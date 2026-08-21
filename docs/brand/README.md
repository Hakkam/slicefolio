# Slicefolio Logo System

## Brand idea

Slicefolio turns one continuous website design into a structured sequence of presentation frames. The identity should therefore communicate **continuity and slicing at the same time**, without relying on literal tools such as scissors, image icons, PDF symbols, or social-media references.

## Concept exploration

### 01 — Continuum Slice · Selected

**Visual concept**  
A single vertical composition is interrupted by two horizontal cuts. Each cut stops before the opposite edge, so the three resulting panels remain connected in an alternating rhythm. The silhouette creates a restrained, implicit S while still reading first as one continuous canvas becoming multiple slices.

**Connection to Slicefolio**  
The uninterrupted outer form represents the original long design. The two cut lines represent the slicing operation. The alternating side connections communicate sequence and continuation from one slide to the next.

**Why it is memorable**  
The mark uses a simple outer silhouette with a very specific internal cut pattern. It is recognizable without color and avoids the common stacked-card or generic-lettermark look.

**Favicon performance**  
Excellent. The mark remains readable at 16–24 px because it uses broad masses and only two negative-space cuts. A simplified 32-unit master is included for the smallest contexts.

### 02 — Offset Frames

**Visual concept**  
Three framed rectangles are staggered left-right-left to create a modular S-like sequence.

**Connection to Slicefolio**  
It directly communicates carousel panels and structured presentation.

**Why it is memorable**  
The offset rhythm is clear and easy to understand, but the visual language is closer to familiar layout, layers, and card-stack icons.

**Favicon performance**  
Good at 24 px, weaker at 16 px because the internal frame strokes become less distinctive.

### 03 — Crop Boundary

**Visual concept**  
A continuous geometric path is cropped at alternating edges, suggesting that content continues beyond each frame boundary.

**Connection to Slicefolio**  
The open/cropped edges express continuation and framing rather than a literal slicing tool.

**Why it is memorable**  
It is the most experimental direction and has a strong editorial feel.

**Favicon performance**  
Fair. Its boundary logic becomes harder to read at very small sizes, which makes it less suitable as the primary product mark.

## Final direction — Continuum Slice

The selected mark is built from one rounded vertical field and two alternating horizontal cuts. The construction deliberately preserves a single connected form: Slicefolio does not destroy or crop the design; it reorganizes one continuous composition into a sequence.

### Logo system

- `public/brand/slicefolio-logo-horizontal.svg` — primary horizontal lockup
- `public/brand/slicefolio-symbol.svg` — black standalone symbol
- `public/brand/slicefolio-symbol-white.svg` — white standalone symbol
- `public/brand/slicefolio-symbol-accent.svg` — coral accent symbol
- `public/brand/slicefolio-wordmark.svg` — wordmark-only version
- `public/brand/slicefolio-mark-small.svg` — simplified small-size/favion master
- `docs/brand/logo-system.svg` — clean presentation sheet
- `docs/brand/concept-directions.svg` — concept comparison sheet

## Typography

The wordmark uses a compact neo-grotesk direction based on **Inter Display / Inter SemiBold** with intentionally tight tracking. The title-case form keeps the product name readable and credible while avoiding playful startup styling or futuristic display typography.

Recommended CSS treatment:

```css
font-family: "Inter Display", Inter, ui-sans-serif, sans-serif;
font-weight: 650;
letter-spacing: -0.045em;
```

## Color

The identity is designed to work first in monochrome.

- Ink: `#181815`
- White: `#FFFFFF`
- Slicefolio Coral: `#FF5A36`
- Warm Neutral Background: `#F4F1EA`

Coral is an accent, not a structural requirement. The black and white versions are the primary identity masters.

## Usage principles

- Prefer the black mark on warm or white surfaces.
- Use the white version on dark surfaces.
- Use the coral version selectively for high-salience product moments.
- Do not add gradients, shadows, outlines, 3D treatments, or glass effects to the mark.
- Do not compress or rotate the symbol.
- Preserve at least one internal cut-height of clear space around the mark.
- Use the small-size master at approximately 16–24 px.
- The symbol may sit inside square or circular containers, but the container should remain visually secondary.

## Product integration

The existing header keeps its semantic markup, while `src/brand.css` replaces the provisional bar icon with the selected sliced-canvas construction. The favicon now uses the dedicated small-size mark.
