// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service | GoElev8.ai', description: 'GoElev8.ai terms of service' };

export default function TermsPage() {
  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8.ai_logo.png" alt="GoElev8.ai" width={36} height={36} style={{ display: 'block' }} /></a>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px', lineHeight: 1.8, fontSize: 14, color: '#AAA' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 42, color: '#fff', letterSpacing: 2, marginBottom: 8 }}>TERMS OF SERVICE</h1>
        <p style={{ color: '#555', marginBottom: 32 }}>Last updated: April 4, 2026</p>

        <p>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the GoElev8.ai platform and services operated by Aaron Bryant (&ldquo;GoElev8,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By using our services, you agree to these Terms.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>1. Account Registration</h2>
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to use our services.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>2. Free Trial</h2>
        <p>All plans include a 7-day free trial. Your payment method is collected at signup but not charged until Day 8. You may cancel at any time during the trial period at no cost. If you do not cancel before the trial ends, your selected plan will be charged automatically.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>3. Subscription Plans &amp; Billing</h2>
        <p>Plans are billed monthly or annually at the rates displayed on our pricing page. Prices may change with 30 days&apos; advance notice. Annual plans are billed upfront for the full year at a 20% discount.</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong style={{ color: '#ccc' }}>Launch:</strong> $99/month ($79/month billed annually)</li>
          <li><strong style={{ color: '#ccc' }}>Grow:</strong> $199/month ($159/month billed annually)</li>
          <li><strong style={{ color: '#ccc' }}>Scale:</strong> $397/month ($317/month billed annually)</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>4. SMS Credits</h2>
        <p>SMS credits are purchased separately and never expire. Credits are non-refundable once purchased. Standard messaging rates apply. See our <a href="/sms-policy" style={{ color: '#00CFFF' }}>SMS Policy</a> for compliance details.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>5. Product Store &amp; Platform Fees</h2>
        <p>When you sell products through the GoElev8 product store, the following platform fees apply:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong style={{ color: '#ccc' }}>Launch and Grow plans:</strong> 10% platform fee on each sale</li>
          <li><strong style={{ color: '#ccc' }}>Scale plan:</strong> 8% platform fee on each sale</li>
        </ul>
        <p>Platform fees are deducted automatically via Stripe Connect. The remainder is deposited directly into your connected Stripe account. Stripe&apos;s standard processing fees (approximately 2.9% + $0.30) apply in addition to the platform fee.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>6. Cancellation Policy</h2>
        <p>You may cancel your subscription at any time from your portal settings. Upon cancellation:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Your service continues until the end of the current billing period</li>
          <li>No prorated refunds are issued for partial months</li>
          <li>Annual plans: refunds for unused months are available within the first 30 days</li>
          <li>Your funnel pages will become inactive after the billing period ends</li>
          <li>Your data is retained for 30 days after cancellation, then deleted</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>7. Acceptable Use</h2>
        <p>You agree not to use GoElev8 to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Send spam or unsolicited messages</li>
          <li>Engage in fraudulent or deceptive practices</li>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on intellectual property rights</li>
          <li>Transmit malicious code or interfere with the platform</li>
          <li>Collect data in violation of privacy laws</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>8. Intellectual Property</h2>
        <p>The GoElev8 platform, including its design, code, and AI models, is the property of GoElev8.ai / Aaron Bryant. Content you create through the platform (funnel pages, products, business descriptions) remains yours.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>9. Limitation of Liability</h2>
        <p>GoElev8 is provided &ldquo;as is.&rdquo; We are not liable for lost revenue, data loss, or indirect damages arising from your use of the platform. Our total liability is limited to the amount you paid us in the 12 months preceding the claim.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>10. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms. We will provide reasonable notice except in cases of severe abuse or legal requirement.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>11. Changes to Terms</h2>
        <p>We may update these Terms with 30 days&apos; notice. Continued use after changes take effect constitutes acceptance of the updated Terms.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>12. Contact</h2>
        <p>GoElev8.ai<br />Aaron Bryant<br />Email: <a href="mailto:legal@goelev8.ai" style={{ color: '#00CFFF' }}>legal@goelev8.ai</a></p>
      </main>
    </div>
  );
}
