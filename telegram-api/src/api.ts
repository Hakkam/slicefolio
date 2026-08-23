import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import JSZip from 'jszip';
import multer from 'multer';
import { generateSlices, loadSource } from './engine.js';
import type { ExportFormat, OutputMode, PaddingScope, ProcessingLimits, SliceOptions } from './types.js';

const PORT = integerEnv('PORT', 8787, 1, 65535);
const MAX_FILE_SIZE_MB = integerEnv('MAX_FILE_SIZE_MB', 250, 1, 1000);
const MAX_PDF_PAGES = integerEnv('MAX_PDF_PAGES', 50, 1, 500);
const MAX_SLIDES = integerEnv('MAX_SLIDES', 100, 2, 500);
const RATE_LIMIT_WINDOW_MS = integerEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000, 1000, 24 * 60 * 60 * 1000);
const RATE_LIMIT_MAX = integerEnv('RATE_LIMIT_MAX', 30, 1, 10000);
const API_KEY = process.env.API_KEY?.trim();

if (process.env.NODE_ENV === 'production' && !API_KEY) {
  throw new Error('API_KEY is required when NODE_ENV=production.');
}

const limits: ProcessingLimits = {
  maxFileSizeBytes: MAX_FILE_SIZE_MB * 1024 * 1024,
  maxPdfPages: MAX_PDF_PAGES,
  maxSlides: MAX_SLIDES,
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: limits.maxFileSizeBytes,
  },
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '64kb' }));
app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'slicefolio-telegram-api',
    version: '0.1.0',
  });
});

app.get('/v1/formats', (_request, response) => {
  response.json({
    formats: [
      { id: 'portrait', label: 'Portrait 4:5', width: 1080, height: 1350 },
      { id: 'tall', label: 'Tall 3:4', width: 1080, height: 1440 },
      { id: 'square', label: 'Square 1:1', width: 1080, height: 1080 },
    ],
    input: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: MAX_FILE_SIZE_MB,
    maxPdfPages: MAX_PDF_PAGES,
    maxSlides: MAX_SLIDES,
  });
});

app.post('/v1/slice', requireApiKey, upload.single('file'), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'Missing multipart field: file' });
      return;
    }

    const options = parseSliceOptions(request.body);
    const selectedSlideIndices = parseSelectedSlides(request.body.selectedSlides);
    const source = await loadSource({
      name: request.file.originalname || 'upload',
      mimeType: request.file.mimetype,
      buffer: request.file.buffer,
    }, limits);

    const slides = await generateSlices(source, options, limits, selectedSlideIndices);
    const manifest = {
      version: 1,
      source: {
        name: source.name,
        type: source.fileType,
        fileSize: source.fileSize,
        pageCount: source.pageCount,
        width: source.width,
        totalHeight: source.totalHeight,
      },
      options,
      slides: slides.map(({ buffer: _buffer, ...slide }) => slide),
    };

    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    for (const slide of slides) zip.file(slide.fileName, slide.buffer);

    const archive = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'STORE',
      streamFiles: true,
    });

    const baseName = safeBaseName(request.file.originalname || 'slicefolio');
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${baseName}-slicefolio.zip"`);
    response.setHeader('X-Slicefolio-Slides', String(slides.length));
    response.setHeader('Cache-Control', 'no-store');
    response.send(archive);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({ error: `File exceeds the ${MAX_FILE_SIZE_MB} MB server limit.` });
      return;
    }
    response.status(400).json({ error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected processing error.';
  const clientError = /unsupported|could not|invalid|exceeds|limit|missing|must|would generate|password/i.test(message);
  response.status(clientError ? 400 : 500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`[slicefolio-api] listening on :${PORT}`);
  console.log(`[slicefolio-api] auth ${API_KEY ? 'enabled' : 'disabled (development only)'}`);
});

function requireApiKey(request: Request, response: Response, next: NextFunction) {
  if (!API_KEY) {
    next();
    return;
  }

  const auth = request.header('authorization');
  if (auth !== `Bearer ${API_KEY}`) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

function parseSliceOptions(body: Record<string, unknown>): SliceOptions {
  const mode = enumValue<OutputMode>(body.mode, ['portrait', 'tall', 'square'], 'portrait');
  const format = enumValue<ExportFormat>(body.format, ['png', 'jpeg'], 'png');
  const background = colorValue(body.background, '#f5f5f2');
  const jpegQuality = numberValue(body.jpegQuality, 0.92, 0.1, 1);
  const paddingEnabled = booleanValue(body.paddingEnabled, false);
  const paddingScope = enumValue<PaddingScope>(body.paddingScope, ['all', 'selected'], 'all');

  return {
    mode,
    format,
    background,
    jpegQuality,
    padding: {
      enabled: paddingEnabled,
      scope: paddingScope,
      top: numberValue(body.paddingTop, 48, 0, 420),
      right: numberValue(body.paddingRight, 48, 0, 420),
      bottom: numberValue(body.paddingBottom, 48, 0, 420),
      left: numberValue(body.paddingLeft, 48, 0, 420),
    },
  };
}

function parseSelectedSlides(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return [];
  const indices = new Set<number>();
  for (const raw of value.split(',')) {
    const slideNumber = Number.parseInt(raw.trim(), 10);
    if (Number.isInteger(slideNumber) && slideNumber > 0) indices.add(slideNumber - 1);
  }
  return [...indices].sort((a, b) => a - b);
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true;
  if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false;
  return fallback;
}

function colorValue(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const color = value.trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback;
}

function integerEnv(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : fallback;
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function safeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const safe = withoutExtension.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return safe || 'slicefolio';
}
