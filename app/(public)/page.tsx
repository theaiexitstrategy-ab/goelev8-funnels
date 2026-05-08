'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import s from './page.module.css';


/* ── Phone format helper ── */
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
}


/* ── Industry options ── */
const INDUSTRIES = [
  { v: 'gym', ico: '🏋️', label: 'Gym / Fitness' },
  { v: 'medspa', ico: '💆', label: 'Med Spa' },
  { v: 'hvac', ico: '🔧', label: 'HVAC / Home Services' },
  { v: 'realestate', ico: '🏡', label: 'Real Estate' },
  { v: 'studio', ico: '🎙️', label: 'Studio' },
  { v: 'law', ico: '⚖️', label: 'Law / Legal' },
  { v: 'insurance', ico: '🛡️', label: 'Insurance / Financial' },
  { v: 'other', ico: '🏢', label: 'Other' },
];


/* ── Animation examples ── */
type AnimMsg = { kind: 'them' | 'me'; text: string; time: string; typewriter: boolean };
type AnimExample = {
  missedTime: string;
  messages: AnimMsg[];
  label: string;
};

const ANIM_EXAMPLES: AnimExample[] = [
  {
    missedTime: '9:47 PM',
    messages: [
      { kind: 'them', text: "Hey! Sorry we missed your call at STL Strength Studio. What fitness goal are you working toward? 💪", time: '9:48 PM', typewriter: true },
      { kind: 'me', text: 'Trying to lose 30 lbs', time: '9:48 PM', typewriter: false },
      { kind: 'them', text: "Perfect — Coach Marcus specializes in exactly that. I have Tuesday at 6pm open. Want me to lock that in?", time: '9:49 PM', typewriter: true },
      { kind: 'me', text: 'Yes!', time: '9:49 PM', typewriter: false },
      { kind: 'them', text: "Done! You're booked Tuesday at 6pm. See you then 🎉", time: '9:49 PM', typewriter: true },
    ],
    label: '⚡ Booked automatically while the owner slept',
  },
  {
    missedTime: '8:23 PM',
    messages: [
      { kind: 'them', text: "Hi! Sorry we missed you at Glow Aesthetics. What treatment were you interested in? ✨", time: '8:24 PM', typewriter: true },
      { kind: 'me', text: 'Botox consultation', time: '8:24 PM', typewriter: false },
      { kind: 'them', text: "We'd love to help with that. Sarah has Thursday at 2pm available — want me to grab it?", time: '8:24 PM', typewriter: true },
      { kind: 'me', text: 'That works!', time: '8:25 PM', typewriter: false },
      { kind: 'them', text: "Confirmed for Thursday at 2pm. See you then ✨", time: '8:25 PM', typewriter: true },
    ],
    label: '⚡ $400 consultation captured at 8pm automatically',
  },
  {
    missedTime: '7:15 PM',
    messages: [
      { kind: 'them', text: "Hey! Missed your call at Metro HVAC. Is this something urgent or can we schedule service? 🔧", time: '7:16 PM', typewriter: true },
      { kind: 'me', text: 'AC stopped working', time: '7:16 PM', typewriter: false },
      { kind: 'them', text: "Got it — that's urgent. I have tomorrow morning at 9am available. Want me to book that?", time: '7:16 PM', typewriter: true },
      { kind: 'me', text: 'Please yes', time: '7:17 PM', typewriter: false },
      { kind: 'them', text: "Booked for tomorrow 9am. Kevin will be there. Thank you 🔧", time: '7:17 PM', typewriter: true },
    ],
    label: '⚡ Emergency job booked at 7pm without Kevin lifting a finger',
  },
];

const TYPE_SPEED = 28;
const GAP_AFTER_SYSTEM = 1300;
const GAP_AFTER_LEAD = 1100;
const LOOP_PAUSE = 3000;


/* ══════════ COMPONENT ══════════ */
export default function HomePage() {
  /* Hero SMS demo form */
  const [heroIndustry, setHeroIndustry] = useState('gym');
  const [heroPhone, setHeroPhone] = useState('');
  const [heroStatus, setHeroStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [heroError, setHeroError] = useState('');

  /* Vapi strip */
  const [vapiPhone, setVapiPhone] = useState('');
  const [vapiStatus, setVapiStatus] = useState<'idle'|'calling'|'sent'|'error'>('idle');
  const [vapiError, setVapiError] = useState('');

  /* Founding Client checkout */
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const goToCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/create-checkout', { method: 'POST' });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutLoading(false);
      alert(data?.error || 'Could not start checkout. Try again or book a setup call.');
    } catch {
      setCheckoutLoading(false);
      alert('Network error. Try again or book a setup call.');
    }
  }, []);

  /* Per-tier checkout (Starter / Growth / Pro) */
  const [checkingOutTier, setCheckingOutTier] = useState<string | null>(null);
  const goToTierCheckout = useCallback(async (tier: string) => {
    setCheckingOutTier(tier);
    try {
      const res = await fetch(`/api/checkout/${tier}`, { method: 'POST' });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setCheckingOutTier(null);
      alert(data?.error || 'Could not start checkout. Try again or book a setup call.');
    } catch {
      setCheckingOutTier(null);
      alert('Network error. Try again or book a setup call.');
    }
  }, []);

  /* Animation state */
  const [exIdx, setExIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showLabel, setShowLabel] = useState(false);
  const animTimers = useRef<number[]>([]);

  /* Scroll reveal */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(s.vis); });
    }, { threshold: 0.12 });
    document.querySelectorAll(`.${s.rev}`).forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Smooth scroll */
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* Animation loop */
  useEffect(() => {
    const clearTimers = () => { animTimers.current.forEach(t => clearTimeout(t)); animTimers.current = []; };
    const push = (fn: () => void, ms: number) => { animTimers.current.push(window.setTimeout(fn, ms) as unknown as number); };

    const currentEx = ANIM_EXAMPLES[exIdx];
    const currentMsg = currentEx.messages[msgIdx];

    if (!currentMsg) {
      push(() => {
        setShowLabel(true);
        push(() => {
          setShowLabel(false);
          setExIdx(prev => (prev + 1) % ANIM_EXAMPLES.length);
          setMsgIdx(0);
          setTypedText('');
        }, LOOP_PAUSE);
      }, 400);
      return clearTimers;
    }

    if (currentMsg.typewriter) {
      let i = 0;
      const typeNext = () => {
        if (i <= currentMsg.text.length) {
          setTypedText(currentMsg.text.slice(0, i));
          i++;
          push(typeNext, TYPE_SPEED);
        } else {
          push(() => {
            setTypedText('');
            setMsgIdx(prev => prev + 1);
          }, GAP_AFTER_SYSTEM);
        }
      };
      typeNext();
    } else {
      push(() => { setMsgIdx(prev => prev + 1); }, GAP_AFTER_LEAD);
    }

    return clearTimers;
  }, [exIdx, msgIdx]);

  /* Submit hero SMS demo */
  const submitHero = useCallback(async () => {
    const digits = heroPhone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setHeroError('Enter a valid US number');
      return;
    }
    setHeroError('');
    setHeroStatus('sending');

    try {
      const res = await fetch('/api/demo/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: heroIndustry, phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHeroError(data.error || 'Something went wrong');
        setHeroStatus('error');
        return;
      }
      setHeroStatus('sent');
    } catch {
      setHeroError('Network error. Try again.');
      setHeroStatus('error');
    }
  }, [heroIndustry, heroPhone]);

  /* Submit Vapi strip */
  const submitVapi = useCallback(async () => {
    const digits = vapiPhone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setVapiError('Enter a valid US number');
      return;
    }
    setVapiError('');
    setVapiStatus('calling');

    try {
      const res = await fetch('/api/demo/trigger-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      });
      if (!res.ok) {
        setVapiError("Call couldn't connect right now. Book a setup call and Aaron will demo it live.");
        setVapiStatus('error');
        return;
      }
      setTimeout(() => setVapiStatus('sent'), 3000);
    } catch {
      setVapiError("Call couldn't connect right now. Book a setup call and Aaron will demo it live.");
      setVapiStatus('error');
    }
  }, [vapiPhone]);

  const currentExample = ANIM_EXAMPLES[exIdx];
  const visibleMsgs = currentExample.messages.slice(0, msgIdx);
  const typingMsg = currentExample.messages[msgIdx];
  const isTyping = !!(typingMsg && typingMsg.typewriter && typedText.length > 0);


  /* ══════════ JSX ══════════ */
  return (
    <div className={s.page}>
      <div className={s.scanlines} />
      <div className={s.noise} />

      {/* NAV */}
      <nav className={s.nav} role="navigation" aria-label="Main navigation">
        <Link href="/" className={s['nav-logo']} aria-label="GoElev8.ai Home">
          <Image src="/images/goelev8-full-logo.png" alt="GoElev8.ai — Infinite Possibilities" width={60} height={60} style={{height:60,width:60}} />
        </Link>
        <ul className={s['nav-links']} role="list">
          <li><a href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how'); }}>How It Works</a></li>
          <li><a href="#who" onClick={(e) => { e.preventDefault(); scrollTo('who'); }}>Who It&apos;s For</a></li>
          <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }}>Pricing</a></li>
          <li><a href="#results" onClick={(e) => { e.preventDefault(); scrollTo('results'); }}>Results</a></li>
        </ul>
        <div className={s['nav-actions']}>
          <button className={s['nav-demo']} onClick={() => scrollTo('vapi-strip')}>See Demo</button>
          <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer" className={s['nav-login']}>Book a Call</a>
        </div>
      </nav>


      {/* ── HERO ── */}
      <section className={s.hero} aria-label="Hero">
        <div className={s['hero-bg']} aria-hidden="true" />
        <div className={s['hero-grid']} aria-hidden="true" />
        <div className={s['hero-scan']} aria-hidden="true" />

        <div className={s['hero-left']}>
          <div className={s['hero-eyebrow']}>AI LEAD FOLLOW-UP · ALWAYS ON</div>

          <h1 className={s['hero-h']}>
            Your Missed Calls<br/>
            <span className={s.gold}>Book Themselves.</span>
          </h1>

          <p className={s['hero-sub']}>
            GoElev8.ai texts every missed caller back within <strong>60 seconds</strong> and books them on your calendar — automatically. <strong>No staff. No voicemail. No lost revenue.</strong>
          </p>

          <div className={s['sys-status']}>
            <span className={s['sys-dot']} />
            <span className={s['sys-text']}>SYSTEM ONLINE</span>
            <span className={s['sys-sep']}>·</span>
            <span className={s['sys-item']}>ZERO HUMANS REQUIRED</span>
            <span className={s['sys-sep']}>·</span>
            <span className={s['sys-item']}>GO LIVE IN 48 HOURS</span>
          </div>

          {heroStatus !== 'sent' ? (
            <>
              <div className={s['demo-form']}>
                <div className={s['demo-industry-wrap']}>
                  <span className={s['demo-industry-ico']}>{INDUSTRIES.find(i => i.v === heroIndustry)?.ico || '🏢'}</span>
                  <select
                    className={s['demo-industry']}
                    value={heroIndustry}
                    onChange={e => setHeroIndustry(e.target.value)}
                    disabled={heroStatus === 'sending'}
                    aria-label="Select industry"
                  >
                    {INDUSTRIES.map(i => (
                      <option key={i.v} value={i.v}>{i.ico} {i.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="tel"
                  className={s['demo-phone']}
                  value={heroPhone}
                  onChange={e => setHeroPhone(formatPhone(e.target.value))}
                  placeholder="Your cell — demo hits in 60 sec"
                  disabled={heroStatus === 'sending'}
                  aria-label="Your cell phone"
                />
                <button
                  className={s['demo-submit']}
                  onClick={submitHero}
                  disabled={heroStatus === 'sending'}
                >
                  {heroStatus === 'sending' ? 'Building your demo...' : 'Send My Demo →'}
                </button>
              </div>
              {heroError && <div className={s['demo-error']}>{heroError}</div>}
              <div className={s['demo-hint']}>By submitting you agree to receive one SMS from GoElev8.ai. Standard rates apply. Reply STOP to opt out.</div>
            </>
          ) : (
            <div className={s['demo-success']}>
              <div className={s['demo-success-row']}>
                <span className={s['demo-success-dot']} />
                <span className={s['demo-success-text']}>✓ Demo sent to {heroPhone}</span>
              </div>
              <p className={s['demo-success-sub']}>That&apos;s exactly what your missed callers receive — automatically.</p>
              <div className={s['demo-success-links']}>
                <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer" className={s['demo-success-link']}>Book a setup call →</a>
                <button className={s['demo-success-link']} onClick={() => scrollTo('pricing')}>See pricing →</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Auto-playing SMS animation */}
        <div className={s['hero-right']}>
          <div className={s['anim-phone']}>
            <div className={s['anim-notch']} />
            <div className={s['anim-screen']}>
              <div className={s['anim-notif']}>
                <div className={s['anim-notif-icon']}>📵</div>
                <div>
                  <div className={s['anim-notif-title']}>Missed call · {currentExample.missedTime}</div>
                  <div className={s['anim-notif-sub']}>Unknown Number</div>
                </div>
              </div>

              <div className={s['anim-thread']}>
                {visibleMsgs.map((msg, i) => (
                  <div key={`${exIdx}-${i}`} className={s['anim-row']} data-kind={msg.kind}>
                    <div className={`${s['anim-bubble']} ${msg.kind === 'me' ? s['anim-me'] : s['anim-them']}`}>
                      {msg.text}
                    </div>
                    <div className={s['anim-ts']}>{msg.time}</div>
                  </div>
                ))}

                {isTyping && (
                  <div className={s['anim-row']} data-kind={typingMsg.kind}>
                    <div className={`${s['anim-bubble']} ${typingMsg.kind === 'me' ? s['anim-me'] : s['anim-them']}`}>
                      {typedText}<span className={s['anim-cursor']}>▎</span>
                    </div>
                  </div>
                )}

                {showLabel && (
                  <div className={s['anim-label']}>{currentExample.label}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── VAPI STRIP ── */}
      <section className={s['vapi-strip']} id="vapi-strip" aria-label="Hear it live">
        <div className={s['vapi-strip-inner']}>
          <div className={s['vapi-strip-left']}>
            <div className={s['vapi-strip-h']}>Want to hear it instead?</div>
            <p className={s['vapi-strip-p']}>Enter your number and Lev — our AI assistant — calls you live. Growth and Pro clients get this for their business.</p>
          </div>
          <div className={s['vapi-strip-right']}>
            {vapiStatus === 'idle' || vapiStatus === 'error' ? (
              <>
                <div className={s['vapi-form']}>
                  <input
                    type="tel"
                    className={s['demo-phone']}
                    value={vapiPhone}
                    onChange={e => setVapiPhone(formatPhone(e.target.value))}
                    placeholder="Your cell"
                    aria-label="Your cell phone"
                  />
                  <button className={s['demo-submit']} onClick={submitVapi}>Call Me Now →</button>
                </div>
                {vapiError && (
                  <div className={s['vapi-error']}>
                    {vapiError} <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer" className={s['vapi-error-link']}>Book a setup call →</a>
                  </div>
                )}
              </>
            ) : vapiStatus === 'calling' ? (
              <div className={s['vapi-calling']}>
                <span className={s['vapi-calling-dot']} />
                <span>Calling {vapiPhone}...</span>
              </div>
            ) : (
              <div className={s['vapi-sent']}>
                <span className={s['vapi-calling-dot']} />
                Lev is calling you now. Answer and hear exactly what your leads will hear.
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Trust bar */}
      <div className={s['trust-strip']}>
        <span>🔒 256-bit Encrypted</span>
        <span className={s['trust-sep']}>·</span>
        <span>📱 Twilio + Vapi Powered</span>
        <span className={s['trust-sep']}>·</span>
        <span>🇺🇸 Built in St. Louis, MO</span>
        <span className={s['trust-sep']}>·</span>
        <span>⚡ Go Live in 48 Hours</span>
      </div>

      <div className={s.divider} />


      {/* ── PAIN SECTION ── */}
      <section className={s.painSection}>
        <div className={s.painWrap}>
          <div className={s.painLabel}>
            <span className={s.painLabelLine} />THE PROBLEM WE SOLVE
          </div>
          <h2 className={s.painH}>YOUR LEADS AREN&apos;T DEAD.<br/><span style={{color:'var(--cyan)'}}>THEY STOPPED HEARING FROM YOU.</span></h2>
          <p className={s.painSub}>The average service business takes 47 hours to follow up. Leads go cold in 5 minutes. Here is what that costs you every week.</p>
          <div className={s.painGrid}>
            <div className={s.painCard} style={{background:'rgba(255,59,59,.03)'}}>
              <div className={s.painBar} style={{background:'var(--red)'}} />
              <div className={s.painCardLabel} style={{color:'var(--red)'}}>
                <span className={s.painCardDot} style={{background:'var(--red)'}} />WITHOUT GOELEV8.AI
              </div>
              <div className={s.painCardH}>You Call Back Tomorrow.</div>
              <p className={s.painCardP}>A lead opts in at 9pm. You see it in the morning. You call back around lunch. By then they&apos;ve already booked with whoever texted them first. This happens to <strong style={{color:'var(--wh)'}}>62% of your leads</strong> — every single week — and you never know it because they just go silent.</p>
              <div className={s.painCardStat} style={{background:'rgba(255,59,59,.08)',borderLeft:'2px solid var(--red)',color:'var(--red)'}}>Average small business follow-up time: 47 hours. Conversion drops 80% after 5 minutes of no contact.</div>
            </div>
            <div className={s.painCard} style={{background:'rgba(0,207,255,.03)'}}>
              <div className={s.painBar} style={{background:'var(--cyan)'}} />
              <div className={s.painCardLabel} style={{color:'#00E87A'}}>
                <span className={s.painCardDot} style={{background:'#00E87A',animation:'pulse 2s infinite'}} />WITH GOELEV8.AI
              </div>
              <div className={s.painCardH}>They Get a Text in 60 Seconds.</div>
              <p className={s.painCardP}>Missed call comes in. The GoElev8.AI system texts them back within 60 seconds — before they&apos;ve opened another tab. The conversation starts automatically. <strong style={{color:'var(--wh)'}}>Your morning starts with confirmed bookings,</strong> not missed opportunities.</p>
              <div className={s.painCardStat} style={{background:'rgba(0,207,255,.07)',borderLeft:'2px solid var(--cyan)',color:'var(--cyan)'}}>GoElev8.AI response time: &lt; 60 seconds. Every lead. Every time. Zero humans required.</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`${s.section} ${s.hiw}`} id="how" aria-labelledby="hiw-h">
        <div className={s.sl} aria-hidden="true">System</div>
        <h2 className={s.sh} id="hiw-h">HOW THE<br/><span style={{color:'var(--cyan)'}}>SYSTEM WORKS</span></h2>
        <div className={`${s.steps} ${s.rev}`} role="list">
          {[
            {n:'01',ico:'📵',t:'Missed Call Detected',d:'A lead calls your business number. You\'re busy, in a meeting, or after hours. The system detects the missed call instantly.',tag:'Instant Detection'},
            {n:'02',ico:'💬',t:'System Responds in 60 Sec',d:'The GoElev8.ai system texts the caller back within 60 seconds automatically. Growth and Pro clients also get an AI voice assistant that answers live.',tag:'SMS Default · Voice Optional'},
            {n:'03',ico:'📅',t:'AI Books the Appointment',d:'The system qualifies the lead, handles back-and-forth, and books them on your calendar — all automated.',tag:'Automated Booking'},
            {n:'04',ico:'📊',t:'You See Everything',d:'Every lead, every conversation, every booking — visible in your client portal dashboard in real time. Full pipeline visibility.',tag:'Live Intelligence'},
          ].map((step, i) => (
            <div key={step.n} className={s.step} data-n={step.n} role="listitem">
              <div className={s['step-num']}>// {step.n}</div>
              <div className={s['step-ico']}>{step.ico}</div>
              <div className={s['step-t']}>{step.t}</div>
              <div className={s['step-d']}>{step.d}</div>
              <div className={s['step-tag']}>{step.tag}</div>
              {i < 3 && <div className={s['step-arrow']} aria-hidden="true">→</div>}
            </div>
          ))}
        </div>
      </section>


      {/* WHO IT'S FOR */}
      <section className={`${s.section} ${s['who-section']}`} id="who" aria-labelledby="who-h">
        <div className={s.sl} aria-hidden="true">Industries</div>
        <h2 className={`${s.sh} ${s.rev}`} id="who-h">BUILT FOR LOCAL<br/><span style={{color:'var(--cyan)'}}>SERVICE BUSINESSES</span></h2>
        <div className={`${s['who-grid']} ${s.rev}`}>
          {[
            {ico:'🏋️',t:'Gyms & Fitness Studios',d:'Your front desk can\'t answer during class. We catch every missed lead and get them booked automatically.'},
            {ico:'💆',t:'Med Spas & Aesthetics',d:'A missed consultation is $500 walking out the door. We text them back in 60 seconds before they book somewhere else.'},
            {ico:'🔧',t:'HVAC & Home Services',d:'You\'re on a job and can\'t answer. We text the caller back and book them on your calendar — Jobber compatible.'},
            {ico:'🏡',t:'Real Estate',d:'Buyers don\'t wait. We respond to every inquiry in under 60 seconds day or night.'},
            {ico:'🛡️',t:'Insurance & Financial Planning',d:'Every missed call is a policy that went to a competitor. We follow up within 60 seconds automatically.'},
          ].map(card => (
            <div key={card.t} className={s['who-card']}>
              <div className={s['who-ico']}>{card.ico}</div>
              <div className={s['who-title']}>{card.t}</div>
              <div className={s['who-desc']}>{card.d}</div>
            </div>
          ))}
        </div>
      </section>


      {/* TRUST */}
      <section className={`${s.section} ${s['trust-section']}`} id="trust" aria-labelledby="trust-h">
        <div className={s.sl} aria-hidden="true">Built to Perform</div>
        <h2 className={`${s.sh} ${s.rev}`} id="trust-h">ENTERPRISE-GRADE<br/><span style={{color:'var(--cyan)'}}>RELIABILITY.</span></h2>
        <p className={`${s.ssub} ${s.rev}`}>The GoElev8.AI system is built on the same infrastructure tier used by Fortune 500 companies — with security, compliance, and uptime standards that protect your business and your leads.</p>
        <div className={`${s['trust-grid']} ${s.rev}`}>
          {[
            {ico:'🔒',n:'256-bit',t:'Encryption at Rest & in Transit',d:'Every lead record, call transcript, and SMS conversation is encrypted end-to-end. Your customer data never travels unprotected.'},
            {ico:'⚡',n:'99.9%',t:'Uptime SLA',d:'Your AI system runs on globally distributed edge infrastructure. Zero downtime maintenance. Leads captured every second of every day.'},
            {ico:'📋',n:'A2P',t:'SMS Compliance Handled',d:'GoElev8.AI manages your A2P 10DLC registration automatically. You\'re compliant from Day 1 — no paperwork, no Twilio dashboards, no risk.'},
          ].map(c => (
            <div key={c.t} className={s['trust-card']}>
              <div className={s['trust-card-ico']}>{c.ico}</div>
              <div className={s['trust-card-n']}>{c.n}</div>
              <div className={s['trust-card-title']}>{c.t}</div>
              <div className={s['trust-card-desc']}>{c.d}</div>
            </div>
          ))}
        </div>
      </section>


      {/* PRICING */}
      <section className={`${s.section} ${s['pr-section']}`} id="pricing" aria-labelledby="pricing-h">
        <div className={s['pr-hd']}>
          <div>
            <div className={s.sl} aria-hidden="true">Pricing</div>
            <h2 className={`${s.sh} ${s.rev}`} id="pricing-h">LESS THAN ONE<br/><span style={{color:'var(--cyan)'}}>MISSED CLIENT.</span></h2>
          </div>
        </div>
        <div className={`${s['pr-grid']} ${s.rev}`} role="list">
          {[
            {
              name:'STARTER',
              tier:'starter',
              desc:'Missed call text-back, booking calendar, and a dedicated business number.',
              setup:300, mo:127, feat:false,
              features:['Missed call text-back (60 sec)','Automated booking calendar','Dedicated business phone number','Client portal dashboard','Monthly lead report','300 SMS/mo included','$0.05/msg overage'],
              off:['AI voice assistant (Vapi)'],
            },
            {
              name:'GROWTH',
              tier:'growth',
              desc:'The full GoElev8.AI system. AI voice, SMS campaigns, and portal analytics.',
              setup:400, mo:197, feat:true,
              features:['Everything in Starter','AI voice assistant (Vapi)','Lead qualification flow','SMS campaign automation','Portal analytics + GA4','Priority support','600 SMS/mo + 60 min included','$0.05/msg · $0.15/min overage'],
              off:[],
            },
            {
              name:'PRO',
              tier:'pro',
              desc:'Multi-agent dashboard, routing logic, and dedicated account manager.',
              setup:600, mo:297, feat:false,
              features:['Everything in Growth','Multi-agent team dashboard','Agent routing logic','Broker pipeline view','Custom SMS campaigns','Dedicated account manager','1,200 SMS/mo + 120 min included','$0.05/msg · $0.15/min overage'],
              off:[],
            },
          ].map(plan => (
            <div key={plan.name} className={`${s.pc} ${plan.feat ? s.feat : ''}`} role="listitem">
              {plan.feat && <div className={s['feat-bdg']}>Most Popular</div>}
              <div className={s['setup-badge']}>${plan.setup} one-time setup</div>
              <div className={s.tn}>{plan.name}</div>
              <div className={s.td}>{plan.desc}</div>
              <div className={s.tp}><span className={s.tc}>$</span><span className={s.ta}>{plan.mo}</span><span className={s.tper}>/mo</span></div>
              <div className={s.tu}>Go Live in 48 Hours</div>
              <div className={s.tdiv} />
              <ul className={s.tfl}>
                {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                {plan.off.map((f, i) => <li key={`off-${i}`} className={s.off}>{f}</li>)}
              </ul>
              <button
                type="button"
                className={s.tcta}
                onClick={() => goToTierCheckout(plan.tier)}
                disabled={checkingOutTier !== null}
              >
                {checkingOutTier === plan.tier ? 'Starting…' : `GET ${plan.name} →`}
              </button>
            </div>
          ))}
        </div>
        <div className={`${s['pricing-note']} ${s.rev}`}>
          Setup fee covers full configuration, testing, and go-live in 48 hours. Cancel anytime with 30 days written notice. Setup fee is non-refundable.
        </div>
      </section>


      {/* RESULTS */}
      <section className={`${s.section} ${s['results-section']}`} id="results" aria-labelledby="results-h">
        <div className={s.sl} aria-hidden="true">Results</div>
        <h2 className={`${s.sh} ${s.rev}`} id="results-h">LIVE AND<br/><span style={{color:'var(--cyan)'}}>RUNNING.</span></h2>
        <p className={`${s.ssub} ${s.rev}`}>Real businesses. Real leads. GoElev8.ai running right now.</p>
        <div className={`${s['clients-grid']} ${s.rev}`}>
          {[
            {ico:'🏋️',name:'The Flex Facility',type:'Fitness Studio · Earth City, MO'},
            {ico:'🎙️',name:'iSlay Studios',type:'Recording Studio · Bridgeton, MO'},
            {ico:'🛡️',name:'Daniel\'s Legacy Planning',type:'Insurance & Financial · Tulsa, OK'},
          ].map(client => (
            <div key={client.name} className={s['client-card']}>
              <div className={s['client-ico']}>{client.ico}</div>
              <div className={s['client-name']}>{client.name}</div>
              <div className={s['client-type']}>{client.type}</div>
              <div className={s['client-status']}><span className={s['client-dot']} />ACTIVE</div>
            </div>
          ))}
        </div>
        <div className={`${s['results-footer']} ${s.rev}`}>
          <p className={s['results-serving']}>Serving businesses in St. Louis, MO and Tulsa, OK — and growing.</p>
          <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer" className={s['btn-primary']}>Apply for Early Access →</a>
        </div>
      </section>


      {/* FINAL CTA */}
      <div className={`${s['cta-section']} ${s.rev}`} role="complementary">
        <div className={s['cta-grid-bg']} aria-hidden="true" />
        <h2 className={s['cta-h']}>STOP LOSING LEADS<br/><span className={s.c}>WHILE YOU SLEEP.</span></h2>
        <p className={s['cta-p']}>Every missed call is a missed appointment. GoElev8.ai texts them back in 60 seconds — automatically. Setup takes 48 hours.</p>
        <div className={s['cta-btns']}>
          <button className={s['btn-primary']} onClick={goToCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? 'Starting…' : 'Get Started — $200 Setup →'}
          </button>
          <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer" className={s['btn-outline']}>Book a Setup Call →</a>
          <button className={s['btn-outline']} onClick={() => scrollTo('vapi-strip')}>See It Work Live →</button>
        </div>
      </div>


      {/* FOOTER */}
      <footer className={s.footer} role="contentinfo">
        <Link href="/" className={s['footer-logo']} aria-label="GoElev8.ai home">
          <Image src="/images/lockup.png" alt="GoElev8.ai" width={100} height={24} style={{height:24,width:'auto',opacity:.7}} />
        </Link>
        <div className={s.fc}>// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.</div>
        <nav className={s.flinks} aria-label="Footer navigation">
          <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }}>Pricing</a>
          <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer">Book a Call</a>
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/sms-policy">SMS Policy</a>
        </nav>
      </footer>
    </div>
  );
}
