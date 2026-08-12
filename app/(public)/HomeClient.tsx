// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

// Root "/" — high-energy landing for cold social traffic. The AI Readiness
// Score quiz is ONE module among several; the full pitch/pricing lives at /warm.
// Brand system + quiz ported from the ai-landing.html reference.

import Image from 'next/image';
import Link from 'next/link';
import s from './home.module.css';
import QuizModule from './QuizModule';

function scrollToId(e: React.MouseEvent, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function HomeClient() {
  return (
    <main className={s.page}>
      <div className={s.gridField} aria-hidden="true" />

      <div className={`${s.statusbar} ${s.mono}`}>
        <span className={s.dot} /> SIGNAL RECEIVED · AI ADOPTION TRACKING LIVE
      </div>

      <div className={s.wrap}>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <header className={s.hero}>
          <div className={s.brandRow}>
            <Image src="/images/inverse-transparent-logo.png" alt="GoElev8.ai" width={132} height={32}
              style={{ height: 30, width: 'auto' }} priority />
          </div>
          <span className={`${s.eyebrow} ${s.mono}`}>THE AI SHIFT IS HERE</span>
          <h1 className={s.h1}>
            The biggest companies on earth are betting everything on AI.{' '}
            <span className={s.accent}>Why isn&apos;t your business?</span>
          </h1>
          <p className={s.sub}>
            GoElev8 builds custom AI agents that answer every call and text, qualify the lead, and
            book it — 24/7. See how ready you are in 60 seconds.
          </p>
          <div className={s.ctaRow}>
            <a href="#quiz" onClick={(e) => scrollToId(e, 'quiz')} className={s.btnPrimary}>
              Take the 60-Second AI Readiness Score →
            </a>
            <Link href="/warm" className={s.btnGhost}>See What We Do</Link>
          </div>
          <div className={s.scalePreview}>
            <span className={`${s.scaleLabel} ${s.mono}`}>EXPOSED</span>
            <div className={s.scaleTrack} />
            <span className={`${s.scaleLabel} ${s.mono}`}>READY</span>
          </div>
        </header>

        {/* ── Why it matters ───────────────────────────────────────── */}
        <section className={s.section}>
          <div className={`${s.sectionLabel} ${s.mono}`}>WHY THIS MATTERS</div>
          <h2 className={s.sectionH}>Speed is the whole game.</h2>
          <div className={s.statGrid}>
            <div className={s.statCard}>
              <div className={s.statNum}>47 hrs</div>
              <div className={s.statLabel}>average small-business follow-up time on a new lead</div>
            </div>
            <div className={s.statCard}>
              <div className={`${s.statNum} ${s.go}`}>5 min</div>
              <div className={s.statLabel}>and a fresh lead has already gone cold</div>
            </div>
            <div className={s.statCard}>
              <div className={`${s.statNum} ${s.warn}`}>80%</div>
              <div className={s.statLabel}>of conversions lost after 5 minutes of silence</div>
            </div>
          </div>
        </section>

        {/* ── Community / list framing ─────────────────────────────── */}
        <section className={s.section}>
          <div className={s.community}>
            <div className={s.communityInner}>
              <span className={`${s.opsBadge} ${s.mono}`}>◆ GOELEV8 AI OPERATORS</span>
              <h2 className={s.sectionH}>Join the AI Operators.</h2>
              <p className={s.sectionSub}>
                Operators are the local businesses putting AI on the front line before their
                competitors do. Take the score and you&apos;re in.
              </p>
              <div className={s.opsList}>
                <div className={s.opsItem}><span className={s.tick}>▸</span> Your AI Readiness Score + where you actually rank</div>
                <div className={s.opsItem}><span className={s.tick}>▸</span> First shot at the free agent builds — 10 per quarter</div>
                <div className={s.opsItem}><span className={s.tick}>▸</span> The systems and plays we use, as we ship them</div>
              </div>
              <a href="#quiz" onClick={(e) => scrollToId(e, 'quiz')} className={s.btnPrimary} style={{ margin: '0 auto' }}>
                Get My Score &amp; Join ↓
              </a>
            </div>
          </div>
        </section>

        {/* ── The quiz module ──────────────────────────────────────── */}
        <section className={s.section} id="quiz">
          <div className={`${s.sectionLabel} ${s.mono}`}>60-SECOND DIAGNOSTIC</div>
          <h2 className={s.sectionH}>What&apos;s your AI Readiness Score?</h2>
          <p className={s.sectionSub}>
            Answer 4 quick questions and see how exposed your business is to losing leads — and where
            you rank.
          </p>
          <QuizModule />
          <div className={`${s.trust} ${s.mono}`}>
            <span>🔒 256-bit Encrypted</span>
            <span>📱 Twilio + Vapi Powered</span>
            <span>🇺🇸 Built in St. Louis, MO</span>
          </div>
        </section>

        {/* ── Fun closing ──────────────────────────────────────────── */}
        <section className={s.section}>
          <div className={s.closing}>
            <p className={s.closingQuote}>
              &ldquo;Watching a good business lose a customer to a faster reply never sat right with us.&rdquo;
            </p>
            <p className={s.closingBody}>
              We&apos;re a St. Louis shop putting enterprise-grade AI in reach of the businesses that
              actually run this city — the gyms, the shops, the spas, the crews. If that&apos;s you,
              you&apos;re exactly who we built this for.
            </p>
            <div className={`${s.closingSig} ${s.mono}`}>— AARON BRYANT · FOUNDER</div>
          </div>
        </section>

        {/* ── Sibling program: The AI Exit Strategy ────────────────── */}
        <section className={s.taes}>
          <div className={`${s.taesEyebrow}`}>ALSO BUILDING</div>
          <div className={s.taesH}>The AI Exit Strategy</div>
          <p className={s.taesDesc}>
            Free AI literacy training for schools, nonprofits, and workforce organizations — no
            coding, no IT department required.
          </p>
          <a href="https://theaiexitstrategy.com" target="_blank" rel="noopener noreferrer" className={s.taesBtn}>
            Learn More →
          </a>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className={s.footer}>
          <nav className={s.footerLinks} aria-label="Footer">
            <Link href="/warm">Pricing</Link>
            <a href="https://book.goelev8.ai/go" target="_blank" rel="noopener noreferrer">Book a Call</a>
            <a href="/support">Support</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/sms-policy">SMS Policy</a>
          </nav>
          <div className={s.footerCopy}>
            // © {2026} GoElev8.ai | Aaron Bryant. All rights reserved.<br />
            <a href="https://goelev8.ai">goelev8.ai</a> · St. Louis, MO
          </div>
        </footer>
      </div>
    </main>
  );
}
