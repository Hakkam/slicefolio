import { createCanvas, loadImage } from '@napi-rs/canvas';
import { generateSlices, loadSource, planSlices } from './engine.js';
import type { ProcessingLimits, SliceOptions } from './types.js';

const limits: ProcessingLimits = {
  maxFileSizeBytes: 20 * 1024 * 1024,
  maxPdfPages: 10,
  maxSlides: 50,
};

const options: SliceOptions = {
  mode: 'portrait',
  background: '#f5f5f2',
  format: 'png',
  jpegQuality: 0.92,
  padding: {
    enabled: false,
    scope: 'all',
    top: 48,
    right: 48,
    bottom: 48,
    left: 48,
  },
};

await smokeImagePath();
await smokePdfPath();

async function smokeImagePath() {
  const input = createCanvas(1200, 4800);
  const context = input.getContext('2d');
  const bands = ['#151515', '#ff5a36', '#f5f5f2', '#4f46e5', '#dbeafe', '#111827'];

  bands.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(0, index * 800, 1200, 800);
  });

  const buffer = Buffer.from(await input.encode('png'));
  const source = await loadSource({
    name: 'smoke.png',
    mimeType: 'image/png',
    buffer,
  }, limits);

  const plans = planSlices(source, options.mode);
  if (plans.length !== 6) throw new Error(`Expected 6 image plans, received ${plans.length}.`);
  assertPlanningInvariants(plans);

  const slides = await generateSlices(source, options, limits);
  await assertPngSlides(slides, plans.length);
  console.log(`[smoke] image path generated ${slides.length} valid portrait slides`);
}

async function smokePdfPath() {
  const pdfBuffer = createSmokePdf();
  const source = await loadSource({
    name: 'smoke.pdf',
    mimeType: 'application/pdf',
    buffer: pdfBuffer,
  }, limits);

  if (source.fileType !== 'pdf' || source.pageCount !== 1 || source.segments.length < 1) {
    throw new Error('PDF source was not rendered into the expected page/segments.');
  }

  const plans = planSlices(source, options.mode);
  if (plans.length < 2) throw new Error('PDF source did not produce a cover and body sequence.');
  assertPlanningInvariants(plans);

  const slides = await generateSlices(source, options, limits);
  await assertPngSlides(slides, plans.length);
  console.log(`[smoke] PDF path rendered ${source.pageCount} page and generated ${slides.length} valid portrait slides`);
}

function assertPlanningInvariants(plans: ReturnType<typeof planSlices>) {
  if (plans[0]?.role !== 'cover' || plans[1]?.sourceStart !== 0 || plans[1]?.rotation !== -90) {
    throw new Error('Cover/body planning invariant failed.');
  }

  for (let index = 1; index < plans.length - 1; index += 1) {
    if (Math.abs(plans[index].sourceEnd - plans[index + 1].sourceStart) > 0.0001) {
      throw new Error(`Body continuity failed between plans ${index} and ${index + 1}.`);
    }
  }
}

async function assertPngSlides(slides: Awaited<ReturnType<typeof generateSlices>>, expectedCount: number) {
  if (slides.length !== expectedCount) throw new Error('Generated slide count does not match plan count.');

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  for (const slide of slides) {
    const decoded = await loadImage(slide.buffer);
    if (decoded.width !== 1080 || decoded.height !== 1350) {
      throw new Error(`${slide.fileName} has invalid dimensions ${decoded.width}×${decoded.height}.`);
    }
    if (!slide.buffer.subarray(0, 8).equals(pngSignature)) {
      throw new Error(`${slide.fileName} is not a PNG.`);
    }
  }
}

function createSmokePdf() {
  const stream = [
    '1 1 1 rg',
    '0 0 600 1600 re f',
    '1 0.35 0.21 rg',
    '0 900 600 700 re f',
    '0.08 0.08 0.08 rg',
    '0 0 600 500 re f',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 1600] /Contents 4 0 R /Resources << >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'ascii');
}
