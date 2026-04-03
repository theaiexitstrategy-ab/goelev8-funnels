'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const CSS = {
  '--blk': '#000', '--card': '#0e0e0e', '--b1': '#181818', '--b2': '#202020',
  '--cyan': '#00CFFF', '--grn': '#00FF94', '--red': '#FF3B3B', '--amber': '#FFB800',
  '--wh': '#F5F5F5', '--wh2': '#999', '--mu': '#4a4a4a',
} as Record<string, string>;

const plans = [
  { id: 'launch', name: 'Launch', price: 47, features: ['1 Funnel', '500 SMS Credits/mo', 'AI Chat Assistant'] },
  { id: 'grow', name: 'Grow', price: 97, features: ['3 Funnels', '2,000 SMS Credits/mo', 'SMS Blasts', 'Sequences'] },
  { id: 'scale', name: 'Scale', price: 197, features: ['Unlimited Funnels', '5,000 SMS Credits/mo', 'Priority Support', 'White Label'] },
];

const creditPackages = [
  { credits: 500, price: 10 },
  { credits: 1500, price: 25 },
  { credits: 5000, price: 70 },
];

export default function BillingPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setUser(profile);
      const { data: history } = await supabase
        .from('sms_credits_log')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setCreditHistory(history || []);
      setLoading(false);
    };
    load();
  }, []);

  const daysRemaining = () => {
    if (!user?.trial_ends_at) return 0;
    const diff = new Date(user.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleUpgrade = async (planId: string) => {
    setActionLoading(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_type: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) { console.error(e); }
    setActionLoading('');
  };

  const handleBuyCredits = async (pkg: typeof creditPackages[0]) => {
    setActionLoading(`credits-${pkg.credits}`);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credits', credits: pkg.credits, price: pkg.price }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) { console.error(e); }
    setActionLoading('');
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await fetch('/api/stripe/cancel', { method: 'POST' });
      setShowCancelModal(false);
      window.location.reload();
    } catch (e) { console.error(e); }
    setActionLoading('');
  };

  const handleDeleteAccount = async () => {
    setActionLoading('delete');
    try {
      await fetch('/api/auth/delete-account', { method: 'POST' });
      router.push('/');
    } catch (e) { console.error(e); }
    setActionLoading('');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#00CFFF', fontFamily: 'Bebas Neue, sans-serif', fontSize: 24 }}>Loading...</div>
    </div>
  );

  const currentTier = user?.tier || 'trial';
  const isTrial = currentTier === 'trial';

  return (
    <div style={{ minHeight: '100vh', background: CSS['--blk'], color: CSS['--wh'], fontFamily: 'DM Sans, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 40, color: CSS['--cyan'], margin: '0 0 32px' }}>
          Billing &amp; Plan
        </h1>

        {/* Current Plan */}
        <div style={{ background: CSS['--card'], border: `1px solid ${CSS['--b2']}`, borderRadius: 1, padding: 28, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: CSS['--wh'], margin: '0 0 16px' }}>Current Plan</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, background: CSS['--cyan'], color: CSS['--blk'], padding: '4px 12px', borderRadius: 1, textTransform: 'uppercase', fontWeight: 700 }}>
              {currentTier}
            </span>
            {!isTrial && (
              <span style={{ fontSize: 28, fontFamily: 'Bebas Neue, sans-serif', color: CSS['--wh'] }}>
                ${plans.find(p => p.id === currentTier)?.price || 0}/mo
              </span>
            )}
          </div>
          {user?.current_period_end && (
            <p style={{ color: CSS['--wh2'], fontSize: 14, margin: '8px 0 0' }}>
              Renews on {new Date(user.current_period_end).toLocaleDateString()}
            </p>
          )}
          {isTrial && (
            <div style={{ marginTop: 12, padding: 16, background: CSS['--b1'], borderRadius: 1, border: `1px solid ${CSS['--amber']}` }}>
              <p style={{ color: CSS['--amber'], fontWeight: 600, margin: 0 }}>
                {daysRemaining()} days remaining in trial
              </p>
              {user?.trial_ends_at && (
                <p style={{ color: CSS['--wh2'], fontSize: 13, margin: '6px 0 0' }}>
                  Your card will be charged on {new Date(user.trial_ends_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Change Plan */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: CSS['--wh'], margin: '0 0 20px' }}>Change Plan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {plans.map(plan => {
              const isCurrent = currentTier === plan.id;
              return (
                <div key={plan.id} style={{
                  background: CSS['--card'], border: `1px solid ${isCurrent ? CSS['--cyan'] : CSS['--b2']}`,
                  borderRadius: 1, padding: 24, position: 'relative',
                  boxShadow: isCurrent ? `0 0 20px ${CSS['--cyan']}33` : 'none',
                }}>
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, background: CSS['--cyan'], color: CSS['--blk'], padding: '2px 8px', borderRadius: 1, fontWeight: 700 }}>
                      CURRENT
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: CSS['--wh'], margin: '0 0 4px' }}>{plan.name}</h3>
                  <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: CSS['--cyan'], margin: '0 0 16px' }}>${plan.price}<span style={{ fontSize: 16, color: CSS['--wh2'] }}>/mo</span></p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ color: CSS['--wh2'], fontSize: 14, padding: '4px 0' }}>+ {f}</li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button onClick={() => handleUpgrade(plan.id)} disabled={actionLoading === plan.id} style={{
                      width: '100%', padding: '12px 0', background: CSS['--cyan'], color: CSS['--blk'],
                      border: 'none', borderRadius: 1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                      fontSize: 14, cursor: 'pointer', opacity: actionLoading === plan.id ? 0.6 : 1,
                    }}>
                      {actionLoading === plan.id ? 'Processing...' : 'Upgrade'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SMS Credits */}
        <div style={{ background: CSS['--card'], border: `1px solid ${CSS['--b2']}`, borderRadius: 1, padding: 28, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: CSS['--wh'], margin: '0 0 20px' }}>SMS Credits</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
            <div>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, color: CSS['--cyan'], margin: 0, lineHeight: 1 }}>
                {user?.sms_credits ?? 0}
              </p>
              <p style={{ color: CSS['--wh2'], fontSize: 13, margin: '4px 0 0' }}>credits remaining</p>
            </div>
            <button onClick={() => setShowCreditModal(true)} style={{
              padding: '12px 28px', background: CSS['--cyan'], color: CSS['--blk'], border: 'none',
              borderRadius: 1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Buy More
            </button>
          </div>

          {creditHistory.length > 0 && (
            <>
              <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: CSS['--wh2'], margin: '0 0 12px' }}>Purchase History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Date', 'Credits', 'Amount'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: CSS['--wh2'], borderBottom: `1px solid ${CSS['--b2']}`, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {creditHistory.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 12px', borderBottom: `1px solid ${CSS['--b1']}`, color: CSS['--wh2'] }}>{new Date(row.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '8px 12px', borderBottom: `1px solid ${CSS['--b1']}`, color: CSS['--grn'] }}>+{row.credits}</td>
                        <td style={{ padding: '8px 12px', borderBottom: `1px solid ${CSS['--b1']}`, color: CSS['--wh'] }}>${row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Danger Zone */}
        <div style={{ background: CSS['--card'], border: `1px solid ${CSS['--b2']}`, borderRadius: 1, padding: 28 }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: CSS['--red'], margin: '0 0 20px' }}>Danger Zone</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setShowCancelModal(true)} style={{
              padding: '12px 28px', background: CSS['--red'], color: '#fff', border: 'none',
              borderRadius: 1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Cancel Subscription
            </button>
            <button onClick={() => setShowDeleteModal(true)} style={{
              padding: '12px 28px', background: 'transparent', color: CSS['--red'],
              border: `1px solid ${CSS['--red']}`, borderRadius: 1, fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Delete Account
            </button>
          </div>
        </div>

        <p style={{ color: CSS['--mu'], fontSize: 12, textAlign: 'center', marginTop: 48 }}>
          &copy; 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
        </p>
      </div>

      {/* Credit Packages Modal */}
      {showCreditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreditModal(false)}>
          <div style={{ background: CSS['--card'], border: `1px solid ${CSS['--b2']}`, borderRadius: 1, padding: 32, maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: CSS['--cyan'], margin: '0 0 20px' }}>Buy SMS Credits</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {creditPackages.map(pkg => (
                <button key={pkg.credits} onClick={() => handleBuyCredits(pkg)} disabled={actionLoading === `credits-${pkg.credits}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', background: CSS['--b1'], border: `1px solid ${CSS['--b2']}`,
                  borderRadius: 1, cursor: 'pointer', color: CSS['--wh'],
                }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22 }}>{pkg.credits.toLocaleString()} Credits</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: CSS['--cyan'] }}>${pkg.price}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreditModal(false)} style={{
              marginTop: 16, width: '100%', padding: '10px', background: 'transparent',
              border: `1px solid ${CSS['--mu']}`, borderRadius: 1, color: CSS['--wh2'],
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCancelModal(false)}>
          <div style={{ background: CSS['--card'], border: `1px solid ${CSS['--red']}`, borderRadius: 1, padding: 32, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: CSS['--red'], margin: '0 0 12px' }}>Cancel Subscription?</h3>
            <p style={{ color: CSS['--wh2'], fontSize: 14, margin: '0 0 24px' }}>
              Your access will continue until the end of your current billing period. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleCancel} disabled={actionLoading === 'cancel'} style={{
                flex: 1, padding: '12px', background: CSS['--red'], color: '#fff', border: 'none',
                borderRadius: 1, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>
                {actionLoading === 'cancel' ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button onClick={() => setShowCancelModal(false)} style={{
                flex: 1, padding: '12px', background: 'transparent', color: CSS['--wh2'],
                border: `1px solid ${CSS['--mu']}`, borderRadius: 1, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>
                Keep Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: CSS['--card'], border: `1px solid ${CSS['--red']}`, borderRadius: 1, padding: 32, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: CSS['--red'], margin: '0 0 12px' }}>Delete Account?</h3>
            <p style={{ color: CSS['--wh2'], fontSize: 14, margin: '0 0 24px' }}>
              This will permanently delete your account, all funnels, leads, and data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleDeleteAccount} disabled={actionLoading === 'delete'} style={{
                flex: 1, padding: '12px', background: CSS['--red'], color: '#fff', border: 'none',
                borderRadius: 1, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete Forever'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} style={{
                flex: 1, padding: '12px', background: 'transparent', color: CSS['--wh2'],
                border: `1px solid ${CSS['--mu']}`, borderRadius: 1, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>
                Keep Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
