# Power2U Electrical: website

One-page marketing site for Power2U Electrical (Pty) Ltd, Potchefstroom.
React + Vite, Three.js (React Three Fiber), GSAP, Lenis smooth scrolling and React Bits components.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

`dist/` is a static site: upload it to any host (cPanel `public_html`, Netlify, Vercel, Cloudflare Pages).

## Media

The original (low-resolution) photos live in `Images/` and the Motion Sites hero video in `assets-src/`.
They are cleaned up, upscaled 2× and compressed by:

```bash
npm run media
```

This writes `public/media/**` and `src/data/media.json` (sizes and blur placeholders). Swap in better photos
later by replacing files in `Images/` (same names) and running the command again.

## Where things are

| What | File |
| --- | --- |
| Business details, services, projects, copy | `src/data/site.js` |
| 3D hero (faceted Power2U bulb, plasma arcs, AI video backdrop) | `src/components/three/HeroScene.jsx` |
| 3D solar & load-shedding story | `src/components/three/EnergyScene.jsx` |
| Services slider | `src/components/Services.jsx` |
| Projects gallery + viewer | `src/components/Projects.jsx` |
| Contact form (opens WhatsApp / email, nothing stored) | `src/components/Contact.jsx` |
| React Bits components | `src/components/reactbits/` |
| Colours, type, buttons | `src/styles/global.css` |

## Before going live

- The contact form hands off to WhatsApp or the visitor's email app. Add a form backend later if
  submissions should land in an inbox automatically.
- Project spec text in `src/data/site.js` describes what is visible in each photo; check it with the client.
- Canonical/OG URLs in `index.html` assume `https://power2uelectrical.co.za/`.
