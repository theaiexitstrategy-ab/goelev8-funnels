// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'SMS Policy | GoElev8.ai', description: 'GoElev8.ai A2P SMS compliance policy' };

export default function SmsPolicyPage() {
  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8-full-logo.png" alt="GoElev8.ai — Infinite Possibilities" width={60} height={60} style={{ display: 'block' }} /></a>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px', lineHeight: 1.8, fontSize: 14, color: '#AAA' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 42, color: '#fff', letterSpacing: 2, marginBottom: 8 }}>SMS POLICY</h1>
        <p style={{ color: '#555', marginBottom: 32 }}>Last updated: April 4, 2026</p>

        <p>GoElev8.ai uses Application-to-Person (A2P) SMS messaging to deliver automated follow-ups, appointment reminders, and promotional messages on behalf of businesses using our platform. This policy outlines our compliance with the Telephone Consumer Protection Act (TCPA), CAN-SPAM, and carrier requirements.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>1. Consent</h2>
        <p>All SMS messages sent through GoElev8.ai require prior express consent from the recipient. Consent is obtained when a lead:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Submits their phone number through a GoElev8 funnel page</li>
          <li>Opts in via a GoElev8 chat widget</li>
          <li>Provides their phone number through a connected website form</li>
        </ul>
        <p>Each funnel page and form includes clear disclosure that the user will receive SMS messages by submitting their information.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>2. Message Types</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong style={{ color: '#ccc' }}>Automated Follow-Up:</strong> 5-step SMS nurture sequence delivered over several days after opt-in</li>
          <li><strong style={{ color: '#ccc' }}>Appointment Reminders:</strong> Booking confirmations and reminders</li>
          <li><strong style={{ color: '#ccc' }}>Promotional Blasts:</strong> One-time product announcements or offers sent by business owners</li>
          <li><strong style={{ color: '#ccc' }}>Transactional:</strong> Order confirmations, receipts, and account notifications</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>3. Message Frequency</h2>
        <p>Automated follow-up sequences send a maximum of 5 messages over 14 days. Promotional blasts are sent at the discretion of the business owner. Transactional messages are sent as needed. Typical frequency: 1-3 messages per week during active sequences.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>4. Opt-Out Instructions</h2>
        <p>Every SMS message includes opt-out instructions. Recipients can opt out at any time by:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Replying <strong style={{ color: '#ccc' }}>STOP</strong> to any message</li>
          <li>Replying <strong style={{ color: '#ccc' }}>UNSUBSCRIBE</strong> to any message</li>
          <li>Contacting us at <a href="mailto:support@goelev8.ai" style={{ color: '#00CFFF' }}>support@goelev8.ai</a></li>
        </ul>
        <p>Opt-out requests are processed immediately. Once opted out, no further messages will be sent unless the recipient re-opts in.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>5. Data Handling</h2>
        <p>Phone numbers collected through our platform are stored securely in our database with encryption at rest. Phone numbers are not sold or shared with third parties beyond our messaging provider (Twilio). Numbers are retained only for the duration of the business relationship.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>6. A2P Registration</h2>
        <p>All messaging through GoElev8.ai is sent through registered A2P channels under our master Twilio account. We maintain compliance with carrier requirements including 10DLC registration for US traffic.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>7. Prohibited Content</h2>
        <p>Messages sent through GoElev8 must not contain:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Illegal content or offers</li>
          <li>Deceptive or misleading claims</li>
          <li>Content targeting minors</li>
          <li>Hate speech or harassment</li>
          <li>Content prohibited by SHAFT guidelines (sex, hate, alcohol, firearms, tobacco)</li>
        </ul>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>8. Message and Data Rates</h2>
        <p>Standard message and data rates may apply to recipients based on their carrier plan. GoElev8 is not responsible for carrier charges incurred by message recipients.</p>

        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 32, marginBottom: 12 }}>9. Contact</h2>
        <p>For questions about our SMS practices:<br />
        GoElev8.ai<br />
        Email: <a href="mailto:support@goelev8.ai" style={{ color: '#00CFFF' }}>support@goelev8.ai</a></p>
      </main>
    </div>
  );
}
