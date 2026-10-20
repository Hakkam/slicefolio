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
import { pick, type Locale } from '../i18n';
import type { OutputMode, SliceOptions, SourceDocument } from '../types';

interface ControlsPanelProps {
  source: SourceDocument;
  options: SliceOptions;
  estimatedCount: number;
  selectedCount: number;
  onOptionsChange: (next: SliceOptions) => void;
  onClearSelected: () => void;
  locale?: Locale;
}

const MODES: Array<{
  value: OutputMode;
  title: string;
  titleAr: string;
  detail: string;
  glyphClass: string;
}> = [
  {
    value: 'portrait',
    title: 'Portrait 4:5',
    titleAr: 'عمودي 4:5',
    detail: '1080 × 1350',
    glyphClass: 'ratio-portrait',
  },
  {
    value: 'tall',
    title: 'Tall 3:4',
    titleAr: 'طويل 3:4',
    detail: '1080 × 1440',
    glyphClass: 'ratio-tall',
  },
  {
    value: 'square',
    title: 'Square 1:1',
    titleAr: 'مربع 1:1',
    detail: '1080 × 1080',
    glyphClass: 'ratio-square',
  },
];

const PADDING_SIDES = ['top', 'right', 'bottom', 'left'] as const;
type PaddingSide = (typeof PADDING_SIDES)[number];

const ARABIC_SIDE_LABELS: Record<PaddingSide, string> = {
  top: 'أعلى',
  right: 'يمين',
  bottom: 'أسفل',
  left: 'يسار',
};

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
  locale = 'en',
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

  const pageLabel = locale === 'ar'
    ? (source.pageCount === 1 ? 'صفحة' : 'صفحات')
    : (source.pageCount === 1 ? 'page' : 'pages');
  const outputLabel = locale === 'ar'
    ? (estimatedCount === 1 ? 'شريحة' : 'شرائح')
    : (estimatedCount === 1 ? 'slide' : 'slides');
  const selectedLabel = locale === 'ar'
    ? (selectedCount === 1 ? 'شريحة محددة' : 'شرائح محددة')
    : (selectedCount === 1 ? 'slide selected' : 'slides selected');

  return (
    <aside className="controls-panel" aria-label={pick(locale, 'Export settings', 'إعدادات التصدير')}>
      <section className="control-section source-card">
        <div className="section-eyebrow">{pick(locale, 'Source', 'المصدر')}</div>
        <div className="source-row">
          <span className="source-icon" aria-hidden="true">
            {source.fileType === 'pdf' ? <FileText size={19} /> : <FileImage size={19} />}
          </span>
          <div className="source-copy">
            <strong title={source.name}>{source.name}</strong>
            <span>
              {formatBytes(source.fileSize)} · {source.pageCount} {pageLabel}
            </span>
          </div>
        </div>
        <div className="source-metrics">
          <div>
            <span>{pick(locale, 'Source width', 'عرض المصدر')}</span>
            <strong>{Math.round(source.width)} px</strong>
          </div>
          <div>
            <span>{pick(locale, 'Output', 'الناتج')}</span>
            <strong>{estimatedCount} {outputLabel}</strong>
          </div>
        </div>
      </section>

      <section className="control-section">
        <div className="section-heading">
          <div>
            <div className="section-eyebrow">{pick(locale, 'Layout', 'التخطيط')}</div>
            <h2>{pick(locale, 'Instagram format', 'مقاس إنستغرام')}</h2>
          </div>
          <Layers3 size={18} />
        </div>

        <div className="mode-list" role="radiogroup" aria-label={pick(locale, 'Instagram output format', 'مقاس شرائح إنستغرام')}>
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
                  <strong>{locale === 'ar' ? mode.titleAr : mode.title}</strong>
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
          {pick(
            locale,
            'Every format uses the same sequence: an independent hero cover, then the full source restarts from the top and continues across 90° rotated slides.',
            'تستخدم جميع المقاسات التسلسل نفسه: غلاف Hero مستقل، ثم يبدأ المصدر كاملًا من الأعلى ويتتابع عبر شرائح مدوّرة 90°.',
          )}
        </p>
      </section>

      <section className="control-section padding-section">
        <div className="section-heading">
          <div>
            <div className="section-eyebrow">{pick(locale, 'Spacing', 'المسافات')}</div>
            <h2>{pick(locale, 'Slide padding', 'الهوامش الداخلية')}</h2>
          </div>
          <button
            type="button"
            className={`mini-toggle${options.padding.enabled ? ' is-active' : ''}`}
            aria-pressed={options.padding.enabled}
            onClick={() => updatePadding({ enabled: !options.padding.enabled })}
          >
            {options.padding.enabled ? pick(locale, 'On', 'مفعّل') : pick(locale, 'Off', 'متوقف')}
          </button>
        </div>

        <div className={`padding-controls${options.padding.enabled ? '' : ' is-disabled'}`}>
          <div className="segmented-control padding-scope" role="radiogroup" aria-label={pick(locale, 'Padding scope', 'نطاق تطبيق الهوامش')}>
            <button
              type="button"
              role="radio"
              aria-checked={options.padding.scope === 'all'}
              className={options.padding.scope === 'all' ? 'is-active' : ''}
              onClick={() => updatePadding({ scope: 'all' })}
            >
              {pick(locale, 'All slides', 'كل الشرائح')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={options.padding.scope === 'selected'}
              className={options.padding.scope === 'selected' ? 'is-active' : ''}
              onClick={() => updatePadding({ scope: 'selected' })}
            >
              {pick(locale, 'Selected', 'المحددة')}
            </button>
          </div>

          {options.padding.scope === 'selected' ? (
            <div className="selected-slides-note">
              <span>{selectedCount} {selectedLabel}</span>
              {selectedCount > 0 ? (
                <button type="button" onClick={onClearSelected}>
                  <Trash2 size={13} />
                  {pick(locale, 'Clear', 'مسح التحديد')}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="padding-link-row">
            <span>{pick(locale, 'Directions', 'الاتجاهات')}</span>
            <button
              type="button"
              className={`link-sides-button${options.padding.linked ? ' is-active' : ''}`}
              aria-pressed={options.padding.linked}
              onClick={() => updatePadding({ linked: !options.padding.linked })}
            >
              {options.padding.linked ? <Link2 size={14} /> : <Unlink2 size={14} />}
              {options.padding.linked
                ? pick(locale, 'All sides linked', 'ربط كل الجهات')
                : pick(locale, 'Edit sides separately', 'تعديل الجهات بشكل منفصل')}
            </button>
          </div>

          <div className="padding-grid">
            {PADDING_SIDES.map((side) => (
              <label key={side} className={`padding-input padding-${side}`}>
                <span>{locale === 'ar' ? ARABIC_SIDE_LABELS[side] : side}</span>
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

          <div className="padding-presets" aria-label={pick(locale, 'Padding presets', 'قيم جاهزة للهوامش')}>
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
            {pick(
              locale,
              'Padding is a minimum inset. Slicefolio keeps the slide contained and proportional, so one-sided padding may create extra breathing room on another axis instead of distorting the design.',
              'الهامش الداخلي هو أقل مسافة مطلوبة. يحافظ Slicefolio على احتواء الشريحة ونسبتها، لذلك قد يضيف الهامش في جهة واحدة مساحة إضافية على محور آخر بدل تشويه التصميم.',
            )}
          </p>
          {options.padding.scope === 'selected' ? (
            <p className="control-help selection-help">
              {pick(locale, 'Select individual slides from the thumbnail strip in the preview.', 'حدّد الشرائح المطلوبة من شريط الصور المصغرة في المعاينة.')}
            </p>
          ) : null}
        </div>
      </section>

      <section className="control-section compact-section">
        <div className="section-heading inline-heading">
          <div>
            <div className="section-eyebrow">{pick(locale, 'Canvas', 'لوحة الرسم')}</div>
            <h2>{pick(locale, 'Background', 'لون الخلفية')}</h2>
          </div>
          <div className="color-control">
            <input
              type="color"
              value={options.background}
              aria-label={pick(locale, 'Background color', 'لون الخلفية')}
              onChange={(event) => update('background', event.target.value)}
            />
            <input
              type="text"
              value={options.background.toUpperCase()}
              aria-label={pick(locale, 'Background color hex value', 'قيمة لون الخلفية بنظام Hex')}
              readOnly
            />
          </div>
        </div>
        <p className="control-help">
          {pick(
            locale,
            'Unused canvas space and padding use this color. Source content is never cropped from the body sequence.',
            'تستخدم المساحات غير المشغولة والهوامش هذا اللون. لا يتم قص محتوى المصدر من تسلسل الشرائح.',
          )}
        </p>
      </section>

      <section className="control-section compact-section">
        <div className="section-eyebrow">{pick(locale, 'Export', 'التصدير')}</div>
        <h2>{pick(locale, 'File format', 'صيغة الملف')}</h2>
        <div className="segmented-control" role="radiogroup" aria-label={pick(locale, 'Export file format', 'صيغة ملف التصدير')}>
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
              <span>{pick(locale, 'JPEG quality', 'جودة JPEG')}</span>
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

      <div className="processing-principles" aria-label={pick(locale, 'Processing characteristics', 'خصائص المعالجة')}>
        <span><Check size={14} /> {pick(locale, 'Complete body', 'المحتوى كامل')}</span>
        <span><Check size={14} /> {pick(locale, 'No gaps', 'بدون فجوات')}</span>
        <span><ShieldCheck size={14} /> {pick(locale, 'Local only', 'محلي فقط')}</span>
      </div>
    </aside>
  );
}
