// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import Image from 'next/image';
import { useEffect, useState, type CSSProperties } from 'react';

/* ── Palette — matches the goelev8.ai homepage (cyber-noir) ────────── */
const BLK = '#000000';       // page background
const SURFACE = '#0e0e0e';   // cards / raised surfaces
const SURFACE2 = '#141414';  // nested surfaces
const CYAN = '#00CFFF';      // goElev8 primary accent
const GOLD = '#C9A84C';      // goElev8 secondary accent (also reads as "top shelf")
const GRN = '#00FF94';       // live/status accent
const TEXT = '#F5F5F5';
const MUTED = '#aaaaaa';
const DIM = '#666666';
const HAIRLINE = '#1e1e1e';

const FD = '"Bebas Neue", sans-serif';                  // display
const FB = '"DM Sans", system-ui, sans-serif';          // body
const FM = '"JetBrains Mono", monospace';               // labels / eyebrows

/* ── Static content ───────────────────────────────────────────────── */

/* The bookable menu. This is the page's primary goal — every one of these
   holds a date with a $200 deposit. `goal` must match a GOALS entry so a menu
   card can preselect itself in the funnel's dropdown. */
const EXPERIENCES = [
  {
    icon: '🍸',
    accent: GOLD,
    name: 'Private Kocktail Party',
    detail: 'Mobile bar, bespoke menu, up to 40 guests',
    len: '3–4 hrs',
    goal: 'Private kocktail party',
  },
  {
    icon: '🥂',
    accent: CYAN,
    name: 'Corporate Mixer',
    detail: 'Brand activations, launches, holiday parties',
    len: '2–4 hrs',
    goal: 'Corporate mixer / brand activation',
  },
  {
    icon: '💍',
    accent: GOLD,
    name: 'Wedding & Reception Bar',
    detail: 'Signature couple’s kocktails, full service staff',
    len: '4–6 hrs',
    goal: 'Wedding & reception bar',
  },
  {
    icon: '🧪',
    accent: CYAN,
    name: 'Kocktail Masterclass',
    detail: 'Hands-on build-and-taste session for your group',
    len: '90 min',
    goal: 'Kocktail masterclass / tasting',
  },
  {
    icon: '🎉',
    accent: GOLD,
    name: 'Birthday & Milestone',
    detail: 'Themed menu, garnish bar, custom glassware',
    len: '3 hrs',
    goal: 'Birthday / milestone celebration',
  },
  {
    icon: '🎧',
    accent: CYAN,
    name: 'Bar Takeover / Pop-Up',
    detail: 'Konquered Balance behind an existing bar',
    len: 'Nightly',
    goal: 'Bar takeover / pop-up',
  },
];

const BUILDS = [
  {
    icon: '🍸',
    accent: CYAN,
    title: 'High-Converting Kocktail Funnel',
    copy: 'A dedicated landing funnel built to turn cold clicks into booked events — written, designed, and split-tested around Konquered Balance’s kocktail menu.',
  },
  {
    icon: '📅',
    accent: GOLD,
    title: 'Automated Event Booking',
    copy: 'Guests self-schedule their event date against your real availability. Every booking drops straight into your calendar inside portal.goelev8.ai — no back-and-forth texting.',
  },
  {
    icon: '💳',
    accent: CYAN,
    title: '$200 Deposit Collection via Stripe',
    copy: 'Every event date requires a $200 deposit before it’s held. Deposits gut no-shows, cover your bar prep, and pre-qualify serious hosts. You keep 100% of it.',
  },
  {
    icon: '🔒',
    accent: GOLD,
    title: 'Custom Branded Booking Domain',
    copy: 'Your funnel lives at book.konqueredbalance.com with a full SSL certificate — your brand, your domain, start to finish. No third-party booking logos.',
  },
  {
    icon: '⚡',
    accent: CYAN,
    title: 'Full Automation & Portal Sync',
    copy: 'Confirmations, reminders, and follow-ups fire automatically. Leads, event bookings, and deposits stay in sync with your portal.goelev8.ai dashboard in real time.',
  },
  {
    icon: '🛠️',
    accent: GOLD,
    title: 'Ongoing Management & Support',
    copy: 'goElev8 monitors, maintains, and optimizes the whole system month to month. You pour the drinks — we handle the tech, the updates, and the uptime.',
  },
];

const HERO_PATH = [
  { n: '1', label: 'Guest lands on your kocktail funnel', sub: 'book.konqueredbalance.com' },
  { n: '2', label: 'Picks an experience + event date', sub: 'Live availability from portal.goelev8.ai' },
  { n: '3', label: 'Pays the $200 deposit', sub: 'Secure Stripe checkout' },
  { n: '4', label: 'Booked + confirmed automatically', sub: 'Reminders sent, portal synced' },
];

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'You approve & connect Stripe',
    copy: 'Approve the build below and pay the one-time $400 setup fee. We connect your Stripe account so every deposit lands in your bank, not ours.',
  },
  {
    n: '02',
    title: 'goElev8 builds the system',
    copy: 'We design the kocktail funnel, wire the event calendar into portal.goelev8.ai, configure deposits, and stand up book.konqueredbalance.com with SSL.',
  },
  {
    n: '03',
    title: 'Go live in 5–7 days',
    copy: 'We test the full path end to end — lead capture, event booking, deposit, confirmation — then flip it live and hand you the dashboard.',
  },
  {
    n: '04',
    title: 'Guests book & pay themselves',
    copy: 'Traffic hits the funnel, hosts self-book their date and pay the deposit, and your event calendar fills on autopilot while you focus on the bar.',
  },
];

/* The "Primary goal" dropdown — every option is a kocktail booking except the
   last, which keeps the legacy training side of Konquered Balance reachable. */
const GOALS = [
  'Private kocktail party',
  'Corporate mixer / brand activation',
  'Wedding & reception bar',
  'Kocktail masterclass / tasting',
  'Birthday / milestone celebration',
  'Bar takeover / pop-up',
  'Wellness & training session',
];

/* Event start times, not gym hours. */
const SLOTS = ['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];

const STEP_LABELS = ['Your info', 'Pick a date', 'Deposit', 'Confirmed'];

type DayOption = { key: string; dow: string; md: string };
type Lead = { name: string; phone: string; email: string; goal: string };
type FieldErrors = Partial<Record<'name' | 'phone' | 'email', string>>;

/* Build the next six days. Events land on weekends, so unlike a gym calendar
   this one keeps Sat/Sun. Done in an effect (never during render) so the
   server-rendered markup and the client's first paint can't disagree. */
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

/* A CONFIG value is "live" once its REPLACE_ placeholder has been swapped out. */
function isLive(value: string): boolean {
  return Boolean(value) && !value.includes('REPLACE_');
}

/* Both Stripe payments go through /api/checkout/kbsetup, which builds the
   Checkout Session server-side (inline price_data — no pre-made payment
   links to keep in sync). Resolves to an error string, or never returns
   because the browser has navigated to Stripe. */
async function startCheckout(payload: Record<string, unknown>): Promise<string> {
  try {
    const res = await fetch('/api/checkout/kbsetup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url;
      return '';
    }
    return data.error || 'Checkout could not start. Please try again.';
  } catch {
    return 'Network error. Please check your connection and try again.';
  }
}

function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function KbsetupClient() {
  /* ── Funnel state ───────────────────────────────────────────────── */
  const [step, setStep] = useState(1);
  const [lead, setLead] = useState<Lead>({ name: '', phone: '', email: '', goal: GOALS[0] });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [days, setDays] = useState<DayOption[]>([]);
  const [day, setDay] = useState<DayOption | null>(null);
  const [slot, setSlot] = useState('');
  const [slotError, setSlotError] = useState('');
  const [setupNotice, setSetupNotice] = useState('');
  const [setupBusy, setSetupBusy] = useState(false);
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositError, setDepositError] = useState('');

  useEffect(() => {
    const d = buildDays();
    setDays(d);
    setDay(d[0] ?? null);
  }, []);

  /* Returning from Stripe. ?booked=1 lands the guest on the confirmation
     step; ?setup=success is Stephen's post-payment receipt state. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('booked') === '1') setStep(4);
    if (params.get('setup') === 'success') {
      setSetupNotice('Payment received — your build slot is locked in. We’ll be in touch within one business day.');
    }
  }, []);

  /* All three "$400 setup" buttons. Creates the Checkout Session server-side,
     then hands off to Stripe. */
  async function handleSetupCheckout(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (setupBusy) return;
    setSetupBusy(true);
    setSetupNotice('');
    const err = await startCheckout({ plan: 'setup' });
    if (err) {
      setSetupNotice(err);
      setSetupBusy(false);
    }
    // On success the browser is already navigating to Stripe — leave the
    // button disabled so it can't be double-fired mid-redirect.
  }

  /* Menu cards deep-link into the funnel with that experience preselected. */
  function pickExperience(e: React.MouseEvent<HTMLAnchorElement>, goal: string) {
    setLead((prev) => ({ ...prev, goal }));
    setStep(1);
    smoothScrollTo(e, 'funnel');
  }

  function validateLead(): boolean {
    const next: FieldErrors = {};
    if (!lead.name.trim()) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) next.email = 'Please enter a valid email address.';
    if (lead.phone.replace(/\D/g, '').length < 10) next.phone = 'Please enter a valid mobile number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /* Fire-and-forget so the lead is captured even if they abandon the funnel
     at the booking or deposit step. no-cors means we never see the response —
     that's fine, we only care that it left the browser. */
  function postLead() {
    if (!isLive(CONFIG.LEAD_WEBHOOK_URL)) return;
    try {
      void fetch(CONFIG.LEAD_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name.trim(),
          phone: lead.phone.trim(),
          email: lead.email.trim(),
          experience: lead.goal,
          source: 'goelev8.ai/kbsetup',
          business: 'Konquered Balance',
        }),
      }).catch(() => { /* fire and forget */ });
    } catch { /* fire and forget */ }
  }

  function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!validateLead()) return;
    postLead();
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

  async function payDeposit() {
    if (depositBusy) return;
    setDepositBusy(true);
    setDepositError('');
    const err = await startCheckout({
      plan: 'deposit',
      experience: lead.goal,
      when,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
    });
    if (err) {
      setDepositError(err);
      setDepositBusy(false);
    }
  }

  function resetFunnel() {
    setStep(1);
    setLead({ name: '', phone: '', email: '', goal: GOALS[0] });
    setErrors({});
    setSlot('');
    setSlotError('');
    setDay(days[0] ?? null);
  }

  const when = day ? `${day.dow}, ${day.md} at ${slot}` : slot;

  return (
    <main style={{ background: BLK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.93)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderBottom: `1px solid rgba(201,168,76,0.12)`,
        }}
      >
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <BrandLock />
          <nav
            aria-label="Page sections"
            style={{
              display: 'flex', gap: 22, marginLeft: 'auto', flexWrap: 'wrap',
              fontFamily: FM, fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase',
            }}
          >
            {[
              ['Kocktail Menu', 'menu'],
              ['What’s Built', 'built'],
              ['Pricing', 'pricing'],
              ['Live Funnel', 'funnel'],
            ].map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => smoothScrollTo(e, id)}
                style={{ color: DIM, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href="#pricing"
            onClick={handleSetupCheckout}
            aria-disabled={setupBusy}
            style={{ ...cyanButton, padding: '9px 20px', fontSize: 11, whiteSpace: 'nowrap' }}
          >
            {setupBusy ? 'Opening Stripe…' : 'Approve & Launch'}
          </a>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ ...shell, paddingTop: 'clamp(48px, 8vw, 92px)', paddingBottom: 'clamp(40px, 6vw, 72px)' }}>
        <div style={{
          display: 'grid', gap: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>Built for Konquered Balance by goElev8</Eyebrow>
            <h1 style={{
              margin: '18px 0 0', fontFamily: FD, fontWeight: 400,
              fontSize: 'clamp(40px, 7vw, 78px)',
              lineHeight: 0.95, letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>
              Turn clicks into booked,{' '}
              <span style={{ color: GOLD }}>paid</span> kocktail experiences —{' '}
              <span style={{ color: CYAN }}>on autopilot</span>.
            </h1>
            <p style={{
              margin: '22px 0 0', color: MUTED,
              fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.7, maxWidth: 560,
            }}>
              A complete booking system for the Konquered Balance bar. It captures every event
              inquiry, books it straight into <strong style={{ color: TEXT, fontWeight: 500 }}>portal.goelev8.ai</strong>,
              collects a <strong style={{ color: TEXT, fontWeight: 500 }}>$200 deposit through Stripe</strong> before the
              date is held, and runs on your own branded domain at{' '}
              <strong style={{ color: TEXT, fontWeight: 500 }}>book.konqueredbalance.com</strong>.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30 }}>
              <a
                href="#pricing"
                onClick={handleSetupCheckout}
            aria-disabled={setupBusy}
                style={{ ...cyanButton, padding: '14px 26px', fontSize: 12.5 }}
              >
                {setupBusy ? 'Opening Stripe…' : 'Approve & Pay $400 Setup'}
              </a>
              <a
                href="#menu"
                onClick={(e) => smoothScrollTo(e, 'menu')}
                style={{ ...ghostButton, padding: '14px 26px', fontSize: 12.5 }}
              >
                See the Kocktail Menu
              </a>
            </div>

            {setupNotice && (
              <p role="status" style={{
                margin: '14px 0 0', fontSize: 13.5, color: GOLD, lineHeight: 1.5, maxWidth: 460,
              }}>
                {setupNotice}
              </p>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginTop: 26, flexWrap: 'wrap',
              fontFamily: FM, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GRN, flexShrink: 0 }} />
              <span style={{ color: GRN }}>System live in 5–7 days</span>
              <span style={{ color: '#2e2e2e' }}>/</span>
              <span style={{ color: DIM }}>Secured by Stripe</span>
              <span style={{ color: '#2e2e2e' }}>/</span>
              <span style={{ color: DIM }}>Books into portal.goelev8.ai</span>
            </div>
          </div>

          {/* Side card — the 4-step automated path */}
          <aside style={{
            ...card,
            padding: 'clamp(22px, 3.4vw, 30px)',
            background: 'linear-gradient(160deg, #141414 0%, #060606 100%)',
          }}>
            <div style={eyebrowMono}>The automated path</div>
            <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
              {HERO_PATH.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    flex: '0 0 auto', width: 30, height: 30, borderRadius: 2,
                    display: 'grid', placeItems: 'center',
                    background: i % 2 === 0 ? 'rgba(201,168,76,0.10)' : 'rgba(0,207,255,0.10)',
                    border: `1px solid ${i % 2 === 0 ? 'rgba(201,168,76,0.45)' : 'rgba(0,207,255,0.45)'}`,
                    color: i % 2 === 0 ? GOLD : CYAN,
                    fontFamily: FM, fontSize: 12, fontWeight: 500,
                  }}>
                    {s.n}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 500, lineHeight: 1.35 }}>
                      {s.label}
                    </span>
                    <span style={{ display: 'block', fontFamily: FM, fontSize: 11, color: DIM, marginTop: 4, wordBreak: 'break-word' }}>
                      {s.sub}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* ── Kocktail menu — the primary bookable offer ─────────────── */}
      <section id="menu" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="The primary goal"
          title={<>Book <span style={{ color: GOLD }}>kocktail experiences</span></>}
          sub="Every experience below is bookable in a single flow and holds its date with a $200 deposit. This menu is what the funnel sells."
        />
        <div style={{
          display: 'grid', gap: 16, marginTop: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}>
          {EXPERIENCES.map((x) => (
            <a
              key={x.name}
              href="#funnel"
              onClick={(e) => pickExperience(e, x.goal)}
              style={{
                ...card, padding: 24, display: 'block', textDecoration: 'none', color: TEXT,
                borderColor: `${x.accent}26`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center',
                  fontSize: 19, background: SURFACE2, border: `1px solid ${x.accent}33`,
                }}>
                  {x.icon}
                </span>
                <span style={{ fontFamily: FM, fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: x.accent }}>
                  {x.len}
                </span>
              </div>
              <h3 style={{
                margin: '18px 0 0', fontFamily: FD, fontWeight: 400,
                fontSize: 24, letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.1,
              }}>
                {x.name}
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                {x.detail}
              </p>
              <span style={{
                display: 'inline-block', marginTop: 16, fontFamily: FM, fontSize: 10.5,
                letterSpacing: '1.2px', textTransform: 'uppercase', color: CYAN,
              }}>
                Book this — $200 deposit →
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── What goElev8 builds ────────────────────────────────────── */}
      <section id="built" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="Scope of work"
          title={<>What goElev8 <span style={{ color: CYAN }}>builds &amp; manages</span></>}
          sub="Everything below is included in the build. No hidden line items, no per-seat surprises."
        />
        <div style={{
          display: 'grid', gap: 16, marginTop: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        }}>
          {BUILDS.map((b) => (
            <article key={b.title} style={{ ...card, padding: 26 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center',
                fontSize: 20, background: SURFACE2, border: `1px solid ${b.accent}33`,
              }}>
                {b.icon}
              </div>
              <h3 style={{
                margin: '18px 0 0', fontFamily: FD, fontWeight: 400,
                fontSize: 22, letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.15,
              }}>
                {b.title}
              </h3>
              <p style={{ margin: '10px 0 0', fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>
                {b.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="Investment breakdown"
          title={<>Simple, <span style={{ color: CYAN }}>transparent</span> pricing</>}
          sub="One build fee, one flat monthly, and a small fee only when the system actually books you a paid event."
        />

        <div style={{
          display: 'grid', gap: 20, marginTop: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'start',
        }}>
          {/* Itemized invoice */}
          <div style={{ ...card, padding: 'clamp(22px, 3.4vw, 32px)' }}>
            <h3 style={{
              margin: 0, fontFamily: FD, fontWeight: 400, fontSize: 26,
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>
              Itemized invoice
            </h3>
            <div style={{ marginTop: 22 }}>
              <InvoiceLine label="One-time setup &amp; build" amount="$400" unit="one-time" accent={GOLD} />
              <InvoiceLine label="Hosting &amp; management" amount="$99" unit="/ month" accent={CYAN} />
              <InvoiceLine
                label="Per booked event"
                amount="$10"
                unit="/ booking"
                accent={CYAN}
                note="Only charged when a deposit is actually paid."
                last
              />
            </div>
            <div style={{
              marginTop: 22, padding: '18px 20px', borderRadius: 2,
              background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.22)',
            }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65 }}>
                <strong style={{ color: GOLD, fontWeight: 500 }}>$400 due today to launch</strong>, then{' '}
                <strong style={{ fontWeight: 500 }}>$99/mo begins at go-live</strong>. Per-booking fees are billed monthly.
              </p>
              <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.6, color: MUTED }}>
                You keep <strong style={{ color: TEXT, fontWeight: 500 }}>100% of the $200 deposits</strong> — they go
                straight to your own Stripe account.
              </p>
            </div>
          </div>

          {/* Checkout card */}
          <div style={{
            ...card,
            padding: 'clamp(22px, 3.4vw, 32px)',
            background: 'linear-gradient(165deg, #141414 0%, #050505 100%)',
            border: '1px solid rgba(0,207,255,0.28)',
          }}>
            <div style={{ ...eyebrowMono, color: CYAN }}>Due today</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: FD, fontWeight: 400, fontSize: 'clamp(48px, 8vw, 68px)',
                lineHeight: 1, letterSpacing: '1px',
              }}>
                $400
              </span>
              <span style={{ fontSize: 15, color: MUTED }}>one-time setup</span>
            </div>
            <p style={{ margin: '16px 0 0', fontSize: 15, color: MUTED, lineHeight: 1.65 }}>
              Approving locks your build slot. We start immediately and your booking system is live
              within 5–7 days.
            </p>

            <a
              href="#pricing"
              onClick={handleSetupCheckout}
            aria-disabled={setupBusy}
              style={{ ...cyanButton, display: 'block', textAlign: 'center', marginTop: 24, padding: '16px 24px', fontSize: 13.5 }}
            >
              {setupBusy ? 'Opening Stripe…' : 'Approve & Pay $400 Setup'}
            </a>

            {setupNotice && (
              <p role="status" style={{ margin: '12px 0 0', fontSize: 13.5, color: GOLD, lineHeight: 1.5 }}>
                {setupNotice}
              </p>
            )}

            <p style={{
              margin: '16px 0 0', fontFamily: FM, fontSize: 10.5, color: DIM, letterSpacing: '0.6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, textAlign: 'center',
            }}>
              <span aria-hidden="true">🔒</span> Payments processed securely by Stripe.
            </p>
          </div>
        </div>
      </section>

      {/* ── Live funnel demo ───────────────────────────────────────── */}
      <section id="funnel" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="Live funnel"
          title={<>This is what <span style={{ color: GOLD }}>your guests</span> will see</>}
          sub="Walk through it yourself — this is the real kocktail booking flow, running live on this page."
        />

        <div style={{ ...card, marginTop: 40, padding: 0, overflow: 'hidden' }}>
          {/* Browser chrome */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderBottom: `1px solid ${HAIRLINE}`,
            background: SURFACE2,
          }}>
            <span style={{ display: 'flex', gap: 6 }} aria-hidden="true">
              {['#FF3B3B', '#C9A84C', '#00FF94'].map((c) => (
                <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
              ))}
            </span>
            <span style={{
              flex: 1, minWidth: 0, textAlign: 'center',
              fontFamily: FM, fontSize: 11, color: DIM,
              background: BLK, borderRadius: 2, padding: '6px 10px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              🔒 {CONFIG.BOOKING_DOMAIN}
            </span>
          </div>

          {/* Step progress */}
          <div style={{
            display: 'flex', gap: 8, padding: '18px 16px 0', flexWrap: 'wrap', justifyContent: 'center',
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
                    background: done ? CYAN : active ? 'rgba(0,207,255,0.12)' : SURFACE2,
                    border: `1px solid ${done ? CYAN : active ? CYAN : HAIRLINE}`,
                    color: done ? BLK : active ? CYAN : DIM,
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
                    <span aria-hidden="true" style={{ width: 18, height: 1, background: HAIRLINE }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: 'clamp(20px, 4vw, 34px)' }}>
            {/* Step 1 — lead capture */}
            {step === 1 && (
              <form onSubmit={submitLead} noValidate>
                <h3 style={stepHeading}>Book your kocktail experience</h3>
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 15, lineHeight: 1.65 }}>
                  Tell us about your event and we’ll get your date on the Konquered Balance calendar.
                </p>

                <div style={{
                  display: 'grid', gap: 16, marginTop: 26,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                }}>
                  <Field
                    id="kb-name" label="Full name" value={lead.name} error={errors.name}
                    autoComplete="name" placeholder="Jordan Ellis"
                    onChange={(v) => setLead({ ...lead, name: v })}
                  />
                  <Field
                    id="kb-phone" label="Mobile number" value={lead.phone} error={errors.phone}
                    type="tel" autoComplete="tel" placeholder="(314) 555-0142"
                    onChange={(v) => setLead({ ...lead, phone: v })}
                  />
                  <Field
                    id="kb-email" label="Email address" value={lead.email} error={errors.email}
                    type="email" autoComplete="email" placeholder="you@example.com"
                    onChange={(v) => setLead({ ...lead, email: v })}
                  />
                  <div>
                    <label htmlFor="kb-goal" style={labelStyle}>Kocktail experience</label>
                    <select
                      id="kb-goal"
                      value={lead.goal}
                      onChange={(e) => setLead({ ...lead, goal: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    >
                      {GOALS.map((g) => (
                        <option key={g} value={g} style={{ background: SURFACE, color: TEXT }}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" style={{ ...cyanButton, ...fullButton, marginTop: 26 }}>
                  Continue to booking →
                </button>
                <p style={{ margin: '14px 0 0', fontSize: 12.5, color: DIM, textAlign: 'center' }}>
                  By continuing you agree to be contacted about your event inquiry.
                </p>
              </form>
            )}

            {/* Step 2 — booking */}
            {step === 2 && (
              <form onSubmit={confirmSlot}>
                <h3 style={stepHeading}>Pick your event date</h3>
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 15, lineHeight: 1.65 }}>
                  Real-time availability, synced live from{' '}
                  <strong style={{ color: TEXT, fontWeight: 500 }}>portal.goelev8.ai</strong>. Dates disappear the
                  moment another host books them.
                </p>

                <fieldset style={fieldsetStyle}>
                  <legend style={legendStyle}>Choose a date</legend>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {days.map((d) => {
                      const on = day?.key === d.key;
                      return (
                        <button
                          key={d.key} type="button" aria-pressed={on}
                          onClick={() => { setDay(d); setSlot(''); }}
                          style={{
                            ...chipStyle,
                            minWidth: 78,
                            background: on ? 'rgba(0,207,255,0.12)' : SURFACE2,
                            borderColor: on ? CYAN : HAIRLINE,
                            color: on ? TEXT : MUTED,
                          }}
                        >
                          <span style={{ display: 'block', fontFamily: FM, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.75 }}>{d.dow}</span>
                          <span style={{ display: 'block', fontSize: 15, fontWeight: 500, marginTop: 3 }}>{d.md}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset style={fieldsetStyle}>
                  <legend style={legendStyle}>Available start times</legend>
                  <div style={{
                    display: 'grid', gap: 10,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))',
                  }}>
                    {SLOTS.map((s) => {
                      const on = slot === s;
                      return (
                        <button
                          key={s} type="button" aria-pressed={on}
                          onClick={() => { setSlot(s); setSlotError(''); }}
                          style={{
                            ...chipStyle,
                            padding: '13px 10px', fontSize: 14.5, fontWeight: 500,
                            background: on ? 'rgba(201,168,76,0.12)' : SURFACE2,
                            borderColor: on ? GOLD : HAIRLINE,
                            color: on ? TEXT : MUTED,
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {slotError && (
                  <p role="alert" style={errorTextStyle}>{slotError}</p>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ ...ghostButton, padding: '15px 22px' }}>
                    ← Back
                  </button>
                  <button type="submit" style={{ ...cyanButton, flex: 1, minWidth: 200, padding: '15px 22px' }}>
                    Continue to deposit →
                  </button>
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

                <div style={{
                  marginTop: 24, padding: 20, borderRadius: 2,
                  background: SURFACE2, border: `1px solid ${HAIRLINE}`,
                }}>
                  <SummaryRow label="Name" value={lead.name} />
                  <SummaryRow label="Experience" value={lead.goal} />
                  <SummaryRow label="Event date" value={when} />
                  <SummaryRow label="Host" value="Stephen Simmons — Konquered Balance" last />
                </div>

                <div style={{
                  marginTop: 16, padding: 20, borderRadius: 2,
                  background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.28)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FD, fontWeight: 400, fontSize: 38, color: GOLD, lineHeight: 1 }}>$200</span>
                    <span style={{ fontSize: 15, color: TEXT, fontWeight: 500 }}>event deposit</span>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>
                    Fully <strong style={{ color: TEXT, fontWeight: 500 }}>applied to your final event balance</strong>. It
                    covers bar prep and holds your date on the calendar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={payDeposit}
                  disabled={depositBusy}
                  style={{
                    ...cyanButton, ...fullButton, marginTop: 22,
                    opacity: depositBusy ? 0.6 : 1,
                    cursor: depositBusy ? 'wait' : 'pointer',
                  }}
                >
                  {depositBusy ? 'Opening Stripe…' : 'Pay $200 deposit with Stripe'}
                </button>

                {depositError && (
                  <p role="alert" style={{ ...errorTextStyle, marginTop: 12, textAlign: 'center' }}>
                    {depositError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(2)} style={{ ...ghostButton, padding: '13px 22px' }}>
                    ← Change date
                  </button>
                </div>

                <p style={{ margin: '16px 0 0', fontFamily: FM, fontSize: 10.5, color: DIM, textAlign: 'center', letterSpacing: '0.6px' }}>
                  🔒 Secured by Stripe · Your card details never touch our servers.
                </p>
              </div>
            )}

            {/* Step 4 — confirmation */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 2, margin: '0 auto',
                  display: 'grid', placeItems: 'center', fontSize: 28,
                  background: 'rgba(0,255,148,0.08)', border: `1px solid ${GRN}`, color: GRN,
                }}>
                  ✓
                </div>
                <h3 style={{ ...stepHeading, margin: '22px 0 0', fontSize: 'clamp(28px, 4.4vw, 38px)' }}>
                  Your kocktail experience is booked
                </h3>
                <p style={{ margin: '12px 0 0', color: MUTED, fontSize: 15.5, lineHeight: 1.65 }}>
                  Your date with Konquered Balance is locked in and your deposit is confirmed.
                </p>

                <div style={{
                  marginTop: 26, padding: 20, borderRadius: 2, textAlign: 'left',
                  background: SURFACE2, border: `1px solid ${HAIRLINE}`,
                }}>
                  <SummaryRow label="Experience" value={lead.goal} />
                  <SummaryRow label="Event date" value={when} />
                  <SummaryRow label="Deposit paid" value="$200 — applied to your final balance" />
                  <SummaryRow label="Confirmation sent to" value={lead.email || 'your email'} last />
                </div>

                <p style={{ margin: '18px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.65 }}>
                  Your details have been synced to{' '}
                  <strong style={{ color: TEXT, fontWeight: 500 }}>portal.goelev8.ai</strong> and a reminder will
                  be sent before your event.
                </p>

                <button type="button" onClick={resetFunnel} style={{ ...ghostButton, marginTop: 22, padding: '13px 26px' }}>
                  Book another
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ margin: '18px 0 0', fontFamily: FM, fontSize: 10.5, color: DIM, textAlign: 'center', lineHeight: 1.7, letterSpacing: '0.6px' }}>
          In production, event bookings post to portal.goelev8.ai and deposits run through the
          connected Stripe account.
        </p>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="How it works"
          title={<>From approval to <span style={{ color: CYAN }}>booked events</span></>}
          sub="Four steps. You handle one of them."
        />
        <div style={{
          display: 'grid', gap: 16, marginTop: 40,
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        }}>
          {HOW_IT_WORKS.map((s, i) => (
            <article key={s.n} style={{ ...card, padding: 26 }}>
              <span style={{
                fontFamily: FM, fontSize: 11, letterSpacing: '1.6px',
                color: i % 2 === 0 ? GOLD : CYAN,
              }}>
                {s.n}
              </span>
              <h3 style={{
                margin: '14px 0 0', fontFamily: FD, fontWeight: 400,
                fontSize: 21, letterSpacing: '0.8px', textTransform: 'uppercase', lineHeight: 1.15,
              }}>
                {s.title}
              </h3>
              <p style={{ margin: '10px 0 0', fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>
                {s.copy}
              </p>
            </article>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <a
            href="#pricing"
            onClick={handleSetupCheckout}
            aria-disabled={setupBusy}
            style={{ ...cyanButton, padding: '16px 32px', fontSize: 13.5 }}
          >
            {setupBusy ? 'Opening Stripe…' : 'Approve & Pay $400 Setup'}
          </a>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${HAIRLINE}`, marginTop: 'clamp(40px, 6vw, 72px)' }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '32px 20px 44px',
          display: 'flex', flexWrap: 'wrap', gap: 16,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <BrandLock />
          <p style={{ margin: 0, fontFamily: FM, fontSize: 10.5, color: DIM, letterSpacing: '0.8px' }}>
            Secured by Stripe · Powered by goElev8
          </p>
          <p style={{ margin: 0, fontFamily: FM, fontSize: 10.5, color: DIM, letterSpacing: '0.8px' }}>
            © {2026} goElev8.ai. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ── Small presentational helpers ─────────────────────────────────── */

/* Both marks ship as black-square artwork, so they sit flush on the black
   page with no plate or padding needed. */
function BrandLock() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Image
        src="/images/goelev8-full-logo.png"
        alt="goElev8.ai"
        width={44}
        height={44}
        style={{ height: 44, width: 44, display: 'block' }}
      />
      <span aria-hidden="true" style={{ color: '#2e2e2e', fontFamily: FM, fontSize: 13 }}>×</span>
      <Image
        src="/images/kbalance-logo.jpg"
        alt="Konquered Balance"
        width={40}
        height={40}
        style={{ height: 40, width: 40, display: 'block', borderRadius: '50%' }}
      />
      <span style={{
        fontFamily: FD, fontWeight: 400, fontSize: 17,
        letterSpacing: '1.4px', color: TEXT, whiteSpace: 'nowrap',
      }}>
        Konquered Balance
      </span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontFamily: FM, fontSize: 11, letterSpacing: '2.5px',
      textTransform: 'uppercase', color: GOLD,
    }}>
      <span aria-hidden="true" style={{ width: 24, height: 1, background: GOLD }} />
      {children}
    </span>
  );
}

function SectionHead({ eyebrow, title, sub }: {
  eyebrow: string;
  title: React.ReactNode;
  sub: string;
}) {
  return (
    <div style={{ maxWidth: 680 }}>
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

function InvoiceLine({ label, amount, unit, accent, note, last }: {
  label: string;
  amount: string;
  unit: string;
  accent: string;
  note?: string;
  last?: boolean;
}) {
  return (
    <div style={{
      padding: '16px 0',
      borderBottom: last ? 'none' : `1px solid ${HAIRLINE}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15.5, flex: '1 1 auto', minWidth: 150 }}>{label}</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: FD, fontWeight: 400, fontSize: 28, color: accent, lineHeight: 1 }}>{amount}</span>
          <span style={{ fontFamily: FM, fontSize: 11, color: DIM }}>{unit}</span>
        </span>
      </div>
      {note && (
        <p style={{ margin: '8px 0 0', fontSize: 13.5, color: DIM, lineHeight: 1.55 }}>{note}</p>
      )}
    </div>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
      padding: '11px 0', borderBottom: last ? 'none' : `1px solid ${HAIRLINE}`,
    }}>
      <span style={{ fontFamily: FM, fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', color: DIM }}>
        {label}
      </span>
      <span style={{ fontSize: 14.5, fontWeight: 500, textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, autoComplete }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, borderColor: error ? '#FF3B3B' : HAIRLINE }}
      />
      {error && (
        <p id={`${id}-err`} role="alert" style={{ ...errorTextStyle, marginTop: 7 }}>{error}</p>
      )}
    </div>
  );
}

/* ── Shared style objects ─────────────────────────────────────────── */

const shell: CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 20px',
};

const sectionPad: CSSProperties = {
  paddingTop: 'clamp(44px, 7vw, 84px)',
  paddingBottom: 'clamp(10px, 2vw, 20px)',
  scrollMarginTop: 88, // clears the sticky header on anchor jumps
};

const card: CSSProperties = {
  background: SURFACE,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 2,
};

const eyebrowMono: CSSProperties = {
  fontFamily: FM,
  fontSize: 10.5,
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
  color: DIM,
};

const stepHeading: CSSProperties = {
  margin: 0,
  fontFamily: FD,
  fontWeight: 400,
  fontSize: 'clamp(24px, 3.6vw, 32px)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  lineHeight: 1.05,
};

const cyanButton: CSSProperties = {
  display: 'inline-block',
  background: CYAN,
  color: BLK,
  fontFamily: FM,
  fontWeight: 500,
  fontSize: 12.5,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  border: `1px solid ${CYAN}`,
  borderRadius: 2,
  padding: '14px 24px',
  cursor: 'pointer',
  textDecoration: 'none',
  lineHeight: 1.2,
};

const ghostButton: CSSProperties = {
  display: 'inline-block',
  background: 'transparent',
  color: TEXT,
  fontFamily: FM,
  fontWeight: 500,
  fontSize: 12.5,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  border: `1px solid #2e2e2e`,
  borderRadius: 2,
  padding: '14px 24px',
  cursor: 'pointer',
  textDecoration: 'none',
  lineHeight: 1.2,
};

const fullButton: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  padding: '16px 24px',
  fontSize: 13.5,
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: FM,
  fontSize: 10.5,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: DIM,
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#060606',
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 2,
  padding: '13px 14px',
  color: TEXT,
  fontFamily: FB,
  fontSize: 15,
  outline: 'none',
};

const chipStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 2,
  border: `1px solid ${HAIRLINE}`,
  fontFamily: FB,
  cursor: 'pointer',
  textAlign: 'center',
  lineHeight: 1.25,
};

const fieldsetStyle: CSSProperties = {
  border: 'none',
  padding: 0,
  margin: '26px 0 0',
  minWidth: 0,
};

const legendStyle: CSSProperties = {
  padding: 0,
  fontFamily: FM,
  fontSize: 10.5,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: DIM,
  marginBottom: 12,
};

const errorTextStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: '#FF3B3B',
  lineHeight: 1.45,
};

/* ── Integration config ───────────────────────────────────────────────
   Both Stripe payments are now handled server-side by
   /api/checkout/kbsetup — there are no payment-link placeholders left to
   swap. What remains here is the portal wiring: anything still containing
   "REPLACE_" is treated as not-yet-connected and skipped silently.     */
const CONFIG = {
  // portal.goelev8.ai (GoHighLevel) inbound webhook that receives lead form posts.
  LEAD_WEBHOOK_URL: 'REPLACE_WITH_PORTAL_GOELEV8_LEAD_WEBHOOK_URL',

  // portal.goelev8.ai calendar/booking widget URL (includes the calendar ID).
  BOOKING_EMBED_URL: 'REPLACE_WITH_PORTAL_GOELEV8_BOOKING_EMBED_URL',

  // Customer-facing branded booking domain.
  BOOKING_DOMAIN: 'book.konqueredbalance.com',
};
