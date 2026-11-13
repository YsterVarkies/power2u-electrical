const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false'
};

export const Bolt = props => (
  <svg {...base} {...props}>
    <path d="M13.2 2.5 4.8 13.4h6.1l-1.1 8.1 8.4-10.9h-6.1l1.1-8.1Z" fill="currentColor" stroke="none" />
  </svg>
);

export const Phone = props => (
  <svg {...base} {...props}>
    <path d="M5 3.8h3.2l1.6 4-2 1.3a10.6 10.6 0 0 0 5.1 5.1l1.3-2 4 1.6v3.2a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6a2 2 0 0 1 2-2.2Z" />
  </svg>
);

export const WhatsApp = props => (
  <svg {...base} {...props}>
    <path d="M4.3 19.7 5.4 16a8 8 0 1 1 2.9 2.8l-4 .9Z" />
    <path d="M9.2 8.6c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.1-.2.3 0 .5a6 6 0 0 0 2.8 2.4c.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.5.7c.3.2.4.3.4.5a1.9 1.9 0 0 1-.9 1.6c-.6.4-1.7.6-3.4-.1a8.9 8.9 0 0 1-4-3.6c-.6-1-.9-2-.6-2.9Z" fill="currentColor" stroke="none" />
  </svg>
);

export const Mail = props => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const Pin = props => (
  <svg {...base} {...props}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);

export const Arrow = props => (
  <svg {...base} {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = props => (
  <svg {...base} {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const Close = props => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Shield = props => (
  <svg {...base} {...props}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="m8.8 12 2.2 2.2 4.4-4.6" />
  </svg>
);

export const Clipboard = props => (
  <svg {...base} {...props}>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2.5" />
    <path d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7M8.5 11h7M8.5 15h5" />
  </svg>
);

export const Spark = props => (
  <svg {...base} {...props}>
    <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M5.3 18.7l2.8-2.8M15.9 8.1l2.8-2.8" />
  </svg>
);

export const Coach = props => (
  <svg {...base} {...props}>
    <path d="M4 18.5V6.5A2.5 2.5 0 0 1 6.5 4H20v12H6.5A2.5 2.5 0 0 0 4 18.5Zm0 0A2.5 2.5 0 0 0 6.5 21H20" />
    <path d="M9 8.5h6M9 12h4" />
  </svg>
);
