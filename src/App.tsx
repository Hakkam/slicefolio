import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  FileUp,
  Layers3,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { ControlsPanel } from './components/ControlsPanel';
import { Dropzone } from './components/Dropzone';
import { Preview } from './components/Preview';
import type { SliceAsset, SliceOptions, SourceDocument } from './types';

type MediaModule = typeof import('./lib/media');

let mediaModulePromise: Promise<MediaModule> | null = null;

function getMediaModule() {
  if (!mediaModulePromise) mediaModulePromise = import('./lib/media');
  return mediaModulePromise;
}

const DEFAULT_OPTIONS: SliceOptions = {
  mode: 'portrait',
  background: '#F4F1EA',
  format: 'png',
  jpegQuality: 0.92,
  padding: {
    enabled: false,
    scope: 'all',
    linked: true,
    top: 48,
    right: 48,
    bottom: 48,
    left: 48,
  },
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong while processing this file.';
}

function Brand() {
  return (
    <a className="brand" href="/" aria-label="Slicefolio home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Slicefolio</span>
    </a>
  );
}

export default function App() {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [mediaModule, setMediaModule] = useState<MediaModule | null>(null);
  const [source, setSource] = useState<SourceDocument | null>(null);
  const [options, setOptions] = useState<SliceOptions>(DEFAULT_OPTIONS);
  const [slices, setSlices] = useState<SliceAsset[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSlideIndices, setSelectedSlideIndices] = useState<number[]>([]);
  const [processingSource, setProcessingSource] = useState(false);
  const [sourceProgress, setSourceProgress] = useState(0);
  const [sourceProgressLabel, setSourceProgressLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationLabel, setGenerationLabel] = useState('');
  const [exportingZip, setExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const estimatedCount = useMemo(
    () => (source && mediaModule ? mediaModule.planSlices(source, options.mode).length : 0),
    [source, mediaModule, options.mode],
  );

  const selectedPaddingKey = useMemo(() => {
    if (!options.padding.enabled || options.padding.scope !== 'selected') return '';
    return selectedSlideIndices.join(',');
  }, [options.padding.enabled, options.padding.scope, selectedSlideIndices]);

  const clearGeneratedSlices = () => {
    setSlices((current) => {
      mediaModule?.revokeSlices(current);
      return [];
    });
  };

  const toggleSlideSelection = (index: number) => {
    setSelectedSlideIndices((current) => {
      if (current.includes(index)) return current.filter((item) => item !== index);
      return [...current, index].sort((a, b) => a - b);
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    setProcessingSource(true);
    setSourceProgress(0);
    setSourceProgressLabel('Reading file');
    clearGeneratedSlices();
    setSource(null);
    setActiveIndex(0);
    setSelectedSlideIndices([]);

    try {
      const media = await getMediaModule();
      setMediaModule(media);
      const nextSource = await media.loadSource(file, (progress, label) => {
        setSourceProgress(progress);
        setSourceProgressLabel(label);
      });
      setSource(nextSource);
      setSourceProgress(1);
      setSourceProgressLabel('Ready');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setProcessingSource(false);
    }
  };

  useEffect(() => {
    setSelectedSlideIndices((current) => {
      const next = current.filter((index) => index < estimatedCount);
      return next.length === current.length ? current : next;
    });
  }, [estimatedCount]);

  useEffect(() => {
    if (!source || !mediaModule) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setGenerating(true);
      setGenerationProgress(0);
      setGenerationLabel('Preparing slides');
      setError(null);

      try {
        const nextSlices = await mediaModule.generateSlices(
          source,
          options,
          selectedSlideIndices,
          (progress, label) => {
            if (!cancelled) {
              setGenerationProgress(progress);
              setGenerationLabel(label);
            }
          },
          () => cancelled,
        );

        if (cancelled) {
          mediaModule.revokeSlices(nextSlices);
          return;
        }

        setSlices((current) => {
          mediaModule.revokeSlices(current);
          return nextSlices;
        });
        setActiveIndex((current) => Math.min(current, Math.max(0, nextSlices.length - 1)));
        setGenerationProgress(1);
        setGenerationLabel('Ready');
      } catch (nextError) {
        if (!cancelled) setError(getErrorMessage(nextError));
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, options, selectedPaddingKey, mediaModule, selectedSlideIndices]);

  useEffect(() => {
    return () => {
      mediaModule?.revokeSlices(slices);
    };
  }, [slices, mediaModule]);

  useEffect(() => {
    if (activeIndex > slices.length - 1) {
      setActiveIndex(Math.max(0, slices.length - 1));
    }
  }, [activeIndex, slices.length]);

  const resetApp = () => {
    clearGeneratedSlices();
    setSource(null);
    setError(null);
    setOptions(DEFAULT_OPTIONS);
    setActiveIndex(0);
    setSelectedSlideIndices([]);
    setGenerationProgress(0);
    setSourceProgress(0);
  };

  const handleDownloadAll = async () => {
    if (!slices.length || exportingZip) return;

    setExportingZip(true);
    setZipProgress(0);
    setError(null);

    try {
      const { downloadAllSlices } = await import('./lib/export');
      await downloadAllSlices(slices, (progress) => setZipProgress(progress));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setExportingZip(false);
    }
  };

  const handleDownloadSlice = async (slice: SliceAsset) => {
    try {
      const { downloadSlice } = await import('./lib/export');
      downloadSlice(slice);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  };

  if (!source) {
    return (
      <div className="app-shell landing-shell">
        <header className="topbar landing-topbar">
          <Brand />
          <div className="topbar-note">
            <LockKeyhole size={15} />
            Local browser processing
          </div>
        </header>

        <main className="landing-main">
          <section className="hero-copy" aria-labelledby="slicefolio-title">
            <span className="product-kicker">
              <Sparkles size={15} />
              Built for UI/UX and web designers
            </span>
            <h1 id="slicefolio-title">Turn website designs and PDFs into Instagram carousel slides.</h1>
            <p>
              Slicefolio is a browser-based tool for UI/UX and web designers that converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides. Your files stay in your browser and are never uploaded to Slicefolio.
            </p>
          </section>

          <Dropzone onFile={handleFile} disabled={processingSource} />

          {processingSource ? (
            <div className="source-progress" role="status" aria-live="polite">
              <div>
                <span>{sourceProgressLabel}</span>
                <strong>{Math.round(sourceProgress * 100)}%</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${Math.max(4, sourceProgress * 100)}%` }} />
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          ) : null}

          <section className="workflow-strip" aria-labelledby="workflow-title">
            <h2 id="workflow-title" className="visually-hidden">How Slicefolio works</h2>
            <div><span>01</span><strong>Upload</strong><p>PDF, PNG, JPG, or WebP</p></div>
            <div><span>02</span><strong>Slice</strong><p>Complete, sequential body</p></div>
            <div><span>03</span><strong>Preview</strong><p>Review the full sequence</p></div>
            <div><span>04</span><strong>Export</strong><p>PNG, JPEG, or ZIP</p></div>
          </section>

          <section className="product-facts" aria-labelledby="product-facts-title">
            <div className="landing-section-intro">
              <span className="section-eyebrow">Product facts</span>
              <h2 id="product-facts-title">Present web design on Instagram without rebuilding it.</h2>
              <p>
                Slicefolio keeps the workflow focused: upload a complete design, create a sequential carousel, review the slides, and export the result.
              </p>
            </div>
            <div className="fact-grid">
              <article className="fact-item">
                <h3>Made for design presentations</h3>
                <p>Use full-page website designs, long website screenshots, portfolio presentations, or webpage exports from UI/UX and web design work.</p>
              </article>
              <article className="fact-item">
                <h3>Instagram-ready output sizes</h3>
                <p>Export Portrait 4:5 at 1080 × 1350, Tall 3:4 at 1080 × 1440, or Square 1:1 at 1080 × 1080.</p>
              </article>
              <article className="fact-item">
                <h3>Local browser processing</h3>
                <p>PDF rendering, image decoding, slicing, previews, image encoding, and ZIP packaging happen in your browser. Nothing is uploaded to Slicefolio.</p>
              </article>
            </div>
          </section>

          <section className="faq-section" aria-labelledby="faq-title">
            <div className="landing-section-intro">
              <span className="section-eyebrow">Common questions</span>
              <h2 id="faq-title">Slicefolio questions, answered directly.</h2>
            </div>
            <div className="faq-list">
              <details>
                <summary>What is Slicefolio?</summary>
                <p>Slicefolio is a browser-based tool that converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides for UI/UX designers, web designers, agencies, and creative professionals.</p>
              </details>
              <details>
                <summary>Can I convert a PDF into Instagram carousel slides?</summary>
                <p>Yes. Slicefolio accepts PDF files as well as PNG, JPG, and WebP images. The current file-size limit is 250 MB.</p>
              </details>
              <details>
                <summary>What Instagram carousel sizes does Slicefolio support?</summary>
                <p>Slicefolio supports Portrait 4:5 at 1080 × 1350, Tall 3:4 at 1080 × 1440, and Square 1:1 at 1080 × 1080.</p>
              </details>
              <details>
                <summary>Does Slicefolio upload my design files?</summary>
                <p>No. Your selected files stay in your browser. Slicefolio processes the source locally instead of uploading it to a Slicefolio server.</p>
              </details>
              <details>
                <summary>Can I add padding to generated slides?</summary>
                <p>Yes. Padding can apply to every slide or only selected slides, with independent controls for the top, right, bottom, and left sides.</p>
              </details>
              <details>
                <summary>Can I export all slides at once?</summary>
                <p>Yes. You can download slides individually as PNG or JPEG files, or package the complete ordered sequence into a ZIP.</p>
              </details>
              <details>
                <summary>Does Slicefolio use AI to detect sections?</summary>
                <p>No. The current slicing model is sequential and deterministic. Slicefolio does not currently use semantic or AI section detection to choose cut points.</p>
              </details>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="footer-brand-credit">
            <span>Slicefolio</span>
            <a href="https://hakkam.com" target="_blank" rel="noopener noreferrer">Developed by Hakkam ↗</a>
          </div>
          <span>No account required. Files stay in your browser.</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-shell workspace-shell">
      <header className="topbar workspace-topbar">
        <Brand />

        <div className="workspace-file-pill" title={source.name}>
          <span className="file-status-dot" />
          <span>{source.name}</span>
        </div>

        <div className="topbar-actions">
          <button type="button" className="ghost-button" onClick={() => replaceInputRef.current?.click()}>
            <FileUp size={16} />
            Replace
          </button>
          <button type="button" className="ghost-button" onClick={resetApp}>
            <RotateCcw size={16} />
            Start over
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleDownloadAll}
            disabled={!slices.length || generating || exportingZip}
          >
            <Download size={17} />
            {exportingZip ? `Packaging ${Math.round(zipProgress * 100)}%` : `Download all · ${slices.length}`}
          </button>
        </div>

        <input
          ref={replaceInputRef}
          className="visually-hidden"
          type="file"
          tabIndex={-1}
          accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.currentTarget.value = '';
          }}
        />
      </header>

      {error ? (
        <div className="workspace-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="workspace-grid">
        <ControlsPanel
          source={source}
          options={options}
          estimatedCount={estimatedCount}
          selectedCount={selectedSlideIndices.length}
          onOptionsChange={setOptions}
          onClearSelected={() => setSelectedSlideIndices([])}
        />

        <Preview
          slices={slices}
          activeIndex={activeIndex}
          generating={generating}
          progress={generationProgress}
          progressLabel={generationLabel}
          selectedSlideIndices={selectedSlideIndices}
          onActiveIndexChange={setActiveIndex}
          onToggleSlideSelection={toggleSlideSelection}
          onDownload={(slice) => void handleDownloadSlice(slice)}
        />
      </div>

      <footer className="workspace-footer">
        <span><Layers3 size={14} /> {estimatedCount} planned slices</span>
        <span><LockKeyhole size={14} /> Your source file never leaves this browser</span>
      </footer>
    </div>
  );
}
