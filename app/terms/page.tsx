export const metadata = {
  title: 'Terms of Service — Supervisd',
  description: 'The terms governing your use of Supervisd.',
};

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
        <a href="/" style={{ fontSize: 14, color: 'var(--spruce)', textDecoration: 'none', fontWeight: 600 }}>&larr; Back to Supervisd</a>

        <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 800, margin: '24px 0 8px', letterSpacing: '-.01em' }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 40 }}>Last updated: June 19, 2026</p>

        <div style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink)' }}>
          <p>These Terms of Service ("Terms") govern your access to and use of Supervisd (the "Service"), operated by Arian Perez ("Supervisd," "we," "us," or "our"). By creating an account or using the Service, you agree to these Terms.</p>

          <h2 style={sectionHeading}>1. Eligibility</h2>
          <p>You must be at least 18 years old and capable of forming a binding contract to use Supervisd. By using the Service, you represent that you meet these requirements.</p>

          <h2 style={sectionHeading}>2. What Supervisd is &mdash; and isn't</h2>
          <p>Supervisd is a fieldwork hour tracking and compliance tool intended to help BCBA trainees, RBTs, and supervising BCBAs organize and monitor progress against BACB requirements.</p>
          <p><strong>Supervisd is not affiliated with, endorsed by, or certified by the Behavior Analyst Certification Board (BACB).</strong> We make reasonable efforts to reflect current BACB requirements accurately, but BACB rules can change, and Supervisd's calculations and the "Ask Supervisd" assistant's answers are provided for informational and organizational purposes only. You are solely responsible for verifying your own eligibility and compliance directly with the BACB and your BCBA supervisor of record. Supervisd does not constitute legal, professional, or certification advice, and we are not responsible for certification decisions made by the BACB.</p>

          <h2 style={sectionHeading}>3. Your account</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us promptly if you suspect unauthorized access.</p>

          <h2 style={sectionHeading}>4. Subscriptions and billing</h2>
          <p>Supervisd is offered on a subscription basis. By subscribing, you authorize us (through our payment processor, Stripe) to charge your payment method on a recurring basis until you cancel.</p>
          <ul style={listStyle}>
            <li><strong>No long-term contract.</strong> You may cancel your subscription at any time through your account settings or by contacting us. Cancellation takes effect at the end of your current billing period.</li>
            <li><strong>Refunds.</strong> Fees already paid are generally non-refundable, except where required by law or at our discretion.</li>
            <li><strong>Price changes.</strong> We may change subscription pricing with reasonable advance notice. Continued use of the Service after a price change takes effect constitutes acceptance of the new price.</li>
          </ul>

          <h2 style={sectionHeading}>5. Your content and data</h2>
          <p>You retain ownership of the fieldwork data, documents, and other content you submit to Supervisd ("Your Content"). You grant us a limited license to store, process, and display Your Content solely as necessary to operate the Service.</p>
          <p>You agree not to upload client-identifying clinical information, protected health information, or any content you do not have the right to share. You are solely responsible for the accuracy of the hours and information you log.</p>

          <h2 style={sectionHeading}>6. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul style={listStyle}>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the Service or other users' accounts or data</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Use automated means to scrape or extract data from the Service without our consent</li>
            <li>Misrepresent your fieldwork hours or compliance status for purposes of certification fraud</li>
          </ul>

          <h2 style={sectionHeading}>7. Roster and supervisor visibility</h2>
          <p>If you are an RBT or trainee linked to a supervising BCBA's roster within Supervisd, you acknowledge that your logged hours and compliance status will be visible to that supervisor as part of the intended use of the Service.</p>

          <h2 style={sectionHeading}>8. Termination</h2>
          <p>You may stop using the Service and cancel your subscription at any time. We may suspend or terminate your access to the Service if you violate these Terms, or if we discontinue the Service, with reasonable notice where practicable.</p>

          <h2 style={sectionHeading}>9. Disclaimers</h2>
          <p style={{ textTransform: 'uppercase', fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>The service is provided "as is" and "as available," without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the service will be uninterrupted, error-free, or that compliance calculations will be free of error. You are responsible for independently verifying your compliance status with the BACB.</p>

          <h2 style={sectionHeading}>10. Limitation of liability</h2>
          <p style={{ textTransform: 'uppercase', fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>To the maximum extent permitted by law, Supervisd and its operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or certification opportunity, arising from your use of the service. Our total liability for any claim relating to the service shall not exceed the amount you paid us in the three months preceding the claim.</p>

          <h2 style={sectionHeading}>11. Changes to the Service or these Terms</h2>
          <p>We may modify or discontinue features of the Service, and may update these Terms from time to time. If we make material changes to these Terms, we will provide reasonable notice. Continued use of the Service after changes take effect constitutes acceptance.</p>

          <h2 style={sectionHeading}>12. Governing law</h2>
          <p>These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law principles, unless otherwise required by applicable law.</p>

          <h2 style={sectionHeading}>13. Contact us</h2>
          <p>Questions about these Terms can be sent to:</p>
          <p><strong><a href="mailto:PLACEHOLDER_EMAIL" style={{ color: 'var(--spruce)' }}>PLACEHOLDER_EMAIL</a></strong></p>
        </div>
      </div>
    </div>
  );
}

const sectionHeading = { fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, marginTop: 36, marginBottom: 10 };
const listStyle = { paddingLeft: 22, margin: '10px 0' };
