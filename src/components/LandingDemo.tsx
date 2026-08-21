import { useEffect, useRef } from 'react';
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

function CaptureCard({ locale }: { locale: Locale }) {
  return (
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
  );
}

function SliceCard({ locale }: { locale: Locale }) {
  return (
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
  );
}

function PublishCard({ locale }: { locale: Locale }) {
  const isArabic = locale === 'ar';

  return (
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
  );
}

export function LandingDemo({ locale = 'en' }: { locale?: Locale }) {
  const rootRef = useRef<HTMLElement>(null);
  const sceneRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    const scenes = sceneRefs.current.filter((scene): scene is HTMLElement => Boolean(scene));
    if (!root || scenes.length === 0) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

    const updateScrollMotion = () => {
      frame = 0;
      const viewportHeight = window.innerHeight || 1;
      const rootRect = root.getBoundingClientRect();
      const rootTravel = Math.max(rootRect.height - viewportHeight * 0.45, 1);
      const storyProgress = clamp((viewportHeight * 0.45 - rootRect.top) / rootTravel);
      root.style.setProperty('--story-progress', storyProgress.toFixed(4));

      let closestScene = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      scenes.forEach((scene, index) => {
        const rect = scene.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const viewportCenter = viewportHeight / 2;
        const distance = Math.abs(center - viewportCenter);
        const focus = clamp(1 - distance / (viewportHeight * 0.78));
        const enter = clamp((viewportHeight * 0.92 - rect.top) / (viewportHeight * 0.82));
        const direction = index % 2 === 0 ? 1 : -1;

        scene.style.setProperty('--scene-focus', focus.toFixed(4));
        scene.style.setProperty('--scene-opacity', (0.25 + focus * 0.75).toFixed(4));
        scene.style.setProperty('--scene-scale', (0.94 + focus * 0.06).toFixed(4));
        scene.style.setProperty('--scene-y', `${((1 - focus) * 42).toFixed(2)}px`);
        scene.style.setProperty('--scene-visual-x', `${(direction * (1 - enter) * 92).toFixed(2)}px`);
        scene.style.setProperty('--scene-copy-x', `${(-direction * (1 - enter) * 58).toFixed(2)}px`);
        scene.style.setProperty('--scene-tilt', `${(direction * (1 - focus) * 2.6).toFixed(2)}deg`);
        scene.style.setProperty('--scene-glow', focus.toFixed(4));

        if (distance < closestDistance) {
          closestDistance = distance;
          closestScene = index;
        }
      });

      root.dataset.scene = String(closestScene + 1);
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollMotion);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-active', entry.isIntersecting || reducedMotion);
        });
      },
      {
        rootMargin: '0px',
        threshold: [0, 0.01, 0.18, 0.45],
      },
    );

    scenes.forEach((scene) => observer.observe(scene));
    if (reducedMotion) scenes.forEach((scene) => scene.classList.add('is-active'));

    updateScrollMotion();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [locale]);

  const replay = () => {
    const firstScene = sceneRefs.current[0];
    if (!firstScene) return;

    firstScene.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  const scenes = [
    {
      number: '01',
      label: pick(locale, 'Capture', 'التقاط الصفحة'),
      title: pick(locale, 'Capture the whole page, once.', 'التقط الصفحة كاملة مرة واحدة.'),
      description: pick(
        locale,
        'Start with the complete website design instead of disconnected screenshots. Slicefolio keeps the original top-to-bottom visual flow intact before any slicing begins.',
        'ابدأ بتصميم الموقع كاملًا بدل لقطات منفصلة. يحافظ Slicefolio على التسلسل البصري الأصلي من أعلى الصفحة إلى أسفلها قبل بدء أي عملية تقطيع.',
      ),
      meta: [pick(locale, 'Full-page source', 'مصدر كامل الصفحة'), pick(locale, 'Local browser processing', 'معالجة محلية في المتصفح')],
      visual: <CaptureCard locale={locale} />,
    },
    {
      number: '02',
      label: pick(locale, 'Slice', 'تقطيع'),
      title: pick(locale, 'Turn one continuous design into a visual sequence.', 'حوّل التصميم المتصل إلى تسلسل بصري متكامل.'),
      description: pick(
        locale,
        'Slicefolio frames the long design into ordered carousel slides while preserving every source region. The sequence stays continuous, consistent, and ready for the selected Instagram ratio.',
        'يحوّل Slicefolio التصميم الطويل إلى شرائح كاروسيل مرتبة مع الحفاظ على جميع أجزاء المصدر. يبقى التسلسل متصلًا ومتسقًا وجاهزًا للمقاس المختار لإنستغرام.',
      ),
      meta: [pick(locale, 'Sequential slices', 'شرائح متسلسلة'), '4:5 · 1080 × 1350'],
      visual: <SliceCard locale={locale} />,
    },
    {
      number: '03',
      label: pick(locale, 'Publish', 'نشر'),
      title: pick(locale, 'Present the work as a carousel built to be swiped.', 'اعرض العمل ككاروسيل مصمم للتصفح بالسحب.'),
      description: pick(
        locale,
        'The result becomes a polished Instagram-ready sequence that lets viewers move through the website as a visual story instead of seeing one compressed, unreadable long image.',
        'تتحول النتيجة إلى تسلسل مصقول وجاهز لإنستغرام، يتيح للمشاهد استكشاف الموقع كقصة بصرية بدل عرض صورة طويلة مضغوطة يصعب قراءتها.',
      ),
      meta: [pick(locale, 'Instagram-ready', 'جاهز لإنستغرام'), pick(locale, 'Swipeable sequence', 'تسلسل قابل للسحب')],
      visual: <PublishCard locale={locale} />,
    },
  ];

  return (
    <section className="landing-demo landing-demo-scroll" ref={rootRef} aria-labelledby="landing-demo-title">
      <div className="landing-demo-heading">
        <div>
          <span className="section-eyebrow">{pick(locale, 'See the transformation', 'شاهد التحول')}</span>
          <h2 id="landing-demo-title">{pick(locale, 'One design. Three moments. One continuous story.', 'تصميم واحد. ثلاث مراحل. قصة بصرية متصلة.')}</h2>
          <p>{pick(
            locale,
            'Scroll through the Slicefolio workflow—from the original long page to ordered slices and a carousel ready to publish.',
            'مرّر عبر رحلة Slicefolio، من الصفحة الطويلة الأصلية إلى الشرائح المرتبة ثم الكاروسيل الجاهز للنشر.',
          )}</p>
        </div>
        <button type="button" className="demo-replay" onClick={replay}>
          <RotateCcw size={15} />
          {pick(locale, 'Replay', 'إعادة العرض')}
        </button>
      </div>

      <nav className="demo-story-progress" aria-label={pick(locale, 'Slicefolio workflow progress', 'تقدم رحلة Slicefolio')}>
        <div className="demo-story-progress-track" aria-hidden="true"><i /></div>
        {scenes.map((scene) => (
          <span className="demo-story-progress-point" data-step={scene.number} key={scene.number}>
            <b>{scene.number}</b>
            <small>{scene.label}</small>
          </span>
        ))}
      </nav>

      <div className="demo-scroll-story">
        {scenes.map((scene, index) => (
          <article
            className={`demo-scroll-scene${index % 2 === 1 ? ' is-reverse' : ''}`}
            key={scene.number}
            ref={(node) => { sceneRefs.current[index] = node; }}
          >
            <div className="demo-scene-copy">
              <span className="demo-scene-number">{scene.number}</span>
              <span className="demo-scene-label">{scene.label}</span>
              <h3>{scene.title}</h3>
              <p>{scene.description}</p>
              <div className="demo-scene-meta">
                {scene.meta.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>

            <div className="demo-scene-visual" aria-hidden="true">
              <span className="demo-scene-orbit"><i /><i /><i /></span>
              <div className="demo-stage demo-scene-stage">
                <article className="demo-step">{scene.visual}</article>
              </div>
              <span className="demo-scene-shadow" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
