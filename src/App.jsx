import { useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from './lib/gsap';
import { startSmoothScroll } from './lib/smooth';
import ClickSpark from './components/reactbits/ClickSpark/ClickSpark';
import Preloader from './components/Preloader';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Ticker from './components/Ticker';
import Services from './components/Services';
import EnergyStory from './components/EnergyStory';
import Projects from './components/Projects';
import About from './components/About';
import Process from './components/Process';
import Brands from './components/Brands';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { ScrollWire } from './components/Chrome';

export default function App() {
  const [stage, setStage] = useState('loading');

  useEffect(() => {
    startSmoothScroll();
    window.scrollTo(0, 0);
    // fonts change line lengths; re-measure every trigger once they are in
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  const onReveal = useCallback(() => setStage('revealing'), []);
  const onDone = useCallback(() => {
    setStage('ready');
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  return (
    <ClickSpark
      sparkColor={['#8ef04c', '#d9ffb8', '#ffffff']}
      sparkSize={10}
      sparkRadius={28}
      sparkCount={9}
      duration={480}
      shape="line"
      glow={0.7}
      randomness={0.6}
      style={{ height: 'auto', minHeight: '100%' }}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {stage !== 'ready' && <Preloader onReveal={onReveal} onDone={onDone} />}
      <Nav />
      <main id="main">
        <Hero powered={stage !== 'loading'} />
        <Ticker />
        <Services />
        <EnergyStory />
        <Projects />
        <About />
        <Process />
        <Brands />
        <Contact />
      </main>
      <Footer />
      <ScrollWire />
      <div className="grain" aria-hidden="true" />
    </ClickSpark>
  );
}
