// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import { useState, useEffect } from 'react';

// ── CREDIT PACKS ──
const PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 25,
    credits: 500,
    bonus: 0,
    badge: null as string | null,
    color: '#444',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 60,
    credits: 1500,
    bonus: 200,
    badge: '🔥 Most Popular' as string | null,
    color: '#F5B800',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 175,
    credits: 5000,
    bonus: 1000,
    badge: 'Best Value' as string | null,
    color: '#22c55e',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 300,
    credits: 10000,
    bonus: 2500,
    badge: null as string | null,
    color: '#a78bfa',
  },
];

type Pack = (typeof PACKS)[number];

// ── TIERS ──
const TIERS = [
  { name: 'Presence', price: 99, included: 500 },
  { name: 'Visibility', price: 199, included: 1500 },
  { name: 'Dominance', price: 399, included: 5000 },
];

// ── USE CASE PRESETS ──
const PRESETS = [
  { label: 'Lead Follow-Ups Only', msgs: 150, description: 'Automated replies to new inquiries' },
  { label: 'Lead Follow-Ups + Reminders', msgs: 400, description: 'Follow-ups + appointment reminders' },
  { label: 'Small Broadcast Campaigns', msgs: 800, description: 'Promos to a list of ~400 people' },
  { label: 'Full Campaign Mode', msgs: 2000, description: 'Weekly broadcasts + all automations' },
  { label: 'High Volume', msgs: 5000, description: 'Large list blasts + full automation suite' },
];

const CREDIT_RATE = 0.05;

function formatNum(n: number): string {
  return n.toLocaleString();
}

function getBestPack(needed: number): Pack {
  const sorted = [...PACKS].sort((a, b) => (a.credits + a.bonus) - (b.credits + b.bonus));
  return sorted.find(p => (p.credits + p.bonus) >= needed) || PACKS[PACKS.length - 1];
}

function getMonthsCovered(pack: Pack, needed: number): string {
  if (needed === 0) return '∞';
  const months = Math.floor((pack.credits + pack.bonus) / needed);
  return months >= 12 ? '12+ months' : months === 1 ? '1 month' : `${months} months`;
}

// ── PACK CARD ──
function PackCard({
  pack, isRecommended, isSelected, onSelect,
}: {
  pack: Pack;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const total = pack.credits + pack.bonus;
  const perCredit = (pack.price / total).toFixed(3);
  const savings = Math.round((1 - Number(perCredit) / CREDIT_RATE) * 100);

  return (
    <div
      onClick={() => onSelect(pack.id)}
      style={{
        position: 'relative',
        background: isSelected
          ? `linear-gradient(145deg, ${pack.color}18, #1A1A1A)`
          : '#141414',
        border: `2px solid ${isSelected ? pack.color : isRecommended ? pack.color + '55' : '#2A2A2A'}`,
        borderRadius: 16,
        padding: '20px 18px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: isSelected ? 'translateY(-3px)' : 'none',
        boxShadow: isSelected ? `0 8px 32px ${pack.color}22` : 'none',
      }}
    >
      {/* Badge */}
      {pack.badge && (
        <div style={{
          position: 'absolute', top: -12, left: '50%',
          transform: 'translateX(-50%)',
          background: pack.color, color: pack.id === 'growth' ? '#0A0A0A' : '#fff',
          borderRadius: 20, padding: '3px 12px',
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
          letterSpacing: 0.5,
        }}>
          {pack.badge}
        </div>
      )}

      {/* Pack name & price */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22, letterSpacing: 1.5,
          color: isSelected ? pack.color : '#F0F0F0',
          marginBottom: 2,
        }}>{pack.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0' }}>${pack.price}</span>
          <span style={{ fontSize: 12, color: '#666' }}>one-time</span>
        </div>
      </div>

      {/* Credits */}
      <div style={{
        background: '#1E1E1E', borderRadius: 10, padding: '10px 12px',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>You get</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F0' }}>
          {formatNum(pack.credits)} credits
          {pack.bonus > 0 && (
            <span style={{
              marginLeft: 8, fontSize: 12, fontWeight: 600,
              color: '#22c55e', background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 20, padding: '2px 8px',
            }}>
              +{formatNum(pack.bonus)} FREE
            </span>
          )}
        </div>
        {pack.bonus > 0 && (
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
            {formatNum(total)} total credits
          </div>
        )}
      </div>

      {/* Per credit & savings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#555' }}>Per credit</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: pack.color }}>
            ${perCredit}
          </div>
        </div>
        {savings > 0 && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 8, padding: '4px 10px',
            fontSize: 12, fontWeight: 700, color: '#22c55e',
          }}>
            Save {savings}%
          </div>
        )}
      </div>

      {/* Selected check */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 22, height: 22, borderRadius: '50%',
          background: pack.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: pack.id === 'growth' ? '#0A0A0A' : '#fff',
          fontWeight: 700,
        }}>✓</div>
      )}
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [msgsPerMonth, setMsgsPerMonth] = useState(400);
  const [selectedTier, setSelectedTier] = useState(0);
  const [selectedPack, setSelectedPack] = useState('growth');
  const [activePreset, setActivePreset] = useState<number | null>(1);
  const [view, setView] = useState<'calculator' | 'packs' | 'explainer'>('calculator');
  const [clientSlug, setClientSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  async function startPackCheckout(packId: string) {
    setSubmitting(true);
    setBuyError(null);
    try {
      const res = await fetch('/api/smscalc/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId, client_slug: clientSlug.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setBuyError(data.error || 'Checkout could not start. Try again.');
    } catch {
      setBuyError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=Space+Mono&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0A0A0A; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      @keyframes shimmer { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
      input[type=range] { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; background: #2A2A2A; outline: none; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #F5B800; cursor: pointer; box-shadow: 0 0 0 3px rgba(245,184,0,0.2); }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 4px; }
    `;
    document.head.appendChild(style);
  }, []);

  const tier = TIERS[selectedTier];
  const includedCredits = tier.included;
  const neededExtra = Math.max(0, msgsPerMonth - includedCredits);
  const extraCost = neededExtra * CREDIT_RATE;
  const totalMonthlyCost = tier.price + extraCost;
  const bestPack = getBestPack(msgsPerMonth);
  const selectedPackData = PACKS.find(p => p.id === selectedPack);
  const monthsCovered = selectedPackData ? getMonthsCovered(selectedPackData, neededExtra) : '—';

  const tabs = [
    { id: 'calculator', label: '💬 Calculator' },
    { id: 'packs', label: '📦 Credit Packs' },
    { id: 'explainer', label: '❓ How It Works' },
  ];

  return (
    <div style={{
      background: '#0A0A0A', minHeight: '100vh',
      fontFamily: "'Inter', sans-serif", color: '#F0F0F0',
    }}>

      {/* HEADER */}
      <div style={{
        background: '#111', borderBottom: '1px solid #1E1E1E',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24, letterSpacing: 2, color: '#F5B800',
          }}>GoElev8.ai</div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10, color: '#555', letterSpacing: 1,
            textTransform: 'uppercase', marginTop: 1,
          }}>SMS Credit Calculator</div>
        </div>
        <div style={{
          background: 'rgba(245,184,0,0.08)',
          border: '1px solid rgba(245,184,0,0.2)',
          borderRadius: 20, padding: '6px 14px',
          fontSize: 12, color: '#F5B800', fontWeight: 600,
        }}>
          1 credit = 160 chars
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1E1E1E',
        background: '#0D0D0D', overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as 'calculator' | 'packs' | 'explainer')}
            style={{
              flex: 1, minWidth: 110, padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: view === tab.id ? '2px solid #F5B800' : '2px solid transparent',
              color: view === tab.id ? '#F5B800' : '#555',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >{tab.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* ── CALCULATOR VIEW ── */}
        {view === 'calculator' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>

            {/* Tier selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#666', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
                Your GoElev8.ai Plan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {TIERS.map((t, i) => (
                  <div
                    key={t.name}
                    onClick={() => setSelectedTier(i)}
                    style={{
                      background: selectedTier === i ? 'rgba(245,184,0,0.08)' : '#141414',
                      border: `2px solid ${selectedTier === i ? '#F5B800' : '#2A2A2A'}`,
                      borderRadius: 12, padding: '14px 12px',
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                    }}
                  >
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 16, letterSpacing: 1,
                      color: selectedTier === i ? '#F5B800' : '#888',
                      marginBottom: 4,
                    }}>{t.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#F0F0F0' }}>${t.price}<span style={{ fontSize: 11, color: '#555', fontWeight: 400 }}>/mo</span></div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                      {formatNum(t.included)} credits incl.
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Use case presets */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#666', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
                How Are You Using SMS?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PRESETS.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => { setActivePreset(i); setMsgsPerMonth(p.msgs); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: activePreset === i ? 'rgba(245,184,0,0.06)' : '#141414',
                      border: `1px solid ${activePreset === i ? '#F5B800' : '#2A2A2A'}`,
                      borderRadius: 10, padding: '12px 14px',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: activePreset === i ? '#F5B800' : '#F0F0F0' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{p.description}</div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: activePreset === i ? '#F5B800' : '#444',
                      whiteSpace: 'nowrap', marginLeft: 12,
                    }}>
                      ~{formatNum(p.msgs)}/mo
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual slider */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#666', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                  Fine-Tune Your Volume
                </div>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14, fontWeight: 700, color: '#F5B800',
                }}>
                  {formatNum(msgsPerMonth)} texts/mo
                </div>
              </div>
              <input
                type="range" min={50} max={10000} step={50}
                value={msgsPerMonth}
                onChange={e => { setMsgsPerMonth(Number(e.target.value)); setActivePreset(null); }}
                style={{ width: '100%', accentColor: '#F5B800' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444', marginTop: 4 }}>
                <span>50</span><span>10,000</span>
              </div>
            </div>

            {/* Results card */}
            <div style={{
              background: 'linear-gradient(145deg, #141414, #111)',
              border: '1px solid #2A2A2A',
              borderRadius: 16, overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{
                background: 'linear-gradient(90deg, rgba(245,184,0,0.1), transparent)',
                padding: '14px 20px',
                borderBottom: '1px solid #1E1E1E',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 16, letterSpacing: 2, color: '#F5B800',
              }}>
                YOUR MONTHLY BREAKDOWN
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Included */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#888' }}>Included with {tier.name}</div>
                    <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>Part of your ${tier.price}/mo plan</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                      {formatNum(Math.min(msgsPerMonth, includedCredits))} credits
                    </div>
                    <div style={{ fontSize: 12, color: '#444' }}>$0.00</div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#1E1E1E' }} />

                {/* Extra needed */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#888' }}>Additional credits needed</div>
                    <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>
                      {neededExtra > 0 ? `${formatNum(neededExtra)} × $0.05` : "None — you're covered!"}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: neededExtra > 0 ? '#F5B800' : '#22c55e' }}>
                      {neededExtra > 0 ? `${formatNum(neededExtra)} credits` : '✓ Covered'}
                    </div>
                    <div style={{ fontSize: 12, color: '#444' }}>
                      {neededExtra > 0 ? `$${extraCost.toFixed(2)}` : '$0.00'}
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#1E1E1E' }} />

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>Estimated Monthly Total</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#F5B800' }}>
                      ${totalMonthlyCost.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: '#444' }}>plan + credits</div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ padding: '0 20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444', marginBottom: 6 }}>
                  <span>Included credits used</span>
                  <span>{Math.min(100, Math.round((msgsPerMonth / includedCredits) * 100))}%</span>
                </div>
                <div style={{ height: 6, background: '#1E1E1E', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min(100, (msgsPerMonth / includedCredits) * 100)}%`,
                    background: msgsPerMonth > includedCredits
                      ? 'linear-gradient(90deg, #22c55e, #F5B800)'
                      : '#22c55e',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                {msgsPerMonth > includedCredits && (
                  <div style={{ fontSize: 11, color: '#F5B800', marginTop: 6, fontWeight: 600 }}>
                    ⚡ You&apos;re {formatNum(neededExtra)} credits over your plan limit — consider upgrading or buying a credit pack
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation */}
            {neededExtra > 0 && (
              <div style={{
                background: `linear-gradient(145deg, ${bestPack.color}12, #141414)`,
                border: `1px solid ${bestPack.color}44`,
                borderRadius: 14, padding: '16px 18px',
                marginBottom: 20, animation: 'fadeUp 0.3s ease',
              }}>
                <div style={{ fontSize: 12, color: '#666', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                  Recommended Pack
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: bestPack.color }}>
                      {bestPack.name} Pack — ${bestPack.price}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                      {formatNum(bestPack.credits + bestPack.bonus)} total credits · covers {getMonthsCovered(bestPack, neededExtra)} of overages
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedPack(bestPack.id); setView('packs'); }}
                    style={{
                      background: bestPack.color,
                      color: bestPack.id === 'growth' ? '#0A0A0A' : '#fff',
                      border: 'none', borderRadius: 20,
                      padding: '8px 18px', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >View Pack →</button>
                </div>
              </div>
            )}

            {msgsPerMonth <= includedCredits && (
              <div style={{
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 24 }}>✅</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                    Your plan covers everything
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                    {tier.name} includes {formatNum(includedCredits)} credits — more than enough for {formatNum(msgsPerMonth)} texts/mo. No extra costs.
                  </div>
                </div>
              </div>
            )}

            {/* ROI nudge */}
            <div style={{
              background: '#141414', border: '1px solid #2A2A2A',
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ fontSize: 28 }}>💡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0', marginBottom: 4 }}>The ROI reality check</div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                  Your total SMS cost at {formatNum(msgsPerMonth)} texts/mo is just <strong style={{ color: '#F5B800' }}>${(extraCost).toFixed(2)}/mo</strong> on top of your plan.
                  One new client booked from an automated follow-up pays for months of this.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PACKS VIEW ── */}
        {view === 'packs' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, color: '#F0F0F0', marginBottom: 6 }}>
                SMS CREDIT PACKS
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                Credits never expire. Buy once, use whenever. The more you buy, the less each text costs.
              </div>
            </div>

            {/* Auto-refill callout */}
            <div style={{
              background: 'rgba(245,184,0,0.06)',
              border: '1px solid rgba(245,184,0,0.2)',
              borderRadius: 12, padding: '12px 16px',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 20 }}>⚡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F5B800' }}>Auto-Refill = Extra 10% Free</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  Set your account to auto-refill when you hit 100 credits and get 10% bonus credits on every purchase — forever.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
              {PACKS.map(pack => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  isRecommended={pack.id === bestPack.id}
                  isSelected={selectedPack === pack.id}
                  onSelect={setSelectedPack}
                />
              ))}
            </div>

            {/* Selected pack summary */}
            {selectedPackData && (
              <div style={{
                background: `linear-gradient(145deg, ${selectedPackData.color}10, #141414)`,
                border: `1px solid ${selectedPackData.color}44`,
                borderRadius: 14, padding: '18px',
                animation: 'fadeUp 0.25s ease',
              }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Selected: {selectedPackData.name} Pack</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                  {[
                    { label: 'Total Credits', value: formatNum(selectedPackData.credits + selectedPackData.bonus) },
                    { label: 'Per Credit', value: `$${(selectedPackData.price / (selectedPackData.credits + selectedPackData.bonus)).toFixed(3)}` },
                    { label: 'Months Covered', value: monthsCovered },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: selectedPackData.color }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Optional: tell us which client account this is for */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{
                    display: 'block', fontSize: 11, color: '#666', letterSpacing: 1,
                    textTransform: 'uppercase', marginBottom: 6, fontWeight: 600,
                  }}>
                    Existing client? Enter your account slug (optional)
                  </label>
                  <input
                    type="text"
                    value={clientSlug}
                    onChange={e => setClientSlug(e.target.value)}
                    placeholder="e.g. roqbody, locs-and-wellness"
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: '#1A1A1A', border: '1px solid #2A2A2A',
                      borderRadius: 8, color: '#F0F0F0',
                      fontSize: 13, fontFamily: "'Inter', sans-serif",
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#444', marginTop: 6, lineHeight: 1.5 }}>
                    Skip this if you&apos;re new — we&apos;ll match by checkout email. Aaron applies credits within 1 business day.
                  </div>
                </div>

                <button
                  onClick={() => startPackCheckout(selectedPackData.id)}
                  disabled={submitting}
                  style={{
                    width: '100%', background: selectedPackData.color,
                    color: selectedPackData.id === 'growth' ? '#0A0A0A' : '#fff',
                    border: 'none', borderRadius: 25, padding: '14px',
                    fontSize: 15, fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    fontFamily: "'Inter', sans-serif", letterSpacing: 0.5,
                    transition: 'opacity 0.15s ease',
                  }}>
                  {submitting
                    ? 'Loading…'
                    : `Buy ${selectedPackData.name} Pack — $${selectedPackData.price}`}
                </button>
                {buyError ? (
                  <p style={{ marginTop: 10, color: '#ff6b6b', fontSize: 12, textAlign: 'center' }} role="alert">
                    {buyError}
                  </p>
                ) : null}
              </div>
            )}

            {/* Launch bonus */}
            <div style={{
              marginTop: 16,
              background: 'rgba(200,16,46,0.06)',
              border: '1px solid rgba(200,16,46,0.2)',
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 20 }}>🎁</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C8102E' }}>New Client Launch Bonus</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  Add a Growth Pack at setup and get it for $50 instead of $60. One time, never again.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPLAINER VIEW ── */}
        {view === 'explainer' && (
          <div style={{ animation: 'fadeUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 22, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, color: '#F0F0F0' }}>
              HOW SMS CREDITS WORK
            </div>

            {[
              {
                icon: '📏',
                title: '1 Credit = 1 Segment = 160 Characters',
                body: "Every text message is measured in segments. One segment holds up to 160 characters — that's a full, normal-length text message. Most automated messages (lead follow-ups, booking confirmations, reminders) fit comfortably in one segment.",
              },
              {
                icon: '✂️',
                title: 'What Happens If You Go Over 160 Characters?',
                body: "If your message goes over 160 characters, it splits into two segments — and uses 2 credits. We keep all automated messages under 160 characters so you're always using exactly 1 credit per text. For broadcasts you write yourself, we'll flag anything approaching the limit.",
              },
              {
                icon: '📦',
                title: 'Credits Are Included With Your Plan',
                body: 'Every GoElev8.ai plan comes with a monthly credit allowance. Presence gets 500 credits, Visibility gets 1,500, and Dominance gets 5,000. These reset every month and cover all your automated lead follow-ups, reminders, and confirmations.',
              },
              {
                icon: '🔋',
                title: 'Extra Credits Never Expire',
                body: "If you buy a credit pack, those credits sit in your account until you use them. No monthly reset, no expiration. Buying bigger means you're stocked up and ready the moment you want to run a campaign — no scrambling.",
              },
              {
                icon: '📢',
                title: 'Broadcast Campaigns Use More Credits',
                body: "Sending a promo to 500 people? That's 500 credits in one shot. Your monthly included credits are designed for automation — for big broadcasts, grab a Growth or Pro pack and you're covered for multiple campaigns.",
              },
              {
                icon: '📊',
                title: 'Your Dashboard Shows Everything',
                body: "Inside your GoElev8.ai portal you can see exactly how many credits you've used, how many are left, and a log of every message sent. No surprises, no mystery charges.",
              },
              {
                icon: '💬',
                title: 'Real Example: ROQ Body',
                body: "At Presence ($99/mo), ROQ Body gets 500 credits included. A typical month running lead follow-ups, booking confirmations, and appointment reminders uses around 300–400 messages — comfortably within the plan. The first time they want to blast a supplement promo to 400 people, they grab a Growth Pack ($60) and they're covered for months.",
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#141414', border: '1px solid #1E1E1E',
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{item.body}</div>
                </div>
              </div>
            ))}

            {/* Segment calculator mini */}
            <div style={{
              background: 'rgba(245,184,0,0.06)',
              border: '1px solid rgba(245,184,0,0.2)',
              borderRadius: 14, padding: '18px',
            }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1, color: '#F5B800', marginBottom: 12 }}>
                QUICK REFERENCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: '1 text message', credits: 1, chars: 'Up to 160 chars' },
                  { label: 'Long message', credits: 2, chars: '161–320 chars' },
                  { label: 'Very long message', credits: 3, chars: '321–480 chars' },
                  { label: 'Broadcast to 100 people', credits: 100, chars: '1 msg each' },
                  { label: 'Broadcast to 500 people', credits: 500, chars: '1 msg each' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < 4 ? '1px solid #1E1E1E' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#F0F0F0' }}>{row.label}</div>
                      <div style={{ fontSize: 11, color: '#444' }}>{row.chars}</div>
                    </div>
                    <div style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 14, fontWeight: 700, color: '#F5B800',
                    }}>
                      {row.credits} credit{row.credits !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        textAlign: 'center', padding: '16px',
        borderTop: '1px solid #1A1A1A',
        fontSize: 11, color: '#333',
        fontFamily: "'Space Mono', monospace",
      }}>
        © 2026 <a href="https://goelev8.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#F5B800', textDecoration: 'none' }}>GoElev8.ai</a> · Aaron Bryant · All rights reserved
      </div>
    </div>
  );
}
