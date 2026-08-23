import { createCanvas, loadImage } from '@napi-rs/canvas';
import { generateSlices, loadSource, planSlices } from './engine.js';
import type { ProcessingLimits, SliceOptions } from './types.js';

const input = createCanvas(1200, 4800);
const context = input.getContext('2d');
const bands = ['#151515', '#ff5a36', '#f5f5f2', '#4f46e5', '#dbeafe', '#111827'];

bands.forEach((color, index) => {
  context.fillStyle = color;
  context.fillRect(0, index * 800, 1200, 800);
});

const buffer = Buffer.from(await input.encode('png'));
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

const source = await loadSource({
  name: 'smoke.png',
  mimeType: 'image/png',
  buffer,
}, limits);

const plans = planSlices(source, options.mode);
if (plans.length !== 6) throw new Error(`Expected 6 plans, received ${plans.length}.`);
if (plans[0]?.role !== 'cover' || plans[1]?.sourceStart !== 0 || plans[1]?.rotation !== -90) {
  throw new Error('Cover/body planning invariant failed.');
}

for (let index = 1; index < plans.length - 1; index += 1) {
  if (Math.abs(plans[index].sourceEnd - plans[index + 1].sourceStart) > 0.0001) {
    throw new Error(`Body continuity failed between plans ${index} and ${index + 1}.`);
  }
}

const slides = await generateSlices(source, options, limits);
if (slides.length !== plans.length) throw new Error('Generated slide count does not match plan count.');

for (const slide of slides) {
  const decoded = await loadImage(slide.buffer);
  if (decoded.width !== 1080 || decoded.height !== 1350) {
    throw new Error(`${slide.fileName} has invalid dimensions ${decoded.width}×${decoded.height}.`);
  }
  if (!slide.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error(`${slide.fileName} is not a PNG.`);
  }
}

console.log(`[smoke] generated ${slides.length} valid portrait slides with continuous body coverage`);
