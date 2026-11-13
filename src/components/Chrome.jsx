import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../lib/gsap';

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
