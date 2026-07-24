// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import Image from 'next/image';
import { useEffect, useState, type CSSProperties } from 'react';

/* ── Konquered Kocktails palette — warm, luxe, black-and-gold ─────────
   Deliberately its OWN brand, not goElev8's cyber-noir: no cyan, no
   monospace, no sharp tech edges. Elegant serif display + gold on ink. */
const INK = '#0A0A0A';        // base black, faintly warm
const PANEL = '#131110';      // raised surfaces
const PANEL2 = '#1c1916';     // nested surfaces
const GOLD = '#C6A15B';       // Konquered gold
const GOLD_HI = '#E8CC86';    // bright gold for gradients / shimmer
const GOLD_D = '#8a6f3a';     // deep gold
const CREAM = '#EDE4D3';      // parchment accent
const TEXT = '#F4EFE6';       // warm off-white body
const MUTED = '#9c9284';      // warm muted
const DIM = '#6b6357';        // faint
const LINE = 'rgba(198,161,91,0.15)';   // gold hairline
const LINE2 = 'rgba(198,161,91,0.28)';  // stronger gold hairline

const FD = '"Cormorant Garamond", Georgia, serif';       // display
const FB = '"Outfit", system-ui, -apple-system, sans-serif'; // body + labels

/* ── Real Konquered Kocktails content (verbatim from the live page) ── */

const PACKAGES = [
  {
    accent: GOLD,
    img: '/images/kk/bourbon-bar.jpeg',
    name: 'The Kustom Mixology Experience',
    tagline: 'Our signature private event',
    bullets: [
      'Custom kocktail list built for your event',
      '2.5 hours of kustom mixology, live',
      'Handcrafted, themed kocktails all night',
    ],
    goal: 'The Kustom Mixology Experience',
  },
  {
    accent: GOLD,
    img: '/images/kk/signature-sour.png',
    imgContain: true,
    name: 'Spirits & Kocktail Tasting',
    tagline: 'A guided tasting for the curious',
    bullets: [
      'Custom spirits & cocktail tasting',
      'Personalized tasting profile kit',
      'Thoughtfully paired snacks',
    ],
    goal: 'Spirits & Kocktail Tasting',
  },
  {
    accent: GOLD,
    img: '/images/kk/live-mixology.jpg',
    name: 'Full-Service Mobile Bar',
    tagline: 'Weddings, corporate & private parties',
    bullets: [
      'We bring the bar, tools & talent to you',
      'Signature drinks tailored to your event',
      'Professional, licensed bar service',
    ],
    goal: 'Full-Service Mobile Bar',
  },
];

const MENU = [
  {
    name: 'Nearest to Happiness',
    build: '1.5 oz Uncle Nearest 1856 · ½ oz Lillet Rouge · ½ oz lemon · ½ oz simple · 3–4 blueberries',
  },
  {
    name: 'Konquered Sour',
    build: '2 oz bourbon · ¾ oz fresh lemon · ½ oz barrel-aged maple · ½ oz Big O Ginger Liqueur · egg white',
    signature: true,
  },
  {
    name: "Uncle's Spiced Side Car",
    build: '2 oz Uncle Nearest 1856 · ½ oz Big O Ginger Liqueur · ½ oz orange curaçao · ½ oz lemon · ¼ oz simple',
  },
];

const GOALS = [
  'The Kustom Mixology Experience',
  'Spirits & Kocktail Tasting',
  'Full-Service Mobile Bar — Wedding',
  'Full-Service Mobile Bar — Corporate',
  'Full-Service Mobile Bar — Private Party',
  'Kocktail Masterclass',
];

const SLOTS = ['1:00 PM', '3:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];

const STEP_LABELS = ['Your info', 'Pick a date', 'Deposit', 'Booked'];

const CONTACT = {
  phone: '(314) 503-9198',
  email: 'stephen@konqueredbalance.com',
  address: '920 Hemsath, Suite 100, St. Charles, MO 63303',
  area: 'St. Charles & Greater St. Louis',
};

type DayOption = { key: string; dow: string; md: string };
type Lead = { name: string; phone: string; email: string; goal: string };
type FieldErrors = Partial<Record<'name' | 'phone' | 'email', string>>;

function buildDays(): DayOption[] {
  const out: DayOption[] = [];
  const d = new Date();
  while (out.length < 6) {
    d.setDate(d.getDate() + 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
      md: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return out;
}

function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function KkClient() {
  const [step, setStep] = useState(1);
  const [lead, setLead] = useState<Lead>({ name: '', phone: '', email: '', goal: GOALS[0] });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [days, setDays] = useState<DayOption[]>([]);
  const [day, setDay] = useState<DayOption | null>(null);
  const [slot, setSlot] = useState('');
  const [slotError, setSlotError] = useState('');
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [demoNote, setDemoNote] = useState(false);

  useEffect(() => {
    const d = buildDays();
    setDays(d);
    setDay(d[0] ?? null);
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('booked') === '1') setStep(4);
  }, []);

  function validateLead(): boolean {
    const next: FieldErrors = {};
    if (!lead.name.trim()) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) next.email = 'Please enter a valid email address.';
    if (lead.phone.replace(/\D/g, '').length < 10) next.phone = 'Please enter a valid mobile number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function bookExperience(e: React.MouseEvent<HTMLAnchorElement>, goal: string) {
    setLead((prev) => ({ ...prev, goal }));
    setStep(1);
    smoothScrollTo(e, 'book');
  }

  function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!validateLead()) return;
    setStep(2);
  }

  function confirmSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) {
      setSlotError('Please choose a start time to continue.');
      return;
    }
    setSlotError('');
    setStep(3);
  }

  const when = day ? `${day.dow}, ${day.md} at ${slot}` : slot;

  async function payDeposit() {
    if (depositBusy) return;
    setDepositBusy(true);
    setDepositError('');
    try {
      const res = await fetch('/api/checkout/kbsetup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'deposit',
          source: 'kk',
          experience: lead.goal,
          when,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 402) {
        setDemoNote(true);
        setStep(4);
        return;
      }
      setDepositError(data.error || 'Checkout could not start. Please try again.');
      setDepositBusy(false);
    } catch {
      setDepositError('Network error. Please check your connection and try again.');
      setDepositBusy(false);
    }
  }

  function resetFunnel() {
    setStep(1);
    setLead({ name: '', phone: '', email: '', goal: GOALS[0] });
    setErrors({});
    setSlot('');
    setSlotError('');
    setDepositBusy(false);
    setDemoNote(false);
    setDay(days[0] ?? null);
  }

  return (
    <main style={{ background: INK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Animation + a couple of pseudo-element effects that inline styles can't express. */}
      <style>{KEYFRAMES}</style>

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.86)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Brand />
          <nav
            aria-label="Sections"
            style={{
              display: 'flex', gap: 26, marginLeft: 'auto', flexWrap: 'wrap',
              fontFamily: FB, fontSize: 12, letterSpacing: '1.6px', textTransform: 'uppercase', fontWeight: 500,
            }}
          >
            {[
              ['Experiences', 'experiences'],
              ['Menu', 'menu'],
              ['About', 'about'],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={(e) => smoothScrollTo(e, id)}
                 className="kk-navlink"
                 style={{ color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {label}
              </a>
            ))}
          </nav>
          <a href="#book" onClick={(e) => smoothScrollTo(e, 'book')}
             className="kk-gold-btn" style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
            Book an Event
          </a>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ ...shell, position: 'relative', paddingTop: 'clamp(36px, 6vw, 72px)', paddingBottom: 'clamp(36px, 6vw, 72px)' }}>
        {/* warm ambient wash behind the whole hero */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(60% 70% at 78% 40%, rgba(198,161,91,0.10) 0%, transparent 60%)',
        }} />
        {/* Single centered column: copy, then the animated drink medallion,
            then the CTAs directly beneath it. */}
        <div className="kk-fade-up" style={{
          position: 'relative',
          maxWidth: 760, margin: '0 auto', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <Eyebrow>Kraft Kocktails · Mobile Bar · {CONTACT.area}</Eyebrow>
          <h1 style={{
            margin: '20px 0 0', fontFamily: FD, fontWeight: 600,
            fontSize: 'clamp(46px, 8vw, 92px)',
            lineHeight: 0.98, letterSpacing: '-0.01em',
          }}>
            Handcrafted<br />
            <span style={{ color: GOLD, fontStyle: 'italic', fontWeight: 500 }}>kocktail</span> experiences,<br />
            konquered.
          </h1>
          <p style={{
            margin: '24px auto 0', color: CREAM, opacity: 0.82,
            fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.75, maxWidth: 540, fontWeight: 300,
          }}>
            Themed, handcrafted kocktails and full-service mobile bar for weddings, corporate
            events, and private parties. Custom menus, live mixology, and guided tastings — built
            around your night. Reserve your date with a{' '}
            <strong style={{ color: GOLD, fontWeight: 500 }}>$200 deposit</strong>.
          </p>

          {/* Animated medallion — KB logo as a spinning gold seal behind the
              signature drink, with a rotating ring, pulsing glow, and rising
              sparkles. Sits directly above the CTAs. */}
          <div className="kk-stage" style={{ width: '100%', maxWidth: 420, margin: 'clamp(20px, 3vw, 34px) auto 0' }}>
            <div className="kk-glow" />
            <div className="kk-ring" />
            <div className="kk-seal">
              <Image
                src="/images/kbalance-logo.jpg"
                alt="Konquered Kocktails seal"
                width={300}
                height={300}
                priority
                style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'block' }}
              />
            </div>
            <div className="kk-drink">
              <Image
                src="/images/kk/signature-sour.png"
                alt="The Konquered Sour — bourbon, barrel-aged maple, ginger liqueur, orange and brandied cherries"
                width={520}
                height={640}
                priority
                style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.6))' }}
              />
            </div>
            <span className="kk-spark kk-spark-1" />
            <span className="kk-spark kk-spark-2" />
            <span className="kk-spark kk-spark-3" />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 'clamp(20px, 3vw, 34px)', justifyContent: 'center' }}>
            <a href="#book" onClick={(e) => smoothScrollTo(e, 'book')}
               className="kk-gold-btn" style={{ ...goldButton, padding: '15px 30px', fontSize: 13 }}>
              Book Your Event
            </a>
            <a href="#experiences" onClick={(e) => smoothScrollTo(e, 'experiences')}
               className="kk-ghost-btn" style={{ ...ghostButton, padding: '15px 30px', fontSize: 13 }}>
              See Experiences
            </a>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center',
            fontFamily: FB, fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', fontWeight: 500,
          }}>
            <span className="kk-live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
            <span style={{ color: GOLD }}>Now booking</span>
            <span style={{ color: GOLD_D }}>·</span>
            <span style={{ color: MUTED }}>Licensed &amp; insured</span>
            <span style={{ color: GOLD_D }}>·</span>
            <span style={{ color: MUTED }}>Deposit secured by Stripe</span>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ── Experiences / packages ─────────────────────────────────── */}
      <section id="experiences" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="What we bring"
          title={<>Book an <em style={{ color: GOLD, fontStyle: 'italic' }}>experience</em></>}
          sub="Every experience is fully custom and holds your date with a $200 deposit that applies to your final balance."
        />
        <div style={{
          display: 'grid', gap: 20, marginTop: 44,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}>
          {PACKAGES.map((p) => (
            <article key={p.name} className="kk-card" style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: 210, background: PANEL2 }}>
                <Image src={p.img} alt={p.name} fill sizes="(max-width: 700px) 100vw, 380px"
                  style={{ objectFit: p.imgContain ? 'contain' : 'cover', objectPosition: 'center' }} />
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.55) 100%)',
                }} />
              </div>
              <div style={{ padding: 26, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontFamily: FB, fontSize: 11, letterSpacing: '1.8px', textTransform: 'uppercase', color: GOLD, fontWeight: 500 }}>
                  {p.tagline}
                </span>
                <h3 style={{ margin: '10px 0 0', fontFamily: FD, fontWeight: 600, fontSize: 28, lineHeight: 1.08, letterSpacing: '-0.01em' }}>
                  {p.name}
                </h3>
                <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                  {p.bullets.map((b) => (
                    <li key={b} style={{ display: 'flex', gap: 10, fontSize: 14.5, color: MUTED, lineHeight: 1.5 }}>
                      <span aria-hidden="true" style={{ color: GOLD, flexShrink: 0 }}>◆</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href="#book" onClick={(e) => bookExperience(e, p.goal)}
                   className="kk-gold-btn" style={{ ...goldButton, marginTop: 24, textAlign: 'center', padding: '14px 20px', fontSize: 12 }}>
                  Book this — $200 deposit
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GoldDivider />

      {/* ── Signature menu ─────────────────────────────────────────── */}
      <section id="menu" style={{ ...shell, ...sectionPad }}>
        <div style={{
          display: 'grid', gap: 'clamp(28px, 4vw, 52px)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', minHeight: 360, borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE2}` }}>
            <Image src="/images/kk/bourbon-bar.jpeg" alt="Stephen behind the Konquered Kocktails bourbon bar"
              fill sizes="(max-width: 700px) 100vw, 540px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(10,10,10,0.5) 100%)',
            }} />
          </div>
          <div>
            <SectionHead
              eyebrow="From the bar"
              title={<>Signature <em style={{ color: GOLD, fontStyle: 'italic' }}>kocktails</em></>}
              sub="A taste of the menu. Every event gets its own custom kocktail list — these are house favorites."
            />
            <div style={{ marginTop: 32 }}>
              {MENU.map((m, i) => (
                <div key={m.name} style={{ padding: '20px 0', borderBottom: i < MENU.length - 1 ? `1px solid ${LINE}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontFamily: FD, fontWeight: 600, fontSize: 26, letterSpacing: '-0.01em', color: TEXT }}>
                      {m.name}
                    </h3>
                    {m.signature && (
                      <span style={{
                        fontFamily: FB, fontSize: 9.5, letterSpacing: '1.6px', textTransform: 'uppercase', fontWeight: 600,
                        color: INK, background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`, borderRadius: 999, padding: '4px 10px',
                      }}>
                        House signature
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: MUTED, lineHeight: 1.6, fontStyle: 'italic', fontFamily: FD }}>
                    {m.build}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ── About / team ───────────────────────────────────────────── */}
      <section id="about" style={{ ...shell, ...sectionPad }}>
        <div style={{
          display: 'grid', gap: 'clamp(28px, 4vw, 52px)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'center',
        }}>
          <div>
            <SectionHead
              eyebrow="Meet the makers"
              title={<>Kraft, <em style={{ color: GOLD, fontStyle: 'italic' }}>konquered</em></>}
              sub="Konquered Kocktails is a St. Charles mobile bar built on handcrafted drinks, Uncle Nearest bourbon, and a whole lot of showmanship. We bring the bar, the tools, and the talent — you bring the guests."
            />
            <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
              <ContactRow icon="☎" label="Call or text" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} />
              <ContactRow icon="✉" label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
              <ContactRow icon="✦" label="Based in" value={CONTACT.address} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE2}` }}>
              <Image src="/images/kk/founder-portrait.jpeg" alt="Konquered Kocktails founder" fill
                sizes="(max-width: 700px) 50vw, 260px" style={{ objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE2}`, marginTop: 28 }}>
              <Image src="/images/kk/team-aprons.jpeg" alt="The Konquered Kocktails team in branded aprons" fill
                sizes="(max-width: 700px) 50vw, 260px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            </div>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ── Booking funnel ─────────────────────────────────────────── */}
      <section id="book" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          center
          eyebrow="Reserve your date"
          title={<>Book your <em style={{ color: GOLD, fontStyle: 'italic' }}>experience</em></>}
          sub="Tell us about your event, pick a date, and hold it with a $200 deposit — applied in full to your final balance."
        />

        <div style={{ ...card, marginTop: 44, padding: 0, overflow: 'hidden', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            display: 'flex', gap: 10, padding: '22px 16px 20px', flexWrap: 'wrap', justifyContent: 'center',
            borderBottom: `1px solid ${LINE}`,
          }}>
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    fontFamily: FB, fontSize: 12, fontWeight: 600,
                    background: done ? `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})` : active ? 'rgba(198,161,91,0.12)' : PANEL2,
                    border: `1px solid ${done ? GOLD : active ? GOLD : LINE}`,
                    color: done ? INK : active ? GOLD : DIM,
                  }}>
                    {done ? '✓' : n}
                  </span>
                  <span style={{
                    fontFamily: FB, fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 500,
                    color: active ? TEXT : DIM,
                  }}>
                    {label}
                  </span>
                  {n < STEP_LABELS.length && <span aria-hidden="true" style={{ width: 16, height: 1, background: LINE }} />}
                </div>
              );
            })}
          </div>

          <div style={{ padding: 'clamp(22px, 4vw, 36px)' }}>
            {step === 1 && (
              <form onSubmit={submitLead} noValidate>
                <h3 style={stepHeading}>Tell us about your event</h3>
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 15, lineHeight: 1.65 }}>
                  A few details and we’ll get your date on the Konquered Kocktails calendar.
                </p>
                <div style={{ display: 'grid', gap: 16, marginTop: 26, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  <Field id="kk-name" label="Full name" value={lead.name} error={errors.name}
                    autoComplete="name" placeholder="Jordan Ellis" onChange={(v) => setLead({ ...lead, name: v })} />
                  <Field id="kk-phone" label="Mobile number" value={lead.phone} error={errors.phone}
                    type="tel" autoComplete="tel" placeholder="(314) 555-0142" onChange={(v) => setLead({ ...lead, phone: v })} />
                  <Field id="kk-email" label="Email address" value={lead.email} error={errors.email}
                    type="email" autoComplete="email" placeholder="you@example.com" onChange={(v) => setLead({ ...lead, email: v })} />
                  <div>
                    <label htmlFor="kk-goal" style={labelStyle}>Experience</label>
                    <select id="kk-goal" value={lead.goal} onChange={(e) => setLead({ ...lead, goal: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                      {GOALS.map((g) => <option key={g} value={g} style={{ background: PANEL, color: TEXT }}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="kk-gold-btn" style={{ ...goldButton, ...fullButton, marginTop: 26 }}>
                  Continue to date &amp; time
                </button>
                <p style={{ margin: '14px 0 0', fontSize: 12.5, color: DIM, textAlign: 'center' }}>
                  By continuing you agree to be contacted about your event.
                </p>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={confirmSlot}>
                <h3 style={stepHeading}>Pick your event date</h3>
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 15, lineHeight: 1.65 }}>
                  Live availability. Dates disappear the moment another host books them.
                </p>
                <fieldset style={fieldsetStyle}>
                  <legend style={legendStyle}>Choose a date</legend>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {days.map((d) => {
                      const on = day?.key === d.key;
                      return (
                        <button key={d.key} type="button" aria-pressed={on} onClick={() => { setDay(d); setSlot(''); }}
                          style={{ ...chipStyle, minWidth: 78, background: on ? 'rgba(198,161,91,0.14)' : PANEL2, borderColor: on ? GOLD : LINE, color: on ? TEXT : MUTED }}>
                          <span style={{ display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.75 }}>{d.dow}</span>
                          <span style={{ display: 'block', fontFamily: FD, fontSize: 19, fontWeight: 600, marginTop: 2 }}>{d.md}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset style={fieldsetStyle}>
                  <legend style={legendStyle}>Available start times</legend>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))' }}>
                    {SLOTS.map((s) => {
                      const on = slot === s;
                      return (
                        <button key={s} type="button" aria-pressed={on} onClick={() => { setSlot(s); setSlotError(''); }}
                          style={{ ...chipStyle, padding: '13px 10px', fontSize: 14.5, fontWeight: 500, background: on ? 'rgba(198,161,91,0.14)' : PANEL2, borderColor: on ? GOLD : LINE, color: on ? TEXT : MUTED }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {slotError && <p role="alert" style={errorTextStyle}>{slotError}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(1)} className="kk-ghost-btn" style={{ ...ghostButton, padding: '15px 22px' }}>← Back</button>
                  <button type="submit" className="kk-gold-btn" style={{ ...goldButton, flex: 1, minWidth: 200, padding: '15px 22px' }}>Continue to deposit</button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div>
                <h3 style={stepHeading}>Confirm &amp; secure your date</h3>
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 15, lineHeight: 1.65 }}>
                  Your event date is held for 15 minutes while you complete the deposit.
                </p>
                <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: PANEL2, border: `1px solid ${LINE}` }}>
                  <SummaryRow label="Name" value={lead.name} />
                  <SummaryRow label="Experience" value={lead.goal} />
                  <SummaryRow label="Event date" value={when} last />
                </div>
                <div style={{ marginTop: 16, padding: 22, borderRadius: 12, background: 'rgba(198,161,91,0.06)', border: `1px solid ${LINE2}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 42, color: GOLD, lineHeight: 1 }}>$200</span>
                    <span style={{ fontSize: 15, color: TEXT, fontWeight: 500 }}>event deposit</span>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>
                    Applied in full to your final event balance. It reserves your date and covers bar prep.
                  </p>
                </div>
                <button type="button" onClick={payDeposit} disabled={depositBusy} className="kk-gold-btn"
                  style={{ ...goldButton, ...fullButton, marginTop: 22, opacity: depositBusy ? 0.6 : 1, cursor: depositBusy ? 'wait' : 'pointer' }}>
                  {depositBusy ? 'Opening secure checkout…' : 'Pay $200 deposit'}
                </button>
                {depositError && <p role="alert" style={{ ...errorTextStyle, marginTop: 12, textAlign: 'center' }}>{depositError}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(2)} className="kk-ghost-btn" style={{ ...ghostButton, padding: '13px 22px' }}>← Change date</button>
                </div>
                <p style={{ margin: '16px 0 0', fontFamily: FB, fontSize: 11, color: DIM, textAlign: 'center', letterSpacing: '0.6px' }}>
                  ✦ Secured by Stripe · Your card details never touch our servers.
                </p>
              </div>
            )}

            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%', margin: '0 auto',
                  display: 'grid', placeItems: 'center', fontSize: 30,
                  background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`, color: INK,
                }}>✓</div>
                <h3 style={{ ...stepHeading, margin: '22px 0 0', fontSize: 'clamp(30px, 4.4vw, 42px)' }}>
                  Your date is booked
                </h3>
                <p style={{ margin: '12px 0 0', color: MUTED, fontSize: 15.5, lineHeight: 1.65 }}>
                  Konquered Kocktails will be in touch to lock your custom menu. Your deposit is confirmed.
                </p>
                <div style={{ marginTop: 26, padding: 20, borderRadius: 12, textAlign: 'left', background: PANEL2, border: `1px solid ${LINE}` }}>
                  <SummaryRow label="Experience" value={lead.goal} />
                  <SummaryRow label="Event date" value={when} />
                  <SummaryRow label="Deposit" value="$200 — applied to your final balance" />
                  <SummaryRow label="Confirmation to" value={lead.email || 'your email'} last />
                </div>
                {demoNote && (
                  <p style={{ margin: '16px 0 0', fontFamily: FB, fontSize: 11, letterSpacing: '0.5px', color: GOLD, lineHeight: 1.6 }}>
                    Demo mode — no live charge. Deposits go live once the Stripe account is connected.
                  </p>
                )}
                <button type="button" onClick={resetFunnel} className="kk-ghost-btn" style={{ ...ghostButton, marginTop: 22, padding: '13px 26px' }}>
                  Book another event
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${LINE}`, marginTop: 'clamp(44px, 6vw, 80px)' }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '36px 20px 48px',
          display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Brand />
          <div style={{ fontFamily: FB, fontSize: 12.5, color: MUTED, letterSpacing: '0.3px', lineHeight: 1.9 }}>
            <div>{CONTACT.phone} · {CONTACT.email}</div>
            <div>{CONTACT.address}</div>
          </div>
          <a href="https://goelev8.ai" className="kk-navlink" style={{
            fontFamily: FB, fontSize: 11, color: DIM, letterSpacing: '1.2px',
            textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
          }}>
            <Image src="/images/goelev8-full-logo.png" alt="" width={22} height={22} style={{ width: 22, height: 22, opacity: 0.75 }} />
            Powered by goElev8
          </a>
        </div>
      </footer>
    </main>
  );
}

/* ── Presentational helpers ───────────────────────────────────────── */

function Brand() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Image src="/images/kbalance-logo.jpg" alt="Konquered Kocktails" width={42} height={42}
        style={{ height: 42, width: 42, display: 'block', borderRadius: '50%', border: `1px solid ${LINE2}` }} />
      <span style={{ lineHeight: 1 }}>
        <span style={{ display: 'block', fontFamily: FD, fontWeight: 600, fontSize: 22, letterSpacing: '0.02em', color: TEXT }}>
          Konquered Kocktails
        </span>
        <span style={{ display: 'block', fontFamily: FB, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginTop: 3, fontWeight: 500 }}>
          Kraft Kocktail Experiences
        </span>
      </span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 11,
      fontFamily: FB, fontSize: 11.5, letterSpacing: '2.4px', textTransform: 'uppercase', color: GOLD, fontWeight: 500,
    }}>
      <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
      {children}
    </span>
  );
}

function SectionHead({ eyebrow, title, sub, center }: { eyebrow: string; title: React.ReactNode; sub: string; center?: boolean }) {
  return (
    <div style={{ maxWidth: 640, ...(center ? { marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' } : {}) }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ margin: '18px 0 0', fontFamily: FD, fontWeight: 600, fontSize: 'clamp(34px, 5.4vw, 58px)', lineHeight: 1.02, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      <p style={{ margin: '16px 0 0', fontSize: 'clamp(14.5px, 2vw, 16.5px)', color: MUTED, lineHeight: 1.7, ...(center ? { marginLeft: 'auto', marginRight: 'auto' } : {}) }}>
        {sub}
      </p>
    </div>
  );
}

function GoldDivider() {
  return (
    <div aria-hidden="true" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${LINE2}, transparent)`, marginTop: 'clamp(24px, 4vw, 44px)' }} />
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  const inner = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <span style={{
        width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center',
        fontSize: 15, color: GOLD, background: PANEL2, border: `1px solid ${LINE2}`, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: FB, fontSize: 10, letterSpacing: '1.6px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 400, color: TEXT, marginTop: 3, wordBreak: 'break-word' }}>{value}</span>
      </span>
    </span>
  );
  return href ? <a href={href} className="kk-contact" style={{ textDecoration: 'none' }}>{inner}</a> : inner;
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', padding: '11px 0', borderBottom: last ? 'none' : `1px solid ${LINE}` }}>
      <span style={{ fontFamily: FB, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 400, textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, autoComplete }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)} className="kk-input"
        style={{ ...inputStyle, borderColor: error ? '#c65b5b' : LINE }} />
      {error && <p id={`${id}-err`} role="alert" style={{ ...errorTextStyle, marginTop: 7 }}>{error}</p>}
    </div>
  );
}

/* ── Shared style objects ─────────────────────────────────────────── */

const shell: CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 20px' };

const sectionPad: CSSProperties = {
  paddingTop: 'clamp(40px, 6vw, 72px)',
  paddingBottom: 'clamp(8px, 2vw, 16px)',
  scrollMarginTop: 84,
};

const card: CSSProperties = { background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16 };

const stepHeading: CSSProperties = {
  margin: 0, fontFamily: FD, fontWeight: 600, fontSize: 'clamp(26px, 3.6vw, 34px)', letterSpacing: '-0.01em', lineHeight: 1.05,
};

/* Gold-gradient pill — deliberately unlike goElev8's flat monospace rectangles. */
const goldButton: CSSProperties = {
  display: 'inline-block', background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`, color: INK,
  fontFamily: FB, fontWeight: 600, fontSize: 13, letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '15px 28px', cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
  boxShadow: '0 8px 22px rgba(198,161,91,0.22)',
};

const ghostButton: CSSProperties = {
  display: 'inline-block', background: 'transparent', color: CREAM,
  fontFamily: FB, fontWeight: 500, fontSize: 13, letterSpacing: '1.4px', textTransform: 'uppercase',
  border: `1px solid ${LINE2}`, borderRadius: 999, padding: '15px 28px', cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
};

const fullButton: CSSProperties = { display: 'block', width: '100%', textAlign: 'center', padding: '17px 24px', fontSize: 14 };

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: DIM, marginBottom: 8, fontWeight: 500,
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0c0b0a',
  border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 15px', color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none',
};

const chipStyle: CSSProperties = {
  padding: '10px 14px', borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FB, cursor: 'pointer', textAlign: 'center', lineHeight: 1.25,
};

const fieldsetStyle: CSSProperties = { border: 'none', padding: 0, margin: '26px 0 0', minWidth: 0 };

const legendStyle: CSSProperties = {
  padding: 0, fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: DIM, marginBottom: 12, fontWeight: 500,
};

const errorTextStyle: CSSProperties = { margin: '10px 0 0', fontSize: 13, color: '#d98a8a', lineHeight: 1.45 };

/* ── Keyframes + effects (things inline styles can't do) ──────────────
   The hero medallion: KB logo as a slow-spinning gold seal behind the
   drink, a counter-rotating conic gold ring, a pulsing radial glow, the
   drink gently floating, and a few rising gold sparkles. */
const KEYFRAMES = `
.kk-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:clamp(360px,44vw,540px)}
.kk-glow{position:absolute;width:82%;aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle, rgba(198,161,91,0.32) 0%, rgba(198,161,91,0.10) 40%, transparent 66%);
  filter:blur(10px);animation:kkGlow 6s ease-in-out infinite}
.kk-ring{position:absolute;width:70%;aspect-ratio:1;border-radius:50%;
  background:conic-gradient(from 0deg, transparent 0deg, rgba(232,204,134,0.55) 60deg, transparent 130deg, transparent 230deg, rgba(198,161,91,0.45) 300deg, transparent 360deg);
  -webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  mask:radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  animation:kkSpin 26s linear infinite}
.kk-seal{position:absolute;width:56%;aspect-ratio:1;opacity:0.9;
  filter:drop-shadow(0 0 24px rgba(198,161,91,0.28));animation:kkSpin 48s linear infinite}
.kk-drink{position:relative;width:100%;max-width:360px;z-index:2;
  animation:kkFadeUp 1s .1s both, kkFloat 5.5s ease-in-out 1s infinite}
.kk-spark{position:absolute;bottom:22%;width:6px;height:6px;border-radius:50%;
  background:radial-gradient(circle, ${GOLD_HI}, ${GOLD_D});box-shadow:0 0 8px rgba(232,204,134,0.8);
  opacity:0;z-index:3}
.kk-spark-1{left:38%;animation:kkRise 4.2s ease-in 0.4s infinite}
.kk-spark-2{left:54%;width:4px;height:4px;animation:kkRise 5s ease-in 1.6s infinite}
.kk-spark-3{left:62%;width:5px;height:5px;animation:kkRise 4.6s ease-in 2.9s infinite}
.kk-fade-up{animation:kkFadeUp .9s .05s both}
.kk-live-dot{animation:kkGlow 2.4s ease-in-out infinite}
.kk-navlink{transition:color .2s ease}
.kk-navlink:hover{color:${GOLD}}
.kk-contact{transition:opacity .2s ease}
.kk-contact:hover{opacity:.82}
.kk-gold-btn{transition:transform .18s ease, box-shadow .18s ease, filter .18s ease}
.kk-gold-btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 12px 28px rgba(198,161,91,0.34)}
.kk-ghost-btn{transition:border-color .2s ease, color .2s ease, background .2s ease}
.kk-ghost-btn:hover{border-color:${GOLD};color:${GOLD};background:rgba(198,161,91,0.05)}
.kk-card{transition:transform .22s ease, border-color .22s ease}
.kk-card:hover{transform:translateY(-3px);border-color:${LINE2}}
.kk-input:focus{border-color:${GOLD}!important}
@keyframes kkSpin{to{transform:rotate(360deg)}}
@keyframes kkGlow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.95;transform:scale(1.07)}}
@keyframes kkFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes kkRise{0%{opacity:0;transform:translateY(24px) scale(.5)}18%{opacity:1}100%{opacity:0;transform:translateY(-150px) scale(1)}}
@media (prefers-reduced-motion: reduce){
  .kk-glow,.kk-ring,.kk-seal,.kk-drink,.kk-spark,.kk-fade-up,.kk-live-dot{animation:none!important}
  .kk-drink{opacity:1;transform:none}
}
`;
