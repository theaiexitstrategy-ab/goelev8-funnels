// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

// AI Readiness Score quiz — ported 1:1 from the ai-landing.html reference
// (4 scored questions → contact gate → animated score reveal → scarcity →
// book.goelev8.ai/go calendar embed). Presented as one module inside the
// homepage scroll, not the whole page.

import { useEffect, useRef, useState } from 'react';
import s from './home.module.css';

type Opt = { v: number; t: string };
const QUESTIONS: { q: string; opts: Opt[] }[] = [
  {
    q: 'When someone calls or texts you after hours, what actually happens?',
    opts: [
      { v: 5, t: 'It sits until I see it — could be hours, could be tomorrow' },
      { v: 15, t: 'I try to get back to them same-day' },
      { v: 20, t: 'I have staff covering it most of the time' },
      { v: 25, t: 'Something responds instantly, 24/7' },
    ],
  },
  {
    q: 'How fast do you typically respond to a brand new lead?',
    opts: [
      { v: 5, t: 'Honestly, inconsistent — depends on the day' },
      { v: 10, t: 'Within a few hours' },
      { v: 15, t: 'Same day, usually' },
      { v: 25, t: 'Within minutes' },
    ],
  },
  {
    q: 'Do you know how many leads you lose to slow follow-up each month?',
    opts: [
      { v: 5, t: 'No idea, never tracked it' },
      { v: 12, t: 'I have a rough gut feel' },
      { v: 25, t: 'Yes — I track it closely' },
    ],
  },
  {
    q: 'How does someone actually book time with you right now?',
    opts: [
      { v: 5, t: 'Back-and-forth texting or phone tag' },
      { v: 12, t: "I use a booking tool, but it's not connected to anything else" },
      { v: 25, t: 'Fully automated — they book, I show up' },
    ],
  },
];

// TODO(Aaron): the "spots left" count is hardcoded. Wire it to a live count
// (e.g. Supabase: 10 minus claimed builds this quarter) instead of a static number.
const SPOTS_TOTAL = 10;
const SPOTS_LEFT = 4;

const RING_CIRCUMFERENCE = 327; // 2πr, r=52

function tierFor(total: number) {
  if (total <= 40) {
    return { tier: 'HIGH EXPOSURE', color: '#FF6B5E', desc: "You're likely losing leads every week and don't have visibility into how many. This is the highest-impact place to start." };
  }
  if (total <= 70) {
    return { tier: 'MODERATE RISK', color: '#F5B400', desc: "You've got some pieces in place, but real gaps in speed and tracking are still costing you bookings." };
  }
  return { tier: 'AI-READY', color: '#2FE6D8', desc: "You're already ahead of most competitors in your space. Automating what's left would compound that lead." };
}

export default function QuizModule() {
  const [phase, setPhase] = useState<'quiz' | 'gate' | 'result'>('quiz');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [displayNum, setDisplayNum] = useState(0);
  const [ringOffset, setRingOffset] = useState(RING_CIRCUMFERENCE);
  const [calShown, setCalShown] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const total = answers.reduce((a, b) => a + (b || 0), 0);
  const answeredAny = answers.some((v) => v != null);
  const { tier, color, desc } = tierFor(total);

  function choose(qIndex: number, value: number) {
    const next = [...answers];
    next[qIndex] = value;
    setAnswers(next);
    // brief pause so the "chosen" state is visible, matching the reference
    setTimeout(() => {
      if (qIndex + 1 < QUESTIONS.length) setCurrent(qIndex + 1);
      else setPhase('gate');
    }, 260);
  }

  function unlock() {
    const next: Record<string, boolean> = {};
    (['name', 'email', 'phone'] as const).forEach((k) => {
      if (!lead[k].trim()) next[k] = true;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: lead.name.trim(),
      email: lead.email.trim(),
      phone: lead.phone.trim(),
      readiness_score: total,
      source: 'social_video_funnel_quiz',
      created_at: new Date().toISOString(),
    };
    // TODO(Aaron): replace with a real submit — POST `payload` to a Supabase
    // Edge Function (insert into the GoElev8.ai leads table) and/or trigger the
    // Twilio 888-302-0649 auto-text follow-up here. Kept client-side only for now.
    // eslint-disable-next-line no-console
    console.log('lead captured', payload);

    setPhase('result');
  }

  // Animate the score number + ring once the result is shown.
  useEffect(() => {
    if (phase !== 'result') return;
    const step = Math.max(1, Math.round(total / 40));
    let n = 0;
    const anim = setInterval(() => {
      n = Math.min(total, n + step);
      setDisplayNum(n);
      if (n >= total) clearInterval(anim);
    }, 20);
    const raf = requestAnimationFrame(() => {
      setRingOffset(RING_CIRCUMFERENCE - (total / 100) * RING_CIRCUMFERENCE);
    });
    return () => { clearInterval(anim); cancelAnimationFrame(raf); };
  }, [phase, total]);

  function claim() {
    setClaimed(true);
    setCalShown(true);
    setTimeout(() => calRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  return (
    <div className={s.quiz}>
      {phase === 'quiz' && (
        <>
          <div className={s.qhead}>
            <span className={`${s.qcount} ${s.mono}`}>QUESTION {current + 1} / {QUESTIONS.length}</span>
            <span className={`${s.qcount} ${s.mono}`}>{answeredAny ? `RUNNING SCORE: ${total}` : ''}</span>
          </div>
          <div className={s.progressTrack}>
            <div className={s.progressFill} style={{ width: `${(current / QUESTIONS.length) * 100}%` }} />
          </div>
          <div className={s.qBlock}>
            <div className={s.qText}>{QUESTIONS[current].q}</div>
            {QUESTIONS[current].opts.map((o) => (
              <button
                key={o.t}
                type="button"
                className={`${s.opt} ${answers[current] === o.v ? s.chosen : ''}`}
                onClick={() => choose(current, o.v)}
              >
                {o.t}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'gate' && (
        <div className={s.qBlock}>
          <div className={s.gateIcon}>🔒</div>
          <h3 className={s.gateH}>Your score is ready.</h3>
          <p className={s.gateP}>Enter your info to unlock it — we&apos;ll also text you a copy so you don&apos;t lose it.</p>
          <div className={s.lockedScore}><span>YOUR SCORE:</span><span className={s.blur}>••</span></div>
          <label className={s.label}>Your name</label>
          <input
            type="text" placeholder="First name" autoComplete="given-name"
            className={`${s.input} ${errors.name ? s.inputError : ''}`}
            value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })}
          />
          <label className={s.label}>Email</label>
          <input
            type="email" placeholder="you@business.com" autoComplete="email"
            className={`${s.input} ${errors.email ? s.inputError : ''}`}
            value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })}
          />
          <label className={s.label}>Mobile number</label>
          <input
            type="tel" placeholder="(314) 555-0100" autoComplete="tel"
            className={`${s.input} ${errors.phone ? s.inputError : ''}`}
            value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })}
          />
          <button type="button" className={s.submitBtn} onClick={unlock}>Unlock My Score →</button>
          <div className={s.fineprint}>By submitting you agree to receive one SMS from GoElev8.ai. Standard rates apply. Reply STOP to opt out.</div>
        </div>
      )}

      {phase === 'result' && (
        <div className={s.qBlock}>
          <div className={s.scoreRing}>
            <svg viewBox="0 0 120 120">
              <circle className={s.scoreTrack} cx="60" cy="60" r="52" />
              <circle
                className={s.scoreFill} cx="60" cy="60" r="52"
                strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={ringOffset}
                style={{ stroke: color }}
              />
            </svg>
            <div className={s.scoreNum}><span className={s.n}>{displayNum}</span><span className={`${s.l} ${s.mono}`}>/ 100</span></div>
          </div>
          <span className={s.tierTag} style={{ color }}>{tier}</span>
          <p className={s.tierDesc}>{desc}</p>

          <div className={s.scarcity}>
            <div className={`${s.top} ${s.mono}`}>LIMITED THIS QUARTER</div>
            <div className={s.main}>We&apos;ll build your first AI agent free — no setup fee.</div>
            <div className={s.spots}>Only <strong>{SPOTS_TOTAL} spots</strong> this quarter. <strong>{SPOTS_LEFT}</strong> left.</div>
          </div>

          <button type="button" className={s.submitBtn} onClick={claim} disabled={claimed}>
            {claimed ? 'Locked In — Pick Your Time ↓' : 'Claim My Free Build →'}
          </button>

          {calShown && (
            <div className={s.calEmbed} ref={calRef}>
              <iframe src="https://book.goelev8.ai/go" title="Book your free AI strategy session" loading="lazy" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
