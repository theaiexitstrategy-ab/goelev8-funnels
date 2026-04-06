// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import s from '../styles/homepage.module.css';
import {
  NAV_LOGO,
  LEV_MASCOT,
  FLEX_FACILITY,
  ISLAY_STUDIOS,
  DANIELS_LEGACY,
  FOOTER_LOGO,
} from '../lib/homepage-images';

const TYPEWRITER_MESSAGES = [
  "Describe your business and we'll build your first AI site for you...",
  "I run a hair salon in Atlanta called Luxe Hair Studio. I specialize in braids, natural hair, and loc maintenance. Free consultation for new clients.",
  "I'm a personal trainer in Chicago helping adults over 40 lose weight and build real strength. I design programs so clients see results without getting hurt. Free 1-on-1 fitness assessment.",
  "We run a recording studio in St. Louis called iSlay Studios \u2014 full recording, mixing, and mastering. We work with artists at every level. Free 1-hour intro session.",
  "I'm a family law attorney in Dallas handling divorce, custody, and estate planning. I help clients protect what matters most. Free 30-minute consultation.",
  "We're an HVAC company serving Dallas-Fort Worth for residential and commercial customers. Same-day availability. Free system inspection and estimate.",
  "Our dental practice in Phoenix offers general and cosmetic dentistry. We specialize in smile makeovers, implants, and preventive care. Free exam and X-rays for new patients.",
];

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function HomePage() {
  // --- State ---
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'embed'>('build');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [activeColor, setActiveColor] = useState('#00CFFF');
  const [customColorOutline, setCustomColorOutline] = useState('');

  // --- Refs ---
  const promptTARef = useRef<HTMLTextAreaElement>(null);
  const mFirstRef = useRef<HTMLInputElement>(null);
  const mLastRef = useRef<HTMLInputElement>(null);
  const mEmailRef = useRef<HTMLInputElement>(null);
  const mPhoneRef = useRef<HTMLInputElement>(null);
  const customColorPickerRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const modalFormRef = useRef<HTMLDivElement>(null);
  const modalSuccessRef = useRef<HTMLDivElement>(null);
  const colorPreviewLabelRef = useRef<HTMLSpanElement>(null);
  const colorPreviewDotRef = useRef<HTMLDivElement>(null);
  const colorPreviewTextRef = useRef<HTMLDivElement>(null);
  const colorPreviewBarRef = useRef<HTMLDivElement>(null);
  const colorPreviewBtnRef = useRef<HTMLButtonElement>(null);

  // --- Typewriter effect (isolated useEffect) ---
  useEffect(() => {
    const taEl = promptTARef.current;
    if (!taEl) return;
    const ta = taEl as HTMLTextAreaElement;

    let msgIndex = 0;
    let charIndex = 0;
    let typeInterval: ReturnType<typeof setInterval> | null = null;
    let eraseInterval: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function startTyping() {
      if (cancelled) return;
      if (ta === document.activeElement) return;
      typeInterval = setInterval(() => {
        if (cancelled) { if (typeInterval) clearInterval(typeInterval); return; }
        if (ta === document.activeElement) { if (typeInterval) clearInterval(typeInterval); return; }
        const current = TYPEWRITER_MESSAGES[msgIndex];
        if (charIndex <= current.length) {
          ta.setAttribute('placeholder', current.slice(0, charIndex));
          charIndex++;
        } else {
          if (typeInterval) clearInterval(typeInterval);
          timeoutId = setTimeout(startErasing, 3000);
        }
      }, 28);
    }

    function startErasing() {
      if (cancelled) return;
      if (ta === document.activeElement) { scheduleNext(); return; }
      const current = TYPEWRITER_MESSAGES[msgIndex];
      charIndex = current.length;
      eraseInterval = setInterval(() => {
        if (cancelled) { if (eraseInterval) clearInterval(eraseInterval); return; }
        if (ta === document.activeElement) { if (eraseInterval) clearInterval(eraseInterval); return; }
        if (charIndex >= 0) {
          ta.setAttribute('placeholder', current.slice(0, charIndex));
          charIndex--;
        } else {
          if (eraseInterval) clearInterval(eraseInterval);
          scheduleNext();
        }
      }, 10);
    }

    function scheduleNext() {
      if (cancelled) return;
      msgIndex = (msgIndex + 1) % TYPEWRITER_MESSAGES.length;
      charIndex = 0;
      timeoutId = setTimeout(startTyping, 400);
    }

    timeoutId = setTimeout(startTyping, 800);

    return () => {
      cancelled = true;
      if (typeInterval) clearInterval(typeInterval);
      if (eraseInterval) clearInterval(eraseInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // --- Close upload dropdown on outside click ---
  useEffect(() => {
    function handleClick() {
      setUploadOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // --- Escape key closes modal ---
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLead();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // --- Functions ---
  function openLead() {
    const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('ge8_lead='));
    if (cookie) {
      window.location.href = '/auth/signup';
      return;
    }
    setLeadOpen(true);
    setLeadSubmitted(false);
    document.body.style.overflow = 'hidden';
  }

  function closeLead() {
    setLeadOpen(false);
    document.body.style.overflow = '';
  }

  function submitLead() {
    const first = mFirstRef.current?.value.trim() || '';
    const last = mLastRef.current?.value.trim() || '';
    const email = mEmailRef.current?.value.trim() || '';
    const phone = mPhoneRef.current?.value.trim() || '';

    if (!first || !email || !phone) {
      alert('Please fill in your name, email, and phone number.');
      return;
    }

    localStorage.setItem('ge8_lead', JSON.stringify({ first, last, email, phone }));

    const d = new Date();
    d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
    document.cookie = 'ge8_lead=1; expires=' + d.toUTCString() + '; path=/';

    setLeadSubmitted(true);

    setTimeout(() => {
      const params = new URLSearchParams({ email, name: first + ' ' + last, phone });
      window.location.href = '/auth/signup?' + params.toString();
    }, 3200);
  }

  function toggleMic() {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (promptTARef.current) {
        promptTARef.current.value += transcript;
      }
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function switchTab(tab: 'build' | 'embed') {
    setActiveTab(tab);
    if (tab === 'embed') {
      openLead();
    }
  }

  function toggleUpload(e: React.MouseEvent) {
    e.stopPropagation();
    setUploadOpen((prev) => !prev);
  }

  function handleUpload(type: 'logo' | 'images') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'logo' ? '.png,.svg' : 'image/*';
    input.multiple = type === 'images';
    input.click();
    setUploadOpen(false);
  }

  function applyColorPreview(hex: string) {
    if (colorPreviewLabelRef.current) colorPreviewLabelRef.current.textContent = hex.toUpperCase();
    if (colorPreviewDotRef.current) colorPreviewDotRef.current.style.background = hex;
    if (colorPreviewTextRef.current) colorPreviewTextRef.current.style.color = hex;
    if (colorPreviewBarRef.current) colorPreviewBarRef.current.style.borderColor = hex;
    if (colorPreviewBtnRef.current) {
      colorPreviewBtnRef.current.style.background = hex;
      colorPreviewBtnRef.current.style.color = isLight(hex) ? '#000' : '#fff';
    }
  }

  function selectColor(hex: string) {
    setActiveColor(hex);
    setCustomColorOutline('');
    applyColorPreview(hex);
  }

  function applyCustomColor(hex: string) {
    setActiveColor('custom');
    setCustomColorOutline('2px solid ' + hex);
    applyColorPreview(hex);
  }

  // --- Render ---
  return (
    <div className={s.page}>
      {/* NAV */}
      <nav className={s.nav}>
        <Link href="/" className={s.navBrand}>
          <img src={NAV_LOGO} alt="GoElev8.AI" className={s.navLogo} style={{ mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
          <span className={s.navName}>GOELEV8.AI</span>
        </Link>
        <div className={s.navLinks}>
          <Link href="/pricing">Pricing</Link>
          <Link href="/portal">Portal</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div className={s.navRight}>
          <Link href="/auth/signin" className={s.navSignin}>Sign In</Link>
          <button className={s.btnNav} onClick={openLead}>START BUILDING FREE &rarr;</button>
        </div>
      </nav>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.statusPill}>
          <span className={s.statusDot}></span>
          SYSTEM ONLINE &middot; 7-DAY FREE TRIAL &middot; ZERO HUMANS REQUIRED
        </div>

        <h1 className={s.heroH1}>
          <span className={s.h1Solid}>JUST TELL US WHAT YOU DO.</span>
          <span className={s.h1Ghost}>WE BUILD EVERYTHING.</span>
        </h1>

        <p className={s.heroSub}>
          Your lead capture page, SMS follow-up, and AI phone agent &mdash; live in 20 seconds. No code. No agency. No tech skills needed.
        </p>

        {/* PROMPT BOX */}
        <div className={s.promptWrapper}>
          <div className={s.promptTabs}>
            <button
              className={`${s.ptab} ${activeTab === 'build' ? s.ptabActive : ''}`}
              onClick={() => switchTab('build')}
            >
              &#9889; BUILD AI BUSINESS PAGE
            </button>
            <button
              className={`${s.ptab} ${activeTab === 'embed' ? s.ptabActive : ''}`}
              onClick={() => switchTab('embed')}
            >
              &#128279; ADD TO MY EXISTING SITE
            </button>
          </div>
          <div className={s.promptBox}>
            <div className={s.promptRow1}>
              <textarea
                ref={promptTARef}
                className={s.promptTextarea}
                rows={2}
                placeholder=""
              />
              <button
                className={`${s.btnMic} ${listening ? s.btnMicListening : ''}`}
                onClick={toggleMic}
                title="Speak your prompt"
              >
                <span className={s.micTooltip}>{listening ? 'Listening...' : 'Click to speak'}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
              <button className={s.btnSend} onClick={openLead} title="Build my system">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className={s.promptRow2}>
              <button className={s.btnPlus} onClick={toggleUpload}>+</button>
              <span className={s.plusLabel}>Add image or logo</span>
              <div className={`${s.uploadDropdown} ${uploadOpen ? s.uploadDropdownOpen : ''}`}>
                <div className={s.uploadOpt} onClick={() => handleUpload('logo')}>&#127991;&#65039; Upload Logo &mdash; PNG/SVG</div>
                <div className={s.uploadOpt} onClick={() => handleUpload('images')}>&#128444;&#65039; Upload Images &mdash; photos, team, products</div>
              </div>
            </div>
          </div>
        </div>

        {/* LEV MASCOT */}
        <div className={s.levWrap}>
          <div className={s.levMascot}>
            <img src={LEV_MASCOT} alt="Lev — GoElev8.AI Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 0 }} />
          </div>
        </div>

        {/* TRUSTED BY */}
        <div className={s.trusted}>
          <p className={s.trustedLabel}>Trusted by real businesses</p>
          <div className={s.trustedCards}>
            <div className={s.trustedCard}>
              <div className={s.liveRow}>
                <span className={s.liveDot}></span>
                <span className={s.liveText}>Live</span>
              </div>
              <a href="https://www.theflexfacility.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 110 }}>
                <img src={FLEX_FACILITY} alt="The Flex Facility" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'invert(1) brightness(0.88)' }} />
              </a>
              <p className={s.cardIndustry}>FITNESS &middot; EARTH CITY, MO</p>
            </div>
            <div className={s.trustedCard}>
              <div className={s.liveRow}>
                <span className={s.liveDot}></span>
                <span className={s.liveText}>Live</span>
              </div>
              <a href="https://www.islaystudiosllc.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 110 }}>
                <img src={ISLAY_STUDIOS} alt="iSlay Studios" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', background: 'transparent' }} />
              </a>
              <p className={s.cardIndustry}>HAIR STUDIO &middot; ST. LOUIS, MO</p>
            </div>
            <div className={s.trustedCard}>
              <div className={s.liveRow}>
                <span className={s.liveDot}></span>
                <span className={s.liveText}>Live</span>
              </div>
              <a href="https://www.danielslegacyplanning.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 110 }}>
                <img src={DANIELS_LEGACY} alt="Daniels Legacy Planning" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', background: 'transparent' }} />
              </a>
              <p className={s.cardIndustry}>LEGACY PLANNING &middot; ST. LOUIS, MO</p>
            </div>
          </div>
          <div className={s.industryPills}>
            <span className={s.pill}>&#127947;&#65039; Fitness</span>
            <span className={s.pill}>&#128135; Salons</span>
            <span className={s.pill}>&#127897;&#65039; Studios</span>
            <span className={s.pill}>&#9878;&#65039; Law &amp; Finance</span>
            <span className={s.pill}>&#127973; Health &amp; Dental</span>
            <span className={s.pill}>&#128295; Home Services</span>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className={s.painSection}>
        <div className={s.painGrid}>
          <div className={`${s.painCol} ${s.redSide}`}>
            <span className={s.sectionLabel} style={{ color: 'var(--red)' }}>The problem</span>
            <h2 className={s.painAccent}>You Call Back Tomorrow.</h2>
            <p className={s.painBody}>
              62% of your leads go to whoever responds first.<br />
              The average business takes 47 hours to follow up.
            </p>
            <p className={s.painStat}>Source: Harvard Business Review &amp; InsideSales.com</p>
          </div>
          <div className={`${s.painCol} ${s.cyanSide}`}>
            <span className={s.sectionLabel}>The system</span>
            <h2 className={s.painAccent}>The System Calls in 5 Min.</h2>
            <p className={s.painBody}>
              Lead opts in. AI calls within 5 minutes.<br />
              14-day SMS sequence runs automatically.<br />
              No one on your payroll. Nothing to manage.
            </p>
            <button className={s.btnNav} style={{ marginTop: 8, width: 'fit-content' }} onClick={openLead}>START FREE TRIAL &rarr;</button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={s.section} style={{ background: 'var(--bg)' }}>
        <div className={s.container}>
          <span className={s.sectionLabel}>How it works</span>
          <h2 className={s.sectionH2}>FOUR STEPS.<br />TWENTY SECONDS.</h2>
          <div className={s.stepsGrid}>
            <div className={s.step}>
              <div className={s.stepNum}>01</div>
              <div className={s.stepIcon}>&#9999;&#65039;</div>
              <div className={s.stepTitle}>DESCRIBE YOUR BUSINESS</div>
              <p className={s.stepBody}>Type what you do &mdash; your city, service, and free offer. That&apos;s it. No forms. No onboarding calls.</p>
            </div>
            <div className={s.step}>
              <div className={s.stepNum}>02</div>
              <div className={s.stepIcon}>&#9889;</div>
              <div className={s.stepTitle}>SYSTEM BUILDS YOUR FUNNEL</div>
              <p className={s.stepBody}>The GoElev8.AI Lead Acquisition System generates your page, SMS sequence, and AI phone agent instantly.</p>
            </div>
            <div className={s.step}>
              <div className={s.stepNum}>03</div>
              <div className={s.stepIcon}>&#128222;</div>
              <div className={s.stepTitle}>LEADS COME IN. AI CALLS.</div>
              <p className={s.stepBody}>A dedicated number goes live. When a lead opts in, your AI agent calls within 5 minutes &mdash; day or night.</p>
            </div>
            <div className={s.step}>
              <div className={s.stepNum}>04</div>
              <div className={s.stepIcon}>&#128176;</div>
              <div className={s.stepTitle}>YOU CLOSE. WE FOLLOW UP.</div>
              <p className={s.stepBody}>The 14-day SMS sequence nurtures every lead automatically. Your CRM tracks everything in real time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HEAR IT WORK */}
      <section className={s.demoSection}>
        <div className={s.container}>
          <span className={s.sectionLabel}>Hear it work</span>
          <h2 className={s.sectionH2}>CALL THE AI AGENT LIVE.</h2>
          <div className={s.demoGrid}>
            <div className={s.demoPhone}>
              <div className={s.phoneIcon}>&#128222;</div>
              <p className={s.phoneLabel}>Live Demo Line</p>
              <div className={s.phoneNumber}>888-302-0649</div>
              <p style={{ fontSize: 13, color: '#666', fontWeight: 300 }}>Call right now and hear the AI agent handle your inquiry like a trained sales rep &mdash; 24/7, zero wait time.</p>
              <a href="tel:8883020649" className={s.btnCall}>CALL NOW &rarr;</a>
            </div>
            <div className={s.demoFlow}>
              <div className={s.flowStep}>
                <div className={s.flowIcon}>&#128276;</div>
                <div>
                  <div className={s.flowTime}>T + 0:00</div>
                  <div className={s.flowTitle}>Lead Opts In</div>
                  <div className={s.flowDesc}>Visitor submits name, email, and phone on your funnel page.</div>
                </div>
              </div>
              <div className={s.flowStep}>
                <div className={s.flowIcon}>&#128222;</div>
                <div>
                  <div className={s.flowTime}>T + 4:47</div>
                  <div className={s.flowTitle}>AI Agent Calls</div>
                  <div className={s.flowDesc}>System dials the lead, introduces your business, qualifies interest, and books the appointment.</div>
                </div>
              </div>
              <div className={s.flowStep}>
                <div className={s.flowIcon}>&#128172;</div>
                <div>
                  <div className={s.flowTime}>T + 5:30</div>
                  <div className={s.flowTitle}>SMS Sequence Starts</div>
                  <div className={s.flowDesc}>14-day automated follow-up begins &mdash; reminders, value texts, re-engagement nudges.</div>
                </div>
              </div>
              <div className={s.flowStep}>
                <div className={s.flowIcon}>&#128197;</div>
                <div>
                  <div className={s.flowTime}>T + 6:12</div>
                  <div className={s.flowTitle}>Booking Confirmed</div>
                  <div className={s.flowDesc}>Appointment lands on your calendar. Confirmation SMS sent. You show up and close.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT STORE */}
      <section className={s.section} style={{ background: 'var(--bg)' }}>
        <div className={s.container}>
          <div className={s.storeHeader}>
            <span className={s.sectionLabel}>Product store</span>
            <h2 className={s.sectionH2}>YOUR PRODUCTS.<br />YOUR SYSTEM SELLS THEM.</h2>
            <p className={s.storeSub}>Sell eBooks, services, physical products, or custom packages directly from your funnel &mdash; no third-party store required.</p>
          </div>
          <div className={s.storeGrid}>
            <div className={s.storeCard}>
              <div className={s.storeCardTop}>
                <span className={s.storeType}>eBook</span>
                <span className={`${s.storeStatus} ${s.storeStatusLive}`}>&#9679; LIVE</span>
              </div>
              <div className={s.storeEmoji}>&#128214;</div>
              <div className={s.storeName}>THE ROAD TO THE STAGE</div>
              <div className={s.storePrice}>$27</div>
              <p style={{ fontSize: 12, color: '#555', fontWeight: 300 }}>Instant digital delivery via automated SMS after purchase.</p>
            </div>
            <div className={s.storeCard}>
              <div className={s.storeCardTop}>
                <span className={s.storeType}>Service</span>
                <span className={`${s.storeStatus} ${s.storeStatusLive}`}>&#9679; LIVE</span>
              </div>
              <div className={s.storeEmoji}>&#127942;</div>
              <div className={s.storeName}>ATHLETE RECRUITING PAGE</div>
              <div className={s.storePrice}>$197</div>
              <p style={{ fontSize: 12, color: '#555', fontWeight: 300 }}>Custom recruiting page built within 48 hours of purchase.</p>
            </div>
            <div className={s.storeCard}>
              <div className={s.storeCardTop}>
                <span className={s.storeType}>Physical</span>
                <span className={`${s.storeStatus} ${s.storeStatusConnecting}`}>&#9679; CONNECTING</span>
              </div>
              <div className={s.storeEmoji}>&#128134;</div>
              <div className={s.storeName}>HAIR PRODUCT COLLECTION</div>
              <div className={s.storePrice}>&mdash;</div>
              <p style={{ fontSize: 12, color: '#555', fontWeight: 300 }}>Shopify sync in progress. Live soon.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES */}
      <section className={s.templatesSection}>
        <div className={s.container}>
          <span className={s.sectionLabel}>Templates &amp; Customization</span>
          <h2 className={s.sectionH2}>20+ INDUSTRY TEMPLATES.<br />YOUR COLORS. YOUR BRAND.</h2>
          <div className={s.templatesGrid}>
            {[
              { emoji: '\u{1F3CB}\uFE0F', name: 'Fitness & Gyms' },
              { emoji: '\u{1F487}', name: 'Salons & Beauty' },
              { emoji: '\u{1F399}\uFE0F', name: 'Recording Studios' },
              { emoji: '\u2696\uFE0F', name: 'Law Firms' },
              { emoji: '\u{1F3E5}', name: 'Health & Dental' },
              { emoji: '\u{1F527}', name: 'HVAC & Home' },
              { emoji: '\u{1F3E0}', name: 'Real Estate' },
              { emoji: '\u{1F37D}\uFE0F', name: 'Restaurants' },
              { emoji: '\u{1F48A}', name: 'MedSpas' },
              { emoji: '\u{1F9B7}', name: 'Dental Practices' },
              { emoji: '\u{1F3D7}\uFE0F', name: 'Roofing & Construction' },
              { emoji: '\u{1F4DA}', name: 'Tutoring & Coaching' },
            ].map((t) => (
              <div key={t.name} className={s.tmplCard} onClick={openLead}>
                <div className={s.tmplEmoji}>{t.emoji}</div>
                <div className={s.tmplName}>{t.name}</div>
              </div>
            ))}
          </div>
          <div className={s.colorPickerRow}>
            <span className={s.colorPickerLabel}>Brand color:</span>
            {[
              { id: 'cyan', hex: '#00CFFF' },
              { id: 'green', hex: '#00E87A' },
              { id: 'red', hex: '#FF3B3B' },
              { id: 'purple', hex: '#A855F7' },
              { id: 'gold', hex: '#F59E0B' },
              { id: 'pink', hex: '#EC4899' },
              { id: 'white', hex: '#F5F5F5' },
            ].map((c) => (
              <div
                key={c.id}
                className={`${s.colorSwatch} ${activeColor === c.hex ? s.colorSwatchActive : ''}`}
                style={{ background: c.hex }}
                title={c.id.charAt(0).toUpperCase() + c.id.slice(1)}
                onClick={() => selectColor(c.hex)}
              />
            ))}
            <div
              className={`${s.colorSwatch} ${s.colorSwatchCustom} ${activeColor === 'custom' ? s.colorSwatchActive : ''}`}
              title="Custom color"
              style={customColorOutline ? { outline: customColorOutline } : undefined}
              onClick={() => customColorPickerRef.current?.click()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
              <input
                ref={customColorPickerRef}
                type="color"
                defaultValue="#00CFFF"
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                onChange={(e) => applyCustomColor(e.target.value)}
              />
            </div>
            <span ref={colorPreviewLabelRef} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: '#555', marginLeft: 4, letterSpacing: '0.06em' }}>#00CFFF</span>
          </div>
          <div ref={colorPreviewBarRef} style={{ marginTop: 16, padding: '16px 20px', borderRadius: 4, border: '2px solid #00CFFF', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 420, transition: 'border-color 0.3s' }}>
            <div ref={colorPreviewDotRef} style={{ width: 36, height: 36, borderRadius: 4, background: '#00CFFF', flexShrink: 0, transition: 'background 0.3s' }}></div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>YOUR FUNNEL WILL USE</div>
              <div ref={colorPreviewTextRef} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, transition: 'color 0.3s', color: '#00CFFF' }}>THIS COLOR &rarr;</div>
            </div>
            <button ref={colorPreviewBtnRef} onClick={openLead} style={{ marginLeft: 'auto', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: 2, background: '#00CFFF', color: '#000', transition: 'background 0.3s', whiteSpace: 'nowrap' }}>BUILD WITH THIS COLOR &rarr;</button>
          </div>
        </div>
      </section>

      {/* CHAT WIDGET */}
      <section className={s.chatSection}>
        <div className={s.container} style={{ textAlign: 'center' }}>
          <span className={s.sectionLabel}>AI Chat Widget</span>
          <h2 className={s.sectionH2}>YOUR SITE NEVER SLEEPS.</h2>
          <p style={{ fontSize: 15, color: '#666', maxWidth: 480, margin: '12px auto 0', fontWeight: 300 }}>The AI chat widget answers questions, qualifies leads, and captures contact info &mdash; even at 2am on a Sunday.</p>
          <div className={s.chatDemo}>
            <div className={s.chatHeader}>
              <div className={s.chatAvatar}>&#129302;</div>
              <div>
                <div className={s.chatHname}>LEV &mdash; AI ASSISTANT</div>
                <div className={s.chatHstatus}>&#9679; Online now</div>
              </div>
            </div>
            <div className={s.chatMessages}>
              <div className={`${s.chatMsg} ${s.chatMsgAgent}`}>Hey! I&apos;m Lev, your AI assistant. What brings you in today?</div>
              <div className={`${s.chatMsg} ${s.chatMsgUser}`}>Do you have any openings this week?</div>
              <div className={`${s.chatMsg} ${s.chatMsgAgent}`}>Absolutely! I can get you scheduled. What&apos;s the best day for you &mdash; and can I grab your name and number?</div>
              <div className={`${s.chatMsg} ${s.chatMsgUser}`}>I&apos;m Marcus, 314-555-0182. Wednesday works.</div>
              <div className={`${s.chatMsg} ${s.chatMsgAgent}`}>Perfect, Marcus! You&apos;re booked for Wednesday. You&apos;ll get a confirmation text in a few seconds. &#127881;</div>
            </div>
            <div className={s.chatInputRow}>
              <input className={s.chatInput} type="text" placeholder="Ask anything..." disabled />
              <button className={s.chatSend}>&rarr;</button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className={s.trustSection}>
        <div className={s.container}>
          <span className={s.sectionLabel}>Built to perform</span>
          <h2 className={s.sectionH2}>RELIABILITY YOU CAN<br />SEND LEADS TO.</h2>
          <div className={s.trustGrid}>
            <div className={s.trustItem}>
              <div className={s.trustIcon}>&#9889;</div>
              <div className={s.trustStat}>99.9%</div>
              <div className={s.trustLabel}>Platform uptime SLA &mdash; your funnel never goes down when it matters most.</div>
            </div>
            <div className={s.trustItem}>
              <div className={s.trustIcon}>&#9989;</div>
              <div className={s.trustStat}>A2P</div>
              <div className={s.trustLabel}>10DLC compliance handled automatically &mdash; your SMS lands in inbox, not spam.</div>
            </div>
            <div className={s.trustItem}>
              <div className={s.trustIcon}>&#128274;</div>
              <div className={s.trustStat}>SOC2</div>
              <div className={s.trustLabel}>Enterprise-grade security. Encrypted data. GDPR-aligned storage. Your leads are safe.</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className={s.pricingSection}>
        <div className={s.pricingHeader}>
          <span className={s.sectionLabel}>Pricing</span>
          <h2 className={s.sectionH2}>LESS THAN ONE MISSED CLIENT.</h2>
          <p className={s.pricingSub}>Start free for 7 days. Not charged until Day 8.</p>
        </div>
        <div className={s.pricingGrid}>
          <div className={s.priceCard}>
            <div className={s.priceTier}>LAUNCH</div>
            <div className={s.priceAmount}>
              <span className={s.priceDollar}>$99</span>
              <span className={s.pricePeriod}>/mo</span>
            </div>
            <div className={s.priceFeatures}>
              <div className={`${s.pf} ${s.pfYes}`}>1 funnel page</div>
              <div className={`${s.pf} ${s.pfYes}`}>250 leads/mo</div>
              <div className={`${s.pf} ${s.pfYes}`}>AI chat widget</div>
              <div className={`${s.pf} ${s.pfYes}`}>5-step SMS sequence</div>
              <div className={`${s.pf} ${s.pfYes}`}>Booking calendar</div>
              <div className={`${s.pf} ${s.pfYes}`}>Product store</div>
              <div className={`${s.pf} ${s.pfNo}`}>AI phone agent</div>
              <div className={`${s.pf} ${s.pfNo}`}>CRM portal</div>
            </div>
            <button className={`${s.btnPrice} ${s.btnPriceOutline}`} onClick={openLead}>START FREE TRIAL &rarr;</button>
          </div>

          <div className={`${s.priceCard} ${s.priceCardPopular}`}>
            <div className={s.popularBadge}>MOST POPULAR</div>
            <div className={s.priceTier}>GROW</div>
            <div className={s.priceAmount}>
              <span className={s.priceDollar}>$199</span>
              <span className={s.pricePeriod}>/mo</span>
            </div>
            <div className={s.priceFeatures}>
              <div className={`${s.pf} ${s.pfYes}`}>3 funnel pages</div>
              <div className={`${s.pf} ${s.pfYes}`}>1,000 leads/mo</div>
              <div className={`${s.pf} ${s.pfYes}`}>AI phone agent</div>
              <div className={`${s.pf} ${s.pfYes}`}>SMS blast campaigns</div>
              <div className={`${s.pf} ${s.pfYes}`}>Realtime CRM portal</div>
              <div className={`${s.pf} ${s.pfYes}`}>Custom domain add-on</div>
              <div className={`${s.pf} ${s.pfYes}`}>Everything in Launch</div>
            </div>
            <button className={`${s.btnPrice} ${s.btnPricePrimary}`} onClick={openLead}>START FREE TRIAL &rarr;</button>
          </div>

          <div className={s.priceCard}>
            <div className={s.priceTier}>SCALE</div>
            <div className={s.priceAmount}>
              <span className={s.priceDollar}>$397</span>
              <span className={s.pricePeriod}>/mo</span>
            </div>
            <div className={s.priceFeatures}>
              <div className={`${s.pf} ${s.pfYes}`}>Unlimited funnels</div>
              <div className={`${s.pf} ${s.pfYes}`}>Unlimited leads</div>
              <div className={`${s.pf} ${s.pfYes}`}>White-label option</div>
              <div className={`${s.pf} ${s.pfYes}`}>1 domain included</div>
              <div className={`${s.pf} ${s.pfYes}`}>Multi-client mgmt</div>
              <div className={`${s.pf} ${s.pfYes}`}>8% store cut (vs 10%)</div>
              <div className={`${s.pf} ${s.pfYes}`}>Everything in Grow</div>
            </div>
            <button className={`${s.btnPrice} ${s.btnPriceOutline}`} onClick={openLead}>START FREE TRIAL &rarr;</button>
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: 28, fontFamily: "var(--font-mono)", fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Link href="/pricing" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>View full pricing &amp; feature comparison &rarr;</Link>
        </p>
      </section>

      {/* FINAL CTA */}
      <section className={s.finalCta}>
        <span className={s.sectionLabel}>Ready?</span>
        <h2 className={s.finalH2}>STOP LEAKING<br />HIGH-TICKET REVENUE.</h2>
        <p className={s.finalSub}>Every lead that goes unanswered for more than an hour is a lost client. The GoElev8.AI Lead Acquisition System calls before your competition even reads the notification.</p>
        <button className={s.btnFinal} onClick={openLead}>BUILD MY SYSTEM FREE &rarr;</button>
        <p style={{ marginTop: 20, fontFamily: "var(--font-mono)", fontSize: 10, color: '#444', letterSpacing: '0.06em' }}>7-DAY FREE TRIAL &middot; NO CARD UNTIL DAY 8 &middot; CANCEL ANYTIME</p>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerBrand}>
          <img src={FOOTER_LOGO} alt="GoElev8.AI" className={s.footerLogo} style={{ mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
          <span className={s.footerName}>GOELEV8.AI</span>
        </div>
        <div className={s.footerLinks}>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/sms-policy">SMS Policy</Link>
        </div>
        <span className={s.footerCopy}>&copy; 2025 GoElev8.AI &mdash; All rights reserved</span>
      </footer>

      {/* LEAD MODAL */}
      <div
        className={`${s.modalOverlay} ${leadOpen ? s.modalOverlayOpen : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeLead(); }}
      >
        <div className={s.modal}>
          <button className={s.modalClose} onClick={closeLead}>&#10005;</button>

          {!leadSubmitted ? (
            <div ref={modalFormRef}>
              <div className={s.modalTag}>Start Free Trial</div>
              <h2 className={s.modalH}>7 DAYS FREE.<br />THEN $99/MO.</h2>
              <p className={s.modalSub}>No charge until Day 8. Cancel any time. Start building your lead system in 20 seconds.</p>
              <div className={s.modalForm}>
                <div className={s.formRow}>
                  <div className={s.formField}>
                    <label className={s.formLabel}>First Name</label>
                    <input ref={mFirstRef} className={s.formInput} type="text" placeholder="Marcus" />
                  </div>
                  <div className={s.formField}>
                    <label className={s.formLabel}>Last Name</label>
                    <input ref={mLastRef} className={s.formInput} type="text" placeholder="Johnson" />
                  </div>
                </div>
                <div className={s.formField}>
                  <label className={s.formLabel}>Email</label>
                  <input ref={mEmailRef} className={s.formInput} type="email" placeholder="marcus@mybusiness.com" />
                </div>
                <div className={s.formField}>
                  <label className={s.formLabel}>Phone</label>
                  <input ref={mPhoneRef} className={s.formInput} type="tel" placeholder="(314) 555-0182" />
                </div>
                <button className={s.btnModal} onClick={submitLead}>START BUILDING FREE &rarr;</button>
                <p className={s.modalFine}>By submitting you agree to receive SMS from GoElev8.ai. Reply STOP to opt out. Msg &amp; data rates may apply.</p>
              </div>
            </div>
          ) : (
            <div className={s.modalSuccess} style={{ display: 'flex' }}>
              <div className={s.successIcon}>&#10003;</div>
              <div className={s.successH}>YOU&apos;RE IN.</div>
              <p className={s.successSub}>Redirecting you to your dashboard now...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
