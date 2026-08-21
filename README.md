# Slicefolio

Slicefolio is a browser-native tool for turning full-page website designs into Instagram-ready carousel slices.

## MVP behavior

- Upload PDF, PNG, JPG, or WebP.
- Process everything locally in the browser.
- Blindly slice the source from top to bottom with no skipped or duplicated source regions.
- Default mixed output: a 1080 × 1350 portrait cover followed by 1080 × 566 landscape slides.
- Optional portrait-only, square-only, and landscape-only presets.
- Keep source content contained inside every export frame; never crop source content to fill a frame.
- Fill unused space on the final slide with a configurable background color.
- Export PNG or JPEG.
- Download one slide or package the full ordered sequence as a ZIP.

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

For each slide, Slicefolio calculates how much source height fits when the complete source width is scaled to the Instagram output width:

```text
outputScale = outputWidth / sourceWidth
sourceSliceHeight = outputHeight / outputScale
```

A cursor then advances through the normalized source from the first pixel to the last. The final partial slice remains intact and the unused output area is filled with the selected background color.

Long PDF pages are rendered in internal vertical tiles instead of one extremely tall intermediate canvas. This reduces browser canvas-limit failures while keeping the visual order continuous.

## Current scope

This MVP deliberately does not perform semantic section detection, AI layout analysis, or smart cut placement. The slicing model is sequential and deterministic by design.
