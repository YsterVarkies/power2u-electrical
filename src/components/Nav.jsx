import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { lockScroll, scrollToTarget } from '../lib/smooth';
import { BUSINESS, NAV, whatsappHref } from '../data/site';
import Logo from './Logo';
import { Bolt, Phone, WhatsApp, Mail } from './Icons';
import './Nav.css';

export default function Nav() {
  const header = useRef(null);
  const menu = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  // hide on scroll down, show on scroll up, glass background once scrolled
  useGSAP(() => {
    const el = header.current;
    let hidden = false;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: self => {
        const y = self.scroll();
        el.classList.toggle('is-scrolled', y > 40);
        // keep the header (and its hamburger) on screen on phones/tablets
        const hide = y > 220 && self.direction === 1 && window.innerWidth > 1100;
        if (hide !== hidden) {
          hidden = hide;
          gsap.to(el, { yPercent: hide ? -110 : 0, duration: 0.6, ease: hide ? 'power3.in' : 'expo.out', overwrite: true });
        }
      }
    });
    return () => st.kill();
  });

  // current section highlight
  useEffect(() => {
    const sections = NAV.map(item => document.getElementById(item.id)).filter(Boolean);
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(section => io.observe(section));
    return () => io.disconnect();
  }, []);

  // mobile menu
  useEffect(() => {
    if (!open) return undefined;
    lockScroll(true);
    const tl = gsap.timeline();
    tl.fromTo(menu.current, { clipPath: 'circle(0% at calc(100% - 44px) 38px)' }, { clipPath: 'circle(150% at calc(100% - 44px) 38px)', duration: 0.9, ease: 'expo.inOut' })
      .fromTo('.menu__link', { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, 0.35)
      .fromTo('.menu__foot', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.55);
    const onKey = event => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      tl.kill();
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (event, id) => {
    event.preventDefault();
    setOpen(false);
    // wait one frame so the scroll lock is released before scrolling
    requestAnimationFrame(() => scrollToTarget(`#${id}`));
  };

  return (
    <>
      <header className="nav" ref={header}>
        <div className="nav__inner">
          <a className="nav__logo" href="#top" onClick={event => go(event, 'top')} aria-label="Power2U Electrical, back to top">
            <Logo />
          </a>

          <nav className="nav__links" aria-label="Main">
            {NAV.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav__link${active === item.id ? ' is-active' : ''}`}
                onClick={event => go(event, item.id)}
              >
                <span className="nav__dot" aria-hidden="true" />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <a className="nav__phone" href={BUSINESS.phoneHref}>
              <Phone />
              <span>{BUSINESS.phoneDisplay}</span>
            </a>
            <a className="btn btn--volt btn--sm nav__cta" href="#contact" onClick={event => go(event, 'contact')}>
              <Bolt />
              Free assessment
            </a>
            <button
              className={`nav__burger${open ? ' is-open' : ''}`}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen(value => !value)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="menu" id="mobile-menu" ref={menu} role="dialog" aria-modal="true" aria-label="Menu">
          <nav className="menu__nav" aria-label="Mobile">
            {[{ id: 'top', label: 'Home' }, ...NAV].map((item, index) => (
              <a key={item.id} href={`#${item.id}`} className="menu__item" onClick={event => go(event, item.id)}>
                <span className="menu__link">
                  <span className="menu__index">{String(index + 1).padStart(2, '0')}</span>
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
          <div className="menu__foot">
            <a className="btn btn--volt" href={BUSINESS.phoneHref}>
              <Phone /> Call {BUSINESS.phoneDisplay}
            </a>
            <a className="btn btn--ghost" href={whatsappHref('Hi Power2U, I would like a free assessment.')} target="_blank" rel="noreferrer">
              <WhatsApp /> WhatsApp
            </a>
            <a className="menu__mail" href={`mailto:${BUSINESS.email}`}>
              <Mail /> {BUSINESS.email}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
