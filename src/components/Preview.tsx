import { ArrowLeft, ArrowRight, Download, Image as ImageIcon } from 'lucide-react';
import type { SliceAsset } from '../types';

interface PreviewProps {
  slices: SliceAsset[];
  activeIndex: number;
  generating: boolean;
  progress: number;
  progressLabel: string;
  onActiveIndexChange: (index: number) => void;
  onDownload: (slice: SliceAsset) => void;
}

export function Preview({
  slices,
  activeIndex,
  generating,
  progress,
  progressLabel,
  onActiveIndexChange,
  onDownload,
}: PreviewProps) {
  const activeSlice = slices[activeIndex];
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < slices.length - 1;

  return (
    <main className="preview-panel">
      <div className="preview-toolbar">
        <div>
          <span className="section-eyebrow">Preview</span>
          <h1>Carousel sequence</h1>
        </div>
        {activeSlice ? (
          <div className="active-meta">
            <span>Slide {activeIndex + 1} of {slices.length}</span>
            <span>{activeSlice.width} × {activeSlice.height}</span>
            <span>{activeSlice.role === 'cover' ? 'Cover' : 'Body'}</span>
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
              <img src={activeSlice.url} alt={`Generated slide ${activeIndex + 1}`} draggable={false} />
            </div>

            <div className="preview-actions">
              <button
                type="button"
                className="icon-button"
                onClick={() => onActiveIndexChange(activeIndex - 1)}
                disabled={!canGoPrevious}
                aria-label="Previous slide"
              >
                <ArrowLeft size={18} />
              </button>

              <span className="pagination-count">{String(activeIndex + 1).padStart(2, '0')} / {String(slices.length).padStart(2, '0')}</span>

              <button
                type="button"
                className="icon-button"
                onClick={() => onActiveIndexChange(activeIndex + 1)}
                disabled={!canGoNext}
                aria-label="Next slide"
              >
                <ArrowRight size={18} />
              </button>

              <span className="action-divider" aria-hidden="true" />

              <button
                type="button"
                className="secondary-button small-button"
                onClick={() => onDownload(activeSlice)}
              >
                <Download size={16} />
                Download slide
              </button>
            </div>
          </>
        ) : (
          <div className="empty-preview">
            <span><ImageIcon size={24} /></span>
            <strong>Preparing your carousel</strong>
            <p>Slides will appear here as soon as the browser finishes rendering the file.</p>
          </div>
        )}

        {generating ? (
          <div className="generation-status">
            <div className="generation-status-copy">
              <span>{progressLabel || 'Generating slides'}</span>
              <strong>{Math.round(progress * 100)}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${Math.max(4, progress * 100)}%` }} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="thumbnail-section" aria-label="Generated slides">
        <div className="thumbnail-heading">
          <span>Generated slides</span>
          <span>{slices.length} assets</span>
        </div>
        <div className="thumbnail-strip">
          {slices.map((slice, index) => (
            <button
              type="button"
              key={slice.id}
              className={`thumbnail-card${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => onActiveIndexChange(index)}
              aria-label={`Show slide ${index + 1}`}
            >
              <span
                className="thumbnail-image"
                style={{ aspectRatio: `${slice.width} / ${slice.height}` }}
              >
                <img src={slice.url} alt="" draggable={false} />
              </span>
              <span className="thumbnail-meta">
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <span>{slice.role === 'cover' ? 'Cover' : `${slice.width} × ${slice.height}`}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
