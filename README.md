# Slicefolio

Slicefolio is a browser-based tool for UI/UX designers, web designers, agencies, and creative professionals that converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides.

## MVP behavior

- Upload PDF, PNG, JPG, or WebP.
- Process the selected file locally in the browser; the source file is not uploaded to a Slicefolio server.
- Choose one of three Instagram carousel sizes:
  - Portrait 4:5 — 1080 × 1350
  - Tall 3:4 — 1080 × 1440
  - Square 1:1 — 1080 × 1080
- Every format uses the same carousel structure:
  - Slide 01 is an independent hero cover using the selected dimensions.
  - Slide 02 restarts from the first pixel of the source.
  - Slide 02 onward keeps the same selected dimensions and rotates the source 90° counter-clockwise.
  - The body sequence advances through the complete source with no skipped, duplicated, or overlapping body regions.
- Keep the complete source represented in the body sequence; never discard content to fill a frame.
- Fill unused space on the final slide with a configurable background color.
- Optional slide padding can be applied to all slides or selected slides without changing source slicing boundaries.
- Padding can be linked across all sides or controlled independently for top, right, bottom, and left.
- Export PNG or JPEG.
- Download one slide or package the full ordered sequence as a ZIP.
- The landing page keeps the original restrained visual direction. Experimental visual redesign work remains deferred.
- The landing footer includes a development credit linking to hakkam.com.

## Stack

- React
- TypeScript
- Vite
- pdfjs-dist
- JSZip
- lucide-react

## Local development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## GitHub Pages deployment

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

When GitHub Pages is configured to use **GitHub Actions**, every push to `main` builds the app and deploys the `dist/` output automatically.

For the current repository name, the expected project Pages URL is:

```text
https://hakkam.github.io/slicefolio/
```

The workflow sets both deployment values automatically:

- `SLICEFOLIO_SITE_URL` for canonical, Open Graph, structured data, sitemap, and robots metadata.
- `SLICEFOLIO_BASE_PATH` so Vite assets and internal home links work correctly from the `/slicefolio/` project path.

If the app later moves to a custom root domain, set `SLICEFOLIO_BASE_PATH=/` and use the custom origin for `SLICEFOLIO_SITE_URL`.

## Production SEO configuration

The final public site URL is intentionally configured in one place instead of being hardcoded across metadata files.

Set `SLICEFOLIO_SITE_URL` at build time to the canonical production origin:

```bash
SLICEFOLIO_SITE_URL=https://your-domain.example npm run build
```

When this value is present, the Vite build:

- adds a self-referencing canonical URL to the initial HTML;
- adds the absolute Open Graph page and image URLs;
- connects the `WebSite` and `WebApplication` structured-data entities to the canonical URL;
- emits a root `sitemap.xml` containing the canonical homepage URL;
- references that sitemap from `robots.txt`.

When the final production URL is not configured, the build deliberately omits canonical and sitemap URLs rather than publishing an incorrect production identity. `robots.txt` still allows crawling, and all non-URL metadata remains available.

A branded `1200 × 630` Open Graph image and favicon live in `public/` and are copied into the production build by Vite.

## Search and machine-readable foundation

The landing page includes meaningful product content in the initial HTML response, so the product definition, H1, supported formats, supported output sizes, local-processing explanation, workflow, and common product questions do not depend on client-side rendering to exist.

Structured data uses factual Schema.org entities only:

- `WebApplication` for Slicefolio;
- `WebSite` when a canonical production URL is configured;
- `Person` for the developer relationship to Hakkam (`https://hakkam.com`).

No review, rating, pricing, customer-count, award, encryption, compliance, or other unsupported claims are included.

No `llms.txt` file is included as an SEO requirement. It can be reconsidered later if a target system documents a concrete use for it, but it is not treated as a ranking mechanism.

## Processing model

Slicefolio does not send the selected file to an API or storage service. PDF rendering, image decoding, slicing, preview generation, image encoding, and ZIP packaging happen in the user's browser.

The cover is a separate hero asset and does not consume source content from the body sequence. Body slicing always starts again at source position `0`.

For the cover, the complete source width maps to the selected output width:

```text
outputScale = outputWidth / sourceWidth
coverSourceHeight = outputHeight / outputScale
```

For the body sequence, the source is rotated 90° inside the selected Instagram frame, so the complete source width maps to the output frame height:

```text
outputScale = outputHeight / sourceWidth
bodySourceSliceHeight = outputWidth / outputScale
```

A body cursor advances through the normalized source from the first pixel to the last. Rotating counter-clockwise maps the original top-to-bottom direction to left-to-right inside each carousel slide. The final partial slice remains intact and the unused output area is filled with the selected background color.

Padding is applied after each slice has been rendered. The rendered slide is proportionally contained inside the remaining padded canvas, so padding never changes source slice boundaries and never crops source content.

Long PDF pages are rendered in internal vertical tiles instead of one extremely tall intermediate canvas. This reduces browser canvas-limit failures while keeping the visual order continuous.

## Current scope

This MVP deliberately does not perform semantic section detection, AI layout analysis, or smart cut placement. The slicing model is sequential and deterministic by design.
