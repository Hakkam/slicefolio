# Slicefolio

Slicefolio is a browser-native tool for turning full-page website designs into Instagram-ready carousel slices.

## MVP behavior

- Upload PDF, PNG, JPG, or WebP.
- Process everything locally in the browser.
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
- The landing page currently uses the original restrained visual direction; experimental visual redesign work is intentionally deferred.
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

## Processing model

Slicefolio never sends the selected file to an API or storage service. PDF rendering, image decoding, slicing, preview generation, image encoding, and ZIP packaging all happen in the user's browser.

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
