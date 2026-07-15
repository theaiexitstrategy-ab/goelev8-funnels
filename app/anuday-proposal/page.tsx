// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Sales proposal page for Adrianne Martin covering both of her businesses
// (A Nu Day Therapy + Free Flow Fitness). Original design + copy — does
// NOT reference any prior HTML proposal file in this repo.
//
// Scope: proposal + Stripe checkout only. The actual booking / SMS / Vapi
// automation is a separate build after this is approved.

import './proposal.css';
import CheckoutButton from './CheckoutButton';

export const metadata = {
  title: 'Proposal — A Nu Day Therapy & Free Flow Fitness | GoElev8.ai',
  description:
    'A founding-partner proposal from GoElev8.ai for A Nu Day Therapy and Free Flow Fitness — new Next.js sites, AI phone lines, and 60-second SMS follow-up.',
  robots: { index: false, follow: false }, // prospect-only, don't index
};

const PREPARED_DATE = 'July 2026';

export default function ProposalPage() {
  return (
    <div className="proposal">
      {/* Top bar */}
      <header className="top">
        <div className="brand">
          GO<strong>ELEV8</strong>.AI
        </div>
        <div className="meta">
          <span>Proposal</span>
          <span>Prepared for Adrianne Martin</span>
          <span>{PREPARED_DATE}</span>
        </div>
      </header>

      <div className="page">
        {/* HERO */}
        <div className="hero">
          <div className="eyebrow">Founding-Partner Proposal</div>
          <h1>
            Two businesses. <em>One clean handoff.</em>
          </h1>
          <p className="lede">
            A Nu Day Therapy and Free Flow Fitness both live on manual systems today &mdash;
            WordPress on one side, phone tag and paper intake on the other. The proposal below
            is what it takes to move both onto real automated infrastructure, at a founding-partner
            rate that&apos;s only available up-front, once.
          </p>
          <dl className="prepared">
            <div>
              <dt>Prepared For</dt>
              <dd>Adrianne Martin, MSW, LCSW</dd>
            </div>
            <div>
              <dt>Businesses</dt>
              <dd>A Nu Day Therapy · Free Flow Fitness</dd>
            </div>
            <div>
              <dt>Prepared By</dt>
              <dd>Aaron Bryant · GoElev8.ai</dd>
            </div>
          </dl>
        </div>

        {/* 01 — SITUATION */}
        <section className="chapter">
          <div className="marker">
            <span className="num">01</span>
            <span>The Situation</span>
            <span className="rule-h" />
          </div>
          <h2>
            What both businesses share right now: <em>manual everything.</em>
          </h2>
          <p>
            Leads come in on their own schedule &mdash; a call missed during a session, a form
            submitted at 9pm, a referral texting a personal number at midnight. The
            response happens whenever someone can get to it, which for a solo practice
            usually means the next morning. Sometimes longer.
          </p>
          <p>
            The measurable cost is the leads that go cold in the gap between
            &ldquo;interested&rdquo; and &ldquo;heard back.&rdquo; The less-measurable cost is
            the hours spent on phone tag and calendar-arithmetic that don&apos;t bill.
          </p>
          <p>
            This proposal is the plan to close that gap for both businesses at once.
          </p>
        </section>

        {/* 02 — A NU DAY THERAPY */}
        <section className="chapter">
          <div className="marker">
            <span className="num">02</span>
            <span>A Nu Day Therapy</span>
            <span className="rule-h" />
          </div>
          <h2>
            Rebuild the site around <em>one action:</em> booking the $100 consult.
          </h2>
          <p>
            The current WordPress site presents a menu of options. The new site presents a
            single primary path &mdash; the $100 / 30-minute consultation &mdash; with everything
            else (services, credentials, modalities) supporting that path rather than
            competing with it.
          </p>

          <h3>What&apos;s built during setup</h3>
          <ul>
            <li>
              New Next.js site at anudaytherapy.com, rebuilt around the consult as the
              primary conversion; hosting, SSL, and speed included.
            </li>
            <li>
              Consult booking form on the site that captures name, phone, and
              a two-line note about what&apos;s going on.
            </li>
            <li>
              <strong>60-second SMS follow-up:</strong> every form submission triggers an
              automatic text from your dedicated number confirming receipt and setting
              the tone before the human reply.
            </li>
            <li>
              <strong>Dedicated AI phone line:</strong> a Vapi assistant that can answer
              basic questions about your approach (DBT, crisis intervention, dance/movement)
              and book the $100 consult. Trained on your language, not a generic script.
            </li>
            <li>
              Client-side dashboard where every lead, booking, and SMS thread is visible in
              one place.
            </li>
          </ul>

          <div className="callout">
            <span className="label">Honest note · SimplePractice</span>
            <p>
              You use SimplePractice for scheduling and clinical notes.
              SimplePractice <strong>doesn&apos;t publish an API or webhooks</strong>, so
              there&apos;s no clean way to push a booking into it automatically or pull an
              appointment out of it. The practical result: a booking on the new site
              creates a lead in your GoElev8 dashboard, and you copy that into
              SimplePractice yourself when scheduling the actual session. SimplePractice
              stays your system of record for clinical notes; nothing about that changes.
              I&apos;d rather be straight with you about this now than sell you a seamless
              integration that doesn&apos;t exist.
            </p>
          </div>

          <dl className="pricing">
            <div className="row">
              <span className="label">Website setup (one-time)</span>
              <span className="price">
                <span className="was">$400</span>
                $200
              </span>
            </div>
            <div className="row">
              <span className="label">Monthly platform (recurring)</span>
              <span className="price">
                <span className="was">$99</span>
                $49.50 / mo
              </span>
            </div>
          </dl>

          <div className="actions">
            <CheckoutButton
              plan="anuday-setup"
              label="Start A Nu Day setup"
              amountLabel="→  $200"
              variant="primary"
            />
            <CheckoutButton
              plan="anuday-monthly"
              label="Start monthly (after go-live)"
              amountLabel="→  $49.50 / mo"
              variant="secondary"
            />
          </div>
        </section>

        {/* 03 — FREE FLOW FITNESS */}
        <section className="chapter">
          <div className="marker">
            <span className="num">03</span>
            <span>Free Flow Fitness</span>
            <span className="rule-h" />
          </div>
          <h2>
            Two booking flows on one site &mdash; <em>parties on one path, 1-on-1 on the other.</em>
          </h2>
          <p>
            Free Flow&apos;s two revenue streams don&apos;t behave the same way. A party inquiry
            needs headcount, date, and a group vibe; a 1-on-1 personal training inquiry
            needs goals, availability, and a single-person cadence. The new site treats
            them as separate paths from the first click, so the qualifying questions match
            what each caller actually cares about.
          </p>

          <h3>What&apos;s built during setup</h3>
          <ul>
            <li>
              New Next.js site with two clear top-level actions: <em>Book a Party</em> and{' '}
              <em>Book 1-on-1 Training</em>. No fumbling in a general contact form.
            </li>
            <li>
              Separate intake forms for each path &mdash; a party inquiry captures date,
              headcount, and event type; a 1-on-1 inquiry captures goals, current level,
              and availability.
            </li>
            <li>
              <strong>60-second SMS follow-up</strong> from a dedicated Free Flow number,
              tailored to which path the lead came from.
            </li>
            <li>
              <strong>Dedicated AI phone line:</strong> a Vapi assistant that asks the caller
              party-or-1-on-1 first, then branches into the right qualifying questions and
              books the consult.
            </li>
            <li>
              Same client dashboard as A Nu Day &mdash; each business gets its own view, but
              you sign in once.
            </li>
          </ul>

          <dl className="pricing">
            <div className="row">
              <span className="label">Website setup (one-time)</span>
              <span className="price">
                <span className="was">$400</span>
                $200
              </span>
            </div>
            <div className="row">
              <span className="label">Monthly platform (recurring)</span>
              <span className="price">
                <span className="was">$99</span>
                $49.50 / mo
              </span>
            </div>
          </dl>

          <div className="actions">
            <CheckoutButton
              plan="freeflow-setup"
              label="Start Free Flow setup"
              amountLabel="→  $200"
              variant="primary"
            />
            <CheckoutButton
              plan="freeflow-monthly"
              label="Start monthly (after go-live)"
              amountLabel="→  $49.50 / mo"
              variant="secondary"
            />
          </div>
        </section>

        {/* 04 — BUNDLED */}
        <section className="chapter">
          <div className="marker">
            <span className="num">04</span>
            <span>If You Do Both</span>
            <span className="rule-h" />
          </div>
          <h2>
            The founding-partner math, side by side.
          </h2>
          <p>
            Nothing to click here &mdash; this is just the total, so the discount is honest and
            visible.
          </p>

          <div className="bundle">
            <span className="label">Combined founding-partner terms</span>
            <div className="math">
              Website setup, both businesses <br />
              <span className="was">$800</span> &nbsp; <strong>$400 one-time</strong>
              <br />
              <br />
              Monthly platform, both businesses <br />
              <span className="was">$198 / mo</span> &nbsp; <strong>$99 / mo</strong>
            </div>
            <div className="savings">
              Year-one savings vs. standard rates: <strong>$1,588</strong> ($400 on setup + $99/mo × 12).
            </div>
          </div>

          <p style={{ marginTop: '20px' }}>
            The founding-partner rate is <strong>locked for as long as the account stays
            active</strong>. If you cancel and re-onboard later, it&apos;s standard pricing.
          </p>
        </section>

        {/* 05 — TIMELINE */}
        <section className="chapter">
          <div className="marker">
            <span className="num">05</span>
            <span>Timeline & Rollout</span>
            <span className="rule-h" />
          </div>
          <h2>
            Setup takes <em>5&ndash;7 business days</em> per business.
          </h2>
          <p>
            The setup fee kicks the clock off. Both businesses can run in parallel &mdash; A Nu
            Day and Free Flow are separate sites with separate phone numbers, so building
            one doesn&apos;t block the other.
          </p>
          <ul>
            <li>
              <strong>Day 0</strong>: Setup fee paid. I schedule a 30-min kickoff with you to
              confirm brand voice, phone-line greeting, and the two or three questions you
              want your consult form to ask.
            </li>
            <li>
              <strong>Days 1&ndash;5</strong>: I build the site, wire the AI phone line, and set
              up the SMS templates. You&apos;re not blocked on anything during this window.
            </li>
            <li>
              <strong>Day 6&ndash;7</strong>: We test end-to-end &mdash; call the AI line, submit
              the form, watch the SMS fire &mdash; and go live once you sign off.
            </li>
            <li>
              <strong>Monthly starts</strong> the day the new site goes live. Not before.
            </li>
          </ul>
        </section>

        {/* 06 — QUESTIONS */}
        <section className="chapter">
          <div className="marker">
            <span className="num">06</span>
            <span>Questions</span>
            <span className="rule-h" />
          </div>
          <h2>Things worth asking before you click.</h2>

          <dl className="faq">
            <dt>Why can&apos;t SimplePractice be integrated?</dt>
            <dd>
              SimplePractice doesn&apos;t publish an API or webhooks &mdash; there&apos;s no
              programmatic way for outside software to read or write in it. Your booking
              flow lives on GoElev8; your clinical notes stay in SimplePractice. This is a
              real tradeoff, not something I&apos;m hiding.
            </dd>

            <dt>What happens to the current anudaytherapy.com WordPress site?</dt>
            <dd>
              It stays live until the day the new one goes up. On go-live day I redirect
              the domain to the new site. No downtime for existing search traffic.
            </dd>

            <dt>Why two payments per business (setup + monthly)?</dt>
            <dd>
              Because they don&apos;t start at the same time. You pay setup to kick off the
              build; you start monthly once your new site is actually live and doing the
              work. If we combined them into one checkout, you&apos;d start paying monthly
              during the week I&apos;m still building.
            </dd>

            <dt>Can I cancel the monthly?</dt>
            <dd>
              Yes. Cancel from your Stripe portal, 30 days&apos; notice. The site stays yours;
              hosting and the AI phone line are the things that switch off.
            </dd>

            <dt>What if a caller to the AI line is in crisis?</dt>
            <dd>
              Non-negotiable safety behavior baked into the A Nu Day assistant: any signal
              of active suicidal ideation and it gives the caller the 988 Suicide &amp;
              Crisis Lifeline immediately, then offers to transfer to your direct line if
              you want that configured. It does not attempt to counsel. We test this before
              going live.
            </dd>

            <dt>Is this founding-partner rate a limited-time thing?</dt>
            <dd>
              Yes. It&apos;s tied to being one of the first two clients on this exact tier &mdash;
              once the price locks in, you keep it as long as the account is active, but
              the offer itself isn&apos;t re-opening.
            </dd>
          </dl>
        </section>
      </div>

      <footer className="foot">
        Prepared by Aaron Bryant &nbsp;·&nbsp; <a href="https://goelev8.ai">goelev8.ai</a> &nbsp;·&nbsp;{' '}
        <a href="mailto:ab@goelev8.ai">ab@goelev8.ai</a>
      </footer>
    </div>
  );
}
