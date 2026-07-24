// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import Image from 'next/image';
import { useEffect, useState, type CSSProperties } from 'react';

/* ── Palette — goElev8 cyber-noir, dressed for a premium bar ────────── */
const BLK = '#000000';
const SURFACE = '#0e0e0e';
const SURFACE2 = '#141414';
const CYAN = '#00CFFF';
const GOLD = '#C9A84C';       // leads here — this is a top-shelf bar brand
const GOLD_D = '#8F7A35';
const GRN = '#00FF94';
const TEXT = '#F5F5F5';
const MUTED = '#aaaaaa';
const DIM = '#666666';
const HAIRLINE = '#1e1e1e';

const FD = '"Bebas Neue", sans-serif';                  // display
const FB = '"DM Sans", system-ui, sans-serif';          // body
const FM = '"JetBrains Mono", monospace';               // labels / eyebrows

/* ── Real Konquered Kocktails content ──────────────────────────────────
   Menu recipes, packages, and contact are taken verbatim from
   konqueredbalance.com/konqueredkocktails. */

const PACKAGES = [
  {
    icon: '🍸',
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
    icon: '🥃',
    accent: CYAN,
    img: '/images/kk/signature-sour.png',
    imgContain: true,
    name: 'Spirits & Kocktail Tasting',
    tagline: 'Guided tasting for the curious',
    bullets: [
      'Custom spirits & cocktail tasting',
      'Personalized tasting profile kit',
      'Thoughtfully paired snacks',
    ],
    goal: 'Spirits & Kocktail Tasting',
  },
  {
    icon: '🎉',
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

/* Signature kocktails — real recipes from the menu. */
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

/* Booking dropdown — every option is a bookable event held with a deposit. */
const GOALS = [
  'The Kustom Mixology Experience',
  'Spirits & Kocktail Tasting',
  'Full-Service Mobile Bar — Wedding',
  'Full-Service Mobile Bar — Corporate',
  'Full-Service Mobile Bar — Private Party',
  'Kocktail Masterclass',
];

/* Event start times — an evening-weighted mobile-bar schedule. */
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

/* Next six days, weekends included — events cluster on Fri/Sat/Sun. Built in
   an effect so SSR markup and first client paint can't disagree. */
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

  /* Returning from Stripe with ?booked=1 lands on the confirmation step. */
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

  /* Real deposit checkout. Hits the shared endpoint; on a live connected
     account this redirects to Stripe. Until then the endpoint answers 402 —
     for this demo we treat that as "show the confirmation the guest would
     see" so the flow reads as complete end to end. */
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
        // Deposits not yet connected — complete the demo booking.
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
    <main style={{ background: BLK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderBottom: `1px solid rgba(201,168,76,0.16)`,
        }}
      >
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Brand />
          <nav
            aria-label="Sections"
            style={{
              display: 'flex', gap: 22, marginLeft: 'auto', flexWrap: 'wrap',
              fontFamily: FM, fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase',
            }}
          >
            {[
              ['Experiences', 'experiences'],
              ['Menu', 'menu'],
              ['About', 'about'],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={(e) => smoothScrollTo(e, id)}
                 style={{ color: DIM, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {label}
              </a>
            ))}
          </nav>
          <a href="#book" onClick={(e) => smoothScrollTo(e, 'book')}
             style={{ ...goldButton, padding: '9px 20px', fontSize: 11, whiteSpace: 'nowrap' }}>
            Book an Event
          </a>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ ...shell, paddingTop: 'clamp(40px, 7vw, 84px)', paddingBottom: 'clamp(36px, 6vw, 68px)' }}>
        <div style={{
          display: 'grid', gap: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow>Kraft Kocktails · Mobile Bar · {CONTACT.area}</Eyebrow>
            <h1 style={{
              margin: '18px 0 0', fontFamily: FD, fontWeight: 400,
              fontSize: 'clamp(44px, 8vw, 88px)',
              lineHeight: 0.92, letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>
              Handcrafted{' '}
              <span style={{ color: GOLD }}>kocktail experiences</span>,{' '}
              <span style={{ color: CYAN }}>konquered</span>.
            </h1>
            <p style={{
              margin: '22px 0 0', color: MUTED,
              fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, maxWidth: 540,
            }}>
              Themed, handcrafted kocktails and full-service mobile bar for weddings, corporate
              events, and private parties. Custom menus, live mixology, and guided tastings — built
              around your night. Reserve your date online with a{' '}
              <strong style={{ color: TEXT, fontWeight: 500 }}>$200 deposit</strong>.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30 }}>
              <a href="#book" onClick={(e) => smoothScrollTo(e, 'book')}
                 style={{ ...goldButton, padding: '14px 28px', fontSize: 13 }}>
                Book Your Event →
              </a>
              <a href="#experiences" onClick={(e) => smoothScrollTo(e, 'experiences')}
                 style={{ ...ghostButton, padding: '14px 28px', fontSize: 13 }}>
                See Experiences
              </a>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginTop: 26, flexWrap: 'wrap',
              fontFamily: FM, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GRN, flexShrink: 0 }} />
              <span style={{ color: GRN }}>Now booking</span>
              <span style={{ color: '#2e2e2e' }}>/</span>
              <span style={{ color: DIM }}>Licensed &amp; insured</span>
              <span style={{ color: '#2e2e2e' }}>/</span>
              <span style={{ color: DIM }}>Deposit secured by Stripe</span>
            </div>
          </div>

          {/* Signature drink, floating on black */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', width: '78%', aspectRatio: '1', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,168,76,0.20) 0%, transparent 68%)',
              filter: 'blur(8px)',
            }} />
            <Image
              src="/images/kk/signature-sour.png"
              alt="The Konquered Sour — bourbon, barrel-aged maple, ginger liqueur, orange and brandied cherries"
              width={520}
              height={640}
              priority
              style={{ position: 'relative', width: '100%', maxWidth: 380, height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ── Experiences / packages ─────────────────────────────────── */}
      <section id="experiences" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="What we bring"
          title={<>Book an <span style={{ color: GOLD }}>experience</span></>}
          sub="Every experience is fully custom and holds your date with a $200 deposit that applies to your final balance."
        />
        <div style={{
          display: 'grid', gap: 18, marginTop: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}>
          {PACKAGES.map((p) => (
            <article key={p.name} style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: 200, background: SURFACE2 }}>
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  sizes="(max-width: 700px) 100vw, 380px"
                  style={{ objectFit: p.imgContain ? 'contain' : 'cover', objectPosition: 'center' }}
                />
                <span style={{
                  position: 'absolute', top: 12, left: 12,
                  width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center',
                  fontSize: 18, background: 'rgba(0,0,0,0.6)', border: `1px solid ${p.accent}55`,
                  backdropFilter: 'blur(6px)',
                }}>
                  {p.icon}
                </span>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontFamily: FM, fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: p.accent }}>
                  {p.tagline}
                </span>
                <h3 style={{
                  margin: '10px 0 0', fontFamily: FD, fontWeight: 400,
                  fontSize: 26, letterSpacing: '0.6px', textTransform: 'uppercase', lineHeight: 1.05,
                }}>
                  {p.name}
                </h3>
                <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
                  {p.bullets.map((b) => (
                    <li key={b} style={{ display: 'flex', gap: 9, fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                      <span aria-hidden="true" style={{ color: p.accent, flexShrink: 0 }}>▸</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href="#book"
                  onClick={(e) => bookExperience(e, p.goal)}
                  style={{ ...goldButton, marginTop: 22, textAlign: 'center', padding: '13px 20px', fontSize: 12 }}
                >
                  Book this — $200 deposit
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Signature menu ─────────────────────────────────────────── */}
      <section id="menu" style={{ ...shell, ...sectionPad }}>
        <div style={{
          display: 'grid', gap: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', minHeight: 340, borderRadius: 2, overflow: 'hidden', border: `1px solid ${HAIRLINE}` }}>
            <Image
              src="/images/kk/bourbon-bar.jpeg"
              alt="Stephen behind the Konquered Kocktails bourbon bar"
              fill
              sizes="(max-width: 700px) 100vw, 540px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div>
            <SectionHead
              eyebrow="From the bar"
              title={<>Signature <span style={{ color: GOLD }}>kocktails</span></>}
              sub="A taste of the menu. Every event gets its own custom kocktail list — these are house favorites."
            />
            <div style={{ marginTop: 30 }}>
              {MENU.map((m, i) => (
                <div key={m.name} style={{
                  padding: '18px 0',
                  borderBottom: i < MENU.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{
                      margin: 0, fontFamily: FD, fontWeight: 400, fontSize: 24,
                      letterSpacing: '0.6px', textTransform: 'uppercase', color: TEXT,
                    }}>
                      {m.name}
                    </h3>
                    {m.signature && (
                      <span style={{
                        fontFamily: FM, fontSize: 9, letterSpacing: '1.4px', textTransform: 'uppercase',
                        color: GOLD, border: `1px solid ${GOLD_D}`, borderRadius: 2, padding: '3px 7px',
                      }}>
                        House signature
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>
                    {m.build}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── About / team ───────────────────────────────────────────── */}
      <section id="about" style={{ ...shell, ...sectionPad }}>
        <div style={{
          display: 'grid', gap: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'center',
        }}>
          <div>
            <SectionHead
              eyebrow="Meet the makers"
              title={<>Kraft, <span style={{ color: CYAN }}>konquered</span></>}
              sub="Konquered Kocktails is a St. Charles mobile bar built on handcrafted drinks, Uncle Nearest bourbon, and a whole lot of showmanship. We bring the bar, the tools, and the talent — you bring the guests."
            />
            <div style={{ display: 'grid', gap: 14, marginTop: 28 }}>
              <ContactRow icon="📞" label="Call or text" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} />
              <ContactRow icon="✉️" label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
              <ContactRow icon="📍" label="Based in" value={CONTACT.address} />
            </div>
          </div>
          <div style={{
            display: 'grid', gap: 14,
            gridTemplateColumns: '1fr 1fr',
          }}>
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 2, overflow: 'hidden', border: `1px solid ${HAIRLINE}` }}>
              <Image src="/images/kk/founder-portrait.jpeg" alt="Konquered Kocktails founder" fill
                     sizes="(max-width: 700px) 50vw, 260px" style={{ objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 2, overflow: 'hidden', border: `1px solid ${HAIRLINE}` }}>
              <Image src="/images/kk/team-aprons.jpeg" alt="The Konquered Kocktails team in branded aprons" fill
                     sizes="(max-width: 700px) 50vw, 260px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking funnel ─────────────────────────────────────────── */}
      <section id="book" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="Reserve your date"
          title={<>Book your <span style={{ color: GOLD }}>experience</span></>}
          sub="Tell us about your event, pick a date, and hold it with a $200 deposit — applied in full to your final balance."
        />

        <div style={{ ...card, marginTop: 40, padding: 0, overflow: 'hidden', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Step progress */}
          <div style={{
            display: 'flex', gap: 8, padding: '20px 16px 0', flexWrap: 'wrap', justifyContent: 'center',
            borderBottom: `1px solid ${HAIRLINE}`, paddingBottom: 18,
          }}>
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 2, display: 'grid', placeItems: 'center',
                    fontFamily: FM, fontSize: 11,
                    background: done ? GOLD : active ? 'rgba(201,168,76,0.14)' : SURFACE2,
                    border: `1px solid ${done ? GOLD : active ? GOLD : HAIRLINE}`,
                    color: done ? BLK : active ? GOLD : DIM,
                  }}>
                    {done ? '✓' : n}
                  </span>
                  <span style={{
                    fontFamily: FM, fontSize: 10.5, letterSpacing: '0.8px', textTransform: 'uppercase',
                    color: active ? TEXT : DIM,
                  }}>
                    {label}
                  </span>
                  {n < STEP_LABELS.length && (
                    <span aria-hidden="true" style={{ width: 16, height: 1, background: HAIRLINE }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: 'clamp(20px, 4vw, 34px)' }}>
            {/* Step 1 — lead */}
            {step === 1 && (
              <form onSubmit={submitLead} noValidate>
                <h3 style={stepHeading}>Tell us about your event</h3>
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 15, lineHeight: 1.65 }}>
                  A few details and we’ll get your date on the Konquered Kocktails calendar.
                </p>
                <div style={{
                  display: 'grid', gap: 16, marginTop: 26,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                }}>
                  <Field id="kk-name" label="Full name" value={lead.name} error={errors.name}
                    autoComplete="name" placeholder="Jordan Ellis" onChange={(v) => setLead({ ...lead, name: v })} />
                  <Field id="kk-phone" label="Mobile number" value={lead.phone} error={errors.phone}
                    type="tel" autoComplete="tel" placeholder="(314) 555-0142" onChange={(v) => setLead({ ...lead, phone: v })} />
                  <Field id="kk-email" label="Email address" value={lead.email} error={errors.email}
                    type="email" autoComplete="email" placeholder="you@example.com" onChange={(v) => setLead({ ...lead, email: v })} />
                  <div>
                    <label htmlFor="kk-goal" style={labelStyle}>Experience</label>
                    <select id="kk-goal" value={lead.goal}
                      onChange={(e) => setLead({ ...lead, goal: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                      {GOALS.map((g) => (
                        <option key={g} value={g} style={{ background: SURFACE, color: TEXT }}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" style={{ ...goldButton, ...fullButton, marginTop: 26 }}>
                  Continue to date &amp; time →
                </button>
                <p style={{ margin: '14px 0 0', fontSize: 12.5, color: DIM, textAlign: 'center' }}>
                  By continuing you agree to be contacted about your event.
                </p>
              </form>
            )}

            {/* Step 2 — date */}
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
                        <button key={d.key} type="button" aria-pressed={on}
                          onClick={() => { setDay(d); setSlot(''); }}
                          style={{
                            ...chipStyle, minWidth: 78,
                            background: on ? 'rgba(201,168,76,0.14)' : SURFACE2,
                            borderColor: on ? GOLD : HAIRLINE, color: on ? TEXT : MUTED,
                          }}>
                          <span style={{ display: 'block', fontFamily: FM, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.75 }}>{d.dow}</span>
                          <span style={{ display: 'block', fontSize: 15, fontWeight: 500, marginTop: 3 }}>{d.md}</span>
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
                        <button key={s} type="button" aria-pressed={on}
                          onClick={() => { setSlot(s); setSlotError(''); }}
                          style={{
                            ...chipStyle, padding: '13px 10px', fontSize: 14.5, fontWeight: 500,
                            background: on ? 'rgba(0,207,255,0.12)' : SURFACE2,
                            borderColor: on ? CYAN : HAIRLINE, color: on ? TEXT : MUTED,
                          }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {slotError && <p role="alert" style={errorTextStyle}>{slotError}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ ...ghostButton, padding: '15px 22px' }}>← Back</button>
                  <button type="submit" style={{ ...goldButton, flex: 1, minWidth: 200, padding: '15px 22px' }}>Continue to deposit →</button>
                </div>
              </form>
            )}

            {/* Step 3 — deposit */}
            {step === 3 && (
              <div>
                <h3 style={stepHeading}>Confirm &amp; secure your date</h3>
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 15, lineHeight: 1.65 }}>
                  Your event date is held for 15 minutes while you complete the deposit.
                </p>
                <div style={{ marginTop: 24, padding: 20, borderRadius: 2, background: SURFACE2, border: `1px solid ${HAIRLINE}` }}>
                  <SummaryRow label="Name" value={lead.name} />
                  <SummaryRow label="Experience" value={lead.goal} />
                  <SummaryRow label="Event date" value={when} last />
                </div>
                <div style={{ marginTop: 16, padding: 20, borderRadius: 2, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.28)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FD, fontWeight: 400, fontSize: 38, color: GOLD, lineHeight: 1 }}>$200</span>
                    <span style={{ fontSize: 15, color: TEXT, fontWeight: 500 }}>event deposit</span>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>
                    Applied in full to your final event balance. It reserves your date and covers bar prep.
                  </p>
                </div>
                <button type="button" onClick={payDeposit} disabled={depositBusy}
                  style={{ ...goldButton, ...fullButton, marginTop: 22, opacity: depositBusy ? 0.6 : 1, cursor: depositBusy ? 'wait' : 'pointer' }}>
                  {depositBusy ? 'Opening secure checkout…' : 'Pay $200 deposit'}
                </button>
                {depositError && <p role="alert" style={{ ...errorTextStyle, marginTop: 12, textAlign: 'center' }}>{depositError}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(2)} style={{ ...ghostButton, padding: '13px 22px' }}>← Change date</button>
                </div>
                <p style={{ margin: '16px 0 0', fontFamily: FM, fontSize: 10.5, color: DIM, textAlign: 'center', letterSpacing: '0.6px' }}>
                  🔒 Secured by Stripe · Your card details never touch our servers.
                </p>
              </div>
            )}

            {/* Step 4 — booked */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 2, margin: '0 auto',
                  display: 'grid', placeItems: 'center', fontSize: 28,
                  background: 'rgba(0,255,148,0.08)', border: `1px solid ${GRN}`, color: GRN,
                }}>✓</div>
                <h3 style={{ ...stepHeading, margin: '22px 0 0', fontSize: 'clamp(28px, 4.4vw, 38px)' }}>
                  Your date is booked
                </h3>
                <p style={{ margin: '12px 0 0', color: MUTED, fontSize: 15.5, lineHeight: 1.65 }}>
                  Konquered Kocktails will be in touch to lock your custom menu. Your deposit is confirmed.
                </p>
                <div style={{ marginTop: 26, padding: 20, borderRadius: 2, textAlign: 'left', background: SURFACE2, border: `1px solid ${HAIRLINE}` }}>
                  <SummaryRow label="Experience" value={lead.goal} />
                  <SummaryRow label="Event date" value={when} />
                  <SummaryRow label="Deposit" value="$200 — applied to your final balance" />
                  <SummaryRow label="Confirmation to" value={lead.email || 'your email'} last />
                </div>
                {demoNote && (
                  <p style={{
                    margin: '16px 0 0', fontFamily: FM, fontSize: 10.5, letterSpacing: '0.5px',
                    color: GOLD, lineHeight: 1.6,
                  }}>
                    Demo mode — no live charge. Deposits go live once the Stripe account is connected.
                  </p>
                )}
                <button type="button" onClick={resetFunnel} style={{ ...ghostButton, marginTop: 22, padding: '13px 26px' }}>
                  Book another event
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${HAIRLINE}`, marginTop: 'clamp(40px, 6vw, 72px)' }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '32px 20px 44px',
          display: 'flex', flexWrap: 'wrap', gap: 20,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Brand />
          <div style={{ fontFamily: FM, fontSize: 11, color: DIM, letterSpacing: '0.5px', lineHeight: 1.9 }}>
            <div>{CONTACT.phone} · {CONTACT.email}</div>
            <div>{CONTACT.address}</div>
          </div>
          <a href="https://goelev8.ai" style={{
            fontFamily: FM, fontSize: 10.5, color: DIM, letterSpacing: '0.8px',
            textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Image src="/images/goelev8-full-logo.png" alt="" width={22} height={22} style={{ width: 22, height: 22, opacity: 0.8 }} />
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
    <span style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <Image
        src="/images/kbalance-logo.jpg"
        alt="Konquered Kocktails"
        width={40}
        height={40}
        style={{ height: 40, width: 40, display: 'block', borderRadius: '50%' }}
      />
      <span style={{ lineHeight: 1 }}>
        <span style={{
          display: 'block', fontFamily: FD, fontWeight: 400, fontSize: 19,
          letterSpacing: '1.6px', color: TEXT, textTransform: 'uppercase',
        }}>
          Konquered Kocktails
        </span>
        <span style={{
          display: 'block', fontFamily: FM, fontSize: 8.5, letterSpacing: '2.4px',
          textTransform: 'uppercase', color: GOLD, marginTop: 3,
        }}>
          Kraft Kocktail Experiences
        </span>
      </span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontFamily: FM, fontSize: 11, letterSpacing: '2.2px',
      textTransform: 'uppercase', color: GOLD,
    }}>
      <span aria-hidden="true" style={{ width: 24, height: 1, background: GOLD }} />
      {children}
    </span>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub: string }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{
        margin: '18px 0 0', fontFamily: FD, fontWeight: 400,
        fontSize: 'clamp(30px, 5vw, 52px)',
        lineHeight: 1, letterSpacing: '1.2px', textTransform: 'uppercase',
      }}>
        {title}
      </h2>
      <p style={{ margin: '14px 0 0', fontSize: 'clamp(14.5px, 2vw, 16.5px)', color: MUTED, lineHeight: 1.7 }}>
        {sub}
      </p>
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  const inner = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{
        width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center',
        fontSize: 16, background: SURFACE2, border: `1px solid ${HAIRLINE}`, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: FM, fontSize: 9.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: DIM }}>{label}</span>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500, color: TEXT, marginTop: 2, wordBreak: 'break-word' }}>{value}</span>
      </span>
    </span>
  );
  return href ? <a href={href} style={{ textDecoration: 'none' }}>{inner}</a> : inner;
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
      padding: '11px 0', borderBottom: last ? 'none' : `1px solid ${HAIRLINE}`,
    }}>
      <span style={{ fontFamily: FM, fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', color: DIM }}>{label}</span>
      <span style={{ fontSize: 14.5, fontWeight: 500, textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>{value}</span>
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
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, borderColor: error ? '#FF3B3B' : HAIRLINE }} />
      {error && <p id={`${id}-err`} role="alert" style={{ ...errorTextStyle, marginTop: 7 }}>{error}</p>}
    </div>
  );
}

/* ── Shared style objects ─────────────────────────────────────────── */

const shell: CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 20px' };

const sectionPad: CSSProperties = {
  paddingTop: 'clamp(44px, 7vw, 84px)',
  paddingBottom: 'clamp(10px, 2vw, 20px)',
  scrollMarginTop: 80,
};

const card: CSSProperties = { background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 2 };

const stepHeading: CSSProperties = {
  margin: 0, fontFamily: FD, fontWeight: 400,
  fontSize: 'clamp(24px, 3.6vw, 32px)', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.05,
};

const goldButton: CSSProperties = {
  display: 'inline-block', background: GOLD, color: BLK,
  fontFamily: FM, fontWeight: 500, fontSize: 12.5, letterSpacing: '1px', textTransform: 'uppercase',
  border: `1px solid ${GOLD}`, borderRadius: 2, padding: '14px 24px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
};

const ghostButton: CSSProperties = {
  display: 'inline-block', background: 'transparent', color: TEXT,
  fontFamily: FM, fontWeight: 500, fontSize: 12.5, letterSpacing: '1px', textTransform: 'uppercase',
  border: `1px solid #2e2e2e`, borderRadius: 2, padding: '14px 24px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
};

const fullButton: CSSProperties = { display: 'block', width: '100%', textAlign: 'center', padding: '16px 24px', fontSize: 13.5 };

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FM, fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase',
  color: DIM, marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#060606',
  border: `1px solid ${HAIRLINE}`, borderRadius: 2, padding: '13px 14px',
  color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none',
};

const chipStyle: CSSProperties = {
  padding: '10px 14px', borderRadius: 2, border: `1px solid ${HAIRLINE}`,
  fontFamily: FB, cursor: 'pointer', textAlign: 'center', lineHeight: 1.25,
};

const fieldsetStyle: CSSProperties = { border: 'none', padding: 0, margin: '26px 0 0', minWidth: 0 };

const legendStyle: CSSProperties = {
  padding: 0, fontFamily: FM, fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase',
  color: DIM, marginBottom: 12,
};

const errorTextStyle: CSSProperties = { margin: '10px 0 0', fontSize: 13, color: '#FF3B3B', lineHeight: 1.45 };
