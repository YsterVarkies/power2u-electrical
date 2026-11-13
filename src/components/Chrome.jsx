import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { scrollToTarget } from '../lib/smooth';
import { BUSINESS, whatsappHref } from '../data/site';
import { Bolt, Phone, WhatsApp } from './Icons';
import './Chrome.css';

/** Fixed right-edge "live wire" that charges with page progress (desktop). */
export function ScrollWire() {
  const ref = useRef(null);
  useGSAP(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: self => ref.current?.style.setProperty('--progress', self.progress.toFixed(4))
    });
    return () => st.kill();
  });
  return (
    <div className="wire" ref={ref} aria-hidden="true">
      <span className="wire__fill" />
      <span className="wire__spark" />
    </div>
  );
}

/** Sticky call / WhatsApp / quote bar for phones, shown once the hero is passed. */
export function MobileBar() {
  const ref = useRef(null);
  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: '#top',
      start: 'bottom 70%',
      onEnter: () => ref.current?.classList.add('is-on'),
      onLeaveBack: () => ref.current?.classList.remove('is-on')
    });
    return () => st.kill();
  });
  return (
    <nav className="mbar" ref={ref} aria-label="Quick contact">
      <a href={BUSINESS.phoneHref} className="mbar__btn">
        <Phone /> Call
      </a>
      <a href={whatsappHref('Hi Power2U, I would like a free assessment.')} target="_blank" rel="noreferrer" className="mbar__btn">
        <WhatsApp /> WhatsApp
      </a>
      <a
        href="#contact"
        className="mbar__btn mbar__btn--volt"
        onClick={event => {
          event.preventDefault();
          scrollToTarget('#contact');
        }}
      >
        <Bolt /> Quote
      </a>
    </nav>
  );
}
