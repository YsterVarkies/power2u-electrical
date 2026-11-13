import { useRef } from 'react';
import { useInView } from '../hooks/useInView';

/** "[02] Services" label with a tiny breaker that flips on when it scrolls into view. */
export default function SectionLabel({ index, children, className = '' }) {
  const ref = useRef(null);
  const on = useInView(ref, { rootMargin: '0px 0px -15% 0px', once: true });
  return (
    <p ref={ref} className={`label${on ? ' is-on' : ''} ${className}`}>
      <span className="label__breaker" aria-hidden="true" />
      <span className="label__index">{index}</span>
      <span>{children}</span>
    </p>
  );
}
