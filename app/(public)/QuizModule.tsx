// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// AI Readiness Score quiz — ported from the abandoned home-restructure
// branch (commit 9d678f7). Adapted for the current homepage:
//   - imports classes from page.module.css (not home.module.css), which now
//     contains restyled versions using the homepage's cyan/gold/DM Sans/
//     Bebas Neue/JetBrains Mono token system instead of the branch's
//     Space Grotesk / #2FE6D8 palette.
//   - unlock() now POSTs to /api/leads/quiz instead of console.logging.
//     That route inserts into the Supabase leads table AND fires a Twilio
//     confirmation SMS from +18883020649.
//
// 4 scored questions → contact gate (name/email/phone) → animated score
// reveal → free-build scarcity → book.goelev8.ai/go calendar embed.

'use client';

import { useEffect, useRef, useState } from 'react';
import s from './page.module.css';

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

// TODO(Aaron): "spots left" is hardcoded. Wire to a live count later
// (e.g. Supabase: 10 minus claimed builds this quarter).
const SPOTS_TOTAL = 10;
const SPOTS_LEFT = 4;

const RING_CIRCUMFERENCE = 327; // 2πr, r=52

function tierFor(total: number) {
  if (total <= 40) {
    return {
      tier: 'HIGH EXPOSURE',
      color: '#FF3B3B',
      desc: "You're likely losing leads every week and don't have visibility into how many. This is the highest-impact place to start.",
    };
  }
  if (total <= 70) {
    return {
      tier: 'MODERATE RISK',
      color: '#C9A84C',
      desc: "You've got some pieces in place, but real gaps in speed and tracking are still costing you bookings.",
    };
  }
  return {
    tier: 'AI-READY',
    color: '#00CFFF',
    desc: "You're already ahead of most competitors in your space. Automating what's left would compound that lead.",
  };
}

export default function QuizModule() {
  // 'teaser' is the activation gate — a value-forward card with a single
  // CTA that transitions to 'quiz' on click. Keeps first-paint clean and
  // frames the quiz as an intentional offer rather than a stray form
  // sitting in the hero.
  const [phase, setPhase] = useState<'teaser' | 'quiz' | 'gate' | 'result'>('teaser');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [displayNum, setDisplayNum] = useState(0);
  const [ringOffset, setRingOffset] = useState(RING_CIRCUMFERENCE);
  const [calShown, setCalShown] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const calRef = useRef<HTMLDivElement>(null);

  const total = answers.reduce((a, b) => a + (b || 0), 0);
  const answeredAny = answers.some((v) => v != null);
  const { tier, color, desc } = tierFor(total);

  function choose(qIndex: number, value: number) {
    const next = [...answers];
    next[qIndex] = value;
    setAnswers(next);
    setTimeout(() => {
      if (qIndex + 1 < QUESTIONS.length) setCurrent(qIndex + 1);
      else setPhase('gate');
    }, 260);
  }

  async function unlock() {
    const next: Record<string, boolean> = {};
    (['name', 'email', 'phone'] as const).forEach((k) => {
      if (!lead[k].trim()) next[k] = true;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setSubmitError(null);

    // Score reveal + backend submit run in parallel. If the backend fails
    // the user still sees their score — we log the error and let Aaron
    // find it in Vercel logs. Never block the reveal on a network hiccup.
    void fetch('/api/leads/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lead.name.trim(),
        email: lead.email.trim(),
        phone: lead.phone.trim(),
        readiness_score: total,
        tier,
        answers: answers.map((v, i) => ({ q: QUESTIONS[i].q, v })),
      }),
    })
      .then((r) => r.ok || Promise.reject(r.statusText))
      .catch((err) => {
        console.error('[quiz] lead submit failed:', err);
        setSubmitError('(Heads up: we couldn’t send your confirmation text. Your score is still yours.)');
      });

    setPhase('result');
    setSubmitting(false);
  }

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
    return () => {
      clearInterval(anim);
      cancelAnimationFrame(raf);
    };
  }, [phase, total]);

  function claim() {
    setClaimed(true);
    setCalShown(true);
    setTimeout(
      () => calRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60,
    );
  }

  return (
    <div className={s.quiz}>
      {phase === 'teaser' && (
        <div className={s.qteaser}>
          <div className={s.qteaserEyebrow}>Free · 60 seconds · Your score</div>
          <h3 className={s.qteaserH}>
            How AI-Ready Is<br />
            Your Business?
          </h3>
          <ul className={s.qteaserBullets}>
            <li>Instant score + tier assessment</li>
            <li>Personalized action plan by SMS</li>
            <li>Zero sales pitch — just insight</li>
          </ul>
          <button
            type="button"
            className={s.qteaserBtn}
            onClick={() => setPhase('quiz')}
          >
            Get My AI Readiness Score →
          </button>
          <div className={s.qteaserFine}>
            Free forever · Score delivered by SMS + email · Reply STOP anytime
          </div>
        </div>
      )}

      {phase === 'quiz' && (
        <>
          <div className={s.qhead}>
            <span className={s.qcount}>
              QUESTION {current + 1} / {QUESTIONS.length}
            </span>
            <span className={s.qcount}>
              {answeredAny ? `SCORE: ${total}` : ''}
            </span>
          </div>
          <div className={s.progressTrack}>
            <div
              className={s.progressFill}
              style={{ width: `${(current / QUESTIONS.length) * 100}%` }}
            />
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
          <p className={s.gateP}>
            Enter your info to unlock it — we&apos;ll also text you a copy so you don&apos;t lose it.
          </p>
          <div className={s.lockedScore}>
            <span>YOUR SCORE:</span>
            <span className={s.blur}>••</span>
          </div>
          <label className={s.qlabel}>Your name</label>
          <input
            type="text"
            placeholder="First name"
            autoComplete="given-name"
            className={`${s.qinput} ${errors.name ? s.inputError : ''}`}
            value={lead.name}
            onChange={(e) => setLead({ ...lead, name: e.target.value })}
          />
          <label className={s.qlabel}>Email</label>
          <input
            type="email"
            placeholder="you@business.com"
            autoComplete="email"
            className={`${s.qinput} ${errors.email ? s.inputError : ''}`}
            value={lead.email}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
          />
          <label className={s.qlabel}>Mobile number</label>
          <input
            type="tel"
            placeholder="(314) 555-0100"
            autoComplete="tel"
            className={`${s.qinput} ${errors.phone ? s.inputError : ''}`}
            value={lead.phone}
            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
          />
          <button
            type="button"
            className={s.qsubmit}
            onClick={unlock}
            disabled={submitting}
          >
            {submitting ? 'Unlocking…' : 'Unlock My Score →'}
          </button>
          <div className={s.fineprint}>
            By submitting you agree to receive one SMS from GoElev8.ai. Standard rates apply. Reply STOP to opt out.
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className={s.qBlock}>
          <div className={s.scoreRing}>
            <svg viewBox="0 0 120 120">
              <circle className={s.scoreTrack} cx="60" cy="60" r="52" />
              <circle
                className={s.scoreFill}
                cx="60"
                cy="60"
                r="52"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                style={{ stroke: color }}
              />
            </svg>
            <div className={s.scoreNum}>
              <span className={s.scoreN}>{displayNum}</span>
              <span className={s.scoreL}>/ 100</span>
            </div>
          </div>
          <span className={s.tierTag} style={{ color }}>
            {tier}
          </span>
          <p className={s.tierDesc}>{desc}</p>

          <div className={s.scarcity}>
            <div className={s.scarcityTop}>LIMITED THIS QUARTER</div>
            <div className={s.scarcityMain}>
              We&apos;ll build your first AI agent free — no setup fee.
            </div>
            <div className={s.scarcitySpots}>
              Only <strong>{SPOTS_TOTAL} spots</strong> this quarter.{' '}
              <strong>{SPOTS_LEFT}</strong> left.
            </div>
          </div>

          <button
            type="button"
            className={s.qsubmit}
            onClick={claim}
            disabled={claimed}
          >
            {claimed ? 'Locked In — Pick Your Time ↓' : 'Claim My Free Build →'}
          </button>

          {submitError ? (
            <div className={s.fineprint} style={{ color: '#FF3B3B', marginTop: 8 }}>
              {submitError}
            </div>
          ) : null}

          {calShown && (
            <div className={s.calEmbed} ref={calRef}>
              <iframe
                src="https://book.goelev8.ai/go"
                title="Book your free AI strategy session"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
