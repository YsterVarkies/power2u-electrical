import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/smooth';
import { STEPS } from '../data/site';
import SectionLabel from './SectionLabel';
import './Process.css';

/** Four steps on one live wire: current flows down as you scroll and trips each breaker on. */
export default function Process() {
  const root = useRef(null);

  useGSAP(
    () => {
      const list = root.current.querySelector('.process__steps');
      const steps = gsap.utils.toArray('.process__step', root.current);
      const reduced = prefersReducedMotion();

      gsap.fromTo(
        '.process__current',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: reduced ? true : 0.6 }
        }
      );

      steps.forEach(step => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 62%',
          onEnter: () => step.classList.add('is-live'),
          onLeaveBack: () => step.classList.remove('is-live')
        });
        if (!reduced) {
          gsap.from(step.querySelectorAll('.process__anim'), {
            x: 30,
            autoAlpha: 0,
            duration: 1,
            stagger: 0.06,
            ease: 'expo.out',
            scrollTrigger: { trigger: step, start: 'top 80%' }
          });
        }
      });
    },
    { scope: root }
  );

  return (
    <section id="process" className="process section" ref={root} aria-label="How it works">
      <div className="wrap process__grid">
        <div className="process__head">
          <SectionLabel index="05">How it works</SectionLabel>
          <h2 className="h2 display">
            From first call to <em>lights on</em>.
          </h2>
          <p className="lede">
            No guesswork and no overselling. One qualified electrician takes you from the assessment to a system you
            know how to use.
          </p>
        </div>

        <div className="process__steps">
          <span className="process__track" aria-hidden="true">
            <span className="process__current">
              <span className="process__spark" />
            </span>
          </span>
          <ol className="process__list">
            {STEPS.map((step, i) => (
              <li key={step.title} className="process__step">
                <span className="process__node" aria-hidden="true">
                  <span className="process__toggle" />
                </span>
                <span className="process__num mono process__anim">Step {String(i + 1).padStart(2, '0')}</span>
                <h3 className="process__title process__anim">{step.title}</h3>
                <p className="process__text process__anim">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
