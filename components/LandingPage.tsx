'use client';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [role, setRole] = useState<'trainee' | 'bcba'>('trainee');
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [hoursLogged, setHoursLogged] = useState<number>(0);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const today = new Date();
  const defaultDeadline = new Date(today);
  defaultDeadline.setFullYear(defaultDeadline.getFullYear() + 5);
  const [deadline, setDeadline] = useState<string>(defaultDeadline.toISOString().slice(0, 10));

  const remainingHours = Math.max(2000 - hoursLogged, 0);
  const weeksNeeded = hoursPerWeek > 0 ? Math.ceil(remainingHours / hoursPerWeek) : Infinity;
  const projectedDate = new Date(today.getTime() + weeksNeeded * 7 * 24 * 60 * 60 * 1000);
  const deadlineDate = new Date(deadline);
  const weeksUntilDeadline = Math.max((deadlineDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000), 0.01);
  const neededPerWeek = remainingHours / weeksUntilDeadline;
  const onPace = projectedDate.getTime() <= deadlineDate.getTime();
  const progressPct = Math.min((hoursLogged / 2000) * 100, 100);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const projectedLabel = isFinite(weeksNeeded)
    ? monthNames[projectedDate.getMonth()] + ' ' + projectedDate.getFullYear()
    : 'N/A';

  const features = [
    { icon: '◉', title: 'Fieldwork logging', desc: 'Log restricted, unrestricted, and supervised hours in seconds.' },
    { icon: '↗', title: 'Accrual record', desc: "Real-time math against BACB's 2,000/1,500-hour and 5% supervision rules." },
    { icon: '▣', title: 'Document vault', desc: 'Every signed form and CEU certificate, stored and searchable.' },
    { icon: '⬆', title: 'Import history', desc: 'Bring in hours from a spreadsheet without re-typing a row.' },
    { icon: '✦', title: 'Ask Supervisd', desc: 'Ask the BACB handbook a question, get a straight answer.' },
    { icon: '◉', title: 'Roster tracking', desc: "See every supervisee's compliance status in one table." },
    { icon: '✦', title: 'Sign forms', desc: 'Digital signatures on supervision contracts, no printer required.' },
    { icon: '▣', title: 'CEU tracking', desc: 'Keep certificates organized and ready for renewal season.' },
  ];

  const included = [
    'Fieldwork hour logging (BACB-compliant)',
    'Compliance dashboard with all BACB metrics',
    'PDF export with digital signature',
    'Document vault (Cloudinary storage)',
    'Ask Supervisd AI agent',
    'BCBA roster + supervisee tracking',
    'RBT invite flow',
    'CEU tracking',
    'Mobile responsive',
  ];

  return (
    <div style={{ background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--ink)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>Supervisd</div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 28, flexWrap: 'wrap' }}>
            <a href="#features" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
            <a href="#pricing" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Pricing</a>
            <a href="/sign-in?redirect_url=/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Sign in</a>
            <a href="/sign-up?redirect_url=/dashboard" style={{ background: 'var(--spruce)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '10px 18px', borderRadius: 10 }}>Get started</a>
          </nav>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '40px 20px 32px' : '64px 24px 48px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
            {(['trainee', 'bcba'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ border: 0, background: role === r ? 'var(--spruce)' : 'transparent', color: role === r ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
                {r === 'trainee' ? "I'm logging hours" : "I supervise a roster"}
              </button>
            ))}
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 30 : 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.02em', margin: '0 0 18px' }}>
            {role === 'trainee'
              ? <>Know exactly when you'll finish your hours.</>
              : <>See your whole roster's compliance, at a glance.</>}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 460, margin: '0 0 32px' }}>
            {role === 'trainee'
              ? "Stop guessing if you're on pace. Track restricted, unrestricted, and supervised hours against BACB's real requirements, and get an actual completion date."
              : "Track every supervisee's hours, catch a ratio violation before it becomes an audit problem, and sign forms without a printer."}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/sign-up?redirect_url=/dashboard" style={{ background: 'var(--spruce)', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '14px 26px', borderRadius: 10 }}>Start tracking free</a>
            <a href="#pricing" style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '14px 26px', borderRadius: 10, border: '1px solid var(--border)' }}>See pricing</a>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Will I make it?</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Your fieldwork pace</div>

          <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Hours logged so far</label>
          <input type="number" min={0} max={2000} value={hoursLogged} onChange={e => setHoursLogged(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 14, marginBottom: 16, color: 'var(--ink)', background: 'var(--bg)' }} />

          <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Hours you can log per week</label>
          <input type="number" min={1} max={40} value={hoursPerWeek} onChange={e => setHoursPerWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 14, marginBottom: 16, color: 'var(--ink)', background: 'var(--bg)' }} />

          <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Your deadline</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 14, marginBottom: 20, color: 'var(--ink)', background: 'var(--bg)' }} />

          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: progressPct.toFixed(1) + '%', borderRadius: 99 }} />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>{hoursLogged} / 2,000 hrs logged</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Projected completion</span>
            <span style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800 }}>{projectedLabel}</span>
          </div>

          <div style={{ background: onPace ? 'var(--spruce-dim)' : 'rgba(217,119,6,0.12)', border: '1px solid ' + (onPace ? 'var(--spruce)' : 'var(--amber)'), color: onPace ? 'var(--spruce)' : 'var(--amber)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
            {onPace
              ? 'On pace for your deadline'
              : 'Behind pace, log ~' + Math.ceil(neededPerWeek) + ' hrs/week to make your deadline'}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '24px 20px' : '40px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { t: 'Spreadsheets lose hours', d: 'A missed row, a wrong formula, and three months of fieldwork is suddenly unaccounted for.' },
          { t: 'Ratio math is easy to get wrong', d: "The 5% supervision minimum and 50% restricted-hours ceiling are simple rules, until you're tracking them by hand." },
          { t: "Audit day shouldn't be a guessing game", d: 'When BACB asks for documentation, you want a signed PDF, not a scramble through old emails.' },
        ].map(c => (
          <div key={c.t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{c.t}</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>{c.d}</div>
          </div>
        ))}
      </section>

      <section id="features" style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '24px 20px 48px' : '40px 24px 64px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Everything in one place</div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: '0 0 32px', letterSpacing: '-.01em' }}>Built around the BACB handbook, not a generic tracker.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 18 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg)', display: 'grid', placeItems: 'center', fontSize: 16, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '0 20px 56px' : '0 24px 80px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Supervisd Pro</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 40, fontWeight: 800, marginBottom: 4 }}>$39.99<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--muted)' }}>/mo</span></div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Full BACB compliance tracking for RBTs and BCBAs.</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', textAlign: 'left' }}>
            {included.map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--spruce)' }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <a href="/sign-up?redirect_url=/dashboard" style={{ display: 'inline-block', background: 'var(--spruce)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 32px', borderRadius: 10 }}>Get started</a>
        </div>
      </section>

      <section style={{ background: 'var(--ink)', padding: isMobile ? '48px 20px' : '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--display)', color: '#fff', fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: '0 0 14px' }}>Your hours are already accruing.</h2>
        <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, margin: '0 0 28px' }}>Start tracking them correctly today.</p>
        <a href="/sign-up?redirect_url=/dashboard" style={{ background: 'var(--spruce)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 30px', borderRadius: 10 }}>Start tracking free</a>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Supervisd</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>BACB Compliance Platform</div>
      </footer>
    </div>
  );
}
