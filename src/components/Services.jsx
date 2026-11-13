import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { prefersReducedMotion, scrollToTarget } from '../lib/smooth';
import { SERVICES } from '../data/site';
import SectionLabel from './SectionLabel';
import Photo from './Photo';
import { Arrow } from './Icons';
import './Services.css';

const pad = n => String(n).padStart(2, '0');

/**
 * Pinned service slider (after the "ice cream slider" reference): a giant word
 * behind a centred subject, colour that follows the active slide, and a column
 * of round thumbnails to jump between services. Scrolling steps through slides.
 */
export default function Services() {
  const root = useRef(null);
  const st = useRef(null);
  const timeline = useRef(null);
  const previous = useRef(0);
  const [active, setActive] = useState(0);
  const n = SERVICES.length;

  useGSAP(
    () => {
      st.current = ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: self => {
          const index = Math.min(n - 1, Math.floor(self.progress * n));
          setActive(current => (current === index ? current : index));
        }
      });
      return () => st.current?.kill();
    },
    { scope: root }
  );

  useEffect(() => {
    const from = previous.current;
    const to = active;
    if (from === to) return;
    previous.current = to;

    const q = gsap.utils.selector(root);
    const words = q('.svc__word');
    const shots = q('.svc__shot');
    const texts = q('.svc__text');
    const counter = q('.svc__count-now')[0];
    timeline.current?.progress(1).kill();

    const others = index => index !== from && index !== to;
    gsap.set(words.filter((_, i) => others(i)), { autoAlpha: 0 });
    gsap.set(texts.filter((_, i) => others(i)), { autoAlpha: 0 });
    gsap.set(shots.filter((_, i) => others(i)), { clipPath: 'inset(100% 0% 0% 0%)' });

    if (prefersReducedMotion()) {
      gsap.set([words[from], texts[from]], { autoAlpha: 0 });
      gsap.set(shots[from], { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set([words[to], texts[to]], { autoAlpha: 1, xPercent: 0, y: 0 });
      gsap.set(shots[to], { clipPath: 'inset(0% 0% 0% 0%)' });
      counter.textContent = pad(to + 1);
      return;
    }

    const dir = to > from ? 1 : -1;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(words[from], { xPercent: -9 * dir, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0)
      .fromTo(words[to], { xPercent: 12 * dir, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 1.3 }, 0.18)
      .to(shots[from], { clipPath: dir > 0 ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)', duration: 0.75, ease: 'power3.inOut' }, 0)
      .fromTo(
        shots[to],
        { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power3.inOut' },
        0.08
      )
      .fromTo(shots[to].querySelector('img'), { scale: 1.28 }, { scale: 1, duration: 1.5 }, 0.08)
      .to(texts[from], { autoAlpha: 0, y: -18 * dir, duration: 0.35, ease: 'power2.in' }, 0)
      .fromTo(texts[to], { autoAlpha: 0, y: 26 * dir }, { autoAlpha: 1, y: 0, duration: 1 }, 0.34)
      .to(counter, { duration: 0.6, scrambleText: { text: pad(to + 1), chars: '0123456789', speed: 0.8 }, ease: 'none' }, 0.1);
    timeline.current = tl;
  }, [active]);

  const goTo = index => {
    const trigger = st.current;
    if (!trigger) return;
    const at = index === 0 ? 0 : (index + 0.4) / n;
    scrollToTarget(Math.round(trigger.start + (trigger.end - trigger.start) * at) + 2);
  };

  const onKey = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(Math.min(n - 1, active + 1));
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(Math.max(0, active - 1));
    }
  };

  const current = SERVICES[active];

  return (
    <section id="services" className="svc" ref={root} style={{ '--slides': n }} aria-label="Services">
      <div className="svc__sticky" style={{ '--tint': current.tint }}>
        {SERVICES.map((s, i) => (
          <div key={s.key} className={`svc__glow${i === active ? ' is-active' : ''}`} style={{ '--tint': s.tint }} aria-hidden="true" />
        ))}

        <div className="svc__words" aria-hidden="true">
          {SERVICES.map((s, i) => (
            <span key={s.key} className="svc__word" style={{ '--tint': s.tint }} data-first={i === 0 || undefined}>
              {s.word}
            </span>
          ))}
        </div>

        <div className="svc__layout wrap">
          <div className="svc__info">
            <SectionLabel index="01">Services</SectionLabel>
            <p className="svc__count mono" aria-hidden="true">
              <span className="svc__count-now">01</span>
              <span className="svc__count-sep">/</span>
              {pad(n)}
            </p>
            <div className="svc__texts">
              {SERVICES.map((s, i) => (
                <article key={s.key} className="svc__text" data-first={i === 0 || undefined} aria-hidden={i !== active}>
                  <h2 className="svc__title display">{s.title}</h2>
                  <p className="svc__blurb">{s.blurb}</p>
                  <ul className="svc__points">
                    {s.points.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <a
              className="btn btn--ghost svc__cta"
              href="#contact"
              onClick={event => {
                event.preventDefault();
                scrollToTarget('#contact');
              }}
            >
              Get a quote
              <Arrow />
            </a>
          </div>

          <div className="svc__stage">
            <div className="svc__cell">
              <span className="svc__terminal" aria-hidden="true" />
              <div className="svc__shots">
                {SERVICES.map((s, i) => (
                  <figure key={s.key} className="svc__shot" data-first={i === 0 || undefined}>
                    <Photo name={s.photo} alt={s.title} focus={s.focus} sizes="(max-width: 768px) 60vw, 28vw" />
                  </figure>
                ))}
                <span className="svc__scan" aria-hidden="true" />
              </div>
              <span className="svc__level" aria-hidden="true">
                {SERVICES.map((s, i) => (
                  <span key={s.key} className={i <= active ? 'is-on' : ''} />
                ))}
              </span>
            </div>
          </div>

          <nav className="svc__thumbs" aria-label="Choose a service" onKeyDown={onKey}>
            {SERVICES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className={`svc__thumb${i === active ? ' is-active' : ''}`}
                style={{ '--tint': s.tint }}
                onClick={() => goTo(i)}
                aria-current={i === active ? 'true' : undefined}
              >
                <span className="svc__thumb-img">
                  <Photo name={s.photo} alt="" focus={s.focus} sizes="64px" />
                </span>
                <span className="svc__thumb-label">{s.short}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="svc__progress" aria-hidden="true">
          {SERVICES.map((s, i) => (
            <span key={s.key} className={i === active ? 'is-active' : i < active ? 'is-done' : ''} />
          ))}
        </div>
      </div>
    </section>
  );
}
