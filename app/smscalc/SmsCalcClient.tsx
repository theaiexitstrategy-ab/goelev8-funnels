// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import { useMemo, useState } from 'react';

// TEMPORARY pricing scaffolding — swap with the real
// goelev8-sms-calculator.jsx component when Aaron sends it.
const PLAN_INCLUDED = 500;
const PACK_RATE_PER_CREDIT = 0.05;    // $25 / 500 credits = $0.05 per credit
const MIN_PACK_DOLLARS = 25;
const GOLD = '#F5B800';
const BODY = '"Inter", system-ui, -apple-system, sans-serif';
const DISPLAY = '"Bebas Neue", sans-serif';

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function SmsCalcClient() {
  const [monthlyText, setMonthlyText] = useState('1000');

  const monthly = Math.max(0, Number(monthlyText) || 0);
  const calc = useMemo(() => {
    const overage = Math.max(0, monthly - PLAN_INCLUDED);
    const overageCostDollars = Math.max(
      overage > 0 ? MIN_PACK_DOLLARS : 0,
      Math.ceil(overage * PACK_RATE_PER_CREDIT),
    );
    return {
      included: Math.min(monthly, PLAN_INCLUDED),
      overage,
      overageCostDollars,
      total: 99 + overageCostDollars,
    };
  }, [monthly]);

  return (
    <div style={{
      background: '#000',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: BODY,
      padding: '40px 20px',
    }}>
      <main style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
          color: GOLD, margin: '0 0 12px', fontWeight: 600,
        }}>
          SMS Pricing
        </p>
        <h1 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(36px, 6vw, 56px)',
          letterSpacing: 1.5, lineHeight: 1, margin: '0 0 12px', fontWeight: 400,
        }}>
          How many <span style={{ color: GOLD }}>credits</span> do you need?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.55, margin: '0 0 32px' }}>
          Your GoElev8.ai plan includes <strong style={{ color: '#fff' }}>{PLAN_INCLUDED} SMS credits / month</strong>. One credit = one text up to 160 characters. Need more? Buy credit packs starting at <strong style={{ color: GOLD }}>${MIN_PACK_DOLLARS}</strong>.
        </p>

        <div style={{
          background: '#0a0a0a',
          border: `1px solid ${GOLD}55`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}>
          <label style={{
            display: 'block', fontSize: 12, letterSpacing: 1.5,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
            marginBottom: 10,
          }}>
            Estimated SMS sent per month
          </label>
          <input
            type="number"
            min={0}
            value={monthlyText}
            onChange={(e) => setMonthlyText(e.target.value)}
            inputMode="numeric"
            style={{
              width: '100%',
              background: '#000', color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 6,
              padding: '14px 16px',
              fontSize: 24, fontFamily: DISPLAY, letterSpacing: 1,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
          <Row label="Included in your plan" value={`${calc.included.toLocaleString()} credits`} />
          <Row label="Overage" value={calc.overage > 0 ? `${calc.overage.toLocaleString()} credits` : 'none'} />
          <Row
            label="Credit pack needed"
            value={calc.overage > 0 ? `$${calc.overageCostDollars}` : '—'}
          />
          <Row
            label="Total monthly cost"
            value={`$${calc.total.toFixed(2)}`}
            highlight
          />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.55, marginBottom: 32 }}>
          Heads up: this is a working estimate while Aaron finalizes the live calculator. Final per-credit price may differ — current placeholder is {dollars(PACK_RATE_PER_CREDIT * 100)} per credit with a ${MIN_PACK_DOLLARS} minimum top-up.
        </p>

        <a
          href="mailto:ab@goelev8.ai?subject=SMS credits"
          style={{
            display: 'inline-block',
            background: GOLD, color: '#000',
            padding: '13px 26px',
            borderRadius: 4,
            textDecoration: 'none',
            fontWeight: 700, fontSize: 13,
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}
        >
          Buy Credit Pack →
        </a>

        <footer style={{
          marginTop: 60, paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center', color: 'rgba(255,255,255,0.4)',
          fontSize: 12, lineHeight: 1.55,
        }}>
          © 2026 GoElev8.ai | Aaron Bryant ·{' '}
          <a href="https://goelev8.ai" style={{ color: GOLD, textDecoration: 'none' }}>goelev8.ai</a>
        </footer>
      </main>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '14px 18px',
      background: highlight ? `${GOLD}11` : '#0a0a0a',
      border: highlight ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6,
    }}>
      <span style={{
        fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
        color: highlight ? GOLD : 'rgba(255,255,255,0.55)', fontWeight: 600,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: highlight ? DISPLAY : BODY,
        fontSize: highlight ? 26 : 16,
        letterSpacing: highlight ? 1 : 0,
        color: highlight ? GOLD : '#fff',
        fontWeight: highlight ? 400 : 600,
      }}>
        {value}
      </span>
    </div>
  );
}
