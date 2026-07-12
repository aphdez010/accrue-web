'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [role, setRole] = useState<'trainee' | 'bcba'>('trainee');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  async function handleGetStarted() {
    setCheckoutLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const res = await fetch(`${apiUrl}/billing/checkout-public`, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutLoading(false);
    }
  }

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

  const steps = [
    { n: '01', title: 'Log an hour in seconds', desc: 'Date, hours, task list area, setting. That\u2019s it \u2014 no formulas, no separate spreadsheet tabs to keep in sync.' },
    { n: '02', title: 'See the compliance math instantly', desc: 'The second you save it, your entry is checked against the real BACB rule set \u2014 supervision percentage, restricted ceiling, contact minimums.' },
    { n: '03', title: 'Export signed proof on demand', desc: 'One click generates a signed PDF for that month or your full record \u2014 ready before anyone asks for it.' },
  ];

  const features = [
    { title: 'Fieldwork logging', tag: 'LOG', color: 'spruce', desc: 'Log restricted, unrestricted, and supervised hours with start/end times, task list area, and setting — in under 30 seconds per entry.' },
    { title: 'Compliance checks', tag: 'CHK', color: 'sky', desc: 'Every BACB rule — 5% supervision, 50% restricted ceiling, monthly contacts, observation requirements — checked automatically against your real numbers.' },
    { title: 'Signed PDF export', tag: 'PDF', color: 'amber', desc: 'One-click monthly or full-record export with digital signature capture — ready the moment BACB or your supervisor asks.' },
    { title: 'Ask Supervisd', tag: 'ASK', color: 'spruce', desc: 'Ask a real BACB handbook question — "is training a caregiver restricted or unrestricted?" — and get a straight, cited answer.' },
    { title: 'Roster tracking', tag: 'ROS', color: 'sky', desc: "Supervising BCBAs see every RBT's compliance status in one table, instead of chasing down spreadsheets from each trainee." },
    { title: 'Document vault', tag: 'DOC', color: 'amber', desc: 'Signed supervision contracts, CEU certificates, and exported records, stored and searchable in one place.' },
    { title: 'Spreadsheet import', tag: 'CSV', color: 'spruce', desc: "Bring your existing hours in from a CSV without manually retyping every row you've already logged." },
    { title: 'CEU tracking', tag: 'CEU', color: 'sky', desc: 'Keep continuing education certificates organized and ready before renewal season catches you off guard.' },
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
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>Supervisd</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>Hours you can trust</div>
          </div>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handleGetStarted} disabled={checkoutLoading} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 10 }}>{checkoutLoading ? 'Loading...' : 'Get started'}</button>
              <button onClick={() => setMobileMenuOpen(o => !o)} aria-label="Toggle menu" style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                <div style={{ width: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ height: 2, background: 'var(--ink)', borderRadius: 1, transform: mobileMenuOpen ? 'translateY(6px) rotate(45deg)' : 'none', transition: 'transform .15s' }} />
                  <div style={{ height: 2, background: 'var(--ink)', borderRadius: 1, opacity: mobileMenuOpen ? 0 : 1, transition: 'opacity .15s' }} />
                  <div style={{ height: 2, background: 'var(--ink)', borderRadius: 1, transform: mobileMenuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none', transition: 'transform .15s' }} />
                </div>
              </button>
            </div>
          ) : (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
              <a href="#how-it-works" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>How it works</a>
              <a href="#features" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
              <a href="#pricing" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Pricing</a>
              <Link href="/sign-in?redirect_url=/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Sign in</Link>
              <button onClick={handleGetStarted} disabled={checkoutLoading} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '10px 18px', borderRadius: 10 }}>{checkoutLoading ? 'Loading...' : 'Get started'}</button>
            </nav>
          )}
        </div>
        {isMobile && mobileMenuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>How it works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Pricing</a>
            <Link href="/sign-in?redirect_url=/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Sign in</Link>
          </div>
        )}
      </header>

      <section style={{ background: 'radial-gradient(circle at 20% 0%, var(--spruce) 0%, #156944 55%, #0F4A30 100%)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '40px 20px 32px' : '64px 24px 80px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
            {(['trainee', 'bcba'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ border: 0, background: role === r ? '#fff' : 'transparent', color: role === r ? 'var(--spruce)' : 'rgba(255,255,255,.75)', font: '600 12px var(--sans)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
                {r === 'trainee' ? "I'm logging hours" : 'I supervise a roster'}
              </button>
            ))}
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 30 : 46, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.02em', margin: '0 0 18px', color: '#fff' }}>
            {role === 'trainee'
              ? <>Know exactly when you&apos;ll finish <span style={{ color: 'var(--sky-dim)' }}>before your supervisor has to ask.</span></>
              : <>Catch a ratio violation <span style={{ color: 'var(--sky-dim)' }}>before it becomes an audit problem.</span></>}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.82)', maxWidth: 460, margin: '0 0 28px' }}>
            {role === 'trainee'
              ? "Most BCBA trainees track 2,000 hours in a spreadsheet and don't find out they're behind until it's too late to fix. Supervisd checks your numbers against the real BACB rules the moment you log an hour."
              : "Track every supervisee's hours in one table, catch a compliance issue while it's still fixable, and sign off without touching a printer."}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <button onClick={handleGetStarted} disabled={checkoutLoading} style={{ background: 'var(--sky)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '14px 26px', borderRadius: 10, boxShadow: '0 8px 20px rgba(45,143,214,.35)' }}>{checkoutLoading ? 'Loading...' : 'Start tracking'}</button>
            <a href="#pricing" style={{ color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '14px 26px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)' }}>See pricing</a>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', margin: '0 0 24px' }}>Every hour you don&apos;t track correctly today is an hour you&apos;ll have to reconstruct from memory later.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 99, padding: '6px 14px' }}>Built by a working BCBA</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 99, padding: '6px 14px' }}>BACB Handbook accurate</div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,.25), 0 4px 12px rgba(0,0,0,.1)', marginTop: isMobile ? 0 : 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--spruce)' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Live calculation</div>
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Will I make it?</div>

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
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 24px 0' }}>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}><span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', fontSize: 18 }}>2,000</span> hour rule, built in</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}><span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', fontSize: 18 }}>5%</span> supervision math, automatic</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}><span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', fontSize: 18 }}>0</span> spreadsheets needed</div>
        </div>
      </section>

      <section id="how-it-works" style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '48px 20px 8px' : '72px 24px 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 44px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>How it works</div>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: 14, letterSpacing: '-.01em' }}>Three steps. No spreadsheet required.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 24 : 28 }}>
          {steps.map(s => (
            <div key={s.n} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 26 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, color: 'var(--spruce)', opacity: 0.5, marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="walkthrough" style={{ background: 'var(--surface2)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '48px 20px' : '72px 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>See it in action</div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: 14, letterSpacing: '-.01em' }}>This is the actual app. Not a mockup.</h2>
            <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.6 }}>Log an hour, and Supervisd checks it against the real BACB handbook the same second — no end-of-month math, no spreadsheet formulas to get wrong.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 56 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.9fr 1.1fr', gap: 40, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Step 1 — your dashboard</div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, marginBottom: 14, letterSpacing: '-.01em' }}>Every hour, broken down the way BACB actually reads it.</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--muted)' }}>Restricted, unrestricted, supervised, independent — split out automatically as you log, with your real percentage against the 50% restricted ceiling and 5% supervision minimum. No more wondering which bucket an hour falls into.</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <img src="/images/dashboard-populated.png" alt="Supervisd compliance dashboard showing total hours, supervised hours, and BACB requirement checks" style={{ width: '100%', display: 'block', height: isMobile ? 280 : 400, objectFit: 'cover', objectPosition: 'top' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: 40, alignItems: 'center' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', order: isMobile ? 2 : 1 }}>
                <img src="/images/monthly-review-populated.png" alt="Supervisd monthly compliance review showing supervision and restricted hour rules both met, with PDF export" style={{ width: '100%', display: 'block', height: isMobile ? 280 : 400, objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div style={{ order: isMobile ? 1 : 2 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--spruce)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Step 2 — monthly review</div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, marginBottom: 14, letterSpacing: '-.01em' }}>Walk into supervision with proof, not promises.</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--muted)' }}>Each BACB requirement gets its own pass/fail check, every month — supervision percentage, restricted ceiling, contact minimums, observation requirements. When you&apos;re ready, export a signed PDF in one click. No scrambling through old emails when BACB asks for documentation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px 80px' }}>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}><span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', fontSize: 18 }}>4 BACB rules</span> checked automatically</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}><span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', fontSize: 18 }}>Every month</span>, not just at certification</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}><span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', fontSize: 18 }}>0 manual math</span> — percentages done for you</div>
          </div>
        </section>

      <section style={{ background: 'var(--surface2)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '0 20px 48px' : '0 24px 72px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <img src="/images/pain.png" alt="" style={{ width: '100%', display: 'block', height: isMobile ? 240 : 340, objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>The problem</div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 24 : 30, fontWeight: 800, marginBottom: 18, letterSpacing: '-.01em' }}>A missed row in a spreadsheet costs you three months.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--muted)', marginBottom: 16 }}>BCBA certification requires 2,000 supervised fieldwork hours (or 1,500 for the concentrated pathway), with at least 5% of those hours under direct supervision and no more than 50% coming from restricted activities. Those are simple rules on paper — until you&apos;re three spreadsheet tabs deep, six months in, and a wrong formula has quietly thrown off your restricted percentage.</p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--muted)' }}>And when BACB asks for documentation, you want a signed PDF ready to go — not a scramble through old emails and texts trying to reconstruct what actually happened in March.</p>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '48px 20px' : '72px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'center' }}>
          <div style={{ order: isMobile ? 2 : 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>The outcome</div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 24 : 30, fontWeight: 800, marginBottom: 18, letterSpacing: '-.01em' }}>Walk into supervision knowing exactly where you stand.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--muted)', marginBottom: 16 }}>Every hour you log gets checked against the real BACB handbook rules in real time. No more mental math during your session, no more end-of-month panic — just a clear number and a clear date.</p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--muted)' }}>That&apos;s an hour back every week you&apos;d have spent untangling a spreadsheet — time you can spend actually working with your client.</p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', order: isMobile ? 1 : 2 }}>
            <img src="/images/outcome.png" alt="" style={{ width: '100%', display: 'block', height: isMobile ? 240 : 340, objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '32px 20px' : '40px 24px', display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: 'var(--spruce)' }}>★★★★★</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 360 }}>&quot;I finally stopped doing the math myself. <span style={{ color: 'var(--ink)', fontWeight: 600 }}>It just tells me.</span>&quot; — BCBA trainee</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 360 }}>&quot;Catching a ratio issue before it became an audit problem <span style={{ color: 'var(--ink)', fontWeight: 600 }}>saved my whole quarter.</span>&quot; — Supervising BCBA</div>
        </div>
      </section>

      <section id="features" style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '24px 20px 48px' : '64px 24px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Everything in one place</div>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-.01em' }}>Built around the BACB handbook, not a generic tracker.</h2>
        <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 620, margin: '0 0 36px' }}>Every feature exists because a real BACB rule required it. Here&apos;s everything that&apos;s already built and live — not a roadmap, the actual product.</p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 18 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: `var(--${f.color})`, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: `var(--${f.color})`, textTransform: 'uppercase' }}>{f.tag}</span>
              </div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{f.desc}</div>
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
              <li key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--spruce)', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'var(--ink)' }}>{item}</span>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, background: 'var(--spruce-dim)', color: 'var(--spruce)' }}>✓</span>
              </li>
            ))}
          </ul>
          <button onClick={handleGetStarted} disabled={checkoutLoading} style={{ display: 'inline-block', background: 'var(--spruce)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 32px', borderRadius: 10 }}>{checkoutLoading ? 'Loading...' : 'Get started'}</button>
        </div>
      </section>

      <section style={{ background: 'var(--ink)', padding: isMobile ? '48px 20px' : '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--display)', color: '#fff', fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: '0 0 14px' }}>Your hours are already accruing.</h2>
        <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, margin: '0 0 8px' }}>Every week you track them in a spreadsheet is a week you&apos;re trusting your own math.</p>
        <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, margin: '0 0 28px' }}>Start tracking them correctly today.</p>
        <button onClick={handleGetStarted} disabled={checkoutLoading} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 30px', borderRadius: 10 }}>{checkoutLoading ? 'Loading...' : 'Start tracking'}</button>
      </section>

      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '40px 20px 24px' : '56px 24px 32px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr 1fr 1fr', gap: isMobile ? 28 : 40 }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>Supervisd</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Hours you can trust</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 240 }}>BACB-compliant fieldwork hour tracking for BCBA trainees and the supervisors who sign off on them.</p>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Product</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="#how-it-works" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>How it works</a>
              <a href="#features" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Features</a>
              <a href="#pricing" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Pricing</a>
              <Link href="/sign-in?redirect_url=/dashboard" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Sign in</Link>
              <Link href="/sign-up?redirect_url=/dashboard" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Get started</Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:hello@supervisd.com" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Contact</a>
              <a href="/privacy" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Privacy policy</a>
              <a href="/terms" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Terms of service</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Follow</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="#" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Instagram</a>
              <a href="#" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>TikTok</a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 24px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>© 2026 Supervisd. All rights reserved.</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Hours you can trust</div>
        </div>
      </footer>
    </div>
  );
}