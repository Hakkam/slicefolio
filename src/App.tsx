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
import { LandingDemo } from './components/LandingDemo';
import { Preview } from './components/Preview';
import { downloadAllSlices, downloadSlice } from './lib/export';
import { generateSlices, loadSource, planSlices, revokeSlices } from './lib/media';
import type { SliceAsset, SliceOptions, SourceDocument } from './types';

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
    () => (source ? planSlices(source, options.mode).length : 0),
    [source, options.mode],
  );

  const selectedPaddingKey = useMemo(() => {
    if (!options.padding.enabled || options.padding.scope !== 'selected') return '';
    return selectedSlideIndices.join(',');
  }, [options.padding.enabled, options.padding.scope, selectedSlideIndices]);

  const clearGeneratedSlices = () => {
    setSlices((current) => {
      revokeSlices(current);
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
      const nextSource = await loadSource(file, (progress, label) => {
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
    if (!source) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setGenerating(true);
      setGenerationProgress(0);
      setGenerationLabel('Preparing slides');
      setError(null);

      try {
        const nextSlices = await generateSlices(
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
          revokeSlices(nextSlices);
          return;
        }

        setSlices((current) => {
          revokeSlices(current);
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
  }, [source, options, selectedPaddingKey]);

  useEffect(() => {
    return () => {
      revokeSlices(slices);
    };
  }, [slices]);

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
      await downloadAllSlices(slices, (progress) => setZipProgress(progress));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setExportingZip(false);
    }
  };

  if (!source) {
    return (
      <div className="app-shell landing-shell">
        <header className="topbar landing-topbar">
          <Brand />
          <div className="topbar-note">
            <LockKeyhole size={15} />
            100% local processing
          </div>
        </header>

        <main className="landing-main">
          <section className="hero-copy">
            <span className="product-kicker">
              <Sparkles size={15} />
              Built for full-page design exports
            </span>
            <h1>Turn full-page designs into Instagram-ready slices.</h1>
            <p>
              Upload a website PDF or long image. Slicefolio divides it into a clean carousel sequence without cropping, skipping, or uploading your work.
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

          <LandingDemo />

          <section className="workflow-strip" aria-label="Slicefolio workflow">
            <div><span>01</span><strong>Upload</strong><p>PDF or long image</p></div>
            <div><span>02</span><strong>Slice</strong><p>Blind, sequential, lossless</p></div>
            <div><span>03</span><strong>Preview</strong><p>Review the full sequence</p></div>
            <div><span>04</span><strong>Export</strong><p>PNG, JPEG, or ZIP</p></div>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="footer-brand-credit">
            <span>Slicefolio</span>
            <a href="https://hakkam.com" target="_blank" rel="noreferrer">Developed by Hakkam ↗</a>
          </div>
          <span>No account. No upload. No server processing.</span>
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
          onDownload={downloadSlice}
        />
      </div>

      <footer className="workspace-footer">
        <span><Layers3 size={14} /> {estimatedCount} planned slices</span>
        <span><LockKeyhole size={14} /> Your source file never leaves this browser</span>
      </footer>
    </div>
  );
}
