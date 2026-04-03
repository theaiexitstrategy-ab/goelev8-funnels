'use client';
// app/portal/page.tsx — Dashboard
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  created_at: string;
  email?: string;
  notes?: string;
}

interface Metrics {
  leadsThisMonth: number;
  activeSequences: number;
  bookedThisMonth: number;
  smsCredits: number;
}

interface SystemStatus {
  smsSequence: 'RUNNING' | 'PAUSED';
  aiAgent: 'ONLINE' | 'OFFLINE';
  twilio: 'ACTIVE' | 'PENDING';
  a2p: 'PENDING' | 'APPROVED' | 'SUBMITTED';
}

/* ------------------------------------------------------------------ */
/*  Style constants                                                    */
/* ------------------------------------------------------------------ */

const CARD: React.CSSProperties = {
  background: '#0e0e0e',
  border: '1px solid #181818',
  borderRadius: 1,
  padding: 24,
};

const LABEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  fontWeight: 400,
  color: '#999',
  marginBottom: 6,
};

const VALUE: React.CSSProperties = {
  fontFamily: "'Bebas Neue', cursive",
  fontSize: '2.5rem',
  color: '#F5F5F5',
  lineHeight: 1,
};

const BADGE_BASE: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  textTransform: 'uppercase',
  padding: '2px 8px',
  borderRadius: 1,
  letterSpacing: 0.5,
  fontWeight: 500,
  display: 'inline-block',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function maskPhone(phone: string): string {
  if (!phone) return '---';
  const digits = phone.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `***-${last4}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    new: { bg: '#00CFFF', color: '#000' },
    called: { bg: '#00FF94', color: '#000' },
    sms_sequence: { bg: '#2563eb', color: '#F5F5F5' },
    booked: { bg: '#00FF94', color: '#000' },
    dead: { bg: '#202020', color: '#999' },
  };
  const s = map[status] ?? { bg: '#202020', color: '#999' };
  return { ...BADGE_BASE, background: s.bg, color: s.color };
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'NEW',
    called: 'CALLED',
    sms_sequence: 'SMS',
    booked: 'BOOKED',
    dead: 'DEAD',
  };
  return map[status] ?? status.toUpperCase();
}

function sourceBadgeStyle(): React.CSSProperties {
  return {
    ...BADGE_BASE,
    background: '#181818',
    color: '#999',
  };
}

function systemDot(
  state: string,
  activeStates: string[],
  pendingStates: string[],
): React.CSSProperties {
  const lower = state.toLowerCase();
  if (activeStates.includes(lower))
    return { width: 8, height: 8, borderRadius: '50%', background: '#00FF94', flexShrink: 0 };
  if (pendingStates.includes(lower))
    return { width: 8, height: 8, borderRadius: '50%', background: '#FFB800', flexShrink: 0 };
  return { width: 8, height: 8, borderRadius: '50%', background: '#4a4a4a', flexShrink: 0 };
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

function Toast({ lead, onDismiss }: { lead: Lead; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 70,
        right: 32,
        zIndex: 100,
        background: '#0e0e0e',
        border: '1px solid #00CFFF',
        borderRadius: 1,
        padding: '12px 20px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        animation: 'toastIn 0.3s ease-out',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#00FF94',
          flexShrink: 0,
        }}
      />
      <span>
        New lead: <strong>{lead.name || 'Unknown'}</strong>
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#999',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 0 0 8px',
          lineHeight: 1,
        }}
      >
        &times;
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    leadsThisMonth: 0,
    activeSequences: 0,
    bookedThisMonth: 0,
    smsCredits: 0,
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<Lead | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    smsSequence: 'PAUSED',
    aiAgent: 'OFFLINE',
    twilio: 'PENDING',
    a2p: 'PENDING',
  });
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);

  /* keep a ref so the realtime callback always sees latest leads */
  const leadsRef = useRef<Lead[]>([]);
  leadsRef.current = leads;

  /* ---------------------------------------------------------------- */
  /*  Load initial data                                                */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      if (!cancelled) setUserId(uid);

      const monthStart = startOfMonth();

      /* parallel fetches */
      const [userRes, leadsMonthRes, seqRes, bookedRes, recentRes, funnelsRes] =
        await Promise.all([
          supabase.from('users').select('sms_credits').eq('id', uid).single(),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', uid)
            .gte('created_at', monthStart),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('status', 'sms_sequence'),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('status', 'booked')
            .gte('booked_at', monthStart),
          supabase
            .from('leads')
            .select('id, name, phone, source, status, created_at, email, notes')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('funnels')
            .select('vapi_assistant_id, twilio_number, a2p_status')
            .eq('user_id', uid),
        ]);

      if (cancelled) return;

      const credits = userRes.data?.sms_credits ?? 0;

      setMetrics({
        leadsThisMonth: leadsMonthRes.count ?? 0,
        activeSequences: seqRes.count ?? 0,
        bookedThisMonth: bookedRes.count ?? 0,
        smsCredits: credits,
      });

      setLeads(recentRes.data ?? []);

      /* system status */
      const funnels = funnelsRes.data ?? [];
      const hasVapi = funnels.some((f) => !!f.vapi_assistant_id);
      const hasTwilio = funnels.some((f) => !!f.twilio_number);
      const a2pRaw: string = funnels.find((f) => f.a2p_status)?.a2p_status ?? 'pending';

      setSystemStatus({
        smsSequence: credits > 0 ? 'RUNNING' : 'PAUSED',
        aiAgent: hasVapi ? 'ONLINE' : 'OFFLINE',
        twilio: hasTwilio ? 'ACTIVE' : 'PENDING',
        a2p: a2pRaw.toUpperCase() as SystemStatus['a2p'],
      });

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  /* ---------------------------------------------------------------- */
  /*  Realtime subscription                                            */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('dashboard-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Lead }) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => [newLead, ...prev].slice(0, 10));
          setMetrics((prev) => ({
            ...prev,
            leadsThisMonth: prev.leadsThisMonth + 1,
          }));
          setToast(newLead);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  /* ---------------------------------------------------------------- */
  /*  Funnel quick-launch                                              */
  /* ---------------------------------------------------------------- */

  const handleQuickLaunch = useCallback(() => {
    if (!prompt.trim()) return;
    router.push(`/onboarding?prompt=${encodeURIComponent(prompt.trim())}`);
  }, [prompt, router]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: '#999',
          fontSize: 14,
          padding: 32,
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  return (
    <>
      {/* Keyframe for toast + pulsing dot */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      {/* Toast */}
      {toast && <Toast lead={toast} onDismiss={() => setToast(null)} />}

      {/* ------------------------------------------------------------ */}
      {/*  HERO METRICS                                                 */}
      {/* ------------------------------------------------------------ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div style={CARD}>
          <div style={LABEL}>Leads This Month</div>
          <div style={VALUE}>{metrics.leadsThisMonth}</div>
        </div>
        <div style={CARD}>
          <div style={LABEL}>Active Sequences</div>
          <div style={VALUE}>{metrics.activeSequences}</div>
        </div>
        <div style={CARD}>
          <div style={LABEL}>Booked This Month</div>
          <div style={VALUE}>{metrics.bookedThisMonth}</div>
        </div>
        <div style={CARD}>
          <div style={LABEL}>SMS Credits</div>
          <div
            style={{
              ...VALUE,
              color: metrics.smsCredits < 50 ? '#FFB800' : '#F5F5F5',
            }}
          >
            {metrics.smsCredits}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  LIVE LEAD FEED                                               */}
      {/* ------------------------------------------------------------ */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#00FF94',
              animation: 'pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: '1.4rem',
              color: '#F5F5F5',
              margin: 0,
              letterSpacing: 0.5,
            }}
          >
            Live Lead Feed
          </h2>
        </div>

        <div
          style={{
            ...CARD,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {leads.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: '#4a4a4a',
              }}
            >
              No leads yet. They will appear here in real time.
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead.id}>
                <div
                  onClick={() =>
                    setExpandedId(expandedId === lead.id ? null : lead.id)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: '1px solid #181818',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: '#F5F5F5',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      '#0a0a0a';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      'transparent';
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 500 }}>
                    {lead.name || 'Unknown'}
                  </span>
                  <span style={{ color: '#999', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    {maskPhone(lead.phone)}
                  </span>
                  <span style={sourceBadgeStyle()}>
                    {lead.source || 'direct'}
                  </span>
                  <span style={statusBadgeStyle(lead.status)}>
                    {statusLabel(lead.status)}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: '#4a4a4a',
                      minWidth: 60,
                      textAlign: 'right',
                    }}
                  >
                    {relativeTime(lead.created_at)}
                  </span>
                </div>

                {/* Expanded details */}
                {expandedId === lead.id && (
                  <div
                    style={{
                      padding: '12px 20px 16px 32px',
                      background: '#0a0a0a',
                      borderBottom: '1px solid #181818',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: '#999',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span>
                      <strong style={{ color: '#F5F5F5' }}>Phone:</strong>{' '}
                      {lead.phone || '---'}
                    </span>
                    <span>
                      <strong style={{ color: '#F5F5F5' }}>Email:</strong>{' '}
                      {lead.email || '---'}
                    </span>
                    <span>
                      <strong style={{ color: '#F5F5F5' }}>Source:</strong>{' '}
                      {lead.source || 'direct'}
                    </span>
                    <span>
                      <strong style={{ color: '#F5F5F5' }}>Status:</strong>{' '}
                      {statusLabel(lead.status)}
                    </span>
                    {lead.notes && (
                      <span>
                        <strong style={{ color: '#F5F5F5' }}>Notes:</strong>{' '}
                        {lead.notes}
                      </span>
                    )}
                    <span>
                      <strong style={{ color: '#F5F5F5' }}>Created:</strong>{' '}
                      {new Date(lead.created_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  AI SYSTEM STATUS                                             */}
      {/* ------------------------------------------------------------ */}
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: '1.4rem',
            color: '#F5F5F5',
            margin: '0 0 16px',
            letterSpacing: 0.5,
          }}
        >
          AI System Status
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {/* SMS Sequence */}
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 10, padding: 16 }}>
            <div
              style={systemDot(
                systemStatus.smsSequence,
                ['running'],
                ['paused'],
              )}
            />
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 2,
                }}
              >
                SMS Sequence
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color:
                    systemStatus.smsSequence === 'RUNNING'
                      ? '#00FF94'
                      : '#FFB800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {systemStatus.smsSequence}
              </div>
            </div>
          </div>

          {/* AI Agent */}
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 10, padding: 16 }}>
            <div
              style={systemDot(
                systemStatus.aiAgent,
                ['online'],
                [],
              )}
            />
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 2,
                }}
              >
                AI Agent
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color:
                    systemStatus.aiAgent === 'ONLINE' ? '#00FF94' : '#4a4a4a',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {systemStatus.aiAgent}
              </div>
            </div>
          </div>

          {/* Twilio */}
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 10, padding: 16 }}>
            <div
              style={systemDot(
                systemStatus.twilio,
                ['active'],
                ['pending'],
              )}
            />
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 2,
                }}
              >
                Twilio
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color:
                    systemStatus.twilio === 'ACTIVE' ? '#00FF94' : '#FFB800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {systemStatus.twilio}
              </div>
            </div>
          </div>

          {/* A2P */}
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 10, padding: 16 }}>
            <div
              style={systemDot(
                systemStatus.a2p,
                ['approved'],
                ['pending', 'submitted'],
              )}
            />
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 2,
                }}
              >
                A2P
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color:
                    systemStatus.a2p === 'APPROVED'
                      ? '#00FF94'
                      : systemStatus.a2p === 'SUBMITTED'
                        ? '#00CFFF'
                        : '#FFB800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {systemStatus.a2p}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/*  FUNNEL QUICK-LAUNCH                                          */}
      {/* ------------------------------------------------------------ */}
      <div style={{ ...CARD, maxWidth: 520 }}>
        <h3
          style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: '1.2rem',
            color: '#F5F5F5',
            margin: '0 0 12px',
            letterSpacing: 0.5,
          }}
        >
          Build Another Funnel
        </h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your funnel idea..."
          rows={3}
          style={{
            width: '100%',
            background: '#060606',
            border: '1px solid #181818',
            borderRadius: 1,
            color: '#F5F5F5',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            padding: '10px 14px',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor =
              '#00CFFF';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor =
              '#181818';
          }}
        />
        <button
          onClick={handleQuickLaunch}
          disabled={!prompt.trim()}
          style={{
            marginTop: 10,
            background: prompt.trim() ? '#00CFFF' : '#181818',
            color: prompt.trim() ? '#000' : '#4a4a4a',
            border: 'none',
            borderRadius: 1,
            padding: '8px 20px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: prompt.trim() ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          Generate &rarr;
        </button>
      </div>
    </>
  );
}
