import {
  Check,
  FileImage,
  FileText,
  Layers3,
  Link2,
  ShieldCheck,
  Trash2,
  Unlink2,
} from 'lucide-react';
import type { OutputMode, SliceOptions, SourceDocument } from '../types';

interface ControlsPanelProps {
  source: SourceDocument;
  options: SliceOptions;
  estimatedCount: number;
  selectedCount: number;
  onOptionsChange: (next: SliceOptions) => void;
  onClearSelected: () => void;
}

const MODES: Array<{
  value: OutputMode;
  title: string;
  detail: string;
  glyphClass: string;
}> = [
  {
    value: 'portrait',
    title: 'Portrait 4:5',
    detail: '1080 × 1350',
    glyphClass: 'ratio-portrait',
  },
  {
    value: 'tall',
    title: 'Tall 3:4',
    detail: '1080 × 1440',
    glyphClass: 'ratio-tall',
  },
  {
    value: 'square',
    title: 'Square 1:1',
    detail: '1080 × 1080',
    glyphClass: 'ratio-square',
  },
];

const PADDING_SIDES = ['top', 'right', 'bottom', 'left'] as const;
type PaddingSide = (typeof PADDING_SIDES)[number];

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

function clampPadding(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(420, Math.round(value)));
}

export function ControlsPanel({
  source,
  options,
  estimatedCount,
  selectedCount,
  onOptionsChange,
  onClearSelected,
}: ControlsPanelProps) {
  const update = <Key extends keyof SliceOptions>(key: Key, value: SliceOptions[Key]) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const updatePadding = (patch: Partial<SliceOptions['padding']>) => {
    onOptionsChange({
      ...options,
      padding: { ...options.padding, ...patch },
    });
  };

  const updatePaddingSide = (side: PaddingSide, rawValue: number) => {
    const value = clampPadding(rawValue);

    if (options.padding.linked) {
      updatePadding({ top: value, right: value, bottom: value, left: value });
      return;
    }

    updatePadding({ [side]: value });
  };

  return (
    <aside className="controls-panel" aria-label="Export settings">
      <section className="control-section source-card">
        <div className="section-eyebrow">Source</div>
        <div className="source-row">
          <span className="source-icon" aria-hidden="true">
            {source.fileType === 'pdf' ? <FileText size={19} /> : <FileImage size={19} />}
          </span>
          <div className="source-copy">
            <strong title={source.name}>{source.name}</strong>
            <span>
              {formatBytes(source.fileSize)} · {source.pageCount} {source.pageCount === 1 ? 'page' : 'pages'}
            </span>
          </div>
        </div>
        <div className="source-metrics">
          <div>
            <span>Source width</span>
            <strong>{Math.round(source.width)} px</strong>
          </div>
          <div>
            <span>Output</span>
            <strong>{estimatedCount} {estimatedCount === 1 ? 'slide' : 'slides'}</strong>
          </div>
        </div>
      </section>

      <section className="control-section">
        <div className="section-heading">
          <div>
            <div className="section-eyebrow">Layout</div>
            <h2>Instagram format</h2>
          </div>
          <Layers3 size={18} />
        </div>

        <div className="mode-list" role="radiogroup" aria-label="Instagram output format">
          {MODES.map((mode) => {
            const active = options.mode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={`mode-option${active ? ' is-active' : ''}`}
                onClick={() => update('mode', mode.value)}
              >
                <span className={`ratio-glyph ${mode.glyphClass}`} aria-hidden="true" />
                <span className="mode-copy">
                  <strong>{mode.title}</strong>
                  <span>{mode.detail}</span>
                </span>
                <span className="mode-check" aria-hidden="true">
                  {active ? <Check size={14} strokeWidth={2.5} /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <p className="control-help">
          Every format uses the same sequence: an independent hero cover, then the full source restarts from the top and continues across 90° rotated slides.
        </p>
      </section>

      <section className="control-section padding-section">
        <div className="section-heading">
          <div>
            <div className="section-eyebrow">Spacing</div>
            <h2>Slide padding</h2>
          </div>
          <button
            type="button"
            className={`mini-toggle${options.padding.enabled ? ' is-active' : ''}`}
            aria-pressed={options.padding.enabled}
            onClick={() => updatePadding({ enabled: !options.padding.enabled })}
          >
            {options.padding.enabled ? 'On' : 'Off'}
          </button>
        </div>

        <div className={`padding-controls${options.padding.enabled ? '' : ' is-disabled'}`}>
          <div className="segmented-control padding-scope" role="radiogroup" aria-label="Padding scope">
            <button
              type="button"
              role="radio"
              aria-checked={options.padding.scope === 'all'}
              className={options.padding.scope === 'all' ? 'is-active' : ''}
              onClick={() => updatePadding({ scope: 'all' })}
            >
              All slides
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={options.padding.scope === 'selected'}
              className={options.padding.scope === 'selected' ? 'is-active' : ''}
              onClick={() => updatePadding({ scope: 'selected' })}
            >
              Selected
            </button>
          </div>

          {options.padding.scope === 'selected' ? (
            <div className="selected-slides-note">
              <span>{selectedCount} {selectedCount === 1 ? 'slide' : 'slides'} selected</span>
              {selectedCount > 0 ? (
                <button type="button" onClick={onClearSelected}>
                  <Trash2 size={13} />
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="padding-link-row">
            <span>Directions</span>
            <button
              type="button"
              className={`link-sides-button${options.padding.linked ? ' is-active' : ''}`}
              aria-pressed={options.padding.linked}
              onClick={() => updatePadding({ linked: !options.padding.linked })}
            >
              {options.padding.linked ? <Link2 size={14} /> : <Unlink2 size={14} />}
              {options.padding.linked ? 'All sides linked' : 'Edit sides separately'}
            </button>
          </div>

          <div className="padding-grid">
            {PADDING_SIDES.map((side) => (
              <label key={side} className={`padding-input padding-${side}`}>
                <span>{side}</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="420"
                    step="8"
                    value={options.padding[side]}
                    onChange={(event) => updatePaddingSide(side, Number(event.target.value))}
                  />
                  <span>px</span>
                </div>
              </label>
            ))}
          </div>

          <div className="padding-presets" aria-label="Padding presets">
            {[0, 24, 48, 72].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updatePadding({ top: value, right: value, bottom: value, left: value })}
              >
                {value}px
              </button>
            ))}
          </div>

          <p className="control-help">
            Padding is a minimum inset. Slicefolio keeps the slide contained and proportional, so one-sided padding may create extra breathing room on another axis instead of distorting the design.
          </p>
          {options.padding.scope === 'selected' ? (
            <p className="control-help selection-help">Select individual slides from the thumbnail strip in the preview.</p>
          ) : null}
        </div>
      </section>

      <section className="control-section compact-section">
        <div className="section-heading inline-heading">
          <div>
            <div className="section-eyebrow">Canvas</div>
            <h2>Background</h2>
          </div>
          <div className="color-control">
            <input
              type="color"
              value={options.background}
              aria-label="Background color"
              onChange={(event) => update('background', event.target.value)}
            />
            <input
              type="text"
              value={options.background.toUpperCase()}
              aria-label="Background color hex value"
              readOnly
            />
          </div>
        </div>
        <p className="control-help">Unused canvas space and padding use this color. Source content is never cropped from the body sequence.</p>
      </section>

      <section className="control-section compact-section">
        <div className="section-eyebrow">Export</div>
        <h2>File format</h2>
        <div className="segmented-control" role="radiogroup" aria-label="Export file format">
          <button
            type="button"
            role="radio"
            aria-checked={options.format === 'png'}
            className={options.format === 'png' ? 'is-active' : ''}
            onClick={() => update('format', 'png')}
          >
            PNG
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={options.format === 'jpeg'}
            className={options.format === 'jpeg' ? 'is-active' : ''}
            onClick={() => update('format', 'jpeg')}
          >
            JPEG
          </button>
        </div>

        {options.format === 'jpeg' ? (
          <label className="quality-control">
            <span>
              <span>JPEG quality</span>
              <strong>{Math.round(options.jpegQuality * 100)}%</strong>
            </span>
            <input
              type="range"
              min="0.7"
              max="1"
              step="0.01"
              value={options.jpegQuality}
              onChange={(event) => update('jpegQuality', Number(event.target.value))}
            />
          </label>
        ) : null}
      </section>

      <div className="processing-principles" aria-label="Processing guarantees">
        <span><Check size={14} /> No crop</span>
        <span><Check size={14} /> No gaps</span>
        <span><ShieldCheck size={14} /> Local only</span>
      </div>
    </aside>
  );
}
