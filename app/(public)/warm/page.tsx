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
          <li><a href="#booking" onClick={(e) => { e.preventDefault(); scrollTo('booking'); }}>Booking</a></li>
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
          <div className={s['hero-eyebrow']}>CUSTOM AI AGENTS · DONE FOR YOU</div>

          <h1 className={s['hero-h']}>
            AI Agents That Answer,<br/>
            <span className={s.gold}>Book &amp; Follow Up.</span>
          </h1>

          <p className={s['hero-sub']}>
            GoElev8.ai designs, builds, and runs custom AI agents that answer every call and text, qualify the lead, and book it on your calendar — <strong>24/7</strong>. <strong>No staff. No missed leads. No lost revenue.</strong>
          </p>

          <div className={s['sys-status']}>
            <span className={s['sys-dot']} />
            <span className={s['sys-text']}>SYSTEM ONLINE</span>
            <span className={s['sys-sep']}>·</span>
            <span className={s['sys-item']}>AGENTS ALWAYS ON</span>
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
              <p className={s['demo-success-sub']}>That&apos;s exactly what your leads get from your AI agent — automatically.</p>
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
          <h2 className={s.painH}>YOUR LEADS AREN&apos;T DEAD.<br/><span style={{color:'var(--cyan)'}}>YOU JUST CAN&apos;T ANSWER FAST ENOUGH.</span></h2>
          <p className={s.painSub}>The average business takes 47 hours to follow up. Leads go cold in 5 minutes. A custom AI agent answers in seconds — here is what the gap costs you every week.</p>
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
              <div className={s.painCardH}>Your Agent Answers Instantly.</div>
              <p className={s.painCardP}>A call or text comes in. Your GoElev8.AI agent responds within 60 seconds — before they&apos;ve opened another tab — qualifies the lead, and books the appointment automatically. <strong style={{color:'var(--wh)'}}>Your morning starts with confirmed bookings,</strong> not missed opportunities.</p>
              <div className={s.painCardStat} style={{background:'rgba(0,207,255,.07)',borderLeft:'2px solid var(--cyan)',color:'var(--cyan)'}}>GoElev8.AI agent response time: &lt; 60 seconds. Every lead. Every time. Zero humans required.</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`${s.section} ${s.hiw}`} id="how" aria-labelledby="hiw-h">
        <div className={s.sl} aria-hidden="true">System</div>
        <h2 className={s.sh} id="hiw-h">HOW YOUR<br/><span style={{color:'var(--cyan)'}}>AGENT WORKS</span></h2>
        <div className={`${s.steps} ${s.rev}`} role="list">
          {[
            {n:'01',ico:'📞',t:'Your Agent Answers',d:'A lead calls or texts your business number. You\'re busy, in a meeting, or after hours. Your AI agent responds instantly — text-back by default, live AI voice on Growth and Pro.',tag:'Instant Response'},
            {n:'02',ico:'💬',t:'It Talks Like You',d:'Trained on your business, your services, and your voice, the agent answers questions, handles the back-and-forth, and qualifies every lead automatically.',tag:'Voice + SMS'},
            {n:'03',ico:'📅',t:'It Books the Appointment',d:'The agent checks your calendar, offers real times, and locks in the booking — no forms, no phone tag, no staff required.',tag:'Automated Booking'},
            {n:'04',ico:'📊',t:'You See Everything',d:'Every call, conversation, and booking flows into your portal dashboard in real time. Full pipeline visibility, zero busywork.',tag:'Live Intelligence'},
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
            {ico:'🏋️',t:'Gyms & Fitness Studios',d:'Your front desk can\'t answer during class. Your AI agent does — catching every lead and booking them while you coach.'},
            {ico:'💆',t:'Med Spas & Aesthetics',d:'A missed consultation is $500 walking out the door. Your agent replies in seconds and books it before they call someone else.'},
            {ico:'🔧',t:'HVAC & Home Services',d:'You\'re on a job and can\'t answer. Your agent answers, qualifies the request, and books it on your calendar — Jobber compatible.'},
            {ico:'🏡',t:'Real Estate',d:'Buyers don\'t wait. Your agent responds to every inquiry in under 60 seconds, day or night, and books the showing.'},
            {ico:'🛡️',t:'Insurance & Financial Planning',d:'Every unanswered lead is a policy lost to a competitor. Your agent follows up instantly and never lets one slip.'},
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
        <p className={`${s.ssub} ${s.rev}`}>Your AI agents run on the same infrastructure tier used by Fortune 500 companies — with the security, compliance, and uptime standards that protect your business and every lead they handle.</p>
        <div className={`${s['trust-grid']} ${s.rev}`}>
          {[
            {ico:'🔒',n:'256-bit',t:'Encryption at Rest & in Transit',d:'Every lead record, call transcript, and SMS conversation is encrypted end-to-end. Your customer data never travels unprotected.'},
            {ico:'⚡',n:'99.9%',t:'Uptime SLA',d:'Your AI agents run on globally distributed edge infrastructure. Zero-downtime maintenance. Every lead answered, every second of every day.'},
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
              desc:'Your always-on text agent — instant missed-call text-back, booking calendar, and a dedicated business number.',
              setup:300, mo:127, feat:false,
              features:['Missed call text-back (60 sec)','Automated booking calendar','Dedicated business phone number','Client portal dashboard','Monthly lead report','300 SMS/mo included','$0.05/msg overage'],
              off:['AI voice assistant (Vapi)'],
            },
            {
              name:'GROWTH',
              tier:'growth',
              desc:'The full agent — AI voice, lead qualification, SMS campaigns, and portal analytics.',
              setup:400, mo:197, feat:true,
              features:['Everything in Starter','AI voice assistant (Vapi)','Lead qualification flow','SMS campaign automation','Portal analytics + GA4','Priority support','600 SMS/mo + 60 min included','$0.05/msg · $0.15/min overage'],
              off:[],
            },
            {
              name:'PRO',
              tier:'pro',
              desc:'A multi-agent command center — routing logic, pipeline view, and a dedicated account manager.',
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
        <p className={`${s.ssub} ${s.rev}`}>Real businesses. Real AI agents. Live and answering right now.</p>
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


      {/* BOOKING — included in every plan */}
      <section className={s.section} id="booking" aria-labelledby="booking-h">
        <div className={s.sl} aria-hidden="true">Included in every plan · Zero setup · Your link in 48 hours</div>
        <h2 className={`${s.sh} ${s.rev}`} id="booking-h">YOUR CLIENTS BOOK<br/><span style={{color:'var(--cyan)'}}>THEMSELVES.</span></h2>
        <p className={`${s.ssub} ${s.rev}`}>
          Every GoElev8.ai plan includes a fully branded booking calendar at <strong style={{color:'var(--wh)'}}>book.goelev8.ai/yourbusiness</strong> — no third-party tools, no monthly fees, no friction. Clients pick a time, you get the confirmation. That&apos;s it.
        </p>

        <div className={s.rev} style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
          gap:'18px',
          maxWidth: 1000,
          margin: '40px auto 36px',
        }}>
          {[
            { ico:'🔗', t:'Your Custom Link',                 d:'Your booking page lives at book.goelev8.ai/yourbusiness — branded, shareable, and ready in 48 hours. Put it in your bio, your texts, your emails. Clients land on it, pick a time, done.' },
            { ico:'📅', t:'Two Service Types, Ready to Go',  d:'Strategy calls and setup sessions are pre-configured out of the box. Add your own service types from your portal — no code, no plugins, no monthly Calendly bill.' },
            { ico:'⚡', t:'Synced to Your AI Agent',         d:'Every booking flows into your GoElev8.ai dashboard. When your agent answers a call or text, it drops your booking link right into the conversation — automatically.' },
          ].map(card => (
            <div key={card.t} style={{
              background:'#0a0a0a',
              border:'1px solid #1e1e1e',
              borderRadius:4,
              padding:'22px 20px',
            }}>
              <div style={{fontSize:26, marginBottom:12}}>{card.ico}</div>
              <div style={{fontFamily:'var(--fd)', fontSize:18, color:'var(--wh)', marginBottom:10, letterSpacing:1}}>{card.t}</div>
              <div style={{color:'#888', fontSize:13, lineHeight:1.65}}>{card.d}</div>
            </div>
          ))}
        </div>

        <div className={s.rev} style={{textAlign:'center', marginTop:32, marginBottom:32}}>
          <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer" className={s['btn-primary']}>
            Book a Call — See It Live →
          </a>
          <p style={{color:'#666', fontSize:12, marginTop:14, fontFamily:'var(--fm)', letterSpacing:'.5px'}}>
            Already a client? Access your booking calendar at portal.goelev8.ai/go
          </p>
        </div>

        <div className={s.rev} style={{
          width:'100%',
          maxWidth: 860,
          margin: '0 auto',
          background:'#080808',
          border:'1px solid #1e1e1e',
          borderRadius:12,
          boxShadow:'0 0 0 1px rgba(0,229,255,0.1), 0 8px 40px rgba(0,229,255,0.05)',
          overflow:'hidden',
        }}>
          <iframe
            src="https://book.goelev8.ai/go"
            title="GoElev8.ai booking calendar"
            loading="lazy"
            style={{width:'100%', height:680, border:'none', display:'block', background:'#080808'}}
          />
        </div>
        <p className={s.rev} style={{textAlign:'center', color:'#555', fontSize:11, marginTop:12, fontFamily:'var(--fm)'}}>
          Calendar not loading? → <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer" style={{color:'var(--cyan)', textDecoration:'none'}}>book.goelev8.ai/go</a>
        </p>
      </section>


      {/* FINAL CTA */}
      <div className={`${s['cta-section']} ${s.rev}`} role="complementary">
        <div className={s['cta-grid-bg']} aria-hidden="true" />
        <h2 className={s['cta-h']}>STOP LOSING LEADS<br/><span className={s.c}>WHILE YOU SLEEP.</span></h2>
        <p className={s['cta-p']}>Every unanswered lead is a booking your competitor takes. Put a custom AI agent on your front line — answering, qualifying, and booking in seconds. Live in 48 hours.</p>
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
