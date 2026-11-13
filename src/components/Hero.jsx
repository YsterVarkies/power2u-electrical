import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap';
import { prefersReducedMotion, scrollToTarget } from '../lib/smooth';
import { useInView, useMediaQuery } from '../hooks/useInView';
import { BUSINESS, heroVideo } from '../data/site';
import Magnet from './reactbits/Magnet/Magnet';
import { BulbMark } from './Logo';
import { Bolt, Phone } from './Icons';
import SafeBoundary from './SafeBoundary';
import './Hero.css';

const HeroScene = lazy(() => import('./three/HeroScene'));

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

function HeroFallback() {
  return (
    <div className="hero__fallback">
      <img src={heroVideo.poster} alt="" />
      <BulbMark className="hero__fallback-bulb" />
    </div>
  );
}

export default function Hero({ powered }) {
  const root = useRef(null);
  const scroll = useRef({ p: 0 });
  const inView = useInView(root);
  const small = useMediaQuery('(max-width: 768px)');
  const [webgl] = useState(hasWebGL);
  const [hinted, setHinted] = useState(false);

  // scroll-out: content lifts away, scene reads progress
  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom top',
        onUpdate: self => {
          scroll.current.p = self.progress;
        }
      });
      if (prefersReducedMotion()) return () => st.kill();
      gsap.to('.hero__grid', {
        yPercent: -12,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '62% top', scrub: true }
      });
      gsap.to('.hero__foot', {
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '25% top', scrub: true }
      });
      return () => st.kill();
    },
    { scope: root }
  );

  // entrance once the power is on
  useGSAP(
    () => {
      if (!powered) return undefined;
      const title = root.current.querySelector('.hero__title');
      const reveal = root.current.querySelectorAll('[data-in]');
      if (prefersReducedMotion()) {
        gsap.set([title, ...reveal], { autoAlpha: 1, y: 0 });
        return undefined;
      }
      const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'hero__line' });
      gsap.set(title, { autoAlpha: 1 });
      const tl = gsap.timeline({ delay: 0.35 });
      tl.from(split.lines, { yPercent: 115, duration: 1.3, stagger: 0.1, ease: 'expo.out' }).fromTo(
        reveal,
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.09, ease: 'expo.out' },
        0.25
      );
      return () => {
        tl.kill();
        split.revert();
      };
    },
    { dependencies: [powered], scope: root }
  );

  // the "touch the glass" hint fades once the cursor has moved around
  useEffect(() => {
    if (hinted) return undefined;
    let moves = 0;
    const onMove = () => {
      moves += 1;
      if (moves > 120) setHinted(true);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [hinted]);

  return (
    <section id="top" className={`hero${powered ? ' is-powered' : ''}`} ref={root} aria-label="Introduction">
      <div className="hero__stage" aria-hidden="true">
        {webgl ? (
          <SafeBoundary fallback={<HeroFallback />}>
            <Suspense fallback={<HeroFallback />}>
              <HeroScene powered={powered} active={inView} scrollRef={scroll} small={small} />
            </Suspense>
          </SafeBoundary>
        ) : (
          <HeroFallback />
        )}
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <div className="hero__grid wrap">
        <div className="hero__content">
          <p className="eyebrow" data-in>
            Qualified electrician · Potchefstroom
          </p>
          <h1 className="hero__title display">
            Power that <em>stays</em> on.
          </h1>
          <p className="hero__lede lede" data-in>
            Legal solar &amp; battery backup, installations, upgrades, repairs and COCs, with a free assessment to fit
            your needs to your budget.
          </p>
          <div className="hero__actions" data-in>
            <Magnet padding={50} magnetStrength={4} wrapperClassName="hero__magnet">
              <a
                className="btn btn--volt"
                href="#contact"
                onClick={event => {
                  event.preventDefault();
                  scrollToTarget('#contact');
                }}
              >
                Book a free assessment
                <span className="btn__bolt">
                  <Bolt />
                </span>
              </a>
            </Magnet>
            <a className="btn btn--ghost" href={BUSINESS.phoneHref}>
              <Phone />
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>

        <ul className="hero__aside" data-in aria-label="Why Power2U">
          <li className="hero__fact">
            <span className="hero__fact-k">{BUSINESS.experience}</span>
            <span className="hero__fact-v">
              years&rsquo; experience
              <br />
              qualified electrician
            </span>
          </li>
          <li className="hero__fact">
            <span className="hero__fact-k">ECB</span>
            <span className="hero__fact-v">
              registered
              <br />
              {BUSINESS.ecb} · {BUSINESS.ecbRegion}
            </span>
          </li>
          <li className="hero__fact">
            <span className="hero__fact-k">Free</span>
            <span className="hero__fact-v">
              assessment &amp;
              <br />
              product coaching
            </span>
          </li>
        </ul>
      </div>

      <div className="hero__foot wrap">
        <span className="mono hero__area" data-in>
          Potchefstroom &amp; surrounds
        </span>
        <button className="hero__scroll" type="button" onClick={() => scrollToTarget('#services')} data-in>
          <span className="mono">Scroll</span>
          <span className="hero__scroll-line" aria-hidden="true" />
        </button>
        <span className="hero__hint-wrap" aria-hidden="true" data-in>
          <span className={`mono hero__hint${hinted ? ' is-hidden' : ''}`}>↯ Bring your cursor to the glass</span>
        </span>
      </div>
    </section>
  );
}
