# Slicefolio

Slicefolio is a browser-native tool for turning full-page website designs into Instagram-ready carousel slices.

## MVP behavior

- Upload PDF, PNG, JPG, or WebP.
- Process everything locally in the browser.
- Blindly slice the source from top to bottom.
- Default mixed output:
  - Slide 01 is an independent 1080 × 1350 portrait hero cover created from the top of the source.
  - Slide 02 restarts from the first pixel of the source.
  - Slide 02 onward uses 1080 × 566 landscape frames with the source rotated 90° counter-clockwise.
  - The body sequence advances through the complete source with no skipped, duplicated, or overlapping body regions.
- Optional portrait-only, square-only, and landscape-only presets remain unrotated.
- Keep the complete source represented in the body sequence; never discard content to fill a frame.
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

### Standard presets

For portrait, square, and landscape-only modes, Slicefolio calculates how much source height fits when the complete source width is scaled to the Instagram output width:

```text
outputScale = outputWidth / sourceWidth
sourceSliceHeight = outputHeight / outputScale
```

### Mixed mode

The cover is a separate hero asset and does not consume source content from the body sequence. Body slicing starts again at source position `0`.

Because the body source is rotated 90° inside a landscape frame, the complete source width maps to the output frame height:

```text
outputScale = outputHeight / sourceWidth
sourceSliceHeight = outputWidth / outputScale
```

A body cursor then advances through the normalized source from the first pixel to the last. Rotating counter-clockwise maps the original top-to-bottom direction to left-to-right inside each landscape slide. The final partial slice remains intact and the unused output area is filled with the selected background color.

Long PDF pages are rendered in internal vertical tiles instead of one extremely tall intermediate canvas. This reduces browser canvas-limit failures while keeping the visual order continuous.

## Current scope

This MVP deliberately does not perform semantic section detection, AI layout analysis, or smart cut placement. The slicing model is sequential and deterministic by design.
