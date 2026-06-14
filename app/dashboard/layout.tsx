'use client';
import { ApiProvider } from '../context/api-context';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'trainee' | 'bcba'>('trainee');

  return (
    <ApiProvider>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 360px', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>Accrue</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>BACB Compliance Platform</div>
          </div>

          <div style={{ margin: 12, background: 'var(--bg)', borderRadius: 10, padding: 3, display: 'flex' }}>
            {(['trainee', 'bcba'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, border: 0, background: role === r ? 'var(--spruce)' : 'transparent', color: role === r ? '#fff' : 'var(--muted)', font: '600 11px var(--sans)', padding: '7px 4px', borderRadius: 8, cursor: 'pointer' }}>
                {r === 'trainee' ? 'Trainee' : 'BCBA'}
              </button>
            ))}
          </div>

          <nav style={{ padding: 8, flex: 1 }}>
            {(role === 'trainee' ? [
              { label: 'Today', icon: '◉', href: '/dashboard' },
              { label: 'Log hours', icon: '＋', href: '/dashboard/fieldwork' },
              { label: 'Accrual record', icon: '↗', href: '/dashboard/fieldwork' },
              { label: 'Vault', icon: '▤', href: '/dashboard/compliance' },
              { label: 'Import history', icon: '⬆', href: '/dashboard/fieldwork' },
            ] : [
              { label: 'Roster', icon: '◉', href: '/dashboard' },
              { label: 'Sign forms', icon: '✎', href: '/dashboard' },
              { label: 'Records', icon: '▤', href: '/dashboard' },
              { label: 'My CEUs', icon: '↗', href: '/dashboard' },
            ]).map(item => (
              <a key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: 'var(--muted)', fontWeight: 500, marginBottom: 2, textDecoration: 'none', fontSize: 13.5, transition: 'all .15s' }}>
                <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{ margin: 8, padding: 12, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Total accrual</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>0</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>/ 2,000 hrs</span>
            </div>
            <div style={{ height: 4, background: 'var(--border2)', borderRadius: 99, overflow: 'hidden', margin: '8px 0' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: '0%' }} />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>5-yr deadline Aug 2029</div>
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--spruce-dim)', border: '1px solid var(--spruce)', color: 'var(--spruce)', fontWeight: 600, fontSize: 12, display: 'grid', placeItems: 'center', flexShrink: 0 }}>A</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Arian</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>BCBA</div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>

        {/* ── AGENT PANEL ── */}
        <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Ask Accrue ✦</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Answers from the BACB handbook</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>Quick questions</div>
              {['Am I on track this month?', 'What happens if I end at 4% supervision?', 'Is training a caregiver restricted or unrestricted?', 'What do I still need before month end?', 'Can group supervision exceed individual?'].map(q => (
                <button key={q} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--ink)', font: '500 12px var(--sans)', padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', lineHeight: 1.4 }}>{q}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <textarea placeholder="Ask a compliance question…" rows={1} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--ink)', font: '400 13px var(--sans)', padding: '10px 14px', borderRadius: 10, outline: 'none', resize: 'none' }} />
            <button style={{ background: 'var(--spruce)', border: 0, color: '#fff', font: '600 13px var(--sans)', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', alignSelf: 'flex-end' }}>Send</button>
          </div>
        </aside>

      </div>
    </ApiProvider>
  );
}