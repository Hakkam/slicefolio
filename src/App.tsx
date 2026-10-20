import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  FileUp,
  Globe2,
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
import {
  applyLocaleToDocument,
  localeFromPath,
  localePath,
  localizeError,
  localizeProgressLabel,
  pick,
  type Locale,
} from './i18n';
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

function rawErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong while processing this file.';
}

function Brand({ locale }: { locale: Locale }) {
  return (
    <a
      className="brand"
      href={localePath(locale)}
      aria-label={pick(locale, 'Slicefolio home', 'الصفحة الرئيسية لـ Slicefolio')}
    >
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Slicefolio</span>
    </a>
  );
}

function LanguageSwitch({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (next: Locale) => void;
}) {
  const nextLocale: Locale = locale === 'ar' ? 'en' : 'ar';
  return (
    <a
      className="language-switch"
      href={localePath(nextLocale)}
      hrefLang={nextLocale}
      lang={nextLocale}
      onClick={(event) => {
        event.preventDefault();
        onChange(nextLocale);
      }}
      aria-label={pick(locale, 'Switch to Arabic', 'التبديل إلى الإنجليزية')}
    >
      <Globe2 size={14} />
      {locale === 'ar' ? 'English' : 'العربية'}
    </a>
  );
}

export default function App() {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [locale, setLocale] = useState<Locale>(() => localeFromPath());
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

  useEffect(() => {
    applyLocaleToDocument(locale);
  }, [locale]);

  useEffect(() => {
    const handlePopState = () => setLocale(localeFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    window.history.pushState({}, '', localePath(nextLocale));
    setLocale(nextLocale);
  };

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
      setError(rawErrorMessage(nextError));
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
        if (!cancelled) setError(rawErrorMessage(nextError));
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, options, selectedPaddingKey, mediaModule]);

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
      setError(rawErrorMessage(nextError));
    } finally {
      setExportingZip(false);
    }
  };

  const handleDownloadSlice = async (slice: SliceAsset) => {
    try {
      const { downloadSlice } = await import('./lib/export');
      downloadSlice(slice);
    } catch (nextError) {
      setError(rawErrorMessage(nextError));
    }
  };

  const displayError = error ? localizeError(new Error(error), locale) : null;
  const displayedSourceProgress = localizeProgressLabel(sourceProgressLabel, locale);
  const displayedGenerationLabel = localizeProgressLabel(generationLabel, locale);

  if (!source) {
    return (
      <div className="app-shell landing-shell">
        <header className="topbar landing-topbar">
          <Brand locale={locale} />
          <div className="topbar-note">
            <LockKeyhole size={15} />
            {pick(locale, 'Local browser processing', 'المعالجة محليًا داخل المتصفح')}
          </div>
          <LanguageSwitch locale={locale} onChange={switchLocale} />
        </header>

        <main className="landing-main">
          <section className="hero-copy" aria-labelledby="slicefolio-title">
            <span className="product-kicker">
              <Sparkles size={15} />
              {pick(locale, 'Built for UI/UX and web designers', 'مصمم لمصممي UI/UX والويب')}
            </span>
            <h1 id="slicefolio-title">
              {pick(
                locale,
                'Turn website designs and PDFs into Instagram carousel slides.',
                'حوّل تصميمات المواقع وملفات PDF إلى شرائح كاروسيل جاهزة لإنستغرام.',
              )}
            </h1>
            <p>
              {pick(
                locale,
                'Slicefolio is a browser-based tool for UI/UX and web designers that converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides. Your files stay in your browser and are never uploaded to Slicefolio.',
                'Slicefolio أداة تعمل داخل المتصفح لمصممي UI/UX والويب، تحوّل تصميمات المواقع الكاملة وملفات PDF والصور الطويلة إلى شرائح كاروسيل جاهزة لإنستغرام. تبقى ملفاتك داخل متصفحك ولا يتم رفعها إلى Slicefolio.',
              )}
            </p>
          </section>

          <Dropzone onFile={handleFile} disabled={processingSource} locale={locale} />

          {processingSource ? (
            <div className="source-progress" role="status" aria-live="polite">
              <div>
                <span>{displayedSourceProgress}</span>
                <strong>{Math.round(sourceProgress * 100)}%</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${Math.max(4, sourceProgress * 100)}%` }} />
              </div>
            </div>
          ) : null}

          {displayError ? (
            <div className="error-banner" role="alert">
              <span>{displayError}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label={pick(locale, 'Dismiss error', 'إغلاق التنبيه')}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <LandingDemo locale={locale} />

          <section className="workflow-strip" aria-labelledby="workflow-title">
            <h2 id="workflow-title" className="visually-hidden">
              {pick(locale, 'How Slicefolio works', 'كيف يعمل Slicefolio')}
            </h2>
            <div><span>01</span><strong>{pick(locale, 'Upload', 'رفع')}</strong><p>PDF, PNG, JPG, WebP</p></div>
            <div><span>02</span><strong>{pick(locale, 'Slice', 'تقطيع')}</strong><p>{pick(locale, 'Complete, sequential body', 'تسلسل كامل دون فقد')}</p></div>
            <div><span>03</span><strong>{pick(locale, 'Preview', 'معاينة')}</strong><p>{pick(locale, 'Review the full sequence', 'راجع التسلسل كاملًا')}</p></div>
            <div><span>04</span><strong>{pick(locale, 'Export', 'تصدير')}</strong><p>PNG, JPEG, ZIP</p></div>
          </section>

          <section className="product-facts" aria-labelledby="product-facts-title">
            <div className="landing-section-intro">
              <span className="section-eyebrow">{pick(locale, 'Product facts', 'عن المنتج')}</span>
              <h2 id="product-facts-title">
                {pick(locale, 'Present web design on Instagram without rebuilding it.', 'اعرض تصميم موقعك على إنستغرام دون إعادة بنائه.')}
              </h2>
              <p>
                {pick(
                  locale,
                  'Slicefolio keeps the workflow focused: upload a complete design, create a sequential carousel, review the slides, and export the result.',
                  'يحافظ Slicefolio على رحلة بسيطة وواضحة: ارفع التصميم الكامل، أنشئ كاروسيل متتابعًا، راجع الشرائح، ثم صدّر النتيجة.',
                )}
              </p>
            </div>
            <div className="fact-grid">
              <article className="fact-item">
                <h3>{pick(locale, 'Made for design presentations', 'مصمم لعرض أعمال التصميم')}</h3>
                <p>
                  {pick(
                    locale,
                    'Use full-page website designs, long website screenshots, portfolio presentations, or webpage exports from UI/UX and web design work.',
                    'استخدم تصميمات المواقع الكاملة، ولقطات الشاشة الطويلة، وعروض البورتفوليو، أو تصديرات صفحات الويب من أعمال UI/UX وتصميم المواقع.',
                  )}
                </p>
              </article>
              <article className="fact-item">
                <h3>{pick(locale, 'Instagram-ready output sizes', 'مقاسات جاهزة لإنستغرام')}</h3>
                <p>
                  {pick(
                    locale,
                    'Export Portrait 4:5 at 1080 × 1350, Tall 3:4 at 1080 × 1440, or Square 1:1 at 1080 × 1080.',
                    'صدّر بنسبة 4:5 بمقاس 1080 × 1350، أو 3:4 بمقاس 1080 × 1440، أو مربع 1:1 بمقاس 1080 × 1080.',
                  )}
                </p>
              </article>
              <article className="fact-item">
                <h3>{pick(locale, 'Local browser processing', 'معالجة محلية داخل المتصفح')}</h3>
                <p>
                  {pick(
                    locale,
                    'PDF rendering, image decoding, slicing, previews, image encoding, and ZIP packaging happen in your browser. Nothing is uploaded to Slicefolio.',
                    'تتم معالجة PDF وقراءة الصور والتقطيع والمعاينة وترميز الصور وتجهيز ZIP داخل متصفحك. لا يتم رفع أي ملف إلى Slicefolio.',
                  )}
                </p>
              </article>
            </div>
          </section>

          <section className="faq-section" aria-labelledby="faq-title">
            <div className="landing-section-intro">
              <span className="section-eyebrow">{pick(locale, 'Common questions', 'أسئلة شائعة')}</span>
              <h2 id="faq-title">{pick(locale, 'Slicefolio questions, answered directly.', 'إجابات مباشرة عن Slicefolio.')}</h2>
            </div>
            <div className="faq-list">
              <details>
                <summary>{pick(locale, 'What is Slicefolio?', 'ما هو Slicefolio؟')}</summary>
                <p>
                  {pick(
                    locale,
                    'Slicefolio is a browser-based tool that converts full-page website designs, PDFs, and long images into Instagram-ready carousel slides for UI/UX designers, web designers, agencies, and creative professionals.',
                    'Slicefolio أداة تعمل داخل المتصفح لتحويل تصميمات المواقع الكاملة وملفات PDF والصور الطويلة إلى شرائح كاروسيل جاهزة لإنستغرام لمصممي UI/UX والويب والوكالات والمبدعين.',
                  )}
                </p>
              </details>
              <details>
                <summary>{pick(locale, 'Can I convert a PDF into Instagram carousel slides?', 'هل يمكن تحويل ملف PDF إلى شرائح كاروسيل لإنستغرام؟')}</summary>
                <p>
                  {pick(
                    locale,
                    'Yes. Slicefolio accepts PDF files as well as PNG, JPG, and WebP images. The current file-size limit is 250 MB.',
                    'نعم. يدعم Slicefolio ملفات PDF وصور PNG وJPG وWebP، والحد الحالي لحجم الملف هو 250 ميجابايت.',
                  )}
                </p>
              </details>
              <details>
                <summary>{pick(locale, 'What Instagram carousel sizes does Slicefolio support?', 'ما مقاسات كاروسيل إنستغرام التي يدعمها Slicefolio؟')}</summary>
                <p>
                  {pick(
                    locale,
                    'Slicefolio supports Portrait 4:5 at 1080 × 1350, Tall 3:4 at 1080 × 1440, and Square 1:1 at 1080 × 1080.',
                    'يدعم Slicefolio المقاس العمودي 4:5 بدقة 1080 × 1350، والمقاس 3:4 بدقة 1080 × 1440، والمربع 1:1 بدقة 1080 × 1080.',
                  )}
                </p>
              </details>
              <details>
                <summary>{pick(locale, 'Does Slicefolio upload my design files?', 'هل يرفع Slicefolio ملفات التصميم إلى خادم؟')}</summary>
                <p>
                  {pick(
                    locale,
                    'No. Your selected files stay in your browser. Slicefolio processes the source locally instead of uploading it to a Slicefolio server.',
                    'لا. تبقى الملفات التي تختارها داخل متصفحك، ويعالج Slicefolio المصدر محليًا بدل رفعه إلى خادم تابع لـ Slicefolio.',
                  )}
                </p>
              </details>
              <details>
                <summary>{pick(locale, 'Can I add padding to generated slides?', 'هل يمكن إضافة هوامش داخلية للشرائح الناتجة؟')}</summary>
                <p>
                  {pick(
                    locale,
                    'Yes. Padding can apply to every slide or only selected slides, with independent controls for the top, right, bottom, and left sides.',
                    'نعم. يمكن تطبيق الهوامش على كل الشرائح أو على شرائح محددة فقط، مع التحكم بشكل مستقل في الأعلى واليمين والأسفل واليسار.',
                  )}
                </p>
              </details>
              <details>
                <summary>{pick(locale, 'Can I export all slides at once?', 'هل يمكن تنزيل كل الشرائح دفعة واحدة؟')}</summary>
                <p>
                  {pick(
                    locale,
                    'Yes. You can download slides individually as PNG or JPEG files, or package the complete ordered sequence into a ZIP.',
                    'نعم. يمكنك تنزيل كل شريحة منفردة بصيغة PNG أو JPEG، أو تنزيل التسلسل كاملًا ومرتبًا داخل ملف ZIP.',
                  )}
                </p>
              </details>
              <details>
                <summary>{pick(locale, 'Does Slicefolio use AI to detect sections?', 'هل يستخدم Slicefolio الذكاء الاصطناعي لاكتشاف أقسام التصميم؟')}</summary>
                <p>
                  {pick(
                    locale,
                    'No. The current slicing model is sequential and deterministic. Slicefolio does not currently use semantic or AI section detection to choose cut points.',
                    'لا. يعتمد نموذج التقطيع الحالي على تسلسل ثابت ومحدد، ولا يستخدم Slicefolio حاليًا تحليل الأقسام الدلالي أو الذكاء الاصطناعي لاختيار نقاط القطع.',
                  )}
                </p>
              </details>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="footer-brand-credit">
            <span>Slicefolio</span>
            <a href="https://hakkam.com" target="_blank" rel="noopener noreferrer">
              {pick(locale, 'Developed by Hakkam ↗', 'تم التطوير بواسطة Hakkam ↗')}
            </a>
          </div>
          <span>{pick(locale, 'No account required. Files stay in your browser.', 'لا يحتاج حسابًا. تبقى ملفاتك داخل متصفحك.')}</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-shell workspace-shell">
      <header className="topbar workspace-topbar">
        <Brand locale={locale} />

        <div className="workspace-file-pill" title={source.name}>
          <span className="file-status-dot" />
          <span>{source.name}</span>
        </div>

        <div className="topbar-actions">
          <button type="button" className="ghost-button" onClick={() => replaceInputRef.current?.click()}>
            <FileUp size={16} />
            {pick(locale, 'Replace', 'استبدال الملف')}
          </button>
          <button type="button" className="ghost-button" onClick={resetApp}>
            <RotateCcw size={16} />
            {pick(locale, 'Start over', 'البدء من جديد')}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleDownloadAll}
            disabled={!slices.length || generating || exportingZip}
          >
            <Download size={17} />
            {exportingZip
              ? pick(locale, `Packaging ${Math.round(zipProgress * 100)}%`, `تجهيز ZIP ${Math.round(zipProgress * 100)}%`)
              : pick(locale, `Download all · ${slices.length}`, `تنزيل الكل · ${slices.length}`)}
          </button>
          <LanguageSwitch locale={locale} onChange={switchLocale} />
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

      {displayError ? (
        <div className="workspace-error" role="alert">
          <span>{displayError}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label={pick(locale, 'Dismiss error', 'إغلاق التنبيه')}
          >
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
          locale={locale}
        />

        <Preview
          slices={slices}
          activeIndex={activeIndex}
          generating={generating}
          progress={generationProgress}
          progressLabel={displayedGenerationLabel}
          selectedSlideIndices={selectedSlideIndices}
          onActiveIndexChange={setActiveIndex}
          onToggleSlideSelection={toggleSlideSelection}
          onDownload={(slice) => void handleDownloadSlice(slice)}
          locale={locale}
        />
      </div>

      <footer className="workspace-footer">
        <span><Layers3 size={14} /> {pick(locale, `${estimatedCount} planned slices`, `${estimatedCount} شرائح مخطط لها`)}</span>
        <span><LockKeyhole size={14} /> {pick(locale, 'Your source file never leaves this browser', 'ملف المصدر لا يغادر هذا المتصفح')}</span>
      </footer>
    </div>
  );
}
