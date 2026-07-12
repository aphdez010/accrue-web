import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Supervisd',
  description: 'How Supervisd collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--spruce)', textDecoration: 'none', fontWeight: 600 }}>&larr; Back to Supervisd</Link>

        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, margin: '24px 0 8px', letterSpacing: '-.01em' }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 40 }}>Last updated: June 19, 2026</p>

        <div style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink)' }}>
          <p>Supervisd (&quot;Supervisd,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides a fieldwork hour tracking and BACB compliance tool for BCBA trainees, RBTs, and supervising BCBAs. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>
          <p>Supervisd is operated by an individual (Arian Perez) and is not currently affiliated with a separate legal entity.</p>

          <h2 style={sectionHeading}>1. What we collect</h2>
          <p>We collect the information you provide directly, and some information automatically when you use the service.</p>
          <p><strong>Account information.</strong> When you sign up, we collect your name, email address, and authentication credentials through our authentication provider, Clerk. We do not store your password directly.</p>
          <p><strong>Fieldwork and compliance data.</strong> We collect the hours, dates, task list categories, settings, and notes you log to track your BACB fieldwork progress, along with your credential number, BACB ID, and agency name if you provide them. This data is about your own supervised experience hours &mdash; it is not clinical data about any client, and we ask that you do not enter identifying client information into Supervisd.</p>
          <p><strong>Documents.</strong> If you upload signed supervision contracts, CEU certificates, or other documents, we store those files through our storage provider, Cloudinary.</p>
          <p><strong>Billing information.</strong> If you subscribe, our payment processor, Stripe, collects and processes your payment details directly. We do not store full card numbers on our servers.</p>
          <p><strong>Usage information.</strong> We automatically collect limited technical information such as browser type, device information, and pages visited, to help us operate and improve the service.</p>

          <h2 style={sectionHeading}>2. How we use your information</h2>
          <p>We use the information we collect to:</p>
          <ul style={listStyle}>
            <li>Provide and maintain the Supervisd service, including compliance calculations and the &quot;Ask Supervisd&quot; assistant</li>
            <li>Process subscription payments and manage your account</li>
            <li>Send you service-related communications, such as billing receipts or account notices</li>
            <li>Respond to support requests</li>
            <li>Monitor and improve the reliability and security of the service</li>
          </ul>
          <p>We do not sell your personal information.</p>

          <h2 style={sectionHeading}>3. Third-party service providers</h2>
          <p>We rely on a small number of third-party providers to operate Supervisd:</p>
          <ul style={listStyle}>
            <li><strong>Clerk</strong> &mdash; authentication and account management</li>
            <li><strong>Stripe</strong> &mdash; payment processing</li>
            <li><strong>Cloudinary</strong> &mdash; document storage</li>
            <li><strong>Railway</strong> &mdash; database and backend hosting</li>
            <li><strong>Vercel</strong> &mdash; website hosting</li>
          </ul>
          <p>Each of these providers processes data on our behalf and maintains its own privacy and security practices. We do not control, and are not responsible for, the independent privacy practices of these providers beyond our use of their services.</p>

          <h2 style={sectionHeading}>4. Data sharing</h2>
          <p>We do not share your personal information with third parties except:</p>
          <ul style={listStyle}>
            <li>With the service providers listed above, as necessary to operate Supervisd</li>
            <li>If you are an RBT linked to a supervising BCBA&apos;s roster, your compliance status and hours summary may be visible to that supervisor, consistent with the purpose of the product</li>
            <li>If required by law, subpoena, or other legal process</li>
            <li>In connection with a merger, acquisition, or sale of assets, in which case we will make reasonable efforts to notify you</li>
          </ul>

          <h2 style={sectionHeading}>5. Data retention</h2>
          <p>We retain your account and fieldwork data for as long as your account is active, and for a reasonable period afterward in case you wish to reactivate or export your records. You may request deletion of your account and associated data at any time by contacting us (see Section 9).</p>

          <h2 style={sectionHeading}>6. Security</h2>
          <p>We take reasonable technical and administrative measures to protect your information, including encrypted connections (HTTPS) and access controls. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>

          <h2 style={sectionHeading}>7. Your choices</h2>
          <p>You can access, update, or correct most of your account and fieldwork information directly within the Supervisd dashboard. You may request a copy of your data or deletion of your account by contacting us.</p>

          <h2 style={sectionHeading}>8. Children&apos;s privacy</h2>
          <p>Supervisd is intended for use by adults pursuing BCBA or RBT certification and is not directed to children under 18. We do not knowingly collect information from children.</p>

          <h2 style={sectionHeading}>9. Contact us</h2>
          <p>If you have questions about this Privacy Policy or wish to exercise any of the rights described above, contact us at:</p>
          <p><strong><a href="mailto:PLACEHOLDER_EMAIL" style={{ color: 'var(--spruce)' }}>PLACEHOLDER_EMAIL</a></strong></p>

          <h2 style={sectionHeading}>10. Changes to this policy</h2>
          <p>We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or through a notice on the Supervisd dashboard. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.</p>
        </div>
      </div>
    </div>
  );
}

const sectionHeading = { fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, marginTop: 36, marginBottom: 10 };
const listStyle = { paddingLeft: 22, margin: '10px 0' };