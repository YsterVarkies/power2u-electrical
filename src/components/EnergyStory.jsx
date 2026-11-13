import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { useInView, useMediaQuery } from '../hooks/useInView';
import { STORY } from '../data/site';
import SectionLabel from './SectionLabel';
import Photo from './Photo';
import SafeBoundary from './SafeBoundary';
import './EnergyStory.css';

const EnergyScene = lazy(() => import('./three/EnergyScene'));

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
};

/**
 * A scroll-driven day in the life of a backed-up home: sunrise, surplus,
 * load shedding, and the lights staying on, rendered live in Three.js.
 */
export default function EnergyStory() {
  const root = useRef(null);
  const progress = useRef(0);
  const hud = useRef({});
  const [step, setStep] = useState(0);
  const [outage, setOutage] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [webgl] = useState(hasWebGL);
  const near = useInView(root, { rootMargin: '120% 0px' });
  const visible = useInView(root);
  const small = useMediaQuery('(max-width: 768px)');
  const n = STORY.length;

  useEffect(() => {
    if (near) setMounted(true);
  }, [near]);

  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: self => {
          const p = self.progress;
          progress.current = p;
          const index = Math.min(n - 1, Math.floor(p * n));
          setStep(current => (current === index ? current : index));
          const off = p > 0.455 && p < 0.885;
          setOutage(current => (current === off ? current : off));
        }
      });
      return () => st.kill();
    },
    { scope: root }
  );

  const bind = key => el => {
    hud.current[key] = el;
  };

  return (
    <section id="backup" className="story" ref={root} style={{ '--steps': n }} aria-label="How solar and battery backup works">
      <div className="story__sticky">
        <div className="story__canvas" aria-hidden="true">
          {webgl ? (
            mounted && (
              <SafeBoundary fallback={<Photo name="dyness-wall" className="story__fallback" sizes="100vw" />}>
                <Suspense fallback={null}>
                  <EnergyScene progressRef={progress} hudRef={hud} active={visible} small={small} />
                </Suspense>
              </SafeBoundary>
            )
          ) : (
            <Photo name="dyness-wall" className="story__fallback" sizes="100vw" />
          )}
        </div>
        <div className="story__shade" aria-hidden="true" />

        <header className="story__head wrap">
          <SectionLabel index="02">Solar &amp; backup</SectionLabel>
          <h2 className="h2 display story__title">
            Your home, on <em>its own</em> power.
          </h2>
        </header>

        <div className={`story__alert${outage ? ' is-on' : ''}`} aria-hidden="true">
          <span className="story__alert-dot" />
          Load shedding · grid offline
        </div>

        <div className="story__bottom wrap">
          <ol className="story__list">
            {STORY.map((s, i) => (
              <li key={s.time} className={`story__step${i === step ? ' is-active' : ''}`} aria-current={i === step ? 'step' : undefined}>
                <span className="story__time">{s.time}</span>
                <h3 className="story__step-title">{s.title}</h3>
                <p className="story__text">{s.text}</p>
              </li>
            ))}
          </ol>

          <aside className="hud" ref={bind('root')} data-grid="on" data-mode="grid" aria-hidden="true">
            <div className="hud__row">
              <span className="hud__k">Solar</span>
              <span className="hud__v">
                <b ref={bind('solar')}>0.0</b> kW
              </span>
              <span className="hud__bar hud__bar--solar">
                <i ref={bind('solarBar')} />
              </span>
            </div>
            <div className="hud__row">
              <span className="hud__k">Battery</span>
              <span className="hud__v">
                <b ref={bind('battery')}>32</b>%
              </span>
              <span className="hud__bar hud__bar--battery">
                <i ref={bind('batteryBar')} />
              </span>
            </div>
            <div className="hud__row">
              <span className="hud__k">Grid</span>
              <span className="hud__v hud__grid">
                <i className="hud__dot" />
                <span className="hud__on">Online</span>
                <span className="hud__off">Offline</span>
              </span>
            </div>
            <div className="hud__row">
              <span className="hud__k">Home</span>
              <span className="hud__v hud__mode">
                <span data-m="solar">On solar</span>
                <span data-m="charging">Solar + charging</span>
                <span data-m="battery">On battery</span>
                <span data-m="grid">On grid</span>
              </span>
            </div>
            <p className="hud__note">Illustrative system</p>
          </aside>
        </div>

        <div className="story__rail" aria-hidden="true">
          {STORY.map((s, i) => (
            <span key={s.time} className={i < step ? 'is-past' : i === step ? 'is-on' : ''}>
              {s.time}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
