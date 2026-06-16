'use client';
import { ApiProvider } from '../context/api-context';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';

type Message = { role: 'user' | 'assistant'; content: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bcbaRoutes = ['/dashboard/roster', '/dashboard/forms', '/dashboard/records', '/dashboard/ceus'];
  const [role, setRole] = useState<'trainee' | 'bcba'>(bcbaRoutes.some(r => pathname.startsWith(r)) ? 'bcba' : 'trainee');
  useEffect(() => {
    setRole(bcbaRoutes.some(r => pathname.startsWith(r)) ? 'bcba' : 'trainee');
  }, [pathname]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileAgentOpen, setMobileAgentOpen] = useState(false);
  const [totalHours, setTotalHours] = useState<number>(0);
  const { getToken } = useAuth();
  useEffect(() => {
    const fetchHours = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        const res = await fetch(`${apiUrl}/compliance`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (d.totalHours !== undefined) setTotalHours(Number(d.totalHours));
      } catch {}
    };
    fetchHours();
  }, []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Am I on track this month?',
    'What happens if I end at 4% supervision?',
    'Is training a caregiver restricted or unrestricted?',
    'What do I still need before month end?',
    'Can group supervision exceed individual?',
  ];

  return (
    <ApiProvider>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr 360px', gridTemplateRows: isMobile ? 'auto 1fr' : '1fr', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {isMobile && (
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>Supervisd</div>
            <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 8, padding: 3, gap: 2 }}>
              {(['trainee', 'bcba'] as const).map(r => (
                <button key={r} onClick={() => setRole(r)} style={{ border: 0, background: role === r ? 'var(--spruce)' : 'transparent', color: role === r ? '#fff' : 'var(--muted)', font: '600 10px var(--sans)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer' }}>
                  {r === 'trainee' ? 'Trainee' : 'BCBA'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', padding: '0 12px 12px', gap: 6 }}>
            {(role === 'trainee' ? [
              { label: 'Today', href: '/dashboard' },
              { label: 'Log hours', href: '/dashboard/fieldwork' },
              { label: 'Accrual', href: '/dashboard/compliance' },
              { label: 'Vault', href: '/dashboard/vault' },
              { label: 'Import', href: '/dashboard/import' },
            ] : [
              { label: 'Roster', href: '/dashboard/roster' },
              { label: 'Sign forms', href: '/dashboard/forms' },
              { label: 'Records', href: '/dashboard/records' },
              { label: 'My CEUs', href: '/dashboard/ceus' },
            ]).map(item => (
              <a key={item.label} href={item.href} style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: pathname === item.href ? 'var(--spruce)' : 'var(--bg)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: pathname === item.href ? '#fff' : 'var(--ink)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}

        {/* SIDEBAR */}
        {!isMobile && <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>Supervisd</div>
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
              { label: 'Log hours', icon: '+', href: '/dashboard/fieldwork' },
              { label: 'Accrual record', icon: '↗', href: '/dashboard/compliance' },
              { label: 'Vault', icon: '▣', href: '/dashboard/vault' },
              { label: 'Import history', icon: '⬆', href: '/dashboard/import' },
            ] : [
              { label: 'Roster', icon: '◉', href: '/dashboard/roster' },
              { label: 'Sign forms', icon: '✦', href: '/dashboard/forms' },
              { label: 'Records', icon: '▣', href: '/dashboard/records' },
              { label: 'My CEUs', icon: '↗', href: '/dashboard/ceus' },
            ]).map(item => (
              <a key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: 'var(--muted)', fontWeight: 500, marginBottom: 2, textDecoration: 'none', fontSize: 13.5, transition: 'all .15s' }}>
                <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{ margin: 8, padding: 12, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Total accrual</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{totalHours.toFixed(0)}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>/ 2,000 hrs</span>
            </div>
            <div style={{ height: 4, background: 'var(--border2)', borderRadius: 99, overflow: 'hidden', margin: '8px 0' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: `${Math.min((totalHours / 2000) * 100, 100).toFixed(1)}%` }} />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>5-yr deadline Aug 2029</div>
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--spruce-dim)', border: '1px solid var(--spruce)', color: 'var(--spruce)', fontWeight: 600, fontSize: 12, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{user?.firstName?.[0]?.toUpperCase() || "?"}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.firstName || 'Arian'}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>BCBA</div>
            </div>
          </div>
          <button onClick={() => signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 8px', borderRadius: 6, flexShrink: 0 }}>↪ out</button>
        </aside>}

        {/* MOBILE AGENT OVERLAY */}
        {isMobile && mobileAgentOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700 }}>Ask Supervisd ✦</div>
              <button onClick={() => setMobileAgentOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>Quick questions</div>
                  {quickQuestions.map(q => (
                    <button key={q} onClick={() => { handleSend(q); }} style={{ textAlign: 'left', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', cursor: 'pointer' }}>{q}</button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ background: m.role === 'user' ? 'var(--spruce)' : 'var(--bg)', color: m.role === 'user' ? '#fff' : 'var(--ink)', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, maxWidth: '90%', fontFamily: 'var(--sans)' }}>{m.content}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask a compliance question..." style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none', color: 'var(--ink)' }} />
              <button onClick={() => handleSend()} disabled={loading} style={{ background: 'var(--spruce)', border: 0, color: '#fff', font: '600 13px var(--sans)', padding: '10px 16px', borderRadius: 10, cursor: 'pointer' }}>Send</button>
            </div>
          </div>
        )}
        {isMobile && (
          <button onClick={() => setMobileAgentOpen(true)} style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 90, background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: '50%', width: 52, height: 52, fontSize: 20, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✦</button>
        )}
        {/* MAIN */}
        <main style={{ overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>

        {/* AGENT PANEL */}
        {!isMobile && <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Ask Supervisd ✦</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Answers from the BACB handbook</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>Quick questions</div>
                {quickQuestions.map(q => (
                  <button key={q} onClick={() => handleSend(q)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', font: '500 12px var(--sans)', padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', lineHeight: 1.4 }}>{q}</button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{m.role === 'user' ? 'You' : 'Supervisd'}</div>
                <div style={{ background: m.role === 'user' ? 'var(--spruce)' : 'var(--surface2)', color: m.role === 'user' ? '#fff' : 'var(--ink)', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, maxWidth: '90%', fontFamily: 'var(--sans)' }}><ReactMarkdown>{m.content}</ReactMarkdown></div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Supervisd</div>
                <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 12, fontSize: 13, color: 'var(--muted)' }}>Thinking…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <textarea
              placeholder="Ask a compliance question…"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--ink)', font: '400 13px var(--sans)', padding: '10px 14px', borderRadius: 10, outline: 'none', resize: 'none' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              style={{ background: 'var(--spruce)', border: 0, color: '#fff', font: '600 13px var(--sans)', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', alignSelf: 'flex-end', opacity: loading ? 0.6 : 1 }}>Send</button>
          </div>
        </aside>}

      </div>
    </ApiProvider>
  );
}
