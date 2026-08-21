import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type {
  ExportFormat,
  OutputMode,
  ProgressCallback,
  SliceAsset,
  SliceOptions,
  SlicePlan,
  SourceDocument,
  SourceSegment,
} from '../types';

GlobalWorkerOptions.workerSrc = pdfWorker;

const PDF_RENDER_WIDTH = 2200;
const PDF_MIN_RENDER_WIDTH = 1600;
const PDF_TILE_HEIGHT = 6000;
const MAX_FILE_SIZE = 250 * 1024 * 1024;

const FRAME_PRESETS = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1080, height: 566 },
} as const;

function assertSupportedFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('This file is larger than 250 MB. Try exporting a lighter PDF or image.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const isPdf = file.type === 'application/pdf' || extension === 'pdf';
  const isImage =
    ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    ['png', 'jpg', 'jpeg', 'webp'].includes(extension ?? '');

  if (!isPdf && !isImage) {
    throw new Error('Unsupported file. Upload a PDF, PNG, JPG, or WebP file.');
  }

  return isPdf ? 'pdf' : 'image';
}

function normalizeSegments(
  name: string,
  fileType: 'pdf' | 'image',
  fileSize: number,
  pageCount: number,
  rawSegments: Omit<SourceSegment, 'normalizedHeight'>[],
): SourceDocument {
  if (!rawSegments.length) {
    throw new Error('No visual content could be read from this file.');
  }

  const width = Math.max(...rawSegments.map((segment) => segment.width));
  const segments = rawSegments.map((segment) => ({
    ...segment,
    normalizedHeight: segment.height * (width / segment.width),
  }));
  const totalHeight = segments.reduce((sum, segment) => sum + segment.normalizedHeight, 0);

  return {
    name,
    fileType,
    fileSize,
    width,
    totalHeight,
    pageCount,
    segments,
  };
}

async function loadImage(file: File, onProgress?: ProgressCallback): Promise<SourceDocument> {
  onProgress?.(0.12, 'Reading image');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be decoded. Try exporting it again as PNG or JPG.');
  }

  onProgress?.(0.86, 'Preparing source');

  return normalizeSegments(file.name, 'image', file.size, 1, [
    {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
    },
  ]);
}

async function loadPdf(file: File, onProgress?: ProgressCallback): Promise<SourceDocument> {
  onProgress?.(0.06, 'Reading PDF');
  const data = await file.arrayBuffer();
  const loadingTask = getDocument({ data });

  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch {
    throw new Error('This PDF could not be opened. It may be corrupt or password protected.');
  }

  const pageCount = pdf.numPages;
  const segments: Omit<SourceSegment, 'normalizedHeight'>[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
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
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = tileHeight;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
          throw new Error('Your browser could not create a rendering canvas.');
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
          transform: [1, 0, 0, 1, 0, -tileTop],
        }).promise;

        segments.push({
          source: canvas,
          width: canvas.width,
          height: canvas.height,
        });

        const pageProgress = (pageNumber - 1 + (tileIndex + 1) / tileCount) / pageCount;
        onProgress?.(0.12 + pageProgress * 0.78, `Rendering PDF · page ${pageNumber} of ${pageCount}`);
      }

      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  return normalizeSegments(file.name, 'pdf', file.size, pageCount, segments);
}

export async function loadSource(
  file: File,
  onProgress?: ProgressCallback,
): Promise<SourceDocument> {
  const fileType = assertSupportedFile(file);
  const source =
    fileType === 'pdf' ? await loadPdf(file, onProgress) : await loadImage(file, onProgress);
  onProgress?.(1, 'Ready');
  return source;
}

function sourceCapacityForFrame(
  source: SourceDocument,
  frame: { width: number; height: number },
  rotated: boolean,
) {
  if (rotated) {
    const outputScale = frame.height / source.width;
    return frame.width / outputScale;
  }

  const outputScale = frame.width / source.width;
  return frame.height / outputScale;
}

function planMixedSlices(source: SourceDocument): SlicePlan[] {
  const plans: SlicePlan[] = [];
  const coverFrame = FRAME_PRESETS.portrait;
  const coverCapacity = sourceCapacityForFrame(source, coverFrame, false);

  plans.push({
    index: 0,
    role: 'cover',
    width: coverFrame.width,
    height: coverFrame.height,
    sourceStart: 0,
    sourceEnd: Math.min(source.totalHeight, coverCapacity),
    rotation: 0,
  });

  const bodyFrame = FRAME_PRESETS.landscape;
  const bodyCapacity = sourceCapacityForFrame(source, bodyFrame, true);
  const epsilon = 0.0001;
  let cursor = 0;
  let index = 1;

  while (cursor < source.totalHeight - epsilon) {
    const sourceEnd = Math.min(source.totalHeight, cursor + bodyCapacity);

    plans.push({
      index,
      role: 'body',
      width: bodyFrame.width,
      height: bodyFrame.height,
      sourceStart: cursor,
      sourceEnd,
      rotation: -90,
    });

    cursor = sourceEnd;
    index += 1;
  }

  return plans;
}

export function planSlices(source: SourceDocument, mode: OutputMode): SlicePlan[] {
  if (mode === 'mixed') {
    return planMixedSlices(source);
  }

  const frame = FRAME_PRESETS[mode];
  const sourceCapacity = sourceCapacityForFrame(source, frame, false);
  const plans: SlicePlan[] = [];
  const epsilon = 0.0001;
  let cursor = 0;
  let index = 0;

  while (cursor < source.totalHeight - epsilon) {
    const sourceEnd = Math.min(source.totalHeight, cursor + sourceCapacity);

    plans.push({
      index,
      role: index === 0 ? 'cover' : 'body',
      width: frame.width,
      height: frame.height,
      sourceStart: cursor,
      sourceEnd,
      rotation: 0,
    });

    cursor = sourceEnd;
    index += 1;
  }

  return plans;
}

function drawSourceRange(
  context: CanvasRenderingContext2D,
  source: SourceDocument,
  rangeStart: number,
  rangeEnd: number,
  outputWidth: number,
) {
  const outputScale = outputWidth / source.width;
  let segmentTop = 0;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

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

function drawPlannedSlice(
  context: CanvasRenderingContext2D,
  source: SourceDocument,
  plan: SlicePlan,
) {
  if (plan.rotation === -90) {
    context.save();
    context.translate(0, plan.height);
    context.rotate(-Math.PI / 2);
    drawSourceRange(
      context,
      source,
      plan.sourceStart,
      plan.sourceEnd,
      plan.height,
    );
    context.restore();
    return;
  }

  drawSourceRange(
    context,
    source,
    plan.sourceStart,
    plan.sourceEnd,
    plan.width,
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  jpegQuality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The browser could not encode one of the generated slides.'));
      },
      mimeType,
      format === 'jpeg' ? jpegQuality : undefined,
    );
  });
}

function fileNameForSlice(index: number, format: ExportFormat) {
  const number = String(index + 1).padStart(2, '0');
  const suffix = index === 0 ? '-cover' : '';
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  return `slicefolio-${number}${suffix}.${extension}`;
}

export async function generateSlices(
  source: SourceDocument,
  options: SliceOptions,
  onProgress?: ProgressCallback,
  shouldCancel?: () => boolean,
): Promise<SliceAsset[]> {
  const plans = planSlices(source, options.mode);
  const assets: SliceAsset[] = [];

  for (let index = 0; index < plans.length; index += 1) {
    if (shouldCancel?.()) break;

    const plan = plans[index];
    const canvas = document.createElement('canvas');
    canvas.width = plan.width;
    canvas.height = plan.height;

    const context = canvas.getContext('2d', { alpha: options.format === 'png' });
    if (!context) {
      throw new Error('Your browser could not create an export canvas.');
    }

    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawPlannedSlice(context, source, plan);

    const blob = await canvasToBlob(canvas, options.format, options.jpegQuality);
    if (shouldCancel?.()) break;

    assets.push({
      ...plan,
      id: `${plan.index}-${plan.sourceStart.toFixed(3)}-${plan.sourceEnd.toFixed(3)}-${plan.rotation}`,
      blob,
      url: URL.createObjectURL(blob),
      fileName: fileNameForSlice(plan.index, options.format),
    });

    onProgress?.((index + 1) / plans.length, `Generating slide ${index + 1} of ${plans.length}`);

    canvas.width = 1;
    canvas.height = 1;
  }

  return assets;
}

export function revokeSlices(slices: SliceAsset[]) {
  slices.forEach((slice) => URL.revokeObjectURL(slice.url));
}
