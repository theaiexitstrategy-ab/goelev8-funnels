// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Onboarding chat agent — client component. Self-contained inline styles so
// it ignores any project-level Tailwind scoping. portal.goelev8.ai vibe:
// black background, gold + red accents, Bebas Neue headings, Inter body.
'use client';

import { useEffect, useRef, useState } from 'react';

const GOLD = '#F5B800';
const RED = '#C8102E';
const BG = '#0A0A0A';

type ChatMsg = { role: 'user' | 'assistant'; content: string };

type LoadResponse = {
  client: {
    id: string;
    slug: string;
    first_name: string;
    name: string | null;
    email: string | null;
    business_name: string | null;
    onboarding_step: number;
    onboarding_status: string;
  };
  config: {
    slug: string;
    client_name: string;
    business_name: string;
    tier: string;
    accent_color: string;
    flags: {
      has_lead_agent: boolean;
      has_voice_agent: boolean;
      has_site_build: boolean;
      jobber_integration: boolean;
    };
    known_info: Record<string, unknown>;
  };
  staged: { tenant: any; client_info: any; blob: Record<string, any> };
};

const TOTAL_STEPS = 9;
const STEP_LABELS: Record<number, string> = {
  1: 'Contact',
  2: 'Business basics',
  3: 'Brand',
  4: 'Services',
  5: 'Social proof',
  6: 'Lead agent',
  7: 'Voice agent',
  8: 'Booking',
  9: 'Review',
};

export default function OnboardingChatClient({ slug, token }: { slug: string; token: string }) {
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [profile, setProfile] = useState<LoadResponse | null>(null);
  const [step, setStep] = useState<number>(1);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [savingHint, setSavingHint] = useState<string>('');
  const [completed, setCompleted] = useState<boolean>(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Inject fonts on mount.
  useEffect(() => {
    const id = 'goelev8-onboarding-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Initial load: validate token + fetch state.
  useEffect(() => {
    if (!token) {
      setLoadState('error');
      setErrorMsg('This onboarding link is missing its access token. Contact ab@goelev8.ai to get a new one.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/load/${encodeURIComponent(slug)}`, {
          headers: { 'x-resume-token': token },
        });
        if (res.status === 401) {
          setLoadState('error');
          setErrorMsg('This link has expired or is invalid. Contact ab@goelev8.ai for a fresh link.');
          return;
        }
        if (!res.ok) {
          setLoadState('error');
          setErrorMsg('Something went wrong loading your onboarding. Try refreshing or email ab@goelev8.ai.');
          return;
        }
        const data = (await res.json()) as LoadResponse;
        setProfile(data);
        setStep(Math.max(1, data.client.onboarding_step || 1));
        setLoadState('ok');
        // Auto-start the conversation with a kickoff message from the agent.
        await kickoffAgent(data.client.onboarding_step || 1);
      } catch (err: any) {
        console.error('[onboarding] load failed:', err);
        setLoadState('error');
        setErrorMsg('Network error. Try refreshing.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  // Auto-scroll on new message.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  async function kickoffAgent(currentStep: number) {
    const initialMsg: ChatMsg = {
      role: 'user',
      content: `[SYSTEM] Begin step ${currentStep}. Greet the client and ask the first question for this step.`,
    };
    setMessages([initialMsg]);
    setBusy(true);
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-resume-token': token },
        body: JSON.stringify({ slug, step: currentStep, messages: [initialMsg] }),
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const { text } = (await res.json()) as { text: string };
      const visible = stripMarkers(text);
      // The initial system message is hidden — replace with just the agent's reply.
      setMessages([{ role: 'assistant', content: visible }]);
      handleMarkers(text, currentStep);
    } catch (err: any) {
      console.error('[onboarding] kickoff failed:', err);
      setMessages([{ role: 'assistant', content: 'Hi! Quick technical hiccup on my end — try sending a message and we\'ll get going.' }]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!input.trim() || busy || completed) return;
    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setBusy(true);
    setSavingHint('');

    try {
      // 1) Persist this answer to staging. Best-effort: surface the saving
      //    indicator but don't block the chat on save errors.
      void persistAnswer(step, userMsg.content).then(() => {
        setSavingHint('Saved');
        setTimeout(() => setSavingHint(''), 1200);
      });

      // 2) Get next agent message.
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-resume-token': token },
        body: JSON.stringify({ slug, step, messages: next }),
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const { text } = (await res.json()) as { text: string };
      const visible = stripMarkers(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: visible }]);
      handleMarkers(text, step);
    } catch (err: any) {
      console.error('[onboarding] send failed:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '(network hiccup — try again in a moment)' },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function persistAnswer(currentStep: number, answer: string): Promise<void> {
    setSavingHint('Saving...');
    // We send the raw freeform answer plus the step number; the save route
    // does field-level mapping where appropriate, and falls back to stashing
    // unstructured answers in the brand_notes JSON blob.
    const payload = buildSavePayload(currentStep, answer);
    const res = await fetch(`/api/onboarding/save?slug=${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-resume-token': token },
      body: JSON.stringify({ step: currentStep, payload }),
    });
    if (!res.ok) {
      console.error('[onboarding] save returned', res.status);
    }
  }

  function handleMarkers(rawText: string, currentStep: number) {
    if (rawText.includes('<<ONBOARDING_COMPLETE>>')) {
      void finalize();
      return;
    }
    const m = rawText.match(/<<STEP_DONE:(\d+)>>/);
    if (m) {
      const finished = parseInt(m[1], 10);
      const next = nextStepAfter(finished);
      if (next !== currentStep) {
        setStep(next);
        // Soft transition — let the agent kick off the next step automatically.
        void advanceToStep(next);
      }
    }
  }

  function nextStepAfter(finished: number): number {
    if (!profile) return Math.min(finished + 1, TOTAL_STEPS);
    const f = profile.config.flags;
    let s = finished + 1;
    if (s === 6 && !f.has_lead_agent) s = 7;
    if (s === 7 && !f.has_voice_agent) s = 8;
    if (s === 8 && !f.has_lead_agent && !f.has_voice_agent) s = 9;
    return Math.min(s, TOTAL_STEPS);
  }

  async function advanceToStep(newStep: number) {
    setBusy(true);
    const intro: ChatMsg = {
      role: 'user',
      content: `[SYSTEM] Step ${newStep} begins now. Ask the first question for this step.`,
    };
    const updated = [...messages, intro];
    setMessages(updated);
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-resume-token': token },
        body: JSON.stringify({ slug, step: newStep, messages: updated }),
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const { text } = (await res.json()) as { text: string };
      const visible = stripMarkers(text);
      // Drop the system intro from view, just keep the agent reply.
      setMessages((prev) => {
        const dropped = [...prev];
        // Remove the last user message (the synthetic [SYSTEM]) since it
        // shouldn't be visible to the buyer.
        if (dropped[dropped.length - 1]?.content.startsWith('[SYSTEM]')) dropped.pop();
        return [...dropped, { role: 'assistant', content: visible }];
      });
      handleMarkers(text, newStep);
    } catch (err: any) {
      console.error('[onboarding] advance failed:', err);
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    setCompleted(true);
    try {
      await fetch(`/api/onboarding/complete?slug=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'x-resume-token': token, 'Content-Type': 'application/json' },
        body: '{}',
      });
    } catch (err: any) {
      console.error('[onboarding] finalize failed:', err);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const wrapStyle: React.CSSProperties = {
    background: BG,
    color: '#fff',
    minHeight: '100vh',
    fontFamily: '"Inter", system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  };

  if (loadState === 'loading') {
    return (
      <div style={wrapStyle}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)' }}>
          Loading your onboarding…
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div style={wrapStyle}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 460, textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: GOLD, margin: '0 0 12px', fontWeight: 600 }}>
              Access issue
            </p>
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, letterSpacing: 1.5, margin: '0 0 14px', fontWeight: 400 }}>
              Can&apos;t open this link
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6 }}>
              {errorMsg}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const c = profile!.config;
  const cl = profile!.client;
  const progressPct = Math.min(100, (step / TOTAL_STEPS) * 100);

  return (
    <div style={wrapStyle}>
      {/* Header */}
      <header
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ margin: 0, letterSpacing: 4, textTransform: 'uppercase', fontSize: 11, color: GOLD, fontWeight: 700 }}>
            <span style={{ color: GOLD }}>GO</span>
            <span style={{ color: '#fff', fontWeight: 200 }}>ELEV8.AI</span>
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Step {step}/{TOTAL_STEPS} · {STEP_LABELS[step] ?? '—'}
          </p>
        </div>
        <h1
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(24px, 4vw, 32px)',
            letterSpacing: 1.5,
            margin: 0,
            fontWeight: 400,
          }}
        >
          {c.business_name} × GoElev8.ai
        </h1>
        <div
          style={{
            height: 4,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${GOLD}, ${RED})`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </header>

      {/* Chat */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column' }}>
          <div
            ref={scrollerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {messages
              .filter((m) => !m.content.startsWith('[SYSTEM]'))
              .map((m, i) => (
                <Bubble key={i} role={m.role} text={m.content} />
              ))}
            {busy && <TypingIndicator />}
            {completed && (
              <div
                style={{
                  marginTop: 8,
                  padding: '16px 18px',
                  border: `1px solid ${GOLD}`,
                  borderRadius: 10,
                  background: 'rgba(245,184,0,0.08)',
                }}
              >
                <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
                  Onboarding complete
                </p>
                <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.55 }}>
                  Aaron will take it from here. Expect your agent live within 5–7 business days. We&apos;ll text you when everything is ready.
                </p>
              </div>
            )}
          </div>

          {/* Composer */}
          {!completed && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                padding: '14px 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Type your answer..."
                  rows={1}
                  disabled={busy}
                  style={{
                    flex: 1,
                    resize: 'none',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontFamily: 'inherit',
                    fontSize: 15,
                    lineHeight: 1.4,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => void send()}
                  disabled={busy || !input.trim()}
                  style={{
                    background: GOLD,
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 18px',
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    fontSize: 12,
                    cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: busy || !input.trim() ? 0.5 : 1,
                  }}
                >
                  Send
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', minHeight: 14 }}>
                {savingHint || 'Press Enter to send · Shift+Enter for a new line'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        background: isUser ? 'rgba(245,184,0,0.14)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isUser ? 'rgba(245,184,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        padding: '12px 14px',
        color: '#fff',
        fontSize: 15,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
      }}
    >
      <span style={{ display: 'inline-block', animation: 'pulse 1.4s infinite ease-in-out' }}>● ● ●</span>
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }`}</style>
    </div>
  );
}

function stripMarkers(s: string): string {
  return s.replace(/<<STEP_DONE:\d+>>/g, '').replace(/<<ONBOARDING_COMPLETE>>/g, '').trim();
}

// Best-effort field mapping for raw freeform answers. The save route does
// the heavy lifting; this just hints at common fields based on the current
// step so we capture useful structured data when we can.
function buildSavePayload(step: number, answer: string): Record<string, any> {
  switch (step) {
    case 1: {
      const phone = extractPhone(answer);
      const email = extractEmail(answer);
      return { ...(phone ? { owner_phone: phone } : {}), ...(email ? { email } : {}), raw: answer };
    }
    case 2:
      return { raw: answer };
    case 3: {
      const url = extractUrl(answer);
      return { ...(url ? { website: url } : {}), raw: answer };
    }
    case 4:
      return { services: answer, raw: answer };
    case 5:
      return { raw: answer };
    case 6:
      return { raw: answer };
    case 7:
      return { raw: answer };
    case 8:
      return { raw: answer };
    case 9:
      return { confirmed_at: new Date().toISOString(), raw: answer };
    default:
      return { raw: answer };
  }
}

function extractPhone(s: string): string | null {
  const m = s.match(/(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  return m ? m[1] : null;
}
function extractEmail(s: string): string | null {
  const m = s.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  return m ? m[0] : null;
}
function extractUrl(s: string): string | null {
  const m = s.match(/https?:\/\/\S+|(?:www\.)?[A-Za-z0-9-]+\.[A-Za-z]{2,}(?:\/\S*)?/);
  return m ? m[0] : null;
}
