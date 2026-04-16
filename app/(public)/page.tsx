'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import s from './page.module.css';

const DEMO_PHONE = process.env.NEXT_PUBLIC_DEMO_PHONE_NUMBER || '(888) 302-0649';

/* SMS thread script (plays in modal) */
type SmsMessage = {
  kind: 'notif' | 'them' | 'me';
  text: string;
  time: string;
};

const SMS_SCRIPT: SmsMessage[] = [
  { kind: 'notif', text: 'Missed call from +1 (314) 555-0192', time: '9:47 PM' },
  { kind: 'them', text: "Hey! Sorry we missed your call. We'd love to help — what can we assist you with today? Reply here and we'll get right back to you.", time: '9:48 PM' },
  { kind: 'me', text: 'Hi yes I was calling about getting a membership', time: '9:49 PM' },
  { kind: 'them', text: 'Great timing! Are mornings or evenings better for you to come in?', time: '9:49 PM' },
  { kind: 'me', text: 'Evenings work better', time: '9:50 PM' },
  { kind: 'them', text: 'Perfect — I have Tuesday at 6pm available. Want me to lock that in for you?', time: '9:50 PM' },
  { kind: 'me', text: 'Yes please!', time: '9:51 PM' },
  { kind: 'them', text: "Done! You're booked for Tuesday at 6pm. See you then! 🎉", time: '9:51 PM' },
];


/* ══════════ COMPONENT ══════════ */
export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [visibleMsgs, setVisibleMsgs] = useState(0);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(s.vis); });
    }, { threshold: 0.12 });
    document.querySelectorAll(`.${s.rev}`).forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── Smooth scroll helper ── */
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* ── Modal open/close ── */
  const openDemoModal = useCallback(() => {
    setVisibleMsgs(0);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeDemoModal = useCallback(() => {
    setModalOpen(false);
    document.body.style.overflow = '';
  }, []);

  /* ── Animate messages when modal opens ── */
  useEffect(() => {
    if (!modalOpen) return;
    const timers: number[] = [];
    SMS_SCRIPT.forEach((_, i) => {
      const t = window.setTimeout(() => setVisibleMsgs(i + 1), 400 + i * 900);
      timers.push(t);
    });
    return () => { timers.forEach(t => clearTimeout(t)); };
  }, [modalOpen]);

  /* ── ESC to close ── */
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDemoModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen, closeDemoModal]);


  /* ══════════ JSX ══════════ */
  return (
    <div className={s.page}>
      <div className={s.scanlines} />
      <div className={s.noise} />

      {/* ── NAV ── */}
      <nav className={s.nav} role="navigation" aria-label="Main navigation">
        <Link href="/" className={s['nav-logo']} aria-label="GoElev8.ai Home">
          <Image src="/images/lockup.png" alt="GoElev8.ai" width={120} height={30} style={{height:30,width:'auto'}} />
        </Link>
        <ul className={s['nav-links']} role="list">
          <li><a href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how'); }}>How It Works</a></li>
          <li><a href="#who" onClick={(e) => { e.preventDefault(); scrollTo('who'); }}>Who It&apos;s For</a></li>
          <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }}>Pricing</a></li>
          <li><a href="#results" onClick={(e) => { e.preventDefault(); scrollTo('results'); }}>Results</a></li>
        </ul>
        <div className={s['nav-actions']}>
          <button className={s['nav-demo']} onClick={openDemoModal}>See Demo</button>
          <a href="https://book.goelev8.ai" target="_blank" rel="noopener noreferrer" className={s['nav-login']}>Book a Call</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={s.hero} aria-label="Hero">
        <div className={s['hero-bg']} aria-hidden="true" />
        <div className={s['hero-grid']} aria-hidden="true" />
        <div className={s['hero-scan']} aria-hidden="true" />

        <div className={s['hero-content']}>
          <div className={s['hero-eyebrow']}>AI LEAD FOLLOW-UP FOR LOCAL BUSINESSES</div>

          <h1 className={s['hero-h']}>
            Your Business Follows Up<br/>
            With <span className={s.c}>Every Lead.</span><br/>
            <span className={s.s}>Automatically.</span>
          </h1>

          <p className={s['hero-sub']}>
            Missed call? They get a text back in <strong>60 seconds.</strong> Every time. No staff. No voicemail. <strong>No lost revenue.</strong>
          </p>

          <div className={s['hero-ctas']}>
            <button className={s['btn-primary']} onClick={openDemoModal}>See It Work Live →</button>
            <a href="https://book.goelev8.ai" target="_blank" rel="noopener noreferrer" className={s['btn-outline']}>Book a Setup Call</a>
          </div>

          <div className={s['trust-bar']}>
            <span>🔒 256-bit Encrypted</span>
            <span className={s['trust-sep']}>·</span>
            <span>📱 Twilio + Vapi Powered</span>
            <span className={s['trust-sep']}>·</span>
            <span>📊 GA4 Analytics Included</span>
            <span className={s['trust-sep']}>·</span>
            <span>🇺🇸 Built in St. Louis, MO</span>
          </div>
        </div>

        {/* LEV CHARACTER */}
        <div className={s['hero-lev']}>
          <div className={s['lev-container']}>
            <Image src="/images/lev.png" alt="Lev AI" width={340} height={500} className={s['lev-img']} priority />
            <div className={s['lev-halo']} />
            <div className={s['lev-badge']}>
              <span className={s['lev-badge-dot']} />AI SYSTEM · ONLINE
            </div>
          </div>
        </div>
      </section>

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

      {/* ── HOW IT WORKS ── */}
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


      {/* ── WHO IT'S FOR ── */}
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


      {/* ── TRUST & RELIABILITY ── */}
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


      {/* ── PRICING ── */}
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
              desc:'Missed call text-back, booking calendar, and a dedicated business number.',
              setup:300,
              mo:127,
              feat:false,
              features:[
                'Missed call text-back (60 sec)',
                'Automated booking calendar',
                'Dedicated business phone number',
                'Client portal dashboard',
                'Monthly lead report',
                '300 SMS/mo included',
                '$0.05/msg overage',
              ],
              off:['AI voice assistant (Vapi)'],
            },
            {
              name:'GROWTH',
              desc:'The full GoElev8.AI system. AI voice, SMS campaigns, and portal analytics.',
              setup:400,
              mo:197,
              feat:true,
              features:[
                'Everything in Starter',
                'AI voice assistant (Vapi)',
                'Lead qualification flow',
                'SMS campaign automation',
                'Portal analytics + GA4',
                'Priority support',
                '600 SMS/mo + 60 min included',
                '$0.05/msg · $0.15/min overage',
              ],
              off:[],
            },
            {
              name:'PRO',
              desc:'Multi-agent dashboard, routing logic, and dedicated account manager.',
              setup:600,
              mo:297,
              feat:false,
              features:[
                'Everything in Growth',
                'Multi-agent team dashboard',
                'Agent routing logic',
                'Broker pipeline view',
                'Custom SMS campaigns',
                'Dedicated account manager',
                '1,200 SMS/mo + 120 min included',
                '$0.05/msg · $0.15/min overage',
              ],
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
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
                {plan.off.map((f, i) => (
                  <li key={`off-${i}`} className={s.off}>{f}</li>
                ))}
              </ul>
              <a href="https://book.goelev8.ai" target="_blank" rel="noopener noreferrer" className={s.tcta}>BOOK A SETUP CALL →</a>
            </div>
          ))}
        </div>

        <div className={`${s['pricing-note']} ${s.rev}`}>
          Setup fee covers full configuration, testing, and go-live in 48 hours. Cancel anytime with 30 days written notice. Setup fee is non-refundable.
        </div>
      </section>


      {/* ── LIVE CLIENTS (RESULTS) ── */}
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
          <a href="https://book.goelev8.ai" target="_blank" rel="noopener noreferrer" className={s['btn-primary']}>Apply for Early Access →</a>
        </div>
      </section>


      {/* ── FINAL CTA ── */}
      <div className={`${s['cta-section']} ${s.rev}`} role="complementary">
        <div className={s['cta-grid-bg']} aria-hidden="true" />
        <h2 className={s['cta-h']}>STOP LOSING LEADS<br/><span className={s.c}>WHILE YOU SLEEP.</span></h2>
        <p className={s['cta-p']}>Every missed call is a missed appointment. GoElev8.ai texts them back in 60 seconds — automatically. Setup takes 48 hours.</p>
        <div className={s['cta-btns']}>
          <a href="https://book.goelev8.ai" target="_blank" rel="noopener noreferrer" className={s['btn-primary']}>Book a Setup Call →</a>
          <button className={s['btn-outline']} onClick={openDemoModal}>See It Work Live →</button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className={s.footer} role="contentinfo">
        <Link href="/" className={s['footer-logo']} aria-label="GoElev8.ai home">
          <Image src="/images/lockup.png" alt="GoElev8.ai" width={100} height={24} style={{height:24,width:'auto',opacity:.7}} />
        </Link>
        <div className={s.fc}>// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.</div>
        <nav className={s.flinks} aria-label="Footer navigation">
          <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }}>Pricing</a>
          <a href="https://book.goelev8.ai" target="_blank" rel="noopener noreferrer">Book a Call</a>
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/sms-policy">SMS Policy</a>
        </nav>
      </footer>


      {/* ══════════ DEMO MODAL ══════════ */}
      {modalOpen && (
        <div className={s['demo-overlay']} onClick={(e) => { if (e.target === e.currentTarget) closeDemoModal(); }} role="dialog" aria-modal="true" aria-label="Live demo">
          <div className={s['demo-modal']}>
            <button className={s['demo-close']} onClick={closeDemoModal} aria-label="Close demo">✕</button>

            <div className={s['demo-hd']}>
              <div className={s['demo-label']}>LIVE DEMO</div>
              <h3 className={s['demo-h']}>Watch a Lead Get Captured<br/><span style={{color:'var(--cyan)'}}>In Real Time.</span></h3>
            </div>

            <div className={s['demo-phone-wrap']}>
              <div className={s['phone-mockup']}>
                <div className={s['phone-notch']} />
                <div className={s['phone-screen']}>
                  {SMS_SCRIPT.map((msg, i) => {
                    if (i >= visibleMsgs) return null;
                    if (msg.kind === 'notif') {
                      return (
                        <div key={i} className={s['phone-notif']}>
                          <div className={s['phone-notif-icon']}>📵</div>
                          <div style={{flex:1}}>
                            <div className={s['phone-notif-title']}>{msg.text}</div>
                            <div className={s['phone-notif-sub']}>{msg.time}</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={s['sms-row']}>
                        <div className={`${s['sms-bubble']} ${msg.kind === 'me' ? s['sms-me'] : s['sms-them']}`}>
                          {msg.text}
                        </div>
                        <div className={s['sms-timestamp']}>{msg.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {visibleMsgs >= SMS_SCRIPT.length && (
              <div className={s['demo-after']}>
                <p className={s['demo-bold']}>⚡ That entire conversation happened automatically while the owner slept.</p>

                <div className={s['demo-divider']} />

                <div className={s['demo-call-block']}>
                  <div className={s['demo-call-label']}>CALL THIS NUMBER</div>
                  <a href={`tel:${DEMO_PHONE.replace(/\D/g,'')}`} className={s['demo-number']}>{DEMO_PHONE}</a>
                  <p className={s['demo-call-sub']}>Call this number from your cell. Hang up. Watch what happens.</p>
                  <p className={s['demo-call-fine']}>You&apos;ll get a real auto-text back within 60 seconds.</p>
                </div>

                <div className={s['demo-divider']} />

                <div className={s['demo-final']}>
                  <p className={s['demo-final-q']}>Ready to put this to work for your business?</p>
                  <div className={s['demo-final-ctas']}>
                    <a href="https://book.goelev8.ai" target="_blank" rel="noopener noreferrer" className={s['btn-primary']} onClick={closeDemoModal}>Book a Setup Call →</a>
                    <button className={s['btn-outline']} onClick={() => { closeDemoModal(); setTimeout(() => scrollTo('pricing'), 200); }}>See Pricing</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
