import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Instagram, Layers3, RotateCcw, ScanLine } from 'lucide-react';
import './LandingDemo.css';
import './LandingDemoPolish.css';

function SampleWebsite() {
  return (
    <div className="demo-site" aria-hidden="true">
      <div className="demo-site-nav">
        <span className="demo-site-logo" />
        <div><i /><i /><i /></div>
        <b>Contact</b>
      </div>
      <div className="demo-site-hero">
        <span className="demo-site-kicker">Independent studio</span>
        <strong>Designing digital experiences with clarity.</strong>
        <p>Strategy · Identity · Product</p>
        <div className="demo-site-hero-art">
          <span />
          <span />
        </div>
      </div>
      <div className="demo-site-intro">
        <span>Selected work</span>
        <strong>Built to feel useful, memorable, and unmistakably yours.</strong>
      </div>
      <div className="demo-site-project demo-project-a">
        <div className="demo-project-art"><span /><span /></div>
        <div><small>01 · Product</small><strong>Northline</strong></div>
      </div>
      <div className="demo-site-project demo-project-b">
        <div className="demo-project-art"><span /><span /><span /></div>
        <div><small>02 · Commerce</small><strong>Kinfolk Goods</strong></div>
      </div>
      <div className="demo-site-quote">
        <span>“</span>
        <strong>Good design creates momentum.</strong>
      </div>
      <div className="demo-site-project demo-project-c">
        <div className="demo-project-art"><span /><span /></div>
        <div><small>03 · Editorial</small><strong>Field Notes</strong></div>
      </div>
      <div className="demo-site-footer">
        <strong>Start a project</strong>
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

export function LandingDemo() {
  const rootRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [run, setRun] = useState(0);

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
          <span className="section-eyebrow">See it in action</span>
          <h2 id="landing-demo-title">From one long website to an Instagram carousel.</h2>
          <p>Capture once. Slicefolio turns the full design into an ordered, ready-to-post sequence.</p>
        </div>
        <button type="button" className="demo-replay" onClick={replay}>
          <RotateCcw size={15} />
          Replay
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
            <div><strong>Capture</strong></div>
          </header>

          <div className="demo-browser">
            <div className="demo-browser-bar">
              <span><i /><i /><i /></span>
              <div>studio.example</div>
              <ScanLine size={13} />
            </div>
            <div className="demo-browser-viewport">
              <div className="demo-site-track"><SampleWebsite /></div>
              <div className="demo-capture-scan"><span>FULL PAGE</span></div>
              <div className="demo-capture-ruler" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            </div>
          </div>
        </article>

        <div className="demo-flow-arrow demo-flow-arrow-a" aria-hidden="true"><span /><ArrowRight size={18} /></div>

        <article className="demo-step demo-slice-step">
          <header className="demo-step-label">
            <span>02</span>
            <div><strong>Slice</strong></div>
          </header>

          <div className="demo-processor">
            <div className="demo-processor-topbar">
              <div className="demo-mini-brand"><i /><b>Slicefolio</b></div>
              <span>4:5 · 1080 × 1350</span>
            </div>

            <div className="demo-processor-body">
              <div className="demo-input-strip" aria-hidden="true">
                <div className="demo-input-page"><SampleWebsite /></div>
                <span className="demo-cut-line demo-cut-line-1" />
                <span className="demo-cut-line demo-cut-line-2" />
                <span className="demo-cut-line demo-cut-line-3" />
              </div>

              <div className="demo-slice-output" aria-label="Generated carousel slices">
                {[1, 2, 3, 4].map((item) => (
                  <div className={`demo-output-card demo-output-card-${item}`} key={item}>
                    <SliceArtwork variant={item} />
                    <span>{String(item).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="demo-processor-footer">
              <span><Layers3 size={13} /> 8 slides</span>
              <strong>Ready</strong>
            </div>
          </div>
        </article>

        <div className="demo-flow-arrow demo-flow-arrow-b" aria-hidden="true"><span /><ArrowRight size={18} /></div>

        <article className="demo-step demo-publish-step">
          <header className="demo-step-label">
            <span>03</span>
            <div><strong>Publish</strong></div>
          </header>

          <div className="demo-instagram-card">
            <div className="demo-instagram-header">
              <div className="demo-ig-avatar">SF</div>
              <div><strong>yourstudio</strong><span>Portfolio</span></div>
              <b>•••</b>
            </div>

            <div className="demo-instagram-media">
              <div className="demo-ig-carousel">
                <div className="demo-ig-slide demo-ig-cover"><span>WEBSITE<br />CASE STUDY</span><strong>Northline®</strong></div>
                {[1, 2, 3].map((item) => (
                  <div className="demo-ig-slide demo-ig-body" key={item}><SliceArtwork variant={item} /></div>
                ))}
              </div>
              <span className="demo-ig-counter">1/8</span>
              <div className="demo-swipe-cue" aria-hidden="true"><span>Swipe</span><ArrowRight size={13} /></div>
            </div>

            <div className="demo-instagram-actions">
              <div><span>♡</span><span>○</span><span>⌁</span></div><span>▱</span>
            </div>
            <div className="demo-ig-dots" aria-hidden="true"><i /><i /><i /><i /></div>
          </div>

          <div className="demo-published-badge"><Instagram size={14} />Ready to post</div>
        </article>
      </div>
    </section>
  );
}
