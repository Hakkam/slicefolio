import {
  Canvas,
  DOMMatrix,
  Image,
  ImageData,
  Path2D,
  createCanvas,
  loadImage,
} from '@napi-rs/canvas';
import type {
  ExportFormat,
  GeneratedSlice,
  OutputMode,
  PaddingSettings,
  ProcessingLimits,
  SliceOptions,
  SlicePlan,
  SourceDocument,
  SourceInput,
  SourceKind,
  SourceSegment,
} from './types.js';

const PDF_RENDER_WIDTH = 2200;
const PDF_MIN_RENDER_WIDTH = 1600;
const PDF_TILE_HEIGHT = 6000;
const MAX_PADDING = 420;

const FRAME_PRESETS = {
  portrait: { width: 1080, height: 1350 },
  tall: { width: 1080, height: 1440 },
  square: { width: 1080, height: 1080 },
} as const satisfies Record<OutputMode, { width: number; height: number }>;

function installPdfCanvasGlobals() {
  const globals = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix;
    ImageData?: typeof ImageData;
    Path2D?: typeof Path2D;
  };

  globals.DOMMatrix ??= DOMMatrix;
  globals.ImageData ??= ImageData;
  globals.Path2D ??= Path2D;
}

function sniffSourceKind(input: SourceInput): SourceKind {
  const bytes = input.buffer;
  const extension = input.name.split('.').pop()?.toLowerCase();
  const mime = input.mimeType?.toLowerCase();

  const isPdf = bytes.subarray(0, 5).toString('ascii') === '%PDF-' || mime === 'application/pdf' || extension === 'pdf';
  if (isPdf) return 'pdf';

  const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  const imageByMetadata = ['image/png', 'image/jpeg', 'image/webp'].includes(mime ?? '') || ['png', 'jpg', 'jpeg', 'webp'].includes(extension ?? '');

  if (isPng || isJpeg || isWebp || imageByMetadata) return 'image';
  throw new Error('Unsupported file. Use PDF, PNG, JPG/JPEG, or WebP.');
}

function normalizeSegments(
  name: string,
  fileType: SourceKind,
  fileSize: number,
  pageCount: number,
  rawSegments: Omit<SourceSegment, 'normalizedHeight'>[],
): SourceDocument {
  if (!rawSegments.length) throw new Error('No visual content could be read from this file.');

  const width = Math.max(...rawSegments.map((segment) => segment.width));
  const segments = rawSegments.map((segment) => ({
    ...segment,
    normalizedHeight: segment.height * (width / segment.width),
  }));

  return {
    name,
    fileType,
    fileSize,
    width,
    totalHeight: segments.reduce((sum, segment) => sum + segment.normalizedHeight, 0),
    pageCount,
    segments,
  };
}

async function loadImageSource(input: SourceInput): Promise<SourceDocument> {
  let image: Image;
  try {
    image = await loadImage(input.buffer);
  } catch {
    throw new Error('This image could not be decoded. Try exporting it again as PNG or JPG.');
  }

  if (!image.width || !image.height) throw new Error('The image has invalid dimensions.');

  return normalizeSegments(input.name, 'image', input.buffer.length, 1, [{
    source: image,
    width: image.width,
    height: image.height,
  }]);
}

async function loadPdfSource(input: SourceInput, limits: ProcessingLimits): Promise<SourceDocument> {
  installPdfCanvasGlobals();
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = getDocument({
    data: new Uint8Array(input.buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  });

  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch {
    throw new Error('This PDF could not be opened. It may be corrupt or password protected.');
  }

  if (pdf.numPages > limits.maxPdfPages) {
    await pdf.destroy();
    throw new Error(`This PDF has ${pdf.numPages} pages. The server limit is ${limits.maxPdfPages}.`);
  }

  const segments: Omit<SourceSegment, 'normalizedHeight'>[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = Math.min(
        PDF_RENDER_WIDTH,
        Math.max(PDF_MIN_RENDER_WIDTH, baseViewport.width * 2),
      );
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvasWidth = Math.max(1, Math.ceil(viewport.width));
      const fullHeight = Math.max(1, Math.ceil(viewport.height));
      const tileCount = Math.ceil(fullHeight / PDF_TILE_HEIGHT);

      for (let tileIndex = 0; tileIndex < tileCount; tileIndex += 1) {
        const tileTop = tileIndex * PDF_TILE_HEIGHT;
        const tileHeight = Math.min(PDF_TILE_HEIGHT, fullHeight - tileTop);
        const canvas = createCanvas(canvasWidth, tileHeight);
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context as never,
          viewport,
          transform: [1, 0, 0, 1, 0, -tileTop],
        }).promise;

        segments.push({
          source: canvas,
          width: canvas.width,
          height: canvas.height,
        });
      }

      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  return normalizeSegments(input.name, 'pdf', input.buffer.length, pdf.numPages, segments);
}

export async function loadSource(input: SourceInput, limits: ProcessingLimits): Promise<SourceDocument> {
  if (input.buffer.length > limits.maxFileSizeBytes) {
    const mb = Math.round(limits.maxFileSizeBytes / 1024 / 1024);
    throw new Error(`This file exceeds the ${mb} MB server limit.`);
  }

  const kind = sniffSourceKind(input);
  return kind === 'pdf' ? loadPdfSource(input, limits) : loadImageSource(input);
}

function sourceCapacityForFrame(source: SourceDocument, frame: { width: number; height: number }, rotated: boolean) {
  if (rotated) {
    const outputScale = frame.height / source.width;
    return frame.width / outputScale;
  }
  const outputScale = frame.width / source.width;
  return frame.height / outputScale;
}

export function planSlices(source: SourceDocument, mode: OutputMode): SlicePlan[] {
  const frame = FRAME_PRESETS[mode];
  const plans: SlicePlan[] = [];

  const coverCapacity = sourceCapacityForFrame(source, frame, false);
  plans.push({
    index: 0,
    role: 'cover',
    width: frame.width,
    height: frame.height,
    sourceStart: 0,
    sourceEnd: Math.min(source.totalHeight, coverCapacity),
    rotation: 0,
  });

  const bodyCapacity = sourceCapacityForFrame(source, frame, true);
  const epsilon = 0.0001;
  let cursor = 0;
  let index = 1;

  while (cursor < source.totalHeight - epsilon) {
    const sourceEnd = Math.min(source.totalHeight, cursor + bodyCapacity);
    plans.push({
      index,
      role: 'body',
      width: frame.width,
      height: frame.height,
      sourceStart: cursor,
      sourceEnd,
      rotation: -90,
    });
    cursor = sourceEnd;
    index += 1;
  }

  return plans;
}

function drawSourceRange(
  context: ReturnType<Canvas['getContext']>,
  source: SourceDocument,
  rangeStart: number,
  rangeEnd: number,
  outputWidth: number,
) {
  const outputScale = outputWidth / source.width;
  let segmentTop = 0;
  context.imageSmoothingEnabled = true;

  for (const segment of source.segments) {
    const segmentBottom = segmentTop + segment.normalizedHeight;
    const overlapStart = Math.max(rangeStart, segmentTop);
    const overlapEnd = Math.min(rangeEnd, segmentBottom);

    if (overlapEnd > overlapStart) {
      const normalizationScale = source.width / segment.width;
      const sourceY = (overlapStart - segmentTop) / normalizationScale;
      const sourceHeight = (overlapEnd - overlapStart) / normalizationScale;
      const destinationY = (overlapStart - rangeStart) * outputScale;
      const destinationHeight = (overlapEnd - overlapStart) * outputScale;

      context.drawImage(
        segment.source,
        0,
        sourceY,
        segment.width,
        sourceHeight,
        0,
        destinationY,
        outputWidth,
        destinationHeight,
      );
    }

    if (segmentBottom >= rangeEnd) break;
    segmentTop = segmentBottom;
  }
}

function drawPlannedSlice(context: ReturnType<Canvas['getContext']>, source: SourceDocument, plan: SlicePlan) {
  if (plan.rotation === -90) {
    context.save();
    context.translate(0, plan.height);
    context.rotate(-Math.PI / 2);
    drawSourceRange(context, source, plan.sourceStart, plan.sourceEnd, plan.height);
    context.restore();
    return;
  }

  drawSourceRange(context, source, plan.sourceStart, plan.sourceEnd, plan.width);
}

function clampPadding(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_PADDING, Math.round(value)));
}

function shouldApplyPadding(padding: PaddingSettings, slideIndex: number, selectedSlideIndices: number[]) {
  if (!padding.enabled) return false;
  if (padding.scope === 'all') return true;
  return selectedSlideIndices.includes(slideIndex);
}

function drawWithPadding(
  context: ReturnType<Canvas['getContext']>,
  source: SourceDocument,
  plan: SlicePlan,
  padding: PaddingSettings,
  selectedSlideIndices: number[],
  background: string,
) {
  if (!shouldApplyPadding(padding, plan.index, selectedSlideIndices)) {
    drawPlannedSlice(context, source, plan);
    return;
  }

  const top = clampPadding(padding.top);
  const right = clampPadding(padding.right);
  const bottom = clampPadding(padding.bottom);
  const left = clampPadding(padding.left);

  if (top === 0 && right === 0 && bottom === 0 && left === 0) {
    drawPlannedSlice(context, source, plan);
    return;
  }

  const contentCanvas = createCanvas(plan.width, plan.height);
  const contentContext = contentCanvas.getContext('2d');
  contentContext.fillStyle = background;
  contentContext.fillRect(0, 0, contentCanvas.width, contentCanvas.height);
  drawPlannedSlice(contentContext, source, plan);

  const availableWidth = Math.max(1, plan.width - left - right);
  const availableHeight = Math.max(1, plan.height - top - bottom);
  const containScale = Math.min(availableWidth / plan.width, availableHeight / plan.height);
  const destinationWidth = Math.max(1, plan.width * containScale);
  const destinationHeight = Math.max(1, plan.height * containScale);
  const destinationX = left + (availableWidth - destinationWidth) / 2;
  const destinationY = top + (availableHeight - destinationHeight) / 2;

  context.drawImage(
    contentCanvas,
    0,
    0,
    plan.width,
    plan.height,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
  );
}

function fileNameForSlice(index: number, format: ExportFormat) {
  const number = String(index + 1).padStart(2, '0');
  const suffix = index === 0 ? '-cover' : '';
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  return `slicefolio-${number}${suffix}.${extension}`;
}

async function encodeCanvas(canvas: Canvas, format: ExportFormat, jpegQuality: number) {
  if (format === 'png') return Buffer.from(await canvas.encode('png'));
  const quality = Math.max(10, Math.min(100, Math.round(jpegQuality * 100)));
  return Buffer.from(await canvas.encode('jpeg', quality));
}

export async function generateSlices(
  source: SourceDocument,
  options: SliceOptions,
  limits: ProcessingLimits,
  selectedSlideIndices: number[] = [],
): Promise<GeneratedSlice[]> {
  const plans = planSlices(source, options.mode);
  if (plans.length > limits.maxSlides) {
    throw new Error(`This source would generate ${plans.length} slides. The server limit is ${limits.maxSlides}.`);
  }

  const output: GeneratedSlice[] = [];
  for (const plan of plans) {
    const canvas = createCanvas(plan.width, plan.height);
    const context = canvas.getContext('2d');
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawWithPadding(
      context,
      source,
      plan,
      options.padding,
      selectedSlideIndices,
      options.background,
    );

    output.push({
      ...plan,
      fileName: fileNameForSlice(plan.index, options.format),
      buffer: await encodeCanvas(canvas, options.format, options.jpegQuality),
    });
  }

  return output;
}
