import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { pick, type Locale } from '../i18n';
import type { SliceAsset } from '../types';

interface PreviewProps {
  slices: SliceAsset[];
  activeIndex: number;
  generating: boolean;
  progress: number;
  progressLabel: string;
  selectedSlideIndices: number[];
  onActiveIndexChange: (index: number) => void;
  onToggleSlideSelection: (index: number) => void;
  onDownload: (slice: SliceAsset) => void;
  locale?: Locale;
}

export function Preview({
  slices,
  activeIndex,
  generating,
  progress,
  progressLabel,
  selectedSlideIndices,
  onActiveIndexChange,
  onToggleSlideSelection,
  onDownload,
  locale = 'en',
}: PreviewProps) {
  const activeSlice = slices[activeIndex];
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < slices.length - 1;
  const isSelected = selectedSlideIndices.includes(activeIndex);

  return (
    <main className="preview-panel">
      <div className="preview-toolbar">
        <div>
          <span className="section-eyebrow">{pick(locale, 'Preview', 'المعاينة')}</span>
          <h1>{pick(locale, 'Carousel sequence', 'تسلسل الكاروسيل')}</h1>
        </div>
        {activeSlice ? (
          <div className="active-meta">
            <span>{pick(locale, `Slide ${activeIndex + 1} of ${slices.length}`, `الشريحة ${activeIndex + 1} من ${slices.length}`)}</span>
            <span>{activeSlice.width} × {activeSlice.height}</span>
            <span>{activeSlice.role === 'cover' ? pick(locale, 'Hero cover', 'غلاف Hero') : pick(locale, 'Body', 'المحتوى')}</span>
            {activeSlice.rotation !== 0 ? <span>{pick(locale, 'Rotated 90°', 'مدوّرة 90°')}</span> : null}
            {isSelected ? <span>{pick(locale, 'Selected', 'محددة')}</span> : null}
          </div>
        ) : null}
      </div>

      <section className="preview-stage" aria-live="polite">
        {activeSlice ? (
          <>
            <div
              className={`slide-preview-frame ${activeSlice.role}`}
              style={{ aspectRatio: `${activeSlice.width} / ${activeSlice.height}` }}
            >
              <img
                src={activeSlice.url}
                alt={pick(locale, `Generated slide ${activeIndex + 1}`, `الشريحة الناتجة ${activeIndex + 1}`)}
                draggable={false}
              />
            </div>

            <div className="preview-actions">
              <button
                type="button"
                className="icon-button"
                onClick={() => onActiveIndexChange(activeIndex - 1)}
                disabled={!canGoPrevious}
                aria-label={pick(locale, 'Previous slide', 'الشريحة السابقة')}
              >
                <ArrowLeft size={18} />
              </button>

              <span className="pagination-count">{String(activeIndex + 1).padStart(2, '0')} / {String(slices.length).padStart(2, '0')}</span>

              <button
                type="button"
                className="icon-button"
                onClick={() => onActiveIndexChange(activeIndex + 1)}
                disabled={!canGoNext}
                aria-label={pick(locale, 'Next slide', 'الشريحة التالية')}
              >
                <ArrowRight size={18} />
              </button>

              <span className="action-divider" aria-hidden="true" />

              <button
                type="button"
                className={`secondary-button small-button select-active-button${isSelected ? ' is-selected' : ''}`}
                onClick={() => onToggleSlideSelection(activeIndex)}
                aria-pressed={isSelected}
              >
                <Check size={16} />
                {isSelected ? pick(locale, 'Selected', 'محددة') : pick(locale, 'Select slide', 'تحديد الشريحة')}
              </button>

              <button
                type="button"
                className="secondary-button small-button"
                onClick={() => onDownload(activeSlice)}
              >
                <Download size={16} />
                {pick(locale, 'Download slide', 'تنزيل الشريحة')}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-preview">
            <span><ImageIcon size={24} /></span>
            <strong>{pick(locale, 'Preparing your carousel', 'جاري تجهيز الكاروسيل')}</strong>
            <p>{pick(locale, 'Slides will appear here as soon as the browser finishes rendering the file.', 'ستظهر الشرائح هنا فور انتهاء المتصفح من معالجة الملف.')}</p>
          </div>
        )}

        {generating ? (
          <div className="generation-status">
            <div className="generation-status-copy">
              <span>{progressLabel || pick(locale, 'Generating slides', 'إنشاء الشرائح')}</span>
              <strong>{Math.round(progress * 100)}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${Math.max(4, progress * 100)}%` }} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="thumbnail-section" aria-label={pick(locale, 'Generated slides', 'الشرائح الناتجة')}>
        <div className="thumbnail-heading">
          <span>{pick(locale, 'Generated slides', 'الشرائح الناتجة')}</span>
          <span>{pick(locale, `${slices.length} assets · ${selectedSlideIndices.length} selected`, `${slices.length} شرائح · ${selectedSlideIndices.length} محددة`)}</span>
        </div>
        <div className="thumbnail-strip">
          {slices.map((slice, index) => {
            const selected = selectedSlideIndices.includes(index);
            return (
              <div
                key={slice.id}
                className={`thumbnail-card-shell${index === activeIndex ? ' is-active' : ''}${selected ? ' is-selected' : ''}`}
              >
                <button
                  type="button"
                  className="thumbnail-card"
                  onClick={() => onActiveIndexChange(index)}
                  aria-label={pick(locale, `Show slide ${index + 1}`, `عرض الشريحة ${index + 1}`)}
                >
                  <span
                    className="thumbnail-image"
                    style={{ aspectRatio: `${slice.width} / ${slice.height}` }}
                  >
                    <img src={slice.url} alt="" draggable={false} />
                  </span>
                  <span className="thumbnail-meta">
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                    <span>
                      {slice.role === 'cover'
                        ? pick(locale, 'Hero cover', 'غلاف Hero')
                        : `${slice.rotation !== 0 ? '90° · ' : ''}${slice.width} × ${slice.height}`}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`thumbnail-select${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  aria-label={pick(
                    locale,
                    `${selected ? 'Deselect' : 'Select'} slide ${index + 1} for targeted padding`,
                    `${selected ? 'إلغاء تحديد' : 'تحديد'} الشريحة ${index + 1} لتطبيق الهوامش عليها`,
                  )}
                  onClick={() => onToggleSlideSelection(index)}
                >
                  <Check size={13} strokeWidth={2.8} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
