'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import s from './page.module.css';

/* ── Cookie / localStorage helpers ── */
const LEAD_COOKIE = 'ge8_lead';
const LEAD_STORE = 'ge8_lead_data';
const SIGNUP_URL = '/auth/signup';

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  return document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='))?.split('=')[1] || null;
}
function setCookie(name: string, value: string, days: number) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value};expires=${exp};path=/;SameSite=Strict`;
}
function hasLeadCookie() { return !!getCookie(LEAD_COOKIE); }
function saveLeadToStorage(data: Record<string, string | number>) {
  try { localStorage.setItem(LEAD_STORE, JSON.stringify(data)); } catch {}
  setCookie(LEAD_COOKIE, '1', 30);
}
function getStoredLead(): Record<string, string> | null {
  try { return JSON.parse(localStorage.getItem(LEAD_STORE) || 'null'); } catch { return null; }
}

/* ── Wizard steps ── */
type WizStep = {
  id: string; question: string; hint: string;
  type: 'options' | 'text' | 'textarea';
  placeholder?: string;
  options?: { icon: string; label: string; sub: string; value: string }[];
};

const WIZARD_STEPS: WizStep[] = [
  { id:'industry', question:'What type of business do you run?', hint:"Pick the category that best fits — we'll tailor your AI system to your industry.", type:'options',
    options:[
      {icon:'🏋️',label:'Fitness / Training',sub:'Gyms, personal trainers, sports performance',value:'fitness'},
      {icon:'💇',label:'Salon / Beauty',sub:'Hair, nails, aesthetics, MedSpa',value:'salon'},
      {icon:'🎙️',label:'Studio / Creative',sub:'Recording, photography, dance, music',value:'studio'},
      {icon:'⚖️',label:'Professional Services',sub:'Law, finance, consulting, real estate',value:'professional'},
      {icon:'🏥',label:'Health / Medical',sub:'Dental, chiro, therapy, wellness',value:'health'},
      {icon:'🔧',label:'Home Services',sub:'HVAC, roofing, plumbing, cleaning',value:'home'},
    ]},
  { id:'business_name', question:"What's your business name?", hint:'This becomes your funnel page headline and the name your AI agent uses.', type:'text', placeholder:'e.g. The Flex Facility' },
  { id:'offer', question:"What's your best free offer?", hint:'The lead magnet that gets people to opt in.', type:'options',
    options:[
      {icon:'📋',label:'Free Consultation',sub:'15-30 minute call or in-person session',value:'Free Consultation'},
      {icon:'🎯',label:'Free Assessment',sub:'Evaluation, audit, or analysis',value:'Free Assessment'},
      {icon:'🎁',label:'Free Trial Session',sub:'First class, session, or service free',value:'Free Trial Session'},
      {icon:'📞',label:'Free Strategy Call',sub:'30-minute discovery or strategy session',value:'Free Strategy Call'},
      {icon:'📄',label:'Free Quote / Estimate',sub:'Price estimate for their specific situation',value:'Free Quote'},
    ]},
  { id:'location', question:'Where are you located?', hint:'City and state helps the AI agent and your page rank locally.', type:'text', placeholder:'e.g. St. Louis, MO' },
  { id:'specialty', question:'What makes you different?', hint:'One sentence about your specialty, unique method, or who you serve best.', type:'textarea', placeholder:'e.g. I specialize in strength training for athletes and adults over 40...' },
];

function buildPromptFromWizData(data: Record<string, string>) {
  const parts: string[] = [];
  if (data.business_name) parts.push(`My business is called ${data.business_name}.`);
  if (data.industry) {
    const labels: Record<string, string> = { fitness:'fitness and athletic training', salon:'salon and beauty services', studio:'recording studio and creative services', professional:'professional services', health:'health and medical services', home:'home services' };
    parts.push(`We are in the ${labels[data.industry] || data.industry} industry.`);
  }
  if (data.location) parts.push(`We are located in ${data.location}.`);
  if (data.specialty) parts.push(data.specialty);
  if (data.offer) parts.push(`Our primary free offer for new leads is a ${data.offer}.`);
  return parts.join(' ') || 'Building a lead capture system for my service business.';
}


/* ══════════ COMPONENT ══════════ */
export default function HomePage() {
  /* ── Chat state ── */
  const [chatMessages, setChatMessages] = useState<{role:string;content:string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [showChatOutput, setShowChatOutput] = useState(false);
  const [showChatBlocks, setShowChatBlocks] = useState(false);
  const [showChatActs, setShowChatActs] = useState(false);
  const [chatHl, setChatHl] = useState('—');
  const [chatOf, setChatOf] = useState('—');
  const [chatS0, setChatS0] = useState('—');
  const [chatAg, setChatAg] = useState('—');
  const [buildResult, setBuildResult] = useState<{slug:string;funnel_id:string;url:string;full_url:string;expires_at:string;preview:Record<string,string>}|null>(null);
  const [buildError, setBuildError] = useState('');

  /* ── Pricing ── */
  const [annualBilling, setAnnualBilling] = useState(false);
  const [selectedSms, setSelectedSms] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('grow');

  /* ── Modal (start free trial) ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [modalDesc, setModalDesc] = useState('');
  const [modalBiz, setModalBiz] = useState('');
  const [modalInd, setModalInd] = useState('');
  const [modalSlug, setModalSlug] = useState('');
  const [modalFn, setModalFn] = useState('');
  const [modalLn, setModalLn] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  /* ── Lead capture ── */
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadFirst, setLeadFirst] = useState('');
  const [leadLast, setLeadLast] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);

  /* ── Wizard ── */
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizStep, setWizStep] = useState(0);
  const [wizData, setWizData] = useState<Record<string, string>>({});

  /* ── Site connect ── */
  const [siteMode, setSiteMode] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [siteAnalyzing, setSiteAnalyzing] = useState(false);
  const [siteOutput, setSiteOutput] = useState(false);
  const [embedCode, setEmbedCode] = useState('');

  /* ── Templates ── */
  const [selectedTmpl, setSelectedTmpl] = useState('fitness');
  const [selectedColor, setSelectedColor] = useState('#00CFFF');
  const [aiFeatures, setAiFeatures] = useState({phone:false,chat:true,sms:true});

  /* ── Counter ── */
  const [counterLeads, setCounterLeads] = useState(0);

  /* ── Typewriter placeholder ── */
  const PROMPTS = [
    'I run a hair salon in Atlanta specializing in natural hair transformations, free consultation for new clients...',
    'Personal trainer in Chicago, free 1-on-1 assessment for anyone trying to lose weight or build muscle...',
    'Recording studio in St. Louis — mixing, mastering, and production. Free 1-hour intro session for new artists...',
    'Mobile detailing business in Houston, first wash 50% off for new customers...',
    'Law firm handling personal injury cases — free 30-minute consultation, no win no fee...',
  ];
  const [phIdx, setPhIdx] = useState(0);
  const [phText, setPhText] = useState('');
  const [phTyping, setPhTyping] = useState(true);

  /* ── Refs ── */
  const chatTARef = useRef<HTMLTextAreaElement>(null);
  const chatMsgsRef = useRef<HTMLDivElement>(null);

  /* ── Counter animation ── */
  useEffect(() => {
    const target = 14847;
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCounterLeads(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  /* ── Typewriter effect ── */
  useEffect(() => {
    if (chatInput) return; // stop when user types
    const full = PROMPTS[phIdx];
    if (phTyping) {
      if (phText.length < full.length) {
        const t = setTimeout(() => setPhText(full.slice(0, phText.length + 1)), 35);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhTyping(false), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (phText.length > 0) {
        const t = setTimeout(() => setPhText(phText.slice(0, -1)), 18);
        return () => clearTimeout(t);
      } else {
        setPhIdx((phIdx + 1) % PROMPTS.length);
        setPhTyping(true);
      }
    }
  }, [phText, phTyping, phIdx, chatInput]);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(s.vis); });
    }, { threshold: 0.12 });
    document.querySelectorAll(`.${s.rev}`).forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── Chat helpers ── */
  const addMessage = useCallback((role: string, content: string) => {
    setChatMessages(prev => [...prev, { role, content }]);
    setTimeout(() => chatMsgsRef.current?.scrollTo({ top: chatMsgsRef.current.scrollHeight, behavior: 'smooth' }), 100);
  }, []);

  const buildFromChat = useCallback(async (prompt: string) => {
    setShowChatOutput(true);
    setBuildError('');
    setBuildResult(null);
    addMessage('assistant', '<strong>Building your system now...</strong><br><span style="font-family:var(--fm);font-size:10px;color:var(--mu)">Generating slug · Building page · Writing SMS sequence...</span>');
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.slice(0, 500) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBuildError(data.error || 'Something went wrong. Please try again.');
        addMessage('assistant', `<span style="color:#FF3B3B">✗ ${data.error || 'Build failed. Please try again.'}</span>`);
        setChatSending(false);
        return;
      }
      setBuildResult(data);
      setChatHl(data.preview?.hero_headline || '—');
      setChatOf(data.preview?.offer_text || '—');
      setChatS0('5-step SMS sequence generated');
      setChatAg(`Live at goelev8.ai/f/${data.slug}`);
      setShowChatBlocks(true);
      setShowChatActs(true);
      addMessage('assistant', `✓ <strong>Your page is live.</strong><br>Visit <strong>goelev8.ai/f/${data.slug}</strong> — claim it free to activate your lead system.`);
    } catch {
      setBuildError('Network error. Please check your connection and try again.');
      addMessage('assistant', '<span style="color:#FF3B3B">✗ Network error. Please try again.</span>');
    }
    setChatSending(false);
  }, [addMessage]);

  const sendChatMessage = useCallback((override?: string) => {
    const text = override || chatInput.trim();
    if (!text || chatSending) return;
    setChatSending(true);
    setChatInput('');
    addMessage('user', text);
    addMessage('assistant', '__typing__');
    setTimeout(() => {
      setChatMessages(prev => prev.filter(m => m.content !== '__typing__'));
      buildFromChat(text);
    }, 1500);
  }, [chatInput, chatSending, addMessage, buildFromChat]);

  const useChatChip = useCallback((text: string) => {
    setChatInput(text);
    sendChatMessage(text);
  }, [sendChatMessage]);

  /* ── Lead capture ── */
  const openLead = useCallback(() => {
    if (hasLeadCookie()) {
      const data = getStoredLead();
      let url = SIGNUP_URL;
      if (data) {
        const p = new URLSearchParams({ email: data.email || '', name: `${data.first || ''} ${data.last || ''}`.trim(), phone: data.phone || '' });
        url = `${SIGNUP_URL}?${p.toString()}`;
      }
      window.location.href = url;
      return;
    }
    setLeadOpen(true);
    setLeadSuccess(false);
    document.body.style.overflow = 'hidden';
    const stored = getStoredLead();
    if (stored) {
      if (stored.first) setLeadFirst(stored.first);
      if (stored.last) setLeadLast(stored.last);
      if (stored.email) setLeadEmail(stored.email);
      if (stored.phone) setLeadPhone(stored.phone);
    }
  }, []);

  const closeLead = useCallback(() => {
    setLeadOpen(false);
    document.body.style.overflow = '';
  }, []);

  const submitLead = useCallback(async () => {
    if (!leadFirst.trim()) return;
    if (!leadEmail.trim() || !leadEmail.includes('@')) return;

    // Save to localStorage + cookie immediately
    const data = { first: leadFirst, last: leadLast, email: leadEmail, phone: leadPhone, ts: String(Date.now()) };
    saveLeadToStorage(data);

    try {
      // POST to real API route — fire and forget for UX
      await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `${leadFirst} ${leadLast}`.trim(),
          email: leadEmail || undefined,
          phone: leadPhone,
          source: 'homepage',
          page_url: window.location.href,
          utm_source: new URLSearchParams(window.location.search).get('utm_source') ?? undefined,
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium') ?? undefined,
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') ?? undefined,
        }),
      });
    } catch (err) {
      // Silent fail — localStorage/cookie already saved
      console.error('[submitLead] API call failed:', err);
    }

    // Show success state
    setLeadSuccess(true);
    const slug = (leadFirst + (leadLast ? '-' + leadLast : '')).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setTimeout(() => {
      closeLead();
      const p = new URLSearchParams({ email: leadEmail, name: `${leadFirst} ${leadLast}`.trim(), phone: leadPhone });
      window.location.href = `${SIGNUP_URL}?${p.toString()}`;
    }, 3200);
  }, [leadFirst, leadLast, leadEmail, leadPhone, closeLead]);

  /* ── Wizard ── */
  const openWizard = useCallback(() => {
    setWizData({});
    setWizStep(0);
    setWizardOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);
  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    document.body.style.overflow = '';
  }, []);

  const wizNext = useCallback((skip?: boolean) => {
    const step = WIZARD_STEPS[wizStep];
    if (!skip && (step.type === 'text' || step.type === 'textarea')) {
      // value already in wizData via onChange
    }
    if (wizStep < WIZARD_STEPS.length - 1) {
      setWizStep(prev => prev + 1);
    } else {
      const prompt = buildPromptFromWizData(wizData);
      closeWizard();
      setChatInput(prompt);
      setTimeout(() => sendChatMessage(prompt), 300);
    }
  }, [wizStep, wizData, closeWizard, sendChatMessage, openLead]);

  const wizBack = useCallback(() => { if (wizStep > 0) setWizStep(prev => prev - 1); }, [wizStep]);

  const wizSelect = useCallback((field: string, value: string) => {
    setWizData(prev => ({...prev, [field]: value}));
    setTimeout(() => wizNext(), 400);
  }, [wizNext]);

  /* ── Site connect ── */
  const analyzeSite = useCallback(async () => {
    if (!siteUrl.trim()) return;
    setSiteAnalyzing(true);
    await new Promise(r => setTimeout(r, 1400));
    const slug = siteUrl.replace(/^https?:\/\//,'').replace(/[^a-z0-9]/gi,'-').toLowerCase().slice(0,40);
    setEmbedCode(`<script src="https://goelev8.ai/widget.js" data-funnel="${slug}" defer><\/script>`);
    setSiteOutput(true);
    setSiteAnalyzing(false);
  }, [siteUrl]);

  const copyEmbed = useCallback(() => {
    navigator.clipboard.writeText(embedCode);
  }, [embedCode]);

  /* ── Modal ── */
  const openModal = useCallback(() => { setModalOpen(true); setModalStep(1); setModalSuccess(false); document.body.style.overflow = 'hidden'; }, []);
  const closeModal = useCallback(() => { setModalOpen(false); document.body.style.overflow = ''; }, []);
  const mStep = useCallback((n: number) => setModalStep(n), []);
  const mSel = useCallback((plan: string) => setSelectedPlan(plan), []);

  /* ── Template mock ── */
  const tmplData: Record<string, {logo:string;h:string;sub:string;btn:string}> = {
    fitness:{logo:'⚡ THE FLEX FACILITY',h:'Stop Leaving Gains on the Table',sub:'Free 1-on-1 Assessment with Coach Kenny. Movement screening + personalized training roadmap. No commitment.',btn:'CLAIM FREE ASSESSMENT →'},
    salon:{logo:'✨ LUXE HAIR STUDIO',h:'Your Natural Hair Transformation Starts Here',sub:'Free consultation with our stylists. Big chop, protective styles, color — we do it all.',btn:'BOOK FREE CONSULT →'},
    studio:{logo:'🎙️ iSLAY STUDIOS',h:'Your Sound. Perfected.',sub:'Free 1-hour intro session. Recording, mixing, mastering — all under one roof.',btn:'BOOK FREE SESSION →'},
    realty:{logo:'🏠 PRIME REALTY',h:'Find Your Dream Home',sub:'Free home buying consultation. Expert agents, local knowledge.',btn:'GET FREE CONSULT →'},
    dental:{logo:'🦷 BRIGHT SMILE DENTAL',h:'Your Best Smile Awaits',sub:'Free dental exam and x-rays for new patients.',btn:'BOOK FREE EXAM →'},
    law:{logo:'⚖️ BRENNAN & ASSOCIATES',h:'Justice. Delivered.',sub:'Free 30-minute case evaluation. Personal injury, family law.',btn:'GET FREE EVALUATION →'},
  };
  const mockData = tmplData[selectedTmpl] || tmplData.fitness;


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
          <li><a href="#how">How It Works</a></li>
          <li><a href="#demo">Demo</a></li>
          <li><a href="#templates">Templates</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#proof">Results</a></li>
        </ul>
        <Link href="/auth/signup" className={s['nav-cta']} onClick={(e) => { e.preventDefault(); openLead(); }}>
          Start Free Trial →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className={s.hero} aria-label="Hero">
        <div className={s['hero-bg']} aria-hidden="true" />
        <div className={s['hero-grid']} aria-hidden="true" />
        <div className={s['hero-scan']} aria-hidden="true" />

        <div>
          <div className={s['sys-status']}>
            <span className={s['sys-dot']} />
            <span className={s['sys-text']}>SYSTEM ONLINE</span>
            <span className={s['sys-sep']}>|</span>
            <span className={s['sys-item']}>ZERO HUMANS REQUIRED</span>
            <span className={s['sys-sep']}>|</span>
            <span className={s['sys-item']}>7-DAY FREE TRIAL</span>
          </div>

          <div className={s['sys-name-badge']} aria-label="Product name">
            <span className={s['sys-name-text']}>The GoElev8.AI Lead Acquisition System</span>
          </div>

          <h1 className={s['hero-h']} aria-label="Build your AI lead machine">
            <span className={s['main-text']}>BUILD YOUR <span className={s.c}>AI</span><br/>BUSINESS PAGE<br/><span className={s.s}>BY PROMPT.</span></span>
            <span className={s['glitch-layer']} aria-hidden="true">BUILD YOUR AI<br/>BUSINESS PAGE<br/>BY PROMPT.</span>
          </h1>

          <p className={s['hero-sub']}>
            Your leads are not dead — <strong>they stopped hearing from you.</strong> The GoElev8.AI system builds your complete lead capture page, <strong>calls every opt-in within 5 minutes,</strong> follows up for 14 days automatically, and books appointments while you sleep. One prompt. No code. No agency.
          </p>

          <div className={s['data-strip']} role="region" aria-label="Platform statistics">
            <div className={s['data-cell']}><div className={s['data-n']}>{counterLeads.toLocaleString()}</div><div className={s['data-l']}>Leads Captured</div></div>
            <div className={s['data-cell']}><div className={s['data-n']}>&lt;5min</div><div className={s['data-l']}>AI Response Time</div></div>
            <div className={s['data-cell']}><div className={s['data-n']}>24/7</div><div className={s['data-l']}>Always On</div></div>
            <div className={s['data-cell']}><div className={s['data-n']}>$0</div><div className={s['data-l']}>Until Day 8</div></div>
          </div>

          {/* CHAT-STYLE PROMPT BOX */}
          <div className={s['prompt-hero']} role="region" aria-label="AI Funnel Builder">
            <div className={s['prompt-lbl']} aria-hidden="true">Describe your business — system builds in 20 seconds</div>
            <div className={s['chat-box']}>
              <div className={s['chat-msgs']} ref={chatMsgsRef}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`${s.msg} ${s[msg.role]}`}>
                    <div className={s['msg-avatar']}>{msg.role === 'assistant' ? 'AI' : '→'}</div>
                    {msg.content === '__typing__' ? (
                      <div className={s['msg-bubble']}>
                        <div className={s['typing-indicator']}>
                          <div className={s['typing-dot']} /><div className={s['typing-dot']} /><div className={s['typing-dot']} />
                        </div>
                      </div>
                    ) : (
                      <div className={s['msg-bubble']} dangerouslySetInnerHTML={{ __html: msg.content }} />
                    )}
                  </div>
                ))}
              </div>
              <div className={s['chat-input-row']}>
                <textarea
                  ref={chatTARef}
                  className={s['chat-ta']}
                  rows={1}
                  value={chatInput}
                  onChange={e => { setChatInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  placeholder={phText || "Describe your business — I'll build your complete AI system..."}
                  aria-label="Describe your business"
                />
                <button
                  className={`${s['chat-send']} ${chatInput.trim() ? s.ready : ''}`}
                  onClick={() => sendChatMessage()}
                  disabled={!chatInput.trim() || chatSending}
                  aria-label="Send"
                >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                </button>
              </div>
              <div className={s['chat-footer']}>
                <span className={s['chat-hint']}>↵ Send &nbsp;·&nbsp; <span>Shift+Enter</span> for new line</span>
                <button className={s['start-now-btn']} onClick={openWizard}>⚡ START NOW — GUIDED SETUP</button>
              </div>
              <div className={s['chat-chips']}>
                <button className={s['chat-chip']} onClick={() => useChatChip('Fitness studio in Chicago — strength training and weight loss, free 1-on-1 assessment')}>🏋️ Fitness studio</button>
                <button className={s['chat-chip']} onClick={() => useChatChip('Hair salon specializing in natural hair transformations, free consultation for new clients')}>💇 Hair salon</button>
                <button className={s['chat-chip']} onClick={() => useChatChip('Professional recording studio — recording, mixing, mastering, free 1-hour intro session')}>🎙️ Recording studio</button>
                <button className={s['chat-chip']} onClick={() => useChatChip('Law firm handling personal injury and family law, free 30-minute consultation')}>⚖️ Law firm</button>
              </div>
              {buildError && (
                <div style={{padding:'10px 14px',marginTop:8,background:'rgba(255,59,59,.08)',border:'1px solid rgba(255,59,59,.2)',borderRadius:6,fontSize:12,color:'#FF3B3B',fontFamily:'var(--fm)'}}>{buildError}</div>
              )}
              {showChatOutput && (
                <div className={`${s['chat-output']} ${s.show}`}>
                  <div className={s['co-label']}>// Generated for your business</div>
                  {showChatBlocks && (
                    <div className={s['co-blocks']}>
                      <div className={s['co-blk']}><div className={s['co-blk-l']}>Page Headline</div><div className={s['co-blk-v']}>{chatHl}</div></div>
                      <div className={s['co-blk']}><div className={s['co-blk-l']}>Lead Offer</div><div className={s['co-blk-v']}>{chatOf}</div></div>
                      <div className={s['co-blk']}><div className={s['co-blk-l']}>SMS Sequence</div><div className={s['co-blk-v']}>{chatS0}</div></div>
                      {buildResult && (
                        <div className={s['co-blk']}>
                          <div className={s['co-blk-l']}>Live URL</div>
                          <div className={s['co-blk-v']} style={{cursor:'pointer',textDecoration:'underline'}} onClick={() => { navigator.clipboard.writeText(buildResult.full_url); }}>{chatAg}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {showChatActs && buildResult && (
                    <div className={s['co-acts']}>
                      <button className={s['co-act']} onClick={() => { navigator.clipboard.writeText(buildResult.full_url); }}>Copy URL</button>
                      <a href={buildResult.full_url} target="_blank" rel="noopener noreferrer" className={s['co-act']} style={{textDecoration:'none'}}>Preview Page →</a>
                      <button className={`${s['co-act']} ${s['co-act-p']}`} onClick={() => { window.location.href = `/auth/signup?slug=${buildResult.slug}&funnel_id=${buildResult.funnel_id}`; }}>Claim This Page Free →</button>
                    </div>
                  )}
                  {showChatActs && !buildResult && (
                    <div className={s['co-acts']}>
                      <button className={s['co-act']} onClick={() => chatTARef.current?.focus()}>↺ Refine</button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
            <div className={s['lev-stats']}>
              <div className={s['lev-stat']}><div className={s['lev-stat-n']}>24/7</div><div className={s['lev-stat-l']}>Uptime</div></div>
              <div className={s['lev-stat']}><div className={s['lev-stat-n']}>&lt;5m</div><div className={s['lev-stat-l']}>Call Time</div></div>
              <div className={s['lev-stat']}><div className={s['lev-stat-n']}>14d</div><div className={s['lev-stat-l']}>Follow-Up</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
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
              <div className={s.painCardH}>The System Calls in 5 Minutes.</div>
              <p className={s.painCardP}>Lead opts in. The GoElev8.AI system calls them back within 5 minutes — before they&apos;ve opened another tab. If they don&apos;t answer, 14 days of personalized SMS follow-up starts automatically. <strong style={{color:'var(--wh)'}}>Your morning starts with confirmed bookings,</strong> not missed opportunities.</p>
              <div className={s.painCardStat} style={{background:'rgba(0,207,255,.07)',borderLeft:'2px solid var(--cyan)',color:'var(--cyan)'}}>GoElev8.AI response time: &lt; 5 minutes. Every lead. Every time. Zero humans required.</div>
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
            {n:'01',ico:'🧲',t:'Lead Opts In',d:'Visitor hits your funnel at goelev8.ai/f/slug. The system captures their info instantly — no lag, no middleware, no manual entry.',tag:'Instant Capture'},
            {n:'02',ico:'📞',t:'System Calls in 5 Min',d:'The GoElev8.AI system calls the lead within 5 minutes of opt-in. AI qualifies them, handles objections, and books the appointment.',tag:'AI Voice · 24/7'},
            {n:'03',ico:'💬',t:'SMS Sequence Fires',d:'If no answer — Day 0, 1, 3, 7, 14 texts go out automatically in your brand voice. Sequence stops the moment they book or reply.',tag:'Automated Follow-Up'},
            {n:'04',ico:'📊',t:'Portal Updates Live',d:'Real-time CRM tracks every lead, call outcome, booking, and SMS credit. Full pipeline visibility with zero manual work.',tag:'Live Intelligence'},
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

      {/* ── VOICE DEMO ── */}
      <section className={`${s.section} ${s['demo-section']}`} id="demo" aria-labelledby="demo-h">
        <div className={s.sl} aria-hidden="true">Hear It Work</div>
        <div className={s['demo-layout']}>
          <div className={s.rev}>
            <h2 className={s.sh} id="demo-h">REAL CALLS.<br/><span style={{color:'var(--cyan)'}}>REAL CLOSES.</span></h2>
            <p className={s.ssub} style={{marginBottom:26}}>Listen to the GoElev8.AI system qualify a lead. Then experience it yourself — live in your browser.</p>
            {[
              {ico:'🏋️ Fitness Studio',dur:'0:47',sys1:'System: "Hey Marcus, I\'m calling from The Flex Facility — you just grabbed your free assessment. Quick question: what\'s your number one goal right now?"',human:'Lead: "Trying to lose 30 lbs and build muscle back."',sys2:'System: "Perfect — that\'s exactly what Coach Kenny specializes in. I have Thursday at 7 PM open — want me to lock that in?"'},
              {ico:'💇 Hair Salon',dur:'0:52',sys1:'System: "Hi Aaliyah, I\'m calling from Luxe Hair Studio. You requested a free consult — are you looking for something specific or a full transformation?"',human:'Lead: "Trying to do a big chop and go natural."',sys2:'System: "Maya is incredible with natural transitions. She has Saturday morning open — want me to grab that?"'},
              {ico:'⚖️ Personal Injury Law',dur:'1:04',sys1:'System: "This is the intake line for Brennan & Associates. I understand you were in an accident — was anyone else involved?"',human:'Lead: "Rear-end collision. I\'ve had neck pain since."',sys2:'System: "That\'s exactly the type of case our attorneys handle. James has 3 PM today — does that work?"'},
            ].map((call, i) => (
              <div key={i} className={s['call-card']}>
                <div className={s['cc-hd']}><span className={s['cc-ind']}>{call.ico}</span><span className={s['cc-dur']}>{call.dur}</span></div>
                <div className={s['cc-body']}>
                  <div className={s['cc-tx']}><span className={s.sys}>{call.sys1}</span><br/><br/><span className={s.human}>{call.human}</span><br/><br/><span className={s.sys}>{call.sys2}</span></div>
                  <div className={s['cc-player']}>
                    <button className={s['play-btn']} aria-label={`Play ${call.ico} call`}>▶</button>
                    <div className={s.prog}><div className={s['prog-fill']} /></div>
                    <span className={s['ply-time']}>{call.dur}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={s.rev} style={{transitionDelay:'.13s'}}>
            <div className={s.sl} style={{marginBottom:12}} aria-hidden="true">Experience It Live</div>
            <h3 style={{fontFamily:'var(--fd)',fontSize:'clamp(26px,3vw,40px)',letterSpacing:1,lineHeight:1.02,marginBottom:8}}>HEAR THE SYSTEM<br/><span style={{color:'var(--cyan)'}}>AS YOUR LEAD DOES.</span></h3>
            <p style={{fontSize:12,color:'var(--mu)',lineHeight:1.7,marginBottom:4}}>The GoElev8.AI demo system calls you or talks live in browser. No account. No commitment.</p>
            <div className={s['live-demo-card']}>
              <div className={s['ld-hd']}><div className={s['ld-dot']} /><div className={s['ld-title']}>GoElev8.AI System · Demo Mode · Online</div></div>
              <div className={s['ld-body']}>
                <div className={s['ld-desc']}>Enter your phone and the system calls within 60 seconds. Or talk directly in your browser — zero friction.</div>
                <div className={s['ld-row']}>
                  <input type="tel" className={s['ld-inp']} placeholder="+1 (314) 000-0000" aria-label="Your phone number" />
                  <button className={s['ld-call']}>CALL ME →</button>
                </div>
                <div className={s['ld-or']}><div className={s['ld-or-line']} /><span>or</span><div className={s['ld-or-line']} /></div>
                <button className={s['ld-browser']}>🎙 EXPERIENCE IN BROWSER</button>
                <div className={s['ld-note']}>Demo uses GoElev8.AI&apos;s shared system. Your account activates your own dedicated instance.</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── PRODUCT STORE ── */}
      <section className={`${s.section} ${s['store-section']}`} id="store" aria-labelledby="store-h">
        <div className={s.sl} aria-hidden="true">Product Store</div>
        <div className={s['store-layout']}>
          <div className={s.rev}>
            <h2 className={s['store-headline']} id="store-h">YOUR PRODUCTS.<br/><span style={{color:'var(--cyan)'}}>YOUR SYSTEM</span><br/><span style={{color:'var(--wh2)'}}>SELLS THEM.</span></h2>
            <p className={s['store-sub']}>Connect your physical products, digital downloads, or service packages to your funnel. The GoElev8.AI system promotes them naturally during calls and SMS campaigns — turning every touchpoint into a potential sale, automatically.</p>
            <div className={s['store-powers']}>
              {[
                {ico:'📞',t:'Promoted During Calls',d:'After booking an appointment, the system naturally introduces your products mid-conversation — seamless, contextual, never pushy.'},
                {ico:'💬',t:'SMS Blast Campaigns',d:'Send targeted product promotions to your entire lead list or specific segments. The system handles replies and drives them to checkout automatically.'},
                {ico:'⚡',t:'Instant Checkout Mid-Conversation',d:'A payment link drops mid-SMS thread. Your lead buys without leaving the conversation. Revenue while you\'re not even looking.'},
                {ico:'🔄',t:'Zero Management Required',d:'Connect once. The system handles promotion, payment collection, and confirmation automatically — physical products, digital downloads, or session packs.'},
              ].map(p => (
                <div key={p.t} className={s['store-power']}>
                  <div className={s['sp-ico']}>{p.ico}</div>
                  <div><div className={s['sp-title']}>{p.t}</div><div className={s['sp-desc']}>{p.d}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className={s.rev} style={{transitionDelay:'.13s'}}>
            <div className={s['store-visual']}>
              <div className={s['sv-hd']}>
                <div className={s.dots} aria-hidden="true"><div className={`${s.d} ${s.dr}`} /><div className={`${s.d} ${s.dy}`} /><div className={`${s.d} ${s.dg}`} /></div>
                <div className={s['sv-hd-title']}>portal.goelev8.ai — product console</div>
              </div>
              <div className={s['sv-body']}>
                <div className={s['sv-term']}>
                  <div>// Last sale: 14 min ago · Payout: automatic<span className={s.cursor} /></div>
                </div>
                <div className={s['sv-products']}>
                  <div className={s['sv-prod']}><div className={s['sv-prod-ico']}>🏋️</div><div className={s['sv-prod-name']}>Flex Performance Protein</div><div className={`${s['sv-prod-status']} ${s['sv-live']}`}>● LIVE</div></div>
                  <div className={s['sv-prod']}><div className={s['sv-prod-ico']}>📱</div><div className={s['sv-prod-name']}>12-Week Training Program</div><div className={`${s['sv-prod-status']} ${s['sv-live']}`}>● LIVE</div></div>
                  <div className={s['sv-prod']}><div className={s['sv-prod-ico']}>👕</div><div className={s['sv-prod-name']}>Flex Facility Merch Pack</div><div className={`${s['sv-prod-status']} ${s['sv-pending']}`}>⟳ CONNECTING</div></div>
                </div>
                <button className={s['sv-cta']} onClick={openLead}>CONNECT YOUR PRODUCTS →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ── */}
      <section className={s.section} id="templates" aria-labelledby="tmpl-h">
        <div className={s.sl} aria-hidden="true">Templates &amp; Customization</div>
        <div className={s['tmpl-layout']}>
          <div className={s.rev}>
            <h2 className={s.sh} id="tmpl-h">NOT READY<br/>FOR <span style={{color:'var(--cyan)'}}>AI YET?</span></h2>
            <p className={s.ssub} style={{marginBottom:24}}>Start with a template. Customize your brand. Activate AI features when you&apos;re ready — your funnel upgrades without a rebuild.</p>
            <div className={s['ctrl-group']}><label className={s['ctrl-lbl']}>Industry Template</label>
              <div className={s['tmpl-grid']}>
                {[{k:'fitness',ico:'🏋️',n:'Fitness'},{k:'salon',ico:'💇',n:'Salon'},{k:'studio',ico:'🎙️',n:'Studio'},{k:'realty',ico:'🏠',n:'Realty'},{k:'dental',ico:'🦷',n:'Dental'},{k:'law',ico:'⚖️',n:'Law'}].map(t => (
                  <button key={t.k} className={`${s.tmpl} ${selectedTmpl === t.k ? s.active : ''}`} onClick={() => setSelectedTmpl(t.k)}>
                    <div className={s['tmpl-ico']}>{t.ico}</div><div className={s['tmpl-name']}>{t.n}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className={s['ctrl-group']}><label className={s['ctrl-lbl']}>Brand Color</label>
              <div className={s.swatches}>
                {['#00CFFF','#FFFFFF','#FF5F1F','#00FF94','#FF3366','#9B59FF','#FFD600'].map(c => (
                  <button key={c} className={`${s.swatch} ${selectedColor === c ? s.active : ''}`} style={{background:c}} onClick={() => setSelectedColor(c)} aria-label={c} />
                ))}
              </div>
            </div>
            <div className={s['ctrl-group']}><label className={s['ctrl-lbl']}>AI Features</label>
              <div className={s['ai-tog']} onClick={() => setAiFeatures(p => ({...p, phone:!p.phone}))}>
                <div><div className={s['ai-tog-title']}>AI Phone Agent</div><div className={s['ai-tog-sub']}>Calls leads in 5 min · Grow plan</div></div>
                <div className={`${s['ai-sw']} ${aiFeatures.phone ? s.on : ''}`} />
              </div>
              <div className={s['ai-tog']} onClick={() => setAiFeatures(p => ({...p, chat:!p.chat}))}>
                <div><div className={s['ai-tog-title']}>Chat Widget</div><div className={s['ai-tog-sub']}>On your funnel page · All plans</div></div>
                <div className={`${s['ai-sw']} ${aiFeatures.chat ? s.on : ''}`} />
              </div>
              <div className={s['ai-tog']} onClick={() => setAiFeatures(p => ({...p, sms:!p.sms}))}>
                <div><div className={s['ai-tog-title']}>SMS Sequences</div><div className={s['ai-tog-sub']}>Day 0–14 nudge flow · All plans</div></div>
                <div className={`${s['ai-sw']} ${aiFeatures.sms ? s.on : ''}`} />
              </div>
            </div>
          </div>
          <div className={s.rev} style={{transitionDelay:'.13s'}}>
            <div className={s['tmpl-preview']}>
              <div className={s['tp-bar']}>
                <div className={s.dots} aria-hidden="true"><div className={`${s.d} ${s.dr}`} /><div className={`${s.d} ${s.dy}`} /><div className={`${s.d} ${s.dg}`} /></div>
                <div style={{fontFamily:'var(--fm)',fontSize:8,color:'var(--mu)',marginLeft:6}}>goelev8.ai/f/your-slug — live preview</div>
              </div>
              <div className={s['fp-mock']} style={{'--mock-accent': selectedColor} as React.CSSProperties}>
                <div className={s['fp-mock-logo']} style={{color:selectedColor}}>{mockData.logo}</div>
                <div className={s['fp-mock-h']}>{mockData.h}</div>
                <div className={s['fp-mock-sub']}>{mockData.sub}</div>
                <button className={s['fp-mock-btn']} style={{background:selectedColor}} onClick={openLead}>{mockData.btn}</button>
              </div>
              <div className={s['fp-mock-status']}>
                <span style={{fontFamily:'var(--fm)',fontSize:8,color:'var(--mu)'}}>Template: {selectedTmpl} · Color: {selectedColor}</span>
                <button className={s['fp-mock-launch']} onClick={openLead}>LAUNCH →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAT WIDGET ── */}
      <section className={`${s.section} ${s['chat-section']}`} id="chat" aria-labelledby="chat-h">
        <div className={s.sl} aria-hidden="true">Chat Widget</div>
        <div className={s['chat-layout']}>
          <div className={s.rev}>
            <h2 className={s.sh} id="chat-h">AI CHAT ON<br/><span style={{color:'var(--cyan)'}}>EVERY PAGE.</span></h2>
            <p className={s.ssub} style={{marginBottom:24}}>The GoElev8.AI chat system captures leads around the clock — on your funnel, your homepage, and inside your portal.</p>
            {[
              {ico:'🧲',t:'On Your Funnel Page',d:'Catches visitors who don\'t fill the form. Qualifies them in conversation, captures their phone number, fires the SMS sequence automatically.',badge:'All Plans',bc:s['cb-all']},
              {ico:'🏠',t:'On GoElev8.ai Homepage',d:'The GoElev8.AI system answers questions, qualifies prospects, and books strategy calls. The platform sells itself using itself.',badge:'Always On',bc:s['cb-all']},
              {ico:'🛠️',t:'In Your Client Portal',d:'Support AI that knows your account, credits, funnels, and billing. No support tickets. No email chains. Just ask.',badge:'Grow + Scale',bc:s['cb-grow']},
            ].map(c => (
              <div key={c.t} className={s['placement-card']}>
                <div className={s['pc-hd']}><span className={s['pc-ico']}>{c.ico}</span><span className={s['pc-title']}>{c.t}</span></div>
                <div className={s['pc-desc']}>{c.d}</div>
                <span className={`${s['pc-badge']} ${c.bc}`}>{c.badge}</span>
              </div>
            ))}
          </div>
          <div className={s.rev} style={{transitionDelay:'.13s'}}>
            <div className={s['chat-mock']}>
              <div className={s['cm-hd']}>
                <div className={s['cm-av']} aria-hidden="true">
                  <Image src="/images/lev.png" alt="" width={26} height={26} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 10%'}} />
                </div>
                <div>
                  <div className={s['cm-name']}>GoElev8.AI System</div>
                  <div className={s['cm-status']}>● Online · AI Assistant</div>
                </div>
              </div>
              <div className={s['cm-msgs']}>
                <div className={`${s['cm-msg']} ${s.bot}`}><div className={s['cm-bubble']}>Hey! 👋 I&apos;m the AI assistant for The Flex Facility. What brings you in today?</div><div className={s['cm-time']}>Just now</div></div>
                <div className={`${s['cm-msg']} ${s.user}`}><div className={s['cm-bubble']}>I want to lose weight but never worked with a trainer before</div><div className={s['cm-time']}>Just now</div></div>
                <div className={`${s['cm-msg']} ${s.bot}`}><div className={s['cm-bubble']}>That&apos;s exactly what Coach Kenny specializes in — he starts everyone with a free assessment. Zero pressure. Want me to grab you a spot?</div><div className={s['cm-time']}>Just now</div></div>
              </div>
              <div className={s['cm-inp-row']}>
                <input type="text" className={s['cm-field']} placeholder="Type a message..." aria-label="Type a message" />
                <button className={s['cm-send']} aria-label="Send">↑</button>
              </div>
              <button className={s['widget-fab']} aria-label="Open chat">💬</button>
            </div>
          </div>
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
        <div className={`${s['trust-bottom']} ${s.rev}`}>
          {[
            {ico:'🛡️',t:'OWASP Top 10 Protected',d:'Every API route hardened against injection, XSS, CSRF, and brute force attacks'},
            {ico:'🌐',t:'Global Edge Network',d:'Funnels served from 100+ locations worldwide — <50ms load time globally'},
            {ico:'📜',t:'GDPR & CCPA Ready',d:'Full data deletion flows, consent management, and export tools built in'},
          ].map(t => (
            <div key={t.t} className={s['trust-stat']}>
              <div className={s['trust-stat-ico']}>{t.ico}</div>
              <div><div className={s['trust-stat-t']}>{t.t}</div><div className={s['trust-stat-d']}>{t.d}</div></div>
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
          <div className={s.billing}>
            <span>Monthly</span>
            <div className={`${s.btog} ${annualBilling ? s.on : ''}`} onClick={() => setAnnualBilling(!annualBilling)} role="switch" aria-checked={annualBilling} tabIndex={0} />
            <span>Annual <span style={{color:'var(--cyan)',fontFamily:'var(--fm)',fontSize:8}}>SAVE 20%</span></span>
          </div>
        </div>
        <div className={`${s['pr-grid']} ${s.rev}`} role="list">
          {[
            {name:'LAUNCH',desc:'Templates, funnels, SMS. Get leads before you commit.',mo:99,an:79,feat:false,features:['1 active funnel (goelev8.ai/f/slug)','AI funnel builder — prompt or URL','20+ templates + color customizer',{t:'Chat widget',nb:'AI Powered'},'5-step SMS nudge sequence','Dedicated AI phone number','A2P 10DLC auto-handled','Booking calendar','Live CRM (250 leads/mo)','Product store'],off:['AI phone agent','SMS blast campaigns','Client portal','Custom domain']},
            {name:'GROW',desc:'The full GoElev8.AI system. AI calls, blasts, and real-time portal.',mo:199,an:159,feat:true,features:['3 active funnels','AI funnel builder — prompt or URL','20+ templates + color customizer',{t:'Chat widget',nb:'AI Powered'},'5-step SMS nudge sequence','Dedicated AI phone number','A2P 10DLC auto-handled','Booking calendar','Live CRM (1,000 leads/mo)','Product store','AI phone agent ✓','Live demo from prompt box ✓','SMS blast campaigns ✓','Client portal ✓','Custom domain add-on ($19/mo)'],off:[]},
            {name:'SCALE',desc:'Agencies. Unlimited funnels. White-label. Built to resell.',mo:397,an:317,feat:false,features:['Unlimited funnels','AI funnel builder — prompt or URL','20+ templates + color customizer',{t:'Chat widget',nb:'AI Powered'},'5-step SMS nudge sequence','Dedicated AI phone number','A2P 10DLC auto-handled','Booking calendar','Live CRM (unlimited leads)','Product store','AI phone agent ✓','Live demo from prompt box ✓','SMS blast campaigns ✓','Client portal ✓','1 custom domain included','White-label option ✓'],off:[]},
          ].map(plan => (
            <div key={plan.name} className={`${s.pc} ${plan.feat ? s.feat : ''}`} role="listitem">
              {plan.feat && <div className={s['feat-bdg']}>Most Popular</div>}
              <div className={s['trial-b']}>7-Day Free Trial</div>
              <div className={s.tn}>{plan.name}</div>
              <div className={s.td}>{plan.desc}</div>
              <div className={s.tp}><span className={s.tc}>$</span><span className={s.ta}>{annualBilling ? plan.an : plan.mo}</span><span className={s.tper}>/mo</span></div>
              <div className={s.tu}>+ SMS credits purchased separately</div>
              <div className={s.tdiv} />
              <ul className={s.tfl}>
                {plan.features.map((f, i) => (
                  <li key={i}>{typeof f === 'string' ? f : <>{f.t} <span className={s.nb}>{f.nb}</span></>}</li>
                ))}
                {plan.off.map((f, i) => (
                  <li key={`off-${i}`} className={s.off}>{f}</li>
                ))}
              </ul>
              <button className={s.tcta} onClick={openLead}>START BUILDING FREE →</button>
            </div>
          ))}
        </div>

        <div className={s.sl} style={{marginTop:30,marginBottom:10}}>SMS Credits — Buy When You Need Them</div>
        <div className={`${s['sms-grid']} ${s.rev}`}>
          {[
            {price:'$25',msgs:'250 Messages',rate:'$0.10 per SMS',tag:'// Getting started'},
            {price:'$50',msgs:'625 Messages',rate:'$0.08 per SMS',tag:'// Active follow-up'},
            {price:'$100',msgs:'2,000 Messages',rate:'$0.05 per SMS',tag:'// Blast campaigns'},
          ].map((sms, i) => (
            <div key={i} className={`${s['sms-t']} ${selectedSms === i ? s.sel : ''}`} onClick={() => setSelectedSms(i)}>
              <div className={s['sms-price']}>{sms.price}</div>
              <div className={s['sms-msgs']}>{sms.msgs}</div>
              <div className={s['sms-rate']}>{sms.rate}</div>
              <div className={s['sms-tag']}>{sms.tag}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:'12px 16px',background:'var(--cyan-f)',border:'1px solid rgba(0,207,255,.1)',borderRadius:1,fontSize:11,color:'var(--mu)',lineHeight:1.7,fontFamily:'var(--fm)'}}>
          // NO MONTHLY SMS FEES · CREDITS NEVER EXPIRE · A2P COMPLIANCE INCLUDED ON ALL PAID PLANS
        </div>

        {/* SMS Credits visual */}
        <div className={s.smsCreditsInline}>
          <div className={s.smsCreditsHd}>
            <span style={{fontFamily:'var(--fd)',fontSize:20,letterSpacing:1.5}}>SMS CREDITS</span>
            <span style={{fontFamily:'var(--fm)',fontSize:8,color:'#00E87A'}}>● Credits never expire &nbsp;·&nbsp; No monthly SMS fee &nbsp;·&nbsp; Buy once, use anytime</span>
          </div>
          <div className={s.smsCreditsGrid}>
            {[{p:'$25',m:'250 messages',r:'$0.10 per SMS'},{p:'$50',m:'625 messages',r:'$0.08 per SMS'},{p:'$100',m:'2,000 messages',r:'$0.05 per SMS'}].map((c, i) => (
              <div key={i} className={s.smsCreditCell}>
                <div style={{fontFamily:'var(--fd)',fontSize:40,color:'var(--cyan)',lineHeight:1,marginBottom:4}}>{c.p}</div>
                <div style={{fontFamily:'var(--fm)',fontSize:9,color:'var(--wh2)',marginBottom:3}}>{c.m}</div>
                <div style={{fontFamily:'var(--fm)',fontSize:8,color:'#555'}}>{c.r}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF ── */}
      <section className={s.section} id="proof" aria-labelledby="proof-h">
        <div className={s.sl} aria-hidden="true">Results</div>
        <h2 className={`${s.sh} ${s.rev}`} id="proof-h">REAL BUSINESSES.<br/><span style={{color:'var(--cyan)'}}>REAL REVENUE.</span></h2>
        <div className={`${s['proof-scroll']} ${s.rev}`} role="list">
          {[
            {q:'"Built my funnel in 8 minutes. The system booked 4 clients the first week while I was at practice. The sequences sound exactly like me."',init:'KS',name:'Coach Kenny Sims',biz:'The Flex Facility · Earth City, MO',bg:'rgba(0,207,255,.1)',c:'var(--cyan)'},
            {q:'"Bookings up 40% in month one. The AI system calls in 5 minutes — we were losing people because follow-up was too slow."',init:'MR',name:'Maya R.',biz:'Luxe Hair Studio · Atlanta, GA',bg:'rgba(255,95,31,.12)',c:'#FF5F1F'},
            {q:'"The chat widget catches leads at 2am that I would have lost. They\'re booked by morning. The system never misses."',init:'DT',name:'Darius T.',biz:'iSlay Studios · St. Louis, MO',bg:'rgba(0,207,255,.1)',c:'var(--cyan)'},
            {q:'"Started with just a template — tripled lead capture in 2 weeks. When I activated the AI agent, it was over."',init:'AL',name:'Andre L.',biz:'Personal Training · Houston, TX',bg:'rgba(0,255,148,.1)',c:'var(--grn)'},
            {q:'"White-labeling GoElev8.AI for my agency clients. The Scale plan pays for itself with my first retainer every single month."',init:'JW',name:'Janelle W.',biz:'Digital Agency · Chicago, IL',bg:'rgba(255,95,31,.12)',c:'#FF5F1F'},
          ].map((p, i) => (
            <div key={i} className={s.pcard} role="listitem">
              <div className={s.pq}>{p.q}</div>
              <div className={s.pa}>
                <div className={s.pav} style={{background:p.bg,color:p.c}}>{p.init}</div>
                <div><div className={s.pn}>{p.name}</div><div className={s.pb}>{p.biz}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className={`${s['cta-section']} ${s.rev}`} role="complementary">
        <div className={s['cta-grid-bg']} aria-hidden="true" />
        <Image src="/images/lev.png" alt="" className={s['cta-lev']} width={200} height={300} aria-hidden="true" />
        <h2 className={s['cta-h']}>STOP LEAKING<br/><span className={s.c}>HIGH-TICKET</span><br/>REVENUE.</h2>
        <p className={s['cta-p']}>The GoElev8.AI Lead Acquisition System never sleeps, never misses a call, and never forgets to follow up. Your system is 7 minutes away — free for 7 days.</p>
        <div className={s['cta-btns']}>
          <Link href="/auth/signup" className={s['btn-primary']} onClick={(e) => { e.preventDefault(); openLead(); }}>Build My System Free →</Link>
          <a href="#demo" className={s['btn-outline']}>Experience It Live</a>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className={s.footer} role="contentinfo">
        <Link href="/" className={s['footer-logo']} aria-label="GoElev8.ai home">
          <Image src="/images/lockup.png" alt="GoElev8.ai" width={100} height={24} style={{height:24,width:'auto',opacity:.7}} />
        </Link>
        <div className={s.fc}>// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.</div>
        <nav className={s.flinks} aria-label="Footer navigation">
          <a href="/pricing">Pricing</a>
          <a href="/auth/login">Login</a>
          <Link href="/auth/signup" onClick={(e) => { e.preventDefault(); openLead(); }}>Sign Up</Link>
          <a href="/portal">Portal</a>
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/sms-policy">SMS Policy</a>
        </nav>
      </footer>


      {/* ══════════ MODALS ══════════ */}

      {/* ── START FREE TRIAL MODAL ── */}
      {modalOpen && (
        <div className={`${s['modal-bd']} ${s.on}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }} role="dialog" aria-modal="true" aria-label="Start free trial">
          <div className={s.modal}>
            <div className={s.mh}><div className={s.mt}>START FREE TRIAL</div><button className={s.mc} onClick={closeModal} aria-label="Close">✕</button></div>
            <div className={s.mb}>
              <div className={s.mtabs}>
                <div className={`${s.mtab} ${modalStep === 1 ? s.act : ''} ${modalStep > 1 ? s.done : ''}`}>01 · Business</div>
                <div className={`${s.mtab} ${modalStep === 2 ? s.act : ''} ${modalStep > 2 ? s.done : ''}`}>02 · Plan</div>
                <div className={`${s.mtab} ${modalStep === 3 ? s.act : ''}`}>03 · Account</div>
              </div>

              {modalStep === 1 && (
                <div className={`${s.mp} ${s.act}`}>
                  <div className={s.tnote}>// <strong>7-day free trial.</strong> First funnel is free. Card on file — charged Day 8 only if you keep it.</div>
                  <div className={s.mf}><label className={s.ml}>Describe Your Business (or paste your URL)</label><textarea className={s.mi} rows={3} value={modalDesc} onChange={e => setModalDesc(e.target.value)} placeholder="e.g. I run an athletic training facility in St. Louis..." style={{resize:'none'}} /></div>
                  <div className={s.m2c}>
                    <div className={s.mf}><label className={s.ml}>Business Name</label><input type="text" className={s.mi} value={modalBiz} onChange={e => setModalBiz(e.target.value)} placeholder="e.g. The Flex Facility" autoComplete="organization" /></div>
                    <div className={s.mf}><label className={s.ml}>Industry</label>
                      <select className={s.mi} value={modalInd} onChange={e => setModalInd(e.target.value)}>
                        <option value="">Select...</option>
                        <option>Fitness &amp; Training</option><option>Beauty &amp; Salons</option><option>Music Studios</option><option>Real Estate</option><option>Dental / Medical</option><option>Law / Legal</option><option>HVAC &amp; Plumbing</option><option>Consulting</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className={s.mf}><label className={s.ml}>Funnel URL</label>
                    <div style={{display:'flex',gap:0}}>
                      <div style={{background:'var(--blk)',border:'1px solid var(--b1)',borderRight:'none',padding:'10px 8px',fontFamily:'var(--fm)',fontSize:8,color:'var(--mu)',whiteSpace:'nowrap',borderRadius:'1px 0 0 1px'}}>goelev8.ai/f/</div>
                      <input type="text" className={s.mi} value={modalSlug} onChange={e => setModalSlug(e.target.value)} style={{borderRadius:'0 1px 1px 0'}} placeholder="your-business" />
                    </div>
                  </div>
                  <div className={s.mfooter}><span /><button className={s['m-next']} onClick={() => mStep(2)}>NEXT →</button></div>
                </div>
              )}

              {modalStep === 2 && (
                <div className={`${s.mp} ${s.act}`}>
                  <div className={s['plan-opts']}>
                    {[{k:'launch',n:'Launch',d:'Templates · 1 funnel · Chat · Store',p:'$99'},{k:'grow',n:'Grow',d:'Full AI system · Blasts · Portal · Store',p:'$199',pop:true},{k:'scale',n:'Scale',d:'Unlimited · White-label · Agency',p:'$397'}].map(pl => (
                      <div key={pl.k} className={`${s.popt} ${selectedPlan === pl.k ? s.sel : ''}`} onClick={() => mSel(pl.k)}>
                        <div className={s.pr2} />
                        <div className={s.pinfo}>
                          <div className={s.pname}>{pl.n} {pl.pop && <span style={{fontSize:7,color:'var(--cyan)',fontFamily:'var(--fm)'}}>POPULAR</span>}</div>
                          <div className={s.pdetail}>{pl.d}</div>
                        </div>
                        <div className={s.pprice}>{pl.p}<span style={{fontSize:9,color:'var(--mu)'}}>/mo</span></div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:10,padding:'9px 11px',background:'var(--cyan-f)',border:'1px solid rgba(0,207,255,.1)',borderRadius:1,fontSize:9,color:'var(--mu)',fontFamily:'var(--fm)'}}>// SMS CREDITS PURCHASED SEPARATELY · NEVER EXPIRE · $25 / $50 / $100</div>
                  <div className={s.mfooter}><button className={s['m-back']} onClick={() => mStep(1)}>← Back</button><button className={s['m-next']} onClick={() => mStep(3)}>NEXT →</button></div>
                </div>
              )}

              {modalStep === 3 && !modalSuccess && (
                <div className={`${s.mp} ${s.act}`}>
                  <div className={s.m2c}>
                    <div className={s.mf}><label className={s.ml}>First Name</label><input type="text" className={s.mi} value={modalFn} onChange={e => setModalFn(e.target.value)} placeholder="Aaron" autoComplete="given-name" /></div>
                    <div className={s.mf}><label className={s.ml}>Last Name</label><input type="text" className={s.mi} value={modalLn} onChange={e => setModalLn(e.target.value)} placeholder="Bryant" autoComplete="family-name" /></div>
                  </div>
                  <div className={s.mf}><label className={s.ml}>Email</label><input type="email" className={s.mi} value={modalEmail} onChange={e => setModalEmail(e.target.value)} placeholder="you@yourbusiness.com" autoComplete="email" /></div>
                  <div className={s.mf}><label className={s.ml}>Phone</label><input type="tel" className={s.mi} value={modalPhone} onChange={e => setModalPhone(e.target.value)} placeholder="+1 (314) 000-0000" autoComplete="tel" /></div>
                  <div style={{fontSize:9,color:'var(--mu)',fontFamily:'var(--fm)'}}>// CARD ON FILE · NO CHARGE UNTIL DAY 8 · CANCEL ANYTIME · 256-BIT ENCRYPTED</div>
                  <div className={s.mfooter}><button className={s['m-back']} onClick={() => mStep(2)}>← Back</button><button className={s['m-next']} onClick={() => setModalSuccess(true)}>START BUILDING FREE →</button></div>
                </div>
              )}

              {modalSuccess && (
                <div className={`${s.mp} ${s.act}`}>
                  <div className={s.succ}>
                    <div className={s['succ-icon']}>🚀</div>
                    <div className={s['succ-title']}>SYSTEM ACTIVE.</div>
                    <div className={s['succ-sub']}>// The GoElev8.AI Lead Acquisition System is spinning up your funnel now.</div>
                    <div className={s['succ-steps']}>
                      <div className={s['succ-step']}><div className={s['succ-n']}>1</div>Check email — setup link incoming</div>
                      <div className={s['succ-step']}><div className={s['succ-n']}>2</div>System generates your funnel (2–3 min)</div>
                      <div className={s['succ-step']}><div className={s['succ-n']}>3</div>Purchase SMS credits to activate messaging</div>
                      <div className={s['succ-step']}><div className={s['succ-n']}>4</div>Grow: activate your live AI phone agent</div>
                      <div className={s['succ-step']}><div className={s['succ-n']}>5</div>Day 8 — subscription starts automatically</div>
                    </div>
                    <button className={s['m-next']} style={{width:'100%',fontSize:13}} onClick={closeModal}>CLOSE &amp; CHECK EMAIL →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── WIZARD MODAL ── */}
      {wizardOpen && (
        <div className={`${s['wizard-overlay']} ${s.on}`} onClick={(e) => { if (e.target === e.currentTarget) closeWizard(); }} role="dialog" aria-modal="true" aria-label="Business prompt builder">
          <div className={s.wizard}>
            <div className={s['wiz-hd']}>
              <div className={s['wiz-title']}>BUILD YOUR SYSTEM</div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span className={s['wiz-step-indicator']}>STEP {wizStep + 1} OF {WIZARD_STEPS.length}</span>
                <button className={s['wiz-close']} onClick={closeWizard} aria-label="Close">✕</button>
              </div>
            </div>
            <div className={s['wiz-progress']}><div className={s['wiz-progress-fill']} style={{width:`${((wizStep + 1) / WIZARD_STEPS.length) * 100}%`}} /></div>
            <div className={s['wiz-body']}>
              <div className={s['wiz-q']}>{WIZARD_STEPS[wizStep].question}</div>
              <p className={s['wiz-hint']}>{WIZARD_STEPS[wizStep].hint}</p>

              {WIZARD_STEPS[wizStep].type === 'options' && (
                <div className={s['wiz-options']}>
                  {WIZARD_STEPS[wizStep].options!.map(opt => (
                    <button key={opt.value} className={`${s['wiz-opt']} ${wizData[WIZARD_STEPS[wizStep].id] === opt.value ? s.selected : ''}`} onClick={() => wizSelect(WIZARD_STEPS[wizStep].id, opt.value)}>
                      <span className={s['wiz-opt-icon']}>{opt.icon}</span>
                      <span><span className={s['wiz-opt-text']}>{opt.label}</span><span className={s['wiz-opt-sub']}>{opt.sub}</span></span>
                    </button>
                  ))}
                </div>
              )}

              {WIZARD_STEPS[wizStep].type === 'text' && (
                <input type="text" className={s['wiz-input']} placeholder={WIZARD_STEPS[wizStep].placeholder} value={wizData[WIZARD_STEPS[wizStep].id] || ''} onChange={e => setWizData(prev => ({...prev, [WIZARD_STEPS[wizStep].id]: e.target.value}))} onKeyDown={e => { if (e.key === 'Enter') wizNext(); }} />
              )}

              {WIZARD_STEPS[wizStep].type === 'textarea' && (
                <textarea className={s['wiz-input']} placeholder={WIZARD_STEPS[wizStep].placeholder} rows={3} value={wizData[WIZARD_STEPS[wizStep].id] || ''} onChange={e => setWizData(prev => ({...prev, [WIZARD_STEPS[wizStep].id]: e.target.value}))} />
              )}

              <div className={s['wiz-foot']}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  {wizStep > 0 && <button className={s['wiz-back']} onClick={wizBack}>← BACK</button>}
                  <button className={s['wiz-skip']} onClick={() => wizNext(true)}>Skip this step</button>
                </div>
                <button className={s['wiz-next']} onClick={() => wizNext()}>
                  {wizStep === WIZARD_STEPS.length - 1 ? 'BUILD MY SYSTEM →' : 'NEXT →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEAD CAPTURE MODAL ── */}
      {leadOpen && (
        <div className={`${s['lead-overlay']} ${s.on}`} onClick={(e) => { if (e.target === e.currentTarget) closeLead(); }} role="dialog" aria-modal="true" aria-label="Create your account">
          <div className={s['lead-modal']}>
            <div className={s['lead-hd']}>
              <button className={s['lead-close']} onClick={closeLead} aria-label="Close">✕</button>
              <Image src="/images/lev.png" alt="Lev AI" width={80} height={80} className={s['lead-lev']} style={{width:80,height:'auto',margin:'0 auto 12px',display:'block'}} />
              <div className={s['lead-title']}>YOUR SYSTEM IS READY TO BUILD.</div>
              <p className={s['lead-sub']}>Enter your info to <strong>start building free</strong> and activate your AI system. 7 days free — not charged until Day 8.</p>
            </div>

            {!leadSuccess ? (
              <div className={s['lead-body']}>
                <div className={s['lead-preview']}>
                  <div className={s['lead-preview-title']}>// What gets built for you</div>
                  <div className={s['lead-preview-item']}><span className={s['lpi-icon']}>🌐</span><span>Live page at <strong>goelev8.ai/f/your-slug</strong></span></div>
                  <div className={s['lead-preview-item']}><span className={s['lpi-icon']}>💬</span><span><strong>5-step SMS sequence</strong> — starts in 60 seconds</span></div>
                  <div className={s['lead-preview-item']}><span className={s['lpi-icon']}>📞</span><span><strong>AI phone agent</strong> calls leads in 5 minutes (Grow plan)</span></div>
                  <div className={s['lead-preview-item']}><span className={s['lpi-icon']}>📅</span><span><strong>Booking calendar</strong> — synced to Google Calendar</span></div>
                </div>
                <div className={s['lead-row']}>
                  <div className={s['lead-field']}>
                    <label className={s['lead-label']} htmlFor="lead_first">First Name</label>
                    <input type="text" className={s['lead-input']} id="lead_first" value={leadFirst} onChange={e => setLeadFirst(e.target.value)} placeholder="Aaron" autoComplete="given-name" />
                  </div>
                  <div className={s['lead-field']}>
                    <label className={s['lead-label']} htmlFor="lead_last">Last Name</label>
                    <input type="text" className={s['lead-input']} id="lead_last" value={leadLast} onChange={e => setLeadLast(e.target.value)} placeholder="Bryant" autoComplete="family-name" />
                  </div>
                </div>
                <div className={s['lead-field']}>
                  <label className={s['lead-label']} htmlFor="lead_email">Email Address</label>
                  <input type="email" className={s['lead-input']} id="lead_email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="you@yourbusiness.com" autoComplete="email" />
                </div>
                <div className={s['lead-field']}>
                  <label className={s['lead-label']} htmlFor="lead_phone">Phone Number</label>
                  <input type="tel" className={s['lead-input']} id="lead_phone" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="+1 (314) 555-0100" autoComplete="tel" />
                </div>
                <button className={s['lead-cta']} onClick={submitLead}>START BUILDING FREE →</button>
                <p className={s['lead-fine']}>7 days free &nbsp;·&nbsp; Card on file &nbsp;·&nbsp; Not charged until Day 8<br/>No contracts &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Your data is never sold<br/><span style={{color:'var(--wh4)'}}>By submitting you agree to receive SMS from GoElev8.ai. Reply STOP to opt out. Msg &amp; data rates may apply.</span></p>
              </div>
            ) : (
              <div className={`${s['lead-success']} ${s.show}`}>
                <div className={s['ls-icon']}>🚀</div>
                <div className={s['ls-title']}>YOU&apos;RE IN.</div>
                <p className={s['ls-sub']}>Check your email — your login link is on the way.<br/>Your AI system is building now. You&apos;ll have a live URL within 60 seconds.</p>
                <div className={s['ls-url']}>goelev8.ai/f/{(leadFirst + (leadLast ? '-' + leadLast : '')).toLowerCase().replace(/[^a-z0-9]+/g, '-')}</div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
