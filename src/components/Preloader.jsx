import { useEffect, useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { lockScroll, prefersReducedMotion } from '../lib/smooth';
import { BulbMark } from './Logo';
import './Preloader.css';

/**
 * "Switching on": the faceted bulb is drawn line by line while the voltage counts
 * up to 230 V, the main breaker flips, and the curtain lifts onto the lit hero.
 */
export default function Preloader({ onReveal, onDone }) {
  const root = useRef(null);
  const locked = useRef(false);
  const callbacks = useRef({ onReveal, onDone });
  callbacks.current = { onReveal, onDone };

  useEffect(() => {
    lockScroll(true);
    locked.current = true;
    return () => {
      if (locked.current) lockScroll(false);
      locked.current = false;
    };
  }, []);

  useGSAP(
    () => {
      const counter = { v: 0 };
      const volts = root.current.querySelector('.pl__volts');
      const status = root.current.querySelector('.pl__status');
      const finish = () => {
        if (locked.current) lockScroll(false);
        locked.current = false;
        callbacks.current.onDone?.();
      };

      if (prefersReducedMotion()) {
        gsap.set('.pl__mark .bulb-mark__base', { opacity: 1 });
        gsap.timeline({ delay: 0.3 })
          .call(() => callbacks.current.onReveal?.())
          .to(root.current, { autoAlpha: 0, duration: 0.4 })
          .call(finish);
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      tl.from('.pl__mark .bulb-mark__lines path', { drawSVG: '0%', duration: 1.15, stagger: 0.12 })
        .from('.pl__mark .bulb-mark__filament', { drawSVG: '0%', duration: 0.6 }, 0.55)
        .from('.pl__mark .bulb-mark__base > *', { opacity: 0, y: 6, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, 0.7)
        .to(
          counter,
          {
            v: 230,
            duration: 1.5,
            ease: 'power3.inOut',
            onUpdate: () => {
              volts.textContent = String(Math.round(counter.v)).padStart(3, '0');
            }
          },
          0.1
        )
        .to('.pl__bar-fill', { scaleX: 1, duration: 1.5, ease: 'power3.inOut' }, 0.1)
        .add(() => root.current?.classList.add('is-on'), 1.55)
        .to(status, { duration: 0.5, scrambleText: { text: 'Power on', chars: 'upperCase', speed: 0.6 } }, 1.5)
        // filament flickers to life
        .to('.pl__mark', { '--glow': 1, duration: 0.05, ease: 'none' }, 1.6)
        .to('.pl__mark', { '--glow': 0.2, duration: 0.07, ease: 'none' })
        .to('.pl__mark', { '--glow': 1, duration: 0.06, ease: 'none' })
        .to('.pl__mark', { '--glow': 0.45, duration: 0.08, ease: 'none' })
        .to('.pl__mark', { '--glow': 1, duration: 0.3, ease: 'power2.out' })
        .add(() => callbacks.current.onReveal?.(), '+=0.12')
        .to('.pl__inner', { y: -40, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, '<')
        .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut' }, '<0.15')
        .call(finish);
    },
    { scope: root }
  );

  return (
    <div className="pl" ref={root} aria-hidden="true">
      <div className="pl__inner">
        <div className="pl__mark">
          <BulbMark />
        </div>
        <div className="pl__meter">
          <div className="pl__reading">
            <span className="pl__volts">000</span>
            <span className="pl__unit">V AC</span>
          </div>
          <div className="pl__bar">
            <span className="pl__bar-fill" />
          </div>
          <div className="pl__row">
            <span className="pl__status">Switching on</span>
            <span className="pl__breaker">
              <span className="pl__breaker-knob" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
