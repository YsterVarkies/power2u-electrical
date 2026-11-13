import { useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/smooth';
import { useInView, useMediaQuery } from '../hooks/useInView';
import { BUSINESS, SERVICES, whatsappHref } from '../data/site';
import Lightning from './reactbits/Lightning/Lightning';
import ElectricBorder from './reactbits/ElectricBorder/ElectricBorder';
import SectionLabel from './SectionLabel';
import { Mail, Phone, Pin, WhatsApp } from './Icons';
import './Contact.css';

const EMPTY = { name: '', phone: '', area: '', service: '', message: '' };

export default function Contact() {
  const root = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState('');
  const near = useInView(root, { rootMargin: '40% 0px' });
  const small = useMediaQuery('(max-width: 768px)');

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.contact__copy > *, .contact__card', {
        y: 50,
        autoAlpha: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' }
      });
    },
    { scope: root }
  );

  const update = key => event => {
    setForm(current => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors(current => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please tell us your name.';
    if (form.phone.replace(/\D/g, '').length < 9) next.phone = 'Please add a phone number we can call back.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const message = () =>
    [
      'Hi Power2U, I would like a free assessment.',
      '',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      form.area.trim() && `Area: ${form.area.trim()}`,
      form.service && `Service: ${form.service}`,
      form.message.trim() && `Details: ${form.message.trim()}`
    ]
      .filter(line => line !== false && line !== undefined && line !== null)
      .join('\n');

  const sendWhatsApp = event => {
    event.preventDefault();
    if (!validate()) return;
    window.open(whatsappHref(message()), '_blank', 'noopener,noreferrer');
    setSent('whatsapp');
  };

  const sendEmail = () => {
    if (!validate()) return;
    const subject = `Free assessment request: ${form.name.trim()}`;
    window.location.href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message())}`;
    setSent('email');
  };

  return (
    <section id="contact" className="contact" ref={root} aria-label="Contact">
      <div className="contact__bg" aria-hidden="true">
        {near && (
          <Lightning
            color="#8ef04c"
            bolts={small ? 2 : 3}
            spread={small ? 1.1 : 1.25}
            branches={0.55}
            xOffset={small ? 0 : 0.35}
            size={0.9}
            glow={1.1}
            intensity={0.85}
            speed={0.55}
            flicker={0.55}
            fade={0.35}
            opacity={0.7}
            mouseStrength={1.2}
            dpr={small ? 1 : 1.5}
          />
        )}
      </div>
      <div className="contact__shade" aria-hidden="true" />

      <div className="wrap contact__grid">
        <div className="contact__copy">
          <SectionLabel index="06">Contact</SectionLabel>
          <h2 className="h2 display">
            Ready when the grid <em>isn&rsquo;t</em>.
          </h2>
          <p className="lede">
            Tell us what you need powered. We&rsquo;ll come out, assess it for free and give you a clear, honest quote.
          </p>
          <ul className="contact__list">
            <li>
              <a href={BUSINESS.phoneHref}>
                <Phone />
                <span>
                  <small>Call {BUSINESS.contact}</small>
                  {BUSINESS.phoneDisplay}
                </span>
              </a>
            </li>
            <li>
              <a href={whatsappHref('Hi Power2U, I would like a free assessment.')} target="_blank" rel="noreferrer">
                <WhatsApp />
                <span>
                  <small>WhatsApp</small>
                  Message us directly
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${BUSINESS.email}`}>
                <Mail />
                <span>
                  <small>Email</small>
                  {BUSINESS.email}
                </span>
              </a>
            </li>
            <li>
              <a href={BUSINESS.mapsHref} target="_blank" rel="noreferrer">
                <Pin />
                <span>
                  <small>Visit</small>
                  {BUSINESS.address.join(', ')}
                </span>
              </a>
            </li>
          </ul>
        </div>

        <ElectricBorder
          className="contact__card"
          color="#8ef04c"
          speed={0.8}
          chaos={0.45}
          spread={0.5}
          thickness={1.3}
          strands={2}
          glow={0.7}
          intensity={0.75}
          borderRadius={28}
        >
          <form className="form" onSubmit={sendWhatsApp} noValidate>
            <div className="form__head">
              <h3 className="form__title">Book a free assessment</h3>
              <p className="form__sub">Takes a minute. We&rsquo;ll get back to you to arrange a visit.</p>
            </div>

            <div className="form__grid">
              <label className={`field${errors.name ? ' has-error' : ''}`}>
                <span className="field__label">Name *</span>
                <input type="text" name="name" autoComplete="name" value={form.name} onChange={update('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
                {errors.name && (
                  <span className="field__error" id="err-name">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className={`field${errors.phone ? ' has-error' : ''}`}>
                <span className="field__label">Phone *</span>
                <input type="tel" name="phone" autoComplete="tel" inputMode="tel" value={form.phone} onChange={update('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'err-phone' : undefined} />
                {errors.phone && (
                  <span className="field__error" id="err-phone">
                    {errors.phone}
                  </span>
                )}
              </label>
              <label className="field">
                <span className="field__label">Area / suburb</span>
                <input type="text" name="area" autoComplete="address-level2" value={form.area} onChange={update('area')} />
              </label>
              <label className="field">
                <span className="field__label">Service</span>
                <select name="service" value={form.service} onChange={update('service')}>
                  <option value="">Choose a service</option>
                  {SERVICES.map(s => (
                    <option key={s.key} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                  <option value="Something else">Something else</option>
                </select>
              </label>
              <label className="field field--wide">
                <span className="field__label">What do you need powered?</span>
                <textarea name="message" rows="3" value={form.message} onChange={update('message')} placeholder="e.g. backup for lights, Wi-Fi, fridge and gate motor" />
              </label>
            </div>

            <div className="form__actions">
              <button type="submit" className="btn btn--volt">
                <WhatsApp /> Send via WhatsApp
              </button>
              <button type="button" className="btn btn--ghost" onClick={sendEmail}>
                <Mail /> Email instead
              </button>
            </div>
            <p className="form__note" aria-live="polite">
              {sent
                ? sent === 'whatsapp'
                  ? 'WhatsApp opened with your details. Just press send.'
                  : 'Your email app opened with your details. Just press send.'
                : 'Opens WhatsApp or your email app with your details filled in. Nothing is stored on this site.'}
            </p>
          </form>
        </ElectricBorder>
      </div>
    </section>
  );
}
