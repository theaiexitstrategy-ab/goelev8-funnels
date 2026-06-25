// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FONT_OPTIONS, PAGE_POSITIONS, TOTAL_STEPS } from '@/lib/onboarding-steps';

type ClientInfo = Record<string, any> | null;
type Asset = {
  id: string;
  file_url: string;
  file_type: 'image' | 'video';
  label: string | null;
  page_position: string | null;
  rank: number;
  uploaded_at: string;
};

const CYAN = '#00CFFF';
const BODY_FONT = '"DM Sans", system-ui, sans-serif';
const inputCls =
  'w-full bg-black/40 border border-white/10 focus:border-[#00CFFF]/60 rounded-sm px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition';
const labelCls = 'block text-[11px] uppercase tracking-[2px] text-white/50 mb-1.5';

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export default function StepForm({
  n, token, accent, info, assets,
}: {
  n: 1 | 2 | 3 | 4 | 5 | 6;
  token: string;
  accent: string;
  info: ClientInfo;
  assets: Asset[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAndAdvance(data: Record<string, any>): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboard/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, step: n, data }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Could not save.');
        setSaving(false);
        return false;
      }
      return true;
    } catch {
      setError('Network error.');
      setSaving(false);
      return false;
    }
  }

  function nextHref(): string {
    return n < TOTAL_STEPS ? `/onboard/agent/${token}/step/${n + 1}` : `/onboard/agent/${token}/complete`;
  }
  function prevHref(): string | null {
    return n > 1 ? `/onboard/agent/${token}/step/${n - 1}` : null;
  }

  // Branch by step.
  if (n === 1) return <Step1 info={info} accent={accent} saving={saving} error={error} prevHref={prevHref()} onNext={async (d) => (await saveAndAdvance(d)) && router.push(nextHref())} />;
  if (n === 2) return <Step2 info={info} accent={accent} saving={saving} error={error} prevHref={prevHref()} onNext={async (d) => (await saveAndAdvance(d)) && router.push(nextHref())} />;
  if (n === 3) return <Step3 token={token} accent={accent} initialAssets={assets} prevHref={prevHref()} nextHref={nextHref()} onSkip={async () => (await saveAndAdvance({})) && router.push(nextHref())} />;
  if (n === 4) return <Step4 token={token} accent={accent} initialAssets={assets} prevHref={prevHref()} onNext={async () => (await saveAndAdvance({})) && router.push(nextHref())} saving={saving} error={error} />;
  if (n === 5) return <Step5 info={info} accent={accent} saving={saving} error={error} prevHref={prevHref()} onNext={async (d) => (await saveAndAdvance(d)) && router.push(nextHref())} />;
  return <Step6 token={token} info={info} accent={accent} saving={saving} error={error} prevHref={prevHref()} onComplete={async (d) => {
    if (!(await saveAndAdvance(d))) return;
    // Fire the completion endpoint.
    try {
      const res = await fetch('/api/onboard/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not finalize onboarding.');
        return;
      }
      router.push(`/onboard/agent/${token}/complete`);
    } catch {
      setError('Network error finalizing.');
    }
  }} />;
}

// ─── Buttons ────────────────────────────────────────────────────

function ButtonsRow({
  prevHref, onNext, saving, nextLabel, disabled,
}: {
  prevHref: string | null;
  onNext: () => void;
  saving: boolean;
  nextLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-8">
      {prevHref ? (
        <a href={prevHref} className="text-xs uppercase tracking-widest text-white/50 hover:text-white">
          ← Back
        </a>
      ) : <span />}
      <button
        type="button"
        onClick={onNext}
        disabled={saving || disabled}
        className="hover:brightness-110 disabled:opacity-50 text-black px-6 py-3 rounded-sm transition"
        style={{
          background: CYAN,
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '1.5px',
          fontSize: 12,
          textTransform: 'uppercase',
        }}
      >
        {saving ? 'Saving…' : nextLabel}
      </button>
    </div>
  );
}

// ─── Step 1 — Business Info ─────────────────────────────────────

function Step1({ info, saving, error, prevHref, onNext }: {
  info: ClientInfo; accent: string; saving: boolean; error: string | null;
  prevHref: string | null; onNext: (d: Record<string, any>) => void;
}) {
  const i = info ?? {};
  const [state, setState] = useState({
    business_name: i.business_name || '',
    tagline: i.tagline || '',
    phone: i.phone || '',
    address: i.address || '',
    city: i.city || '',
    state: i.state || '',
    zip: i.zip || '',
    booking_url: i.booking_url || '',
    social_instagram: i.social_instagram || '',
    social_facebook: i.social_facebook || '',
    social_tiktok: i.social_tiktok || '',
  });
  const set = (k: keyof typeof state) => (e: any) => setState({ ...state, [k]: e.target.value });
  const ready = state.business_name.trim().length > 0;
  return (
    <div className="space-y-5">
      <Field label="Business name *"><input className={inputCls} value={state.business_name} onChange={set('business_name')} required /></Field>
      <Field label="Tagline / Slogan"><input className={inputCls} value={state.tagline} onChange={set('tagline')} placeholder="Optional" /></Field>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Phone"><input className={inputCls} value={state.phone} onChange={set('phone')} placeholder="(555) 555-5555" /></Field>
        <Field label="Booking URL"><input className={inputCls} value={state.booking_url} onChange={set('booking_url')} placeholder="GlossGenius / Calendly / etc." /></Field>
      </div>
      <Field label="Address"><input className={inputCls} value={state.address} onChange={set('address')} /></Field>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <Field label="City"><input className={inputCls} value={state.city} onChange={set('city')} /></Field>
        <Field label="State"><input className={inputCls} value={state.state} onChange={set('state')} /></Field>
        <Field label="Zip"><input className={inputCls} value={state.zip} onChange={set('zip')} /></Field>
      </div>
      <div className="grid md:grid-cols-3 gap-5 pt-2">
        <Field label="Instagram"><input className={inputCls} value={state.social_instagram} onChange={set('social_instagram')} placeholder="@handle" /></Field>
        <Field label="Facebook"><input className={inputCls} value={state.social_facebook} onChange={set('social_facebook')} placeholder="page url" /></Field>
        <Field label="TikTok"><input className={inputCls} value={state.social_tiktok} onChange={set('social_tiktok')} placeholder="@handle" /></Field>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <ButtonsRow prevHref={prevHref} onNext={() => onNext(state)} saving={saving} nextLabel="Continue →" disabled={!ready} />
    </div>
  );
}

// ─── Step 2 — Brand & Style ────────────────────────────────────

function Step2({ info, accent, saving, error, prevHref, onNext }: {
  info: ClientInfo; accent: string; saving: boolean; error: string | null;
  prevHref: string | null; onNext: (d: Record<string, any>) => void;
}) {
  const i = info ?? {};
  const [state, setState] = useState({
    primary_color: i.primary_color || accent,
    secondary_color: i.secondary_color || '#000000',
    font_preference: i.font_preference || FONT_OPTIONS[0],
    brand_notes: i.brand_notes || '',
  });
  const set = (k: keyof typeof state) => (e: any) => setState({ ...state, [k]: e.target.value });
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Primary brand color">
          <div className="flex items-center gap-3">
            <input type="color" value={state.primary_color} onChange={set('primary_color')} className="w-12 h-10 rounded border border-white/10 bg-transparent cursor-pointer" />
            <input className={inputCls + ' flex-1'} value={state.primary_color} onChange={set('primary_color')} />
          </div>
        </Field>
        <Field label="Secondary color">
          <div className="flex items-center gap-3">
            <input type="color" value={state.secondary_color} onChange={set('secondary_color')} className="w-12 h-10 rounded border border-white/10 bg-transparent cursor-pointer" />
            <input className={inputCls + ' flex-1'} value={state.secondary_color} onChange={set('secondary_color')} />
          </div>
        </Field>
      </div>
      <Field label="Font vibe">
        <select className={inputCls} value={state.font_preference} onChange={set('font_preference')}>
          {FONT_OPTIONS.map((opt) => <option key={opt} value={opt} className="bg-black">{opt}</option>)}
        </select>
      </Field>
      <Field label="Brand notes (anything we should know)">
        <textarea className={inputCls + ' min-h-[100px]'} value={state.brand_notes} onChange={set('brand_notes')} placeholder="Vibe, references, do's and don'ts…" />
      </Field>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <ButtonsRow prevHref={prevHref} onNext={() => onNext(state)} saving={saving} nextLabel="Continue →" />
    </div>
  );
}

// ─── Step 3 — Upload Assets ────────────────────────────────────

function Step3({ token, accent, initialAssets, prevHref, nextHref, onSkip }: {
  token: string; accent: string; initialAssets: Asset[];
  prevHref: string | null; nextHref: string; onSkip: () => void;
}) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true); setErr(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('token', token);
        form.append('file', file);
        form.append('label', file.name);
        const res = await fetch('/api/onboard/upload-asset', { method: 'POST', body: form });
        const body = await res.json();
        if (!res.ok) { setErr(body.error || 'Upload failed'); break; }
        setAssets((prev) => [...prev, body.asset]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function deleteAsset(id: string) {
    if (!confirm('Remove this file?')) return;
    const res = await fetch(`/api/onboard/asset?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-5">
      <label className="block border-2 border-dashed border-white/15 hover:border-white/30 rounded-lg p-10 text-center cursor-pointer transition">
        <input type="file" multiple accept="image/*,video/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
        <p className="text-white/70 mb-2">Drop files here or tap to upload</p>
        <p className="text-xs text-white/40">Images and videos · up to 50 MB each</p>
      </label>
      {uploading ? <p className="text-sm text-white/60">Uploading…</p> : null}
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      {assets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded overflow-hidden">
              {a.file_type === 'image' ? (
                <img src={a.file_url} alt={a.label || ''} className="w-full aspect-square object-cover" />
              ) : (
                <video src={a.file_url} className="w-full aspect-square object-cover" muted />
              )}
              <div className="p-2 flex items-center justify-between text-xs">
                <span className="text-white/60 truncate flex-1">{a.label || '(unlabeled)'}</span>
                <button onClick={() => deleteAsset(a.id)} className="text-red-300 hover:text-red-400 ml-2">×</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between mt-8">
        {prevHref ? <a href={prevHref} className="text-xs uppercase tracking-widest text-white/50 hover:text-white">← Back</a> : <span />}
        <a
          href={nextHref}
          className="hover:brightness-110 text-black px-6 py-3 rounded-sm transition"
          style={{
            background: CYAN,
            fontFamily: BODY_FONT,
            fontWeight: 600,
            letterSpacing: '1.5px',
            fontSize: 12,
            textTransform: 'uppercase',
          }}
        >
          {assets.length === 0 ? 'Skip for now →' : 'Continue →'}
        </a>
      </div>
      <div className="hidden"><button onClick={onSkip}>internal-bind</button></div>
    </div>
  );
}

// ─── Step 4 — Review & Label ───────────────────────────────────

function Step4({ token, accent, initialAssets, prevHref, onNext, saving, error }: {
  token: string; accent: string; initialAssets: Asset[];
  prevHref: string | null; onNext: () => void;
  saving: boolean; error: string | null;
}) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);

  async function patch(id: string, fields: Partial<Asset>) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
    await fetch(`/api/onboard/asset?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...fields }),
    });
  }

  if (assets.length === 0) {
    return (
      <div className="space-y-5">
        <p className="text-white/60">No assets uploaded yet. You can come back and add some, or continue.</p>
        <ButtonsRow prevHref={prevHref} onNext={onNext} saving={saving} nextLabel="Continue →" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {assets.map((a) => (
          <div key={a.id} className="bg-white/5 border border-white/10 rounded p-3 flex items-center gap-4">
            {a.file_type === 'image' ? (
              <img src={a.file_url} alt="" className="w-16 h-16 object-cover rounded flex-shrink-0" />
            ) : (
              <video src={a.file_url} className="w-16 h-16 object-cover rounded flex-shrink-0" muted />
            )}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                className={inputCls + ' !py-1.5'}
                placeholder="Label (e.g. Hero Image)"
                defaultValue={a.label || ''}
                onBlur={(e) => patch(a.id, { label: e.target.value })}
              />
              <select
                className={inputCls + ' !py-1.5'}
                value={a.page_position || ''}
                onChange={(e) => patch(a.id, { page_position: e.target.value })}
              >
                <option value="" className="bg-black">— Position —</option>
                {PAGE_POSITIONS.map((p) => <option key={p} value={p} className="bg-black">{p}</option>)}
              </select>
              <input
                type="number"
                className={inputCls + ' !py-1.5'}
                placeholder="Rank"
                defaultValue={a.rank}
                onBlur={(e) => patch(a.id, { rank: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <ButtonsRow prevHref={prevHref} onNext={onNext} saving={saving} nextLabel="Continue →" />
    </div>
  );
}

// ─── Step 5 — Services & Pricing ───────────────────────────────

type Service = { name: string; description: string; price: string; duration: string };

function Step5({ info, accent, saving, error, prevHref, onNext }: {
  info: ClientInfo; accent: string; saving: boolean; error: string | null;
  prevHref: string | null; onNext: (d: Record<string, any>) => void;
}) {
  const initial: Service[] = Array.isArray(info?.services) && info!.services.length > 0
    ? (info!.services as Service[])
    : [{ name: '', description: '', price: '', duration: '' }];
  const [rows, setRows] = useState<Service[]>(initial);

  function update(i: number, key: keyof Service, v: string) {
    setRows((r) => r.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)));
  }
  function add() {
    if (rows.length >= 10) return;
    setRows((r) => [...r, { name: '', description: '', price: '', duration: '' }]);
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-5">
      {rows.map((s, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest text-white/40">Service #{i + 1}</span>
            {rows.length > 1 ? (
              <button type="button" onClick={() => remove(i)} className="text-xs text-red-300 hover:text-red-400">Remove</button>
            ) : null}
          </div>
          <Field label="Name"><input className={inputCls} value={s.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="e.g. Loc Retwist" /></Field>
          <Field label="Description"><textarea className={inputCls + ' min-h-[60px]'} value={s.description} onChange={(e) => update(i, 'description', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price"><input className={inputCls} value={s.price} onChange={(e) => update(i, 'price', e.target.value)} placeholder="$125" /></Field>
            <Field label="Duration"><input className={inputCls} value={s.duration} onChange={(e) => update(i, 'duration', e.target.value)} placeholder="2 hr" /></Field>
          </div>
        </div>
      ))}
      {rows.length < 10 ? (
        <button type="button" onClick={add} className="text-xs uppercase tracking-widest text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded px-3 py-2">
          + Add another service
        </button>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <ButtonsRow prevHref={prevHref} onNext={() => onNext({ services: rows })} saving={saving} nextLabel="Continue →" />
    </div>
  );
}

// ─── Step 6 — Domain & Keywords ────────────────────────────────

function Step6({ token, info, accent, saving, error, prevHref, onComplete }: {
  token: string; info: ClientInfo; accent: string; saving: boolean; error: string | null;
  prevHref: string | null; onComplete: (d: Record<string, any>) => void;
}) {
  const i = info ?? {};
  const initialKeywords: string[] = (i.keywords as string[]) ?? [];
  const [domain, setDomain] = useState(i.domain_preference || '');
  const [keywords, setKeywords] = useState<string[]>([
    initialKeywords[0] ?? '',
    initialKeywords[1] ?? '',
    initialKeywords[2] ?? '',
    initialKeywords[3] ?? '',
    initialKeywords[4] ?? '',
  ]);

  function setKw(idx: number, v: string) {
    setKeywords((kws) => kws.map((k, ii) => (ii === idx ? v : k)));
  }

  function submit() {
    const cleanedKeywords = keywords.map((k) => k.trim()).filter(Boolean);
    onComplete({ domain_preference: domain.trim() || null, keywords: cleanedKeywords });
  }

  return (
    <div className="space-y-5">
      <Field label="Preferred domain name"><input className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="locsandwellnessco.com" /></Field>
      <div>
        <p className={labelCls}>Keywords (3–5)</p>
        <div className="space-y-2">
          {keywords.map((k, i) => (
            <input key={i} className={inputCls} value={k} onChange={(e) => setKw(i, e.target.value)} placeholder={`Keyword ${i + 1}`} />
          ))}
        </div>
        <p className="text-xs text-white/40 mt-2">We&apos;ll also add you to the iSlay Studios keyword network for an extra SEO boost.</p>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <ButtonsRow prevHref={prevHref} onNext={submit} saving={saving} nextLabel="Finish onboarding →" />
    </div>
  );
}
