'use client';
// app/portal/leads/page.tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: 'funnel' | 'chat_widget' | 'manual' | 'demo';
  status: 'NEW' | 'CALLED' | 'SMS_SEQUENCE' | 'BOOKED' | 'DEAD';
  sms_step: number;
  funnel_id: string;
  created_at: string;
  funnels?: { business_name: string; slug: string } | null;
}

interface FunnelOption {
  id: string;
  business_name: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = ['All', 'NEW', 'CALLED', 'SMS_SEQUENCE', 'BOOKED', 'DEAD'] as const;

const STATUS_COLORS: Record<string, string> = {
  NEW: '#00CFFF',
  CALLED: '#00FF94',
  SMS_SEQUENCE: '#4F8EFF',
  BOOKED: '#00FF94',
  DEAD: '#4a4a4a',
};

const SOURCE_COLORS: Record<string, string> = {
  funnel: '#4F8EFF',
  chat_widget: '#9B59FF',
  manual: '#FFB800',
  demo: '#FF5F9E',
};

const PAGE_SIZE = 25;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function maskPhone(phone: string): string {
  if (!phone) return '---';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-' + digits;
  return '***-' + digits.slice(-4);
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    color: '#F5F5F5',
  } as React.CSSProperties,
  title: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '2rem',
    color: '#F5F5F5',
    margin: 0,
    letterSpacing: 1,
  } as React.CSSProperties,
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
    marginBottom: 24,
  } as React.CSSProperties,
  select: {
    background: '#0e0e0e',
    border: '1px solid #202020',
    borderRadius: 1,
    color: '#F5F5F5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    padding: '8px 12px',
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnCyan: {
    padding: '8px 18px',
    background: '#00CFFF',
    color: '#000',
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 14,
    border: 'none',
    borderRadius: 1,
    cursor: 'pointer',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  btnOutline: {
    padding: '6px 14px',
    background: 'transparent',
    color: '#999',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    border: '1px solid #202020',
    borderRadius: 1,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnRed: {
    padding: '6px 14px',
    background: 'transparent',
    color: '#FF3B3B',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    border: '1px solid #FF3B3B',
    borderRadius: 1,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnGreen: {
    padding: '6px 14px',
    background: 'transparent',
    color: '#00FF94',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    border: '1px solid #00FF94',
    borderRadius: 1,
    cursor: 'pointer',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '1px solid #181818',
    color: '#4a4a4a',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    fontWeight: 500,
  } as React.CSSProperties,
  td: {
    padding: '12px 12px',
    borderBottom: '1px solid #0e0e0e',
    color: '#F5F5F5',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,
  badge: (color: string) => ({
    display: 'inline-block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 1,
    background: color + '18',
    color,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  }) as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    color: '#4a4a4a',
    padding: '60px 20px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
  } as React.CSSProperties,
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  } as React.CSSProperties,
  modal: {
    background: '#0e0e0e',
    border: '1px solid #181818',
    borderRadius: 1,
    padding: 32,
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  } as React.CSSProperties,
  input: {
    background: '#181818',
    border: '1px solid #202020',
    borderRadius: 1,
    color: '#F5F5F5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  timestamp: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#999',
  } as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LeadsPage() {
  const supabase = createClientComponentClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnels, setFunnels] = useState<FunnelOption[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [funnelFilter, setFunnelFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFunnel, setImportFunnel] = useState('');
  const [importResult, setImportResult] = useState('');
  const [importing, setImporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Load funnels for filter */
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('funnels')
        .select('id, business_name')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setFunnels(data);
    })();
  }, [supabase]);

  /* Load leads */
  const loadLeads = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let query = supabase
      .from('leads')
      .select('*, funnels(business_name, slug)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    if (funnelFilter !== 'All') {
      query = query.eq('funnel_id', funnelFilter);
    }

    const { data } = await query;
    if (data) {
      if (reset) {
        setLeads(data as Lead[]);
      } else {
        setLeads((prev) => [...prev, ...(data as Lead[])]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [supabase, statusFilter, funnelFilter, page]);

  useEffect(() => {
    setPage(0);
    loadLeads(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, funnelFilter]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
  };

  useEffect(() => {
    if (page > 0) loadLeads(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* Actions */
  const markBooked = async (id: string) => {
    await supabase.from('leads').update({ status: 'BOOKED' }).eq('id', id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'BOOKED' as const } : l)));
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    await supabase.from('leads').delete().eq('id', id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  /* Import */
  const handleImport = async () => {
    if (!importFile || !importFunnel) return;
    setImporting(true);
    setImportResult('');
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('funnel_id', importFunnel);
      const res = await fetch('/api/leads/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult(`Imported ${data.imported ?? 0}, Skipped ${data.skipped ?? 0} duplicates`);
      loadLeads(true);
    } catch (err: any) {
      setImportResult(err.message);
    }
    setImporting(false);
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>Leads</h1>

      {/* Top bar */}
      <div style={s.topBar}>
        <select
          style={s.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o} value={o}>{o === 'All' ? 'All Statuses' : o.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          style={s.select}
          value={funnelFilter}
          onChange={(e) => setFunnelFilter(e.target.value)}
        >
          <option value="All">All Funnels</option>
          {funnels.map((f) => (
            <option key={f.id} value={f.id}>{f.business_name}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <button style={s.btnCyan} onClick={() => setShowImport(true)}>
          Import Leads
        </button>
      </div>

      {/* Table */}
      {leads.length === 0 && !loading ? (
        <div style={s.empty}>No leads yet. Share your funnel link to start capturing leads.</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Phone</th>
                  <th style={s.th}>Source</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>SMS Step</th>
                  <th style={s.th}>Created</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <>
                    <tr key={lead.id}>
                      <td style={s.td}>{lead.name || '(no name)'}</td>
                      <td style={{ ...s.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {maskPhone(lead.phone)}
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(SOURCE_COLORS[lead.source] || '#4a4a4a')}>
                          {lead.source}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(STATUS_COLORS[lead.status] || '#4a4a4a')}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ ...s.td, ...s.timestamp }}>{lead.sms_step ?? 0}/5</td>
                      <td style={{ ...s.td, ...s.timestamp }}>{relativeTime(lead.created_at)}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={s.btnOutline}
                            onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                          >
                            View
                          </button>
                          {lead.status !== 'BOOKED' && (
                            <button style={s.btnGreen} onClick={() => markBooked(lead.id)}>
                              Mark Booked
                            </button>
                          )}
                          <button style={s.btnRed} onClick={() => deleteLead(lead.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === lead.id && (
                      <tr key={lead.id + '-detail'}>
                        <td colSpan={7} style={{ ...s.td, background: '#0e0e0e', padding: 20 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            <div>
                              <div style={{ color: '#4a4a4a', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Full Phone</div>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{lead.phone || '---'}</div>
                            </div>
                            <div>
                              <div style={{ color: '#4a4a4a', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Email</div>
                              <div style={{ fontSize: 13 }}>{lead.email || '---'}</div>
                            </div>
                            <div>
                              <div style={{ color: '#4a4a4a', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Funnel</div>
                              <div style={{ fontSize: 13 }}>{(lead.funnels as any)?.business_name || '---'}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button style={s.btnOutline} onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {loading && leads.length === 0 && (
        <div style={{ ...s.empty, color: '#999' }}>Loading leads...</div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div style={s.overlay} onClick={() => setShowImport(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...s.title, fontSize: '1.4rem' }}>Import Leads</h2>
            <p style={{ color: '#999', fontSize: 13, margin: 0 }}>
              Upload a CSV file with columns: name, phone, email (optional)
            </p>

            <input
              type="file"
              accept=".csv"
              style={s.input}
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />

            <select
              style={s.select}
              value={importFunnel}
              onChange={(e) => setImportFunnel(e.target.value)}
            >
              <option value="">Select Funnel</option>
              {funnels.map((f) => (
                <option key={f.id} value={f.id}>{f.business_name}</option>
              ))}
            </select>

            <button
              style={{
                ...s.btnCyan,
                opacity: !importFile || !importFunnel || importing ? 0.5 : 1,
                cursor: !importFile || !importFunnel || importing ? 'not-allowed' : 'pointer',
              }}
              onClick={handleImport}
              disabled={!importFile || !importFunnel || importing}
            >
              {importing ? 'Uploading...' : 'Upload'}
            </button>

            {importResult && (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00FF94', margin: 0 }}>
                {importResult}
              </p>
            )}

            <button
              style={{ ...s.btnOutline, alignSelf: 'flex-end' }}
              onClick={() => { setShowImport(false); setImportResult(''); setImportFile(null); }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
