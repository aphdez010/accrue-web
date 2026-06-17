export default function TermsOfService() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F4F1', fontFamily: 'Inter, sans-serif', color: '#0F2018' }}>
      <div style={{ borderBottom: '1px solid #D8E4DC', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff' }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#1A7A50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>S</span>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#0F2018' }}>Supervisd</span>
        </a>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 700, color: '#0F2018', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: '#5A7A65', fontSize: 14, marginBottom: 48 }}>Effective date: June 17, 2026</p>
        {[
          ['1. Acceptance of Terms', 'By using Supervisd you agree to these Terms. If you do not agree, do not use the Service.'],
          ['2. Description of Service', 'Supervisd is a professional compliance tracking platform for BCBAs and RBTs to log fieldwork hours, supervision contacts, CEUs, and BACB progress.'],
          ['3. Eligibility', 'You must be at least 18 years old and a credentialed or supervised behavior analysis professional to use Supervisd.'],
          ['4. Account Responsibilities', 'You are responsible for maintaining the confidentiality of your credentials and all activity under your account. Notify us immediately of any unauthorized access.'],
          ['5. Acceptable Use', 'You agree not to enter false professional data, misrepresent your BACB compliance status, upload client or patient health information (PHI), or attempt unauthorized access to any part of the Service.'],
          ['6. Professional Accuracy Disclaimer', 'Supervisd is an organizational tool. We do not verify accuracy of logged hours or records. You are solely responsible for ensuring your data reflects actual professional activity. Always refer to current BACB Experience Standards for official requirements.'],
          ['7. No HIPAA-Covered Data', 'Do not enter Protected Health Information, client names, or patient-identifiable data into Supervisd. We track professional credentials and activities only.'],
          ['8. Subscription and Billing', 'Supervisd is offered on a subscription basis. You may cancel at any time; cancellations take effect at the end of the billing period. Refunds are not provided for partial periods.'],
          ['9. Intellectual Property', 'All content, features, and functionality of the Service are owned by Supervisd and protected by applicable intellectual property laws.'],
          ['10. Limitation of Liability', 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUPERVISD SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED AMOUNTS PAID IN THE PRIOR TWELVE MONTHS.'],
          ['11. Governing Law', 'These Terms are governed by the laws of the State of Florida. Disputes shall be resolved in Miami-Dade County, Florida.'],
          ['12. Contact Us', 'Questions? Email legal@supervisd.com or visit supervisd.com.'],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#0F2018', marginBottom: 12 }}>{title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#2D4A38' }}>{body}</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #D8E4DC', padding: '24px', textAlign: 'center', fontSize: 13, color: '#5A7A65' }}>
        © {new Date().getFullYear()} Supervisd · <a href="/privacy" style={{ color: '#1A7A50', textDecoration: 'none' }}>Privacy</a> · <a href="/terms" style={{ color: '#1A7A50', textDecoration: 'none' }}>Terms</a>
      </div>
    </div>
  )
}
