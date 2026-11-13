import './Logo.css';

/** The faceted Power2U bulb, redrawn as a clean vector from the business card. */
export function BulbMark({ className = '', title }) {
  return (
    <svg className={`bulb-mark ${className}`} viewBox="0 0 40 54" fill="none" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <g className="bulb-mark__lines" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 1 28.5 3.2 34.6 9 37.4 17 36.2 25.4 31.6 32.4 27.6 37.4 26.8 41H13.2l-.8-3.6-4-5-4.6-7-1.2-8.4 2.8-8 6.1-5.8Z" />
        <path d="M20 1v9M11.5 3.2 20 10l8.5-6.8M5.4 9l7.1 6.5L20 10l7.5 5.5L34.6 9M2.6 17l9.9-1.5M37.4 17l-9.9-1.5M12.5 15.5 9.5 24l-5.7 1.4M27.5 15.5l3 8.5 5.7 1.4M9.5 24 15 31l-6.6 1.4M30.5 24 25 31l6.6 1.4M15 31h10M12.5 15.5 20 20.5l7.5-5M9.5 24 20 20.5 30.5 24" />
      </g>
      <path className="bulb-mark__filament" d="M17.5 41 16.4 31M22.5 41l1.1-10M16.4 31l1.4-2 1.4 2 1.4-2 1.4 2 1.4-2" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round" />
      <g className="bulb-mark__base" fill="currentColor">
        <rect x="13.6" y="42.4" width="12.8" height="2.6" rx="1.3" />
        <rect x="14.3" y="46" width="11.4" height="2.6" rx="1.3" />
        <path d="M16 49.6h8l-1.6 3.6h-4.8Z" />
      </g>
    </svg>
  );
}

export function Wordmark({ compact = false }) {
  return (
    <span className={`wordmark${compact ? ' wordmark--compact' : ''}`}>
      <span className="wordmark__main">
        POWER<span className="wordmark__2">2</span>
        <span className="wordmark__u">U</span>
      </span>
      <span className="wordmark__sub">Electrical</span>
    </span>
  );
}

export default function Logo({ compact = false }) {
  return (
    <span className="logo">
      <BulbMark className="logo__mark" />
      <Wordmark compact={compact} />
    </span>
  );
}
