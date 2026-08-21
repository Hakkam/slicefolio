import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BatteryMedium,
  Bookmark,
  ChevronDown,
  Heart,
  Instagram,
  Layers3,
  MessageCircle,
  RotateCcw,
  ScanLine,
  Send,
  Wifi,
} from 'lucide-react';
import { pick, type Locale } from '../i18n';
import './LandingDemo.css';
import './LandingDemoPolish.css';
import './LandingDemoBalance.css';

function SampleWebsite({ locale }: { locale: Locale }) {
  const isArabic = locale === 'ar';

  return (
    <div className={`demo-site${isArabic ? ' demo-site-ar' : ''}`} aria-hidden="true">
      <div className="demo-site-nav">
        <span className="demo-site-logo" />
        <div><i /><i /><i /></div>
        <b>{pick(locale, 'Contact', 'تواصل')}</b>
      </div>
      <div className="demo-site-hero">
        <span className="demo-site-kicker">{pick(locale, 'Independent studio', 'استوديو مستقل')}</span>
        <strong>{pick(locale, 'Designing digital experiences with clarity.', 'نصمم تجارب رقمية واضحة ومؤثرة.')}</strong>
        <p>{pick(locale, 'Strategy · Identity · Product', 'استراتيجية · هوية · منتج')}</p>
        <div className="demo-site-hero-art">
          <span />
          <span />
        </div>
      </div>
      <div className="demo-site-intro">
        <span>{pick(locale, 'Selected work', 'أعمال مختارة')}</span>
        <strong>{pick(locale, 'Built to feel useful, memorable, and unmistakably yours.', 'نصمم أعمالًا مفيدة، راسخة، وتعكس هويتك بوضوح.')}</strong>
      </div>
      <div className="demo-site-project demo-project-a">
        <div className="demo-project-art"><span /><span /></div>
        <div><small>{pick(locale, '01 · Product', '01 · منتج')}</small><strong>{pick(locale, 'Northline', 'نورث لاين')}</strong></div>
      </div>
      <div className="demo-site-project demo-project-b">
        <div className="demo-project-art"><span /><span /><span /></div>
        <div><small>{pick(locale, '02 · Commerce', '02 · تجارة')}</small><strong>{pick(locale, 'Kinfolk Goods', 'كينفولك')}</strong></div>
      </div>
      <div className="demo-site-quote">
        <span>“</span>
        <strong>{pick(locale, 'Good design creates momentum.', 'التصميم الجيد يصنع الزخم.')}</strong>
      </div>
      <div className="demo-site-project demo-project-c">
        <div className="demo-project-art"><span /><span /></div>
        <div><small>{pick(locale, '03 · Editorial', '03 · تحريري')}</small><strong>{pick(locale, 'Field Notes', 'ملاحظات ميدانية')}</strong></div>
      </div>
      <div className="demo-site-footer">
        <strong>{pick(locale, 'Start a project', 'ابدأ مشروعًا')}</strong>
        <span>hello@studio.co</span>
      </div>
    </div>
  );
}

function SliceArtwork({ variant }: { variant: number }) {
  return (
    <div className={`demo-slice-art demo-slice-art-${variant}`} aria-hidden="true">
      <span className="demo-slice-art-bar" />
      <div className="demo-slice-art-grid"><i /><i /><i /></div>
      <b />
      <em />
    </div>
  );
}

export function LandingDemo({ locale = 'en' }: { locale?: Locale }) {
  const rootRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [run, setRun] = useState(0);
  const isArabic = locale === 'ar';

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [run]);

  const replay = () => {
    setIsActive(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setRun((current) => current + 1);
        setIsActive(true);
      });
    });
  };

  return (
    <section className="landing-demo" ref={rootRef} aria-labelledby="landing-demo-title">
      <div className="landing-demo-heading">
        <div>
          <span className="section-eyebrow">{pick(locale, 'See it in action', 'شاهدها عمليًا')}</span>
          <h2 id="landing-demo-title">{pick(locale, 'From one long website to an Instagram carousel.', 'من موقع طويل واحد إلى كاروسيل جاهز لإنستغرام.')}</h2>
          <p>{pick(locale, 'Capture once. Slicefolio turns the full design into an ordered, ready-to-post sequence.', 'التقط الصفحة مرة واحدة، وسيحوّل Slicefolio التصميم الكامل إلى تسلسل مرتب وجاهز للنشر.')}</p>
        </div>
        <button type="button" className="demo-replay" onClick={replay}>
          <RotateCcw size={15} />
          {pick(locale, 'Replay', 'إعادة العرض')}
        </button>
      </div>

      <div key={run} className={`demo-stage${isActive ? ' is-running' : ''}`}>
        <div className="demo-progress" aria-hidden="true">
          <span className="demo-progress-line" />
          <i className="demo-progress-dot demo-progress-dot-1" />
          <i className="demo-progress-dot demo-progress-dot-2" />
          <i className="demo-progress-dot demo-progress-dot-3" />
        </div>

        <article className="demo-step demo-capture-step">
          <header className="demo-step-label">
            <span>01</span>
            <div><strong>{pick(locale, 'Capture', 'التقاط الصفحة')}</strong></div>
          </header>

          <div className="demo-browser">
            <div className="demo-browser-bar">
              <span><i /><i /><i /></span>
              <div>studio.example</div>
              <ScanLine size={13} />
            </div>
            <div className="demo-browser-viewport">
              <div className="demo-site-track"><SampleWebsite locale={locale} /></div>
              <div className="demo-capture-scan"><span>{pick(locale, 'FULL PAGE', 'الصفحة كاملة')}</span></div>
              <div className="demo-capture-ruler" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            </div>
          </div>
        </article>

        <div className="demo-flow-arrow demo-flow-arrow-a" aria-hidden="true"><span /><ArrowRight size={18} /></div>

        <article className="demo-step demo-slice-step">
          <header className="demo-step-label">
            <span>02</span>
            <div><strong>{pick(locale, 'Slice', 'تقطيع')}</strong></div>
          </header>

          <div className="demo-processor">
            <div className="demo-processor-topbar">
              <div className="demo-mini-brand"><i /><b>Slicefolio</b></div>
              <span>4:5 · 1080 × 1350</span>
            </div>

            <div className="demo-processor-body">
              <div className="demo-input-strip" aria-hidden="true">
                <div className="demo-input-page"><SampleWebsite locale={locale} /></div>
                <span className="demo-cut-line demo-cut-line-1" />
                <span className="demo-cut-line demo-cut-line-2" />
                <span className="demo-cut-line demo-cut-line-3" />
              </div>

              <div className="demo-slice-output" aria-label={pick(locale, 'Generated carousel slices', 'شرائح الكاروسيل الناتجة')}>
                {[1, 2, 3, 4].map((item) => (
                  <div className={`demo-output-card demo-output-card-${item}`} key={item}>
                    <SliceArtwork variant={item} />
                    <span>{String(item).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="demo-processor-footer">
              <span><Layers3 size={13} /> {pick(locale, '8 slides', '8 شرائح')}</span>
              <strong>{pick(locale, 'Ready', 'جاهز')}</strong>
            </div>
          </div>
        </article>

        <div className="demo-flow-arrow demo-flow-arrow-b" aria-hidden="true"><span /><ArrowRight size={18} /></div>

        <article className="demo-step demo-publish-step">
          <header className="demo-step-label">
            <span>03</span>
            <div><strong>{pick(locale, 'Publish', 'نشر')}</strong></div>
          </header>

          <div className={`demo-instagram-card${isArabic ? ' demo-instagram-card-ar' : ''}`}>
            <div className="demo-phone-status" aria-hidden="true">
              <strong>9:41</strong>
              <div>
                <span className="demo-phone-signal">▮▮▮</span>
                <Wifi size={11} strokeWidth={2.2} />
                <BatteryMedium size={14} strokeWidth={2.1} />
              </div>
            </div>

            <div className="demo-instagram-appbar">
              <Instagram size={14} strokeWidth={2} />
              <strong>Instagram</strong>
              <ChevronDown size={12} strokeWidth={2} />
            </div>

            <div className="demo-instagram-header">
              <div className="demo-ig-avatar">SF</div>
              <div>
                <strong>yourstudio</strong>
                <span>{pick(locale, 'Design portfolio', 'معرض تصميم')}</span>
              </div>
              <b aria-hidden="true">•••</b>
            </div>

            <div className="demo-instagram-media">
              <div className="demo-ig-carousel">
                <div className="demo-ig-slide demo-ig-cover">
                  <span>{pick(locale, 'WEBSITE CASE STUDY', 'دراسة حالة موقع')}</span>
                  <strong>{pick(locale, 'Northline®', 'نورث لاين®')}</strong>
                </div>
                {[1, 2, 3].map((item) => (
                  <div className="demo-ig-slide demo-ig-body" key={item}><SliceArtwork variant={item} /></div>
                ))}
              </div>
              <span className="demo-ig-counter">1/8</span>
              <div className="demo-swipe-cue" aria-hidden="true">
                <span>{pick(locale, 'Swipe', 'اسحب')}</span>
                <ArrowRight size={13} />
              </div>
            </div>

            <div className="demo-instagram-cta">
              <span>{pick(locale, 'View project', 'عرض المشروع')}</span>
              <ArrowRight size={12} />
            </div>

            <div className="demo-instagram-actions" aria-hidden="true">
              <div>
                <Heart size={15} strokeWidth={1.9} />
                <MessageCircle size={15} strokeWidth={1.9} />
                <Send size={15} strokeWidth={1.9} />
              </div>
              <Bookmark size={15} strokeWidth={1.9} />
            </div>

            <div className="demo-ig-dots" aria-hidden="true"><i /><i /><i /><i /></div>

            <div className="demo-instagram-caption">
              <strong>yourstudio</strong>
              <span>{pick(
                locale,
                'Full website case study, sliced into a carousel with Slicefolio.',
                'دراسة حالة كاملة للموقع، مقسّمة إلى كاروسيل باستخدام Slicefolio.',
              )}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
