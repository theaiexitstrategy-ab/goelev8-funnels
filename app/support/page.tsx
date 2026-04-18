// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';

const FAQS = [
  { q: 'How does the free trial work?', a: 'Sign up and get 7 days free on any plan. Your card is on file but not charged until Day 8. Cancel anytime before that and pay nothing.' },
  { q: 'What happens after I type my prompt?', a: 'Our AI builds your complete business page, SMS follow-up sequence, and (on Grow+) an AI phone agent — all in under 60 seconds.' },
  { q: 'Do I need coding or design skills?', a: 'No. Everything is generated from your business description. You can customize colors and content in the portal if you want.' },
  { q: 'How does SMS follow-up work?', a: 'When a lead submits their info on your page, they automatically receive a 5-step SMS nurture sequence over several days. You buy SMS credits as needed — they never expire.' },
  { q: 'What is the AI phone agent?', a: 'Available on Grow plan and above. When a lead opts in, the AI agent calls them within 5 minutes to qualify and book an appointment — fully automated.' },
  { q: 'Can I use my existing website?', a: 'Yes. Install our WordPress plugin, Shopify app, or embed our widget on any website. Your GoElev8 funnel works alongside your existing site.' },
  { q: 'How do payments work for product store?', a: 'You connect Stripe via our portal. Customers pay you directly. GoElev8 takes a small platform fee (10% on Launch/Grow, 8% on Scale).' },
  { q: 'Can I cancel at any time?', a: 'Yes. Cancel from your portal settings. No contracts, no cancellation fees.' },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/support/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactForm),
    }).catch(() => {});
    setSent(true);
  };

  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)' }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8-full-logo.png" alt="GoElev8.ai — Infinite Possibilities" width={60} height={60} style={{ display: 'block' }} /></a>
        <a href="/auth/signup" style={{ background: '#00CFFF', color: '#000', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1 }}>Start Free Trial</a>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 48, color: '#fff', textAlign: 'center', letterSpacing: 3, marginBottom: 48 }}>SUPPORT</h1>

        {/* FAQ */}
        <section style={{ marginBottom: 60 }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: '#fff', letterSpacing: 2, marginBottom: 24 }}>FREQUENTLY ASKED QUESTIONS</h2>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid #1A1A1A' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 15, padding: '18px 0', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {faq.q}
                <span style={{ color: '#00CFFF', fontSize: 20, flexShrink: 0, marginLeft: 12 }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, padding: '0 0 18px', margin: 0 }}>{faq.a}</p>}
            </div>
          ))}
        </section>

        {/* Contact Form */}
        <section>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: '#fff', letterSpacing: 2, marginBottom: 24 }}>CONTACT US</h2>
          {sent ? (
            <div style={{ background: '#0A0A0A', border: '1px solid #28C840', borderRadius: 12, padding: 32, textAlign: 'center' }}>
              <p style={{ color: '#28C840', fontSize: 16 }}>Message sent. We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleContact} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input type="text" required placeholder="Your name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} style={{ background: 'transparent', border: '1px solid #333', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
                <input type="email" required placeholder="Email address" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} style={{ background: 'transparent', border: '1px solid #333', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
                <textarea required placeholder="How can we help?" rows={4} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} style={{ background: 'transparent', border: '1px solid #333', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none', resize: 'vertical' }} />
                <button type="submit" style={{ background: '#00CFFF', color: '#000', border: 'none', padding: '14px', borderRadius: 8, fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, letterSpacing: 1, cursor: 'pointer' }}>Send Message</button>
              </div>
            </form>
          )}
          <p style={{ color: '#555', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
            Or email us directly: support@goelev8.ai
          </p>
        </section>
      </main>

      <footer style={{ maxWidth: 1200, margin: '60px auto 0', padding: '32px 24px', borderTop: '1px solid #1A1A1A', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: 12, color: '#333' }}>&copy; 2026 GoElev8.ai &middot; Aaron Bryant &middot; All rights reserved.</p>
      </footer>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
    </div>
  );
}
