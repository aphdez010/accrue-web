export default function PrivacyPolicy() {
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
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 700, color: '#0F2018', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#5A7A65', fontSize: 14, marginBottom: 48 }}>Effective date: June 17, 2026</p>
        {[
          ['1. Overview', 'Supervisd operates supervisd.com and provides a BACB compliance tracking platform for behavior analysts and registered behavior technicians. This Privacy Policy explains how we collect, use, and protect information when you use our service.'],
          ['2. Information We Collect', 'We collect your name, email, role (BCBA or RBT), BACB certification number, BACB PID, agency name, fieldwork log entries, CEU records, supervision contact logs, and usage data. Authentication is managed by Clerk.'],
          ['3. How We Use Your Information', 'We use your data to provide and operate the platform, track BACB compliance progress, generate fieldwork summaries, communicate about your account, and improve the service. We do not sell your personal information.'],
          ['4. No HIPAA-Covered Data', 'Supervisd tracks professional credentials and fieldwork hours — not patient or client health information. Do not enter client names, patient identifiers, or any Protected Health Information (PHI) into Supervisd.'],
          ['5. Data Storage and Security', 'Your data is stored in a secure PostgreSQL database on Railway with encrypted connections (TLS/SSL), authentication tokens, and access controls. No system is 100% secure and we cannot guarantee absolute security.'],
          ['6. Third-Party Services', 'We use Clerk (authentication), Railway (hosting), Vercel (frontend), and Anthropic (AI features). Each operates under their own privacy policies.'],
          ['7. Data Retention', 'We retain your data as long as your account is active. Upon account deletion, personal data is removed within 30 days except where legally required.'],
          ['8. Your Rights', 'You may access, correct, or delete your personal data at any time by contacting privacy@supervisd.com. We will respond within 30 days.'],
          ['9. Changes to This Policy', 'We may update this policy from time to time. Continued use of Supervisd after changes are posted constitutes acceptance of the updated policy.'],
          ['10. Contact Us', 'Questions? Email privacy@supervisd.com or visit supervisd.com.'],
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
