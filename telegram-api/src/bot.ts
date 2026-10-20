import { Input, Markup, Telegraf, type Context } from 'telegraf';
import type { OutputMode } from './types.js';

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required.');

const API_URL = (process.env.SLICEFOLIO_API_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const API_KEY = process.env.SLICEFOLIO_API_KEY?.trim();
const modes = new Map<number, OutputMode>();
const bot = new Telegraf(token);

bot.start(async (ctx) => {
  modes.set(ctx.chat.id, modes.get(ctx.chat.id) ?? 'portrait');
  await ctx.reply(
    'أرسل ملف PDF أو PNG أو JPG أو WebP وسأحوّله إلى شرائح Slicefolio.\n\nالأفضل إرسال الصور كـ File/Document للحفاظ على الجودة الأصلية.',
    formatKeyboard(modes.get(ctx.chat.id) ?? 'portrait'),
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '1) اختر المقاس عبر /format\n2) أرسل الملف\n3) سيعود لك ZIP يحتوي جميع الشرائح بالحجم الكامل وملف manifest.json.\n\nالمقاسات: 4:5، 3:4، 1:1.',
  );
});

bot.command('format', async (ctx) => {
  await ctx.reply('اختر مقاس الإخراج:', formatKeyboard(modes.get(ctx.chat.id) ?? 'portrait'));
});

bot.action(/^mode:(portrait|tall|square)$/, async (ctx) => {
  const mode = ctx.match[1] as OutputMode;
  if (ctx.chat) modes.set(ctx.chat.id, mode);
  await ctx.answerCbQuery(`تم اختيار ${modeLabel(mode)}`);
  if (ctx.chat) {
    await ctx.editMessageReplyMarkup(formatKeyboard(mode).reply_markup);
  }
});

bot.on('document', async (ctx) => {
  const document = ctx.message.document;
  await processTelegramFile(ctx, {
    fileId: document.file_id,
    fileName: document.file_name || 'telegram-upload',
    mimeType: document.mime_type,
  });
});

bot.on('photo', async (ctx) => {
  const photo = ctx.message.photo.at(-1);
  if (!photo) return;
  await ctx.reply('ملاحظة: Telegram قد يضغط الصور المرسلة كصورة. أرسلها كـ File للحصول على جودة المصدر الأصلية.');
  await processTelegramFile(ctx, {
    fileId: photo.file_id,
    fileName: 'telegram-photo.jpg',
    mimeType: 'image/jpeg',
  });
});

bot.catch((error) => {
  console.error('[slicefolio-bot] unhandled error', error);
});

await bot.launch();
console.log('[slicefolio-bot] started with long polling');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

interface TelegramSource {
  fileId: string;
  fileName: string;
  mimeType?: string;
}

async function processTelegramFile(ctx: Context & { chat: { id: number } }, source: TelegramSource) {
  const mode = modes.get(ctx.chat.id) ?? 'portrait';
  const status = await ctx.reply(`جاري تجهيز ${modeLabel(mode)}…`);

  try {
    const fileUrl = await ctx.telegram.getFileLink(source.fileId);
    const sourceResponse = await fetch(fileUrl);
    if (!sourceResponse.ok) throw new Error(`Telegram download failed (${sourceResponse.status}).`);

    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
    const form = new FormData();
    form.append('file', new Blob([sourceBuffer], { type: source.mimeType || 'application/octet-stream' }), source.fileName);
    form.append('mode', mode);
    form.append('format', 'png');
    form.append('background', '#f5f5f2');

    const headers = new Headers();
    if (API_KEY) headers.set('Authorization', `Bearer ${API_KEY}`);

    const apiResponse = await fetch(`${API_URL}/v1/slice`, {
      method: 'POST',
      headers,
      body: form,
    });

    if (!apiResponse.ok) {
      let detail = `Slicefolio API failed (${apiResponse.status}).`;
      try {
        const body = await apiResponse.json() as { error?: string };
        if (body.error) detail = body.error;
      } catch {
        // Keep the HTTP fallback message.
      }
      throw new Error(detail);
    }

    const zipBuffer = Buffer.from(await apiResponse.arrayBuffer());
    const slideCount = apiResponse.headers.get('x-slicefolio-slides') || '?';
    const outputName = outputFileName(source.fileName);

    await ctx.replyWithDocument(
      Input.fromBuffer(zipBuffer, outputName),
      { caption: `تم إنشاء ${slideCount} شرائح · ${modeLabel(mode)}\nالملف يحتوي الشرائح الأصلية + manifest.json` },
    );

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      status.message_id,
      undefined,
      'تمت المعالجة بنجاح ✓',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      status.message_id,
      undefined,
      `تعذر تجهيز الملف:\n${message}`,
    );
  }
}

function formatKeyboard(current: OutputMode) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(`${current === 'portrait' ? '✓ ' : ''}Portrait 4:5`, 'mode:portrait'),
      Markup.button.callback(`${current === 'tall' ? '✓ ' : ''}Tall 3:4`, 'mode:tall'),
      Markup.button.callback(`${current === 'square' ? '✓ ' : ''}Square 1:1`, 'mode:square'),
    ],
  ]);
}

function modeLabel(mode: OutputMode) {
  if (mode === 'tall') return 'Tall 3:4 · 1080×1440';
  if (mode === 'square') return 'Square 1:1 · 1080×1080';
  return 'Portrait 4:5 · 1080×1350';
}

function outputFileName(input: string) {
  const base = input.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'slicefolio';
  return `${base}-slicefolio.zip`;
}
