// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Client demo page for Tarihya McClain's traffic ticket practice.
// Verbatim port of tariyha-intake-agent.html into a Next.js App Router
// page, with only these adaptations:
//   - CSS split out to demo.css (scoped under .mcclain-demo)
//   - metadata (title/description/openGraph) surfaced for URL previews
//   - SMS demo trigger added in the hero per spec — not present in
//     the source HTML but the URL and body text were spec'd
//     explicitly, so it's a specified addition, not an invention.
//
// The "Get started" buttons on the pricing cards and the final CTA now
// hit /api/checkout/mcclain, which creates a Stripe Checkout Session
// that combines the tier's one-time setup fee with the recurring
// monthly subscription in a single hosted checkout.

import './demo.css';
import TierButton from './TierButton';

const SMS_HREF = 'sms:+18883020649?&body=LAW';

const OG_TITLE = 'Intake & Distribution Agent — GoElev8.ai';
const OG_DESCRIPTION =
  "An intake system built for Tarihya McClain's traffic ticket practice — every lead gets a case number in under 60 seconds, routed to the right attorney and booked on the calendar automatically.";

export const metadata = {
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    type: 'website',
    url: 'https://goelev8.ai/mcclain/demo',
    siteName: 'GoElev8.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
};

export default function McclainDemoPage() {
  return (
    <div className="mcclain-demo">
      {/* HERO */}
      <div className="hero">
        <div className="wrap">
          <div className="eyebrow mono">Prepared for Tarihya McClain</div>
          <h1>
            Every lead gets a case number
            <br />
            <em>in under 60 seconds.</em>
          </h1>
          <p className="sub">
            An intake system built for a growing practice — so leads never sit waiting on the right attorney to notice them.
          </p>
          <div className="hero-cta">
            <a href="#pricing" className="btn btn-primary">
              See pricing
            </a>
            <a href="#how" className="btn btn-ghost">
              How it works
            </a>
          </div>

          {/* SMS DEMO TRIGGER — added per spec */}
          <div className="sms-trigger">
            <span className="mono">Try it live — no signup</span>
            <div className="sms-line">
              <a href={SMS_HREF} className="sms-link">
                Text <strong>LAW</strong> to (888) 302-0649
              </a>
              <span className="desktop-note">
                or open this page on your phone to tap-to-send
              </span>
            </div>
          </div>

          <div className="ticker">
            <div className="stamp">
              <div className="num">01 / DOCKET</div>
              <div className="label">RECEIVED</div>
              <div className="desc">Lead comes in from site, ad, or missed call</div>
            </div>
            <div className="stamp">
              <div className="num">02 / DOCKET</div>
              <div className="label">QUALIFIED</div>
              <div className="desc">County, ticket type, court date confirmed</div>
            </div>
            <div className="stamp">
              <div className="num">03 / DOCKET</div>
              <div className="label">ROUTED</div>
              <div className="desc">Assigned to the right attorney, automatically</div>
            </div>
            <div className="stamp">
              <div className="num">04 / DOCKET</div>
              <div className="label">BOOKED</div>
              <div className="desc">Consult confirmed by text, on the calendar</div>
            </div>
          </div>
        </div>
      </div>

      {/* THE SHIFT */}
      <section>
        <div className="wrap">
          <div className="section-label mono">The shift</div>
          <h2>What worked solo doesn&apos;t work at scale.</h2>
          <p className="lede">
            A shared inbox or group text was fine when it was just you answering leads. With a full staff, that same setup is where leads start to disappear.
          </p>

          <div className="compare">
            <div className="compare-before">
              <h3>Before</h3>
              <ul>
                <li>Leads sit in a shared inbox</li>
                <li>Everyone assumes someone else has it</li>
                <li>Response time depends on who&apos;s free</li>
                <li>No-shows just go cold</li>
              </ul>
            </div>
            <div className="compare-after">
              <h3>With the agent</h3>
              <ul>
                <li>Every lead answered in under 60 seconds</li>
                <li>Auto-routed to the right attorney</li>
                <li>Consults booked directly on the calendar</li>
                <li>Non-responders get automatic follow-up</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        style={{
          background: 'var(--white)',
          borderTop: '1px solid var(--cream-2)',
          borderBottom: '1px solid var(--cream-2)',
        }}
      >
        <div className="wrap">
          <div className="section-label mono">How it works</div>
          <h2>Four steps, no manual handoffs.</h2>

          <div className="flow">
            <div className="flow-item">
              <div className="flow-num">01</div>
              <div>
                <h3>Instant response</h3>
                <p>Website form, Google ad click, or missed call — the agent replies in under a minute, every time.</p>
              </div>
            </div>
            <div className="flow-item">
              <div className="flow-num">02</div>
              <div>
                <h3>Real qualification</h3>
                <p>Ticket type, county/court, violation date, and how close the court date is — the exact information your intake process needs.</p>
              </div>
            </div>
            <div className="flow-item">
              <div className="flow-num">03</div>
              <div>
                <h3>Automatic routing</h3>
                <p>Based on caseload, jurisdiction, or availability, the lead is assigned to the right attorney — no group chat required.</p>
              </div>
            </div>
            <div className="flow-item">
              <div className="flow-num">04</div>
              <div>
                <h3>Booking &amp; follow-up</h3>
                <p>Consult gets booked and confirmed by text. Anyone who doesn&apos;t book gets 2–3 automatic follow-ups over 48–72 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="wrap">
          <div className="section-label mono">Investment</div>
          <h2>Priced like a utility bill, not a project.</h2>
          <p className="lede">Start where it makes sense, add on as the team grows.</p>

          <div className="pricing">
            <div className="tier">
              <div className="tname">Base</div>
              <div className="tprice">
                $147<span>/mo</span>
              </div>
              <div className="tsetup mono">+ $497 one-time setup</div>
              <ul>
                <li>Instant lead response</li>
                <li>Qualification questions</li>
                <li>Direct calendar booking</li>
              </ul>
              <TierButton tier="base" variant="ghost" />
            </div>
            <div className="tier featured">
              <div className="tname">Growth</div>
              <div className="tprice">
                $297<span>/mo</span>
              </div>
              <div className="tsetup mono">+ $997 one-time setup</div>
              <ul>
                <li>Everything in Base</li>
                <li>Auto-routing across attorneys</li>
                <li>48–72hr follow-up nurture</li>
              </ul>
              <TierButton tier="growth" variant="primary" />
            </div>
            <div className="tier">
              <div className="tname">Full Scale</div>
              <div className="tprice">
                $497<span>/mo</span>
              </div>
              <div className="tsetup mono">+ $1,497 one-time setup</div>
              <ul>
                <li>Everything in Growth</li>
                <li>Case status text updates</li>
                <li>Client-facing automation</li>
              </ul>
              <TierButton tier="fullscale" variant="ghost" />
            </div>
          </div>

          <div className="addon">
            <div className="mono">ADD-ON</div>
            <div>
              <h3>Case Status Agent</h3>
              <p>
                For existing clients — automated &quot;where&apos;s my court date&quot; text updates. One of the biggest time drains on paralegal staff in traffic law, and a natural next phase once intake is live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — defaults to the featured Growth tier */}
      <div className="final">
        <div className="wrap">
          <h2>Let&apos;s get this running on your current lead flow.</h2>
          <p>A short pilot is the fastest way to see it live before committing to anything bigger.</p>
          <TierButton tier="growth" variant="primary" label="Get started" />
        </div>
      </div>

      <footer>
        Built by{' '}
        <a href="https://goelev8.ai" target="_blank" rel="noopener noreferrer">
          GoElev8.ai
        </a>{' '}
        — AI systems for growing service businesses.
      </footer>
    </div>
  );
}
