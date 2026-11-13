import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/smooth';
import { BUSINESS } from '../data/site';
import ScrollReveal from './reactbits/ScrollReveal/ScrollReveal';
import SpotlightCard from './reactbits/SpotlightCard/SpotlightCard';
import MagnetLines from './reactbits/MagnetLines/MagnetLines';
import SectionLabel from './SectionLabel';
import CountUp from './CountUp';
import Photo from './Photo';
import { Clipboard, Coach, Phone, Shield, Spark } from './Icons';
import './About.css';

const spot = {
  spotlightColor: 'rgba(142, 240, 76, 0.55)',
  intensity: 0.16,
  spotlightSize: 300,
  borderGlow: 0.7,
  theme: 'dark'
};

export default function About() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.bento > *', {
        y: 60,
        autoAlpha: 0,
        duration: 1.2,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.bento', start: 'top 82%' }
      });
      gsap.fromTo(
        '.about__photo img',
        { yPercent: -8, scale: 1.18 },
        { yPercent: 8, scale: 1.18, ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    },
    { scope: root }
  );

  return (
    <section id="about" className="about section" ref={root} aria-label="About Power2U">
      <div className="wrap">
        <SectionLabel index="04">About</SectionLabel>
        <ScrollReveal
          baseOpacity={0.12}
          enableBlur
          blurStrength={6}
          baseRotation={0}
          stagger={0.035}
          highlightColor="#c9ff92"
          containerClassName="about__statement"
          textClassName="about__statement-text"
          wordAnimationEnd="bottom 55%"
        >
          Thirty years as a qualified electrician taught us one thing: do it properly, or not at all. Every Power2U
          installation is legal, certified and explained to you before we leave.
        </ScrollReveal>

        <div className="bento">
          <figure className="bento__photo about__photo">
            <Photo name="onsite-roof" alt="Power2U electrician on site during an installation" focus="30% 40%" sizes="(max-width: 900px) 100vw, 46vw" />
            <figcaption>
              <span className="mono">On site</span>
              Every job starts with an assessment in person.
            </figcaption>
          </figure>

          <SpotlightCard {...spot} className="bento__card bento__years">
            <div className="bento__field" aria-hidden="true">
              <MagnetLines spacing={30} lineColor="rgba(142, 240, 76, 0.28)" accentColor="#c9ff92" lineWidth={2} lineHeight={14} radius={220} intro={false} />
            </div>
            <div className="bento__years-copy">
              <p className="bento__big">
                <CountUp to={BUSINESS.experience} />
                <span className="bento__unit">years</span>
              </p>
              <p className="bento__text">Qualified electrician with three decades of hands-on experience in homes and businesses.</p>
            </div>
          </SpotlightCard>

          <SpotlightCard {...spot} className="bento__card">
            <Shield className="bento__icon" />
            <h3 className="bento__title">ECB registered</h3>
            <p className="bento__text">Electrical Conformance Board</p>
            <p className="bento__code mono">
              {BUSINESS.ecb} · {BUSINESS.ecbRegion}
            </p>
          </SpotlightCard>

          <SpotlightCard {...spot} className="bento__card">
            <Spark className="bento__icon" />
            <h3 className="bento__title">Legal &amp; certified</h3>
            <p className="bento__text">Installed to standard, with a Certificate of Compliance where required.</p>
          </SpotlightCard>

          <SpotlightCard {...spot} className="bento__card">
            <Clipboard className="bento__icon" />
            <h3 className="bento__title">Free assessment</h3>
            <p className="bento__text">A professional on-site assessment that fits your needs to your budget.</p>
          </SpotlightCard>

          <SpotlightCard {...spot} className="bento__card">
            <Coach className="bento__icon" />
            <h3 className="bento__title">Free coaching</h3>
            <p className="bento__text">After installation we show you how to use and monitor your system.</p>
          </SpotlightCard>

          <SpotlightCard {...spot} className="bento__card bento__contact">
            <p className="eyebrow">Talk to the electrician</p>
            <p className="bento__person">{BUSINESS.contact}</p>
            <a className="bento__phone" href={BUSINESS.phoneHref}>
              <Phone />
              {BUSINESS.phoneDisplay}
            </a>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
