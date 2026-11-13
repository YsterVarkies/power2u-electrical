import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { scrollToTarget } from '../lib/smooth';
import { BUSINESS, NAV, SERVICES } from '../data/site';
import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  const root = useRef(null);

  // the giant wordmark charges up like a battery as the footer scrolls in
  useGSAP(
    () => {
      gsap.fromTo(
        '.footer__word',
        { '--fill': '0%' },
        {
          '--fill': '100%',
          ease: 'none',
          scrollTrigger: { trigger: '.footer__word', start: 'top bottom', end: 'bottom bottom', scrub: true }
        }
      );
    },
    { scope: root }
  );

  const go = id => event => {
    event.preventDefault();
    scrollToTarget(`#${id}`);
  };

  return (
    <footer className="footer" ref={root}>
      <div className="wrap footer__top">
        <div className="footer__brand">
          <Logo />
          <p>
            Qualified electrician with {BUSINESS.experience} years&rsquo; experience. Legal solar &amp; battery backup
            systems, electrical installations, upgrades, repairs, maintenance and COCs.
          </p>
        </div>

        <nav className="footer__col" aria-label="Services">
          <h3 className="footer__h">Services</h3>
          {SERVICES.map(s => (
            <a key={s.key} href="#services" onClick={go('services')}>
              {s.title}
            </a>
          ))}
        </nav>

        <nav className="footer__col" aria-label="Company">
          <h3 className="footer__h">Company</h3>
          {NAV.map(item => (
            <a key={item.id} href={`#${item.id}`} onClick={go(item.id)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="footer__col">
          <h3 className="footer__h">Contact</h3>
          <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          <a href={BUSINESS.mapsHref} target="_blank" rel="noreferrer">
            {BUSINESS.address.map(line => (
              <span key={line} className="footer__line">
                {line}
              </span>
            ))}
          </a>
        </div>
      </div>

      <div className="footer__word" aria-hidden="true">
        POWER<span className="footer__2u footer__2">2</span>
        <span className="footer__2u">U</span>
      </div>

      <div className="wrap footer__bottom">
        <span>
          © {new Date().getFullYear()} {BUSINESS.legalName}
        </span>
        <span className="footer__reg">
          Reg {BUSINESS.reg} · VAT {BUSINESS.vat} · ECB {BUSINESS.ecb} · {BUSINESS.ecbRegion}
        </span>
        <button type="button" className="footer__top-btn" onClick={() => scrollToTarget(0)}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
