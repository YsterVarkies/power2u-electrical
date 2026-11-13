import LogoLoop from './reactbits/LogoLoop/LogoLoop';
import { BRANDS } from '../data/site';
import './Brands.css';

const LOGOS = BRANDS.map(name => ({
  title: name,
  ariaLabel: name,
  node: <span className="brand">{name}</span>
}));

export default function Brands() {
  return (
    <section className="brands" aria-label="Brands we install">
      <div className="wrap brands__head">
        <p className="eyebrow">Brands we install &amp; support</p>
        <p className="brands__note">Quality inverters, batteries and protection from names we trust.</p>
      </div>
      <LogoLoop logos={LOGOS} speed={46} direction="right" logoHeight={30} gap={88} fadeOut fadeOutWidth={0.14} scaleOnHover ariaLabel="Brands we install" />
    </section>
  );
}
