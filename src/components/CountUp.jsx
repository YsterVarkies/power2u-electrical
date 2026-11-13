import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/smooth';

/** Counts up to `to` the first time it scrolls into view. */
export default function CountUp({ to, duration = 2, className = '' }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (prefersReducedMotion()) {
        el.textContent = String(to);
        return;
      }
      const state = { v: 0 };
      gsap.to(state, {
        v: to,
        duration,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = String(Math.round(state.v));
        },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    },
    { dependencies: [to] }
  );
  return (
    <span ref={ref} className={className} aria-label={String(to)}>
      0
    </span>
  );
}
