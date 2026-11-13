import { photos } from '../data/site';

/**
 * Responsive photo: 1x original + 2x cleaned/upscaled source, with a tiny
 * blurred placeholder painted behind it while it loads.
 */
export default function Photo({ name, alt = '', sizes = '50vw', className = '', eager = false, focus, style }) {
  const p = photos[name];
  if (!p) return null;
  return (
    <img
      className={`photo ${className}`}
      src={p.src2x}
      srcSet={`${p.src} ${Math.round(p.width / 2)}w, ${p.src2x} ${p.width}w`}
      sizes={sizes}
      width={p.width}
      height={p.height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
      style={{ backgroundImage: `url(${p.placeholder})`, objectPosition: focus, ...style }}
    />
  );
}
