// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useEffect, useState, useCallback } from 'react';

type Funnel = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  domain_status: 'none' | 'pending' | 'active';
};

type DnsInstruction = {
  type: string;
  domain: string;
  value: string;
};

export default function DomainsSettingsPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedFunnel, setSelectedFunnel] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstruction[]>([]);
  const [error, setError] = useState('');

  const loadFunnels = useCallback(async () => {
    try {
      const res = await fetch('/api/funnels');
      if (res.ok) setFunnels(await res.json());
    } catch (err) {
      console.error('Failed to load funnels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFunnels(); }, [loadFunnels]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAdding(true);

    try {
      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput, funnel_id: selectedFunnel }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add domain');
        return;
      }

      setDnsInstructions(data.dns_instructions || []);
      setDomainInput('');
      loadFunnels();
    } catch {
      setError('Failed to add domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (funnel: Funnel) => {
    if (!funnel.custom_domain) return;
    setVerifying(funnel.id);

    try {
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: funnel.custom_domain, funnel_id: funnel.id }),
      });
      const data = await res.json();

      if (data.verified) {
        loadFunnels();
      } else {
        setDnsInstructions(data.dns_instructions || []);
      }
    } catch {
      setError('Verification check failed');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#111' }}>
        Custom Domains
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 32 }}>
        Connect a custom domain to your funnel pages. Requires Launch plan or higher.
      </p>

      {/* Add Domain Form */}
      <section style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add Custom Domain</h2>
        <form onSubmit={handleAddDomain}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              required
              value={selectedFunnel}
              onChange={(e) => setSelectedFunnel(e.target.value)}
              style={{ flex: '1 1 200px', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            >
              <option value="">Select funnel...</option>
              {funnels.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.slug})</option>
              ))}
            </select>
            <input
              type="text" required
              placeholder="yourdomain.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              style={{ flex: '1 1 250px', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
            />
            <button
              type="submit" disabled={adding}
              style={{
                background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                opacity: adding ? 0.6 : 1,
              }}
            >
              {adding ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
        {error && (
          <p style={{ color: '#EF4444', fontSize: 14, marginTop: 12 }}>{error}</p>
        )}
      </section>

      {/* DNS Instructions */}
      {dnsInstructions.length > 0 && (
        <section style={{ background: '#FFFBEB', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #FDE68A' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#92400E' }}>
            DNS Configuration Required
          </h2>
          <p style={{ fontSize: 14, color: '#78350F', marginBottom: 12 }}>
            Add the following DNS records to your domain provider:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #FDE68A' }}>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Name</th>
                  <th style={{ padding: '8px 12px' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {dnsInstructions.map((dns, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #FDE68A' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{dns.type}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{dns.domain}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{dns.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Existing Domains */}
      <section style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Your Domains</h2>
        {funnels.filter((f) => f.custom_domain).length === 0 ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 24 }}>
            No custom domains configured yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnels.filter((f) => f.custom_domain).map((funnel) => (
              <div key={funnel.id} style={{
                border: '1px solid #E5E7EB', borderRadius: 10, padding: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{funnel.custom_domain}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      background: funnel.domain_status === 'active' ? '#D1FAE5' : '#FEF3C7',
                      color: funnel.domain_status === 'active' ? '#065F46' : '#92400E',
                    }}>
                      {funnel.domain_status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                    Funnel: {funnel.name} ({funnel.slug})
                  </p>
                </div>
                {funnel.domain_status !== 'active' && (
                  <button
                    onClick={() => handleVerify(funnel)}
                    disabled={verifying === funnel.id}
                    style={{
                      background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 8,
                      padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      opacity: verifying === funnel.id ? 0.6 : 1,
                    }}
                  >
                    {verifying === funnel.id ? 'Checking...' : 'Check Verification'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
