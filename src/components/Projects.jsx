import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, useGSAP } from '../lib/gsap';
import { lockScroll, prefersReducedMotion, scrollToTarget } from '../lib/smooth';
import { PROJECTS } from '../data/site';
import SectionLabel from './SectionLabel';
import Photo from './Photo';
import { Arrow, ArrowLeft, Close } from './Icons';
import './Projects.css';

const pad = n => String(n).padStart(2, '0');

/* ───────────────────────── detail viewer ───────────────────────── */

function Viewer({ index, origin, onIndex, onClose }) {
  const root = useRef(null);
  const slot = useRef(null);
  const arch = useRef(null);
  const closeBtn = useRef(null);
  const closing = useRef(false);
  const project = PROJECTS[index];
  const reduced = prefersReducedMotion();

  // viewport rect → coordinates for the arch (fixed on desktop, absolute in the scrolling sheet on mobile)
  const local = rect => {
    if (!rect || !arch.current) return rect;
    const absolute = getComputedStyle(arch.current).position === 'absolute';
    return absolute ? { ...rect, top: rect.top + root.current.scrollTop } : rect;
  };
  const rectOf = el => {
    const r = el.getBoundingClientRect();
    return local({ left: r.left, top: r.top, width: r.width, height: r.height });
  };

  // open: grow the arch from the niche the visitor clicked
  useLayoutEffect(() => {
    lockScroll(true);
    const to = rectOf(slot.current);
    const from = local(origin?.()) ?? to;
    gsap.set(arch.current, { ...from, borderRadius: '999px 999px 24px 24px' });
    const tl = gsap.timeline();
    tl.to(root.current, { autoAlpha: 1, duration: reduced ? 0.01 : 0.5, ease: 'power2.out' }, 0)
      .to(arch.current, { ...to, duration: reduced ? 0.01 : 1.05, ease: 'expo.inOut' }, 0)
      .fromTo(
        root.current.querySelectorAll('.viewer__reveal'),
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out' },
        reduced ? 0 : 0.55
      );
    closeBtn.current?.focus({ preventScroll: true });

    const onResize = () => gsap.set(arch.current, rectOf(slot.current));
    window.addEventListener('resize', onResize);
    return () => {
      tl.kill();
      window.removeEventListener('resize', onResize);
      lockScroll(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // swapping projects inside the viewer: quick crossfade
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    gsap.fromTo(root.current.querySelectorAll('.viewer__swap'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.04, ease: 'expo.out' });
    gsap.fromTo(arch.current.querySelector('img'), { scale: 1.15, autoAlpha: 0.4 }, { scale: 1, autoAlpha: 1, duration: 1, ease: 'expo.out' });
  }, [index]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const to = local(origin?.());
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(root.current.querySelectorAll('.viewer__reveal'), { autoAlpha: 0, y: -10, duration: 0.25, ease: 'power2.in' }, 0);
    if (to && !reduced) tl.to(arch.current, { ...to, duration: 0.85, ease: 'expo.inOut' }, 0.05);
    tl.to(root.current, { autoAlpha: 0, duration: 0.35 }, reduced ? 0 : 0.6);
  }, [onClose, origin, reduced]);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') onIndex((index + 1) % PROJECTS.length);
      if (event.key === 'ArrowLeft') onIndex((index - 1 + PROJECTS.length) % PROJECTS.length);
      if (event.key === 'Tab') {
        const focusable = root.current.querySelectorAll('button, a[href]');
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, index, onIndex]);

  return (
    <div className="viewer wall" ref={root} role="dialog" aria-modal="true" aria-labelledby="viewer-title">
      <div className="viewer__grid wrap">
        <div className="viewer__copy">
          <div className="viewer__top viewer__reveal">
            <button ref={closeBtn} type="button" className="viewer__back" onClick={close}>
              <ArrowLeft /> Back to projects
            </button>
            <span className="mono viewer__count">
              {pad(index + 1)} / {pad(PROJECTS.length)}
            </span>
          </div>
          <p className="eyebrow viewer__reveal viewer__swap">{project.tag}</p>
          <h3 id="viewer-title" className="viewer__name viewer__reveal viewer__swap">
            <span className="serif">{project.name}</span>
          </h3>
          <p className="viewer__title viewer__reveal viewer__swap">{project.title}</p>
          <p className="viewer__summary viewer__reveal viewer__swap">{project.summary}</p>
          <dl className="viewer__specs viewer__reveal viewer__swap">
            {project.specs.map(([k, v]) => (
              <div key={k} className="viewer__spec">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="viewer__actions viewer__reveal">
            <button
              type="button"
              className="btn btn--volt"
              onClick={() => {
                onClose();
                requestAnimationFrame(() => scrollToTarget('#contact'));
              }}
            >
              Book a similar install <Arrow />
            </button>
            <div className="viewer__nav">
              <button type="button" aria-label="Previous project" onClick={() => onIndex((index - 1 + PROJECTS.length) % PROJECTS.length)}>
                <ArrowLeft />
              </button>
              <button type="button" aria-label="Next project" onClick={() => onIndex((index + 1) % PROJECTS.length)}>
                <Arrow />
              </button>
            </div>
          </div>
        </div>
        <div className="viewer__slot" ref={slot} aria-hidden="true" />
      </div>

      <div className="viewer__arch niche__arch" ref={arch}>
        <span className="niche__light" aria-hidden="true" />
        <Photo name={project.photo} alt={project.title} focus={project.focus} sizes="(max-width: 900px) 90vw, 40vw" eager />
        <span className="niche__led" aria-hidden="true" />
      </div>

      <button type="button" className="viewer__close" onClick={close} aria-label="Close project">
        <Close />
      </button>
    </div>
  );
}

/* ───────────────────────── gallery ───────────────────────── */

export default function Projects() {
  const root = useRef(null);
  const [open, setOpen] = useState(null);
  const buttons = useRef([]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.projects__head > *', {
        y: 40,
        autoAlpha: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.projects__head', start: 'top 80%' }
      });
      gsap.from('.niche', {
        yPercent: 18,
        autoAlpha: 0,
        duration: 1.3,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.niches', start: 'top 82%' }
      });
      gsap.fromTo(
        '.niche__light',
        { opacity: 0 },
        { opacity: 1, duration: 0.15, stagger: { each: 0.12, from: 'start' }, ease: 'steps(3)', scrollTrigger: { trigger: '.niches', start: 'top 70%' } }
      );
    },
    { scope: root }
  );

  const origin = useCallback(() => {
    const el = buttons.current[open ?? 0]?.querySelector('.niche__arch');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }, [open]);

  const onClose = useCallback(() => {
    const at = open;
    setOpen(null);
    requestAnimationFrame(() => buttons.current[at]?.focus({ preventScroll: true }));
  }, [open]);

  return (
    <section id="projects" className="projects wall" ref={root} aria-label="Recent projects">
      <div className="projects__head wrap">
        <SectionLabel index="03">Projects</SectionLabel>
        <h2 className="h2 display">
          Recent <em>installations</em>.
        </h2>
        <p className="lede">
          A few of the systems we have installed, from compact wall-mounted backup to a six-inverter bank. Tap one for
          the details.
        </p>
      </div>

      <ul className="niches wrap">
        {PROJECTS.map((p, i) => (
          <li key={p.photo} className={`niche${open === i ? ' is-open' : ''}`}>
            <button
              ref={el => {
                buttons.current[i] = el;
              }}
              type="button"
              className="niche__btn"
              onClick={() => setOpen(i)}
              aria-label={`View project: ${p.title}`}
            >
              <span className="niche__arch">
                <span className="niche__light" aria-hidden="true" />
                <Photo name={p.photo} alt="" focus={p.focus} sizes="(max-width: 900px) 62vw, 16vw" />
                <span className="niche__led" aria-hidden="true" />
              </span>
              <span className="niche__meta">
                <span className="niche__name serif">{p.name}</span>
                <span className="niche__tag mono">{p.tag}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open !== null && createPortal(<Viewer index={open} origin={origin} onIndex={setOpen} onClose={onClose} />, document.body)}
    </section>
  );
}
