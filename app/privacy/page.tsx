// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy | GoElev8.ai', description: 'GoElev8.ai privacy policy - how we collect, use, and protect your data' };

export default function PrivacyPage() {
  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/inverse-transparent-logo.png" alt="GoElev8.ai" width={36} height={36} style={{ display: 'block' }} /></a>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px', lineHeight: 1.8, fontSize: 14, color: '#AAA' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 42, color: '#fff', letterSpacing: 2, marginBottom: 8 }}>PRIVACY POLICY</h1>
        <p style={{ color: '#555', marginBottom: 32 }}>Last updated: April 4, 2026</p>

        <p>GoElev8.ai (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the goelev8.ai website and platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>1. Information We Collect</h2>
        <p><strong style={{ color: '#ccc' }}>Account Information:</strong> Name, email address, phone number, business name, and billing information when you create an account.</p>
        <p><strong style={{ color: '#ccc' }}>Lead Data:</strong> Information submitted through funnel pages by your leads, including name, email, phone number, and any additional form data.</p>
        <p><strong style={{ color: '#ccc' }}>Usage Data:</strong> Pages visited, features used, IP address, browser type, device information, and interaction timestamps.</p>
        <p><strong style={{ color: '#ccc' }}>Payment Data:</strong> Processed securely by Stripe. We never store credit card numbers on our servers.</p>
        <p><strong style={{ color: '#ccc' }}>Communications:</strong> SMS messages sent and received through our platform, call recordings and transcripts from AI phone agents.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>2. How We Use Your Information</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>To provide and maintain our services</li>
          <li>To process transactions and send billing notices</li>
          <li>To send SMS messages and make AI phone calls on behalf of our users</li>
          <li>To improve our platform and develop new features</li>
          <li>To communicate with you about your account and provide support</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>3. Data Sharing</h2>
        <p>We do not sell your personal data. We share data only with:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong style={{ color: '#ccc' }}>Service Providers:</strong> Stripe (payments), Twilio (SMS), Vapi (voice AI), Supabase (database), Vercel (hosting), Resend (email)</li>
          <li><strong style={{ color: '#ccc' }}>Business Users:</strong> Lead data is shared with the business whose funnel page the lead submitted to</li>
          <li><strong style={{ color: '#ccc' }}>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>4. Data Retention</h2>
        <p>Account data is retained for the duration of your account plus 30 days after deletion. Lead data is retained according to the account holder&apos;s retention settings. Demo/test data is purged daily.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>5. Your Rights (GDPR / CCPA)</h2>
        <p>You have the right to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your data in a portable format</li>
          <li>Withdraw consent for data processing</li>
          <li>Object to automated decision-making</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>6. Data Deletion</h2>
        <p>To request deletion of your data, email <a href="mailto:privacy@goelev8.ai" style={{ color: '#00CFFF' }}>privacy@goelev8.ai</a> or use the &ldquo;Delete Account&rdquo; option in your portal settings. We will process your request within 30 days.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>7. Security</h2>
        <p>We implement industry-standard security measures including encryption at rest and in transit, rate limiting, CSRF protection, and row-level security on all database tables.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>8. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>9. Children&apos;s Privacy</h2>
        <p>Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>10. Changes to This Policy</h2>
        <p>We may update this policy from time to time. Material changes will be communicated via email to registered users.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>11. Contact</h2>
        <p>GoElev8.ai<br />Aaron Bryant<br />Email: <a href="mailto:privacy@goelev8.ai" style={{ color: '#00CFFF' }}>privacy@goelev8.ai</a></p>
      </main>
    </div>
  );
}
