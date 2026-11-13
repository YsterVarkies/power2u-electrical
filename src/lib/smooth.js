import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

let lenis = null;
let locks = 0;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tick = time => lenis?.raf(time * 1000);

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function startSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis;
  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.95,
    smoothWheel: true,
    anchors: false
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = () => lenis;

const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

/** Scroll to a selector, element or pixel offset (smoothly when Lenis is running). */
export function scrollToTarget(target, options = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (lenis) {
    lenis.scrollTo(typeof target === 'number' ? target : el, {
      duration: 1.5,
      easing: easeOutQuart,
      force: true,
      ...options
    });
    return;
  }
  const top = typeof target === 'number' ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

/** Reference-counted scroll lock (menu, project viewer, preloader). */
export function lockScroll(locked) {
  locks = Math.max(0, locks + (locked ? 1 : -1));
  const on = locks > 0;
  if (lenis) (on ? lenis.stop() : lenis.start());
  document.documentElement.classList.toggle('is-locked', on);
}
