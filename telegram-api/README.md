# Slicefolio Telegram Processing API

A separate Node.js service that exposes Slicefolio's slicing workflow over HTTP and includes a Telegram bot adapter.

> Important privacy difference: the Slicefolio web app processes files locally in the browser. A Telegram bot cannot preserve that same browser-local model. Files sent to Telegram are downloaded by the bot and uploaded to this API process for server-side processing. The API uses in-memory uploads and does not intentionally persist source files, but the transport path is different from the web product.

## What it supports

- PDF, PNG, JPG/JPEG, WebP
- Portrait 4:5 — 1080 × 1350
- Tall 3:4 — 1080 × 1440
- Square 1:1 — 1080 × 1080
- Independent cover from the top of the source
- Body sequence restarts at the first source pixel
- Body slides rotate the source 90° counter-clockwise
- Full top-to-bottom source sequence with no intentionally skipped body regions
- PNG or JPEG output
- Background color
- Padding on all slides or selected slides
- ZIP response with generated assets and `manifest.json`
- Bearer API-key protection
- Configurable file, PDF-page, slide-count, and rate limits
- Telegram long-polling adapter

## API

### Health

```bash
curl http://localhost:8787/health
```

### Supported formats

```bash
curl http://localhost:8787/v1/formats
```

### Slice a file

```bash
curl -X POST http://localhost:8787/v1/slice \
  -H "Authorization: Bearer change-me" \
  -F "file=@./website.pdf" \
  -F "mode=portrait" \
  -F "format=png" \
  -F "background=#f5f5f2" \
  --output website-slicefolio.zip
```

The ZIP contains:

```text
manifest.json
slicefolio-01-cover.png
slicefolio-02.png
slicefolio-03.png
...
```

### Request fields

| Field | Values | Default |
| --- | --- | --- |
| `file` | PDF/PNG/JPG/JPEG/WebP | required |
| `mode` | `portrait`, `tall`, `square` | `portrait` |
| `format` | `png`, `jpeg` | `png` |
| `jpegQuality` | `0.1` to `1` | `0.92` |
| `background` | Hex color | `#f5f5f2` |
| `paddingEnabled` | boolean | `false` |
| `paddingScope` | `all`, `selected` | `all` |
| `paddingTop` | `0` to `420` | `48` |
| `paddingRight` | `0` to `420` | `48` |
| `paddingBottom` | `0` to `420` | `48` |
| `paddingLeft` | `0` to `420` | `48` |
| `selectedSlides` | 1-based comma list, e.g. `1,3,5` | empty |

Example with padding only on slides 1 and 3:

```bash
curl -X POST http://localhost:8787/v1/slice \
  -H "Authorization: Bearer change-me" \
  -F "file=@./website.png" \
  -F "mode=square" \
  -F "paddingEnabled=true" \
  -F "paddingScope=selected" \
  -F "selectedSlides=1,3" \
  -F "paddingTop=48" \
  -F "paddingRight=48" \
  -F "paddingBottom=48" \
  -F "paddingLeft=48" \
  --output result.zip
```

## Local development

```bash
cd telegram-api
cp .env.example .env
npm install
npm run dev
```

The server runs on `http://localhost:8787` by default.

Build check:

```bash
npm run check
npm run build
```

## Telegram bot

Create a bot with BotFather, put the token in `TELEGRAM_BOT_TOKEN`, then run the API and bot as separate processes.

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
TELEGRAM_BOT_TOKEN="..." \
SLICEFOLIO_API_URL="http://127.0.0.1:8787" \
SLICEFOLIO_API_KEY="change-me" \
npm run dev:bot
```

The bot supports:

- `/start`
- `/help`
- `/format`
- Inline selection for 4:5, 3:4, and 1:1
- PDF/image documents
- Telegram photos, with a warning that Telegram may have compressed the source

The bot returns a ZIP to preserve the generated 1080px assets without Telegram recompressing each slide.

## Docker Compose

Create `.env` in this directory:

```env
API_KEY=replace-with-a-long-random-key
TELEGRAM_BOT_TOKEN=123456:telegram-token
```

Then:

```bash
docker compose up --build -d
```

This starts:

- `api` on port `8787`
- `bot` using long polling and the internal `http://api:8787` address

## Production notes

- `API_KEY` is mandatory when `NODE_ENV=production`.
- Put the API behind HTTPS if the Telegram bot is not running on the same private network.
- Keep `API_KEY` and `TELEGRAM_BOT_TOKEN` only in deployment secrets.
- Adjust `MAX_FILE_SIZE_MB`, `MAX_PDF_PAGES`, `MAX_SLIDES`, and rate limits to fit the server's memory/CPU.
- The current implementation intentionally returns ZIP in memory. For very large workloads, a job queue plus object storage or streamed archives would be the next scaling step.
- This service is intended for Telegram/server integrations. Do not replace the web app's local-processing path with this API unless the public privacy promise is also changed.
