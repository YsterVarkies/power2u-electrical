import LogoLoop from './reactbits/LogoLoop/LogoLoop';
import { Bolt } from './Icons';
import './Ticker.css';

const ITEMS = [
  'Solar PV',
  'Battery backup',
  'Hybrid inverters',
  'DB boards',
  'COC certificates',
  'Fault finding',
  'Upgrades',
  'Surge protection',
  'Maintenance',
  'Lighting & plugs'
].map(title => ({ title, ariaLabel: title, node: <span className="ticker__word">{title}</span> }));

export default function Ticker() {
  return (
    <div className="ticker" aria-label="What we do">
      <LogoLoop
        logos={ITEMS}
        speed={70}
        direction="left"
        logoHeight={46}
        gap={34}
        fadeOut
        fadeOutWidth={0.08}
        scrollBoost={1.4}
        draggable={false}
        ariaLabel="Electrical services"
        renderItem={item => (
          <span className="ticker__item">
            <Bolt className="ticker__bolt" />
            {item.node}
          </span>
        )}
      />
    </div>
  );
}
