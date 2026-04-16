// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useEffect, useState, useCallback } from 'react';

type VapiCall = {
  id: string;
  call_id: string;
  caller_number: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  ended_reason: string | null;
  transcript: string | null;
  recording_url: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;

export default function LevCallsPage() {
  const [calls, setCalls] = useState<VapiCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/lev-calls?page=${page}&limit=${PAGE_SIZE}`);
      if (res.status === 403) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setCalls(data.calls || []);
      setTotal(data.total || 0);
      setAuthorized(true);
    } catch {
      setCalls([]);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { loadCalls(); }, [loadCalls]);

  if (authorized === false) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.h2}>Access Denied</h2>
          <p style={styles.muted}>This page is restricted to admin users.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  }

  function formatDuration(s: number | null) {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  function formatPhone(num: string | null) {
    if (!num) return '—';
    const d = num.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) {
      return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    }
    if (d.length === 10) {
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    }
    return num;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Lev Calls</h1>
        <span style={styles.badge}>{total} total call{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div style={styles.card}>
          <p style={styles.muted}>Loading...</p>
        </div>
      ) : calls.length === 0 ? (
        <div style={styles.card}>
          <p style={styles.muted}>No calls logged yet. Calls from the Lev assistant will appear here automatically.</p>
        </div>
      ) : (
        <>
          <div style={styles.table}>
            <div style={styles.thead}>
              <div style={{ ...styles.th, flex: 2 }}>Caller</div>
              <div style={{ ...styles.th, flex: 2 }}>Date & Time</div>
              <div style={{ ...styles.th, flex: 1 }}>Duration</div>
              <div style={{ ...styles.th, flex: 1.5 }}>Ended</div>
              <div style={{ ...styles.th, flex: 1 }}>Transcript</div>
              <div style={{ ...styles.th, flex: 1 }}>Recording</div>
            </div>
            {calls.map(call => (
              <div key={call.id}>
                <div style={styles.row}>
                  <div style={{ ...styles.td, flex: 2, fontFamily: 'var(--fm, monospace)', fontSize: 12 }}>
                    {formatPhone(call.caller_number)}
                  </div>
                  <div style={{ ...styles.td, flex: 2 }}>
                    {formatDate(call.started_at)}
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    {formatDuration(call.duration_seconds)}
                  </div>
                  <div style={{ ...styles.td, flex: 1.5 }}>
                    <span style={{
                      ...styles.reasonBadge,
                      background: call.ended_reason === 'customer-ended-call' ? 'rgba(0,207,255,.08)' :
                        call.ended_reason === 'assistant-ended-call' ? 'rgba(0,255,148,.08)' :
                        'rgba(255,59,59,.08)',
                      color: call.ended_reason === 'customer-ended-call' ? '#00CFFF' :
                        call.ended_reason === 'assistant-ended-call' ? '#00FF94' :
                        '#FF3B3B',
                    }}>
                      {call.ended_reason?.replace(/-/g, ' ') || '—'}
                    </span>
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    {call.transcript ? (
                      <button
                        style={styles.linkBtn}
                        onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                      >
                        {expandedId === call.id ? 'Hide' : 'View'}
                      </button>
                    ) : (
                      <span style={styles.muted}>—</span>
                    )}
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    {call.recording_url ? (
                      <a href={call.recording_url} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
                        Play
                      </a>
                    ) : (
                      <span style={styles.muted}>—</span>
                    )}
                  </div>
                </div>
                {expandedId === call.id && call.transcript && (
                  <div style={styles.transcript}>
                    <pre style={styles.transcriptPre}>{call.transcript}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{ ...styles.pageBtn, opacity: page === 0 ? 0.3 : 1 }}
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                ← Previous
              </button>
              <span style={styles.muted}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                style={{ ...styles.pageBtn, opacity: page >= totalPages - 1 ? 0.3 : 1 }}
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 24px',
    maxWidth: 1100,
    margin: '0 auto',
    fontFamily: '"DM Sans", sans-serif',
    color: '#F5F5F5',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  h1: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 32,
    letterSpacing: 2,
    margin: 0,
  },
  h2: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 24,
    letterSpacing: 1,
    margin: '0 0 8px',
  },
  badge: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10,
    color: '#00CFFF',
    background: 'rgba(0,207,255,.08)',
    border: '1px solid rgba(0,207,255,.15)',
    padding: '3px 10px',
    borderRadius: 1,
    letterSpacing: 1,
  },
  card: {
    background: '#0e0e0e',
    border: '1px solid #222',
    borderRadius: 1,
    padding: 24,
  },
  muted: {
    color: '#555',
    fontSize: 12,
    fontFamily: '"JetBrains Mono", monospace',
  },
  table: {
    background: '#0e0e0e',
    border: '1px solid #222',
    borderRadius: 1,
    overflow: 'hidden',
  },
  thead: {
    display: 'flex',
    background: '#060606',
    borderBottom: '1px solid #222',
    padding: '10px 16px',
  },
  th: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 8,
    color: '#00CFFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  row: {
    display: 'flex',
    padding: '12px 16px',
    borderBottom: '1px solid #191919',
    alignItems: 'center',
    transition: 'background .2s',
  },
  td: {
    fontSize: 12,
    color: '#aaa',
  },
  reasonBadge: {
    display: 'inline-block',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 8,
    padding: '2px 8px',
    borderRadius: 1,
    letterSpacing: 0.5,
    textTransform: 'capitalize' as const,
  },
  linkBtn: {
    background: 'none',
    border: '1px solid #333',
    color: '#00CFFF',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 9,
    padding: '3px 10px',
    borderRadius: 1,
    cursor: 'pointer',
    textDecoration: 'none',
    letterSpacing: 0.5,
  },
  transcript: {
    background: '#060606',
    borderBottom: '1px solid #222',
    padding: '16px 20px',
  },
  transcriptPre: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 11,
    color: '#888',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    margin: 0,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  pageBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#aaa',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10,
    padding: '6px 16px',
    borderRadius: 1,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
};
