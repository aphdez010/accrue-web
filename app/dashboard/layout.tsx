'use client';
import { ApiProvider } from '../context/api-context';
import { ComplianceProvider, useCompliance } from '../context/compliance-context';
import { useState, useRef, useEffect, Suspense, Fragment } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';

type Message = { role: 'user' | 'assistant'; content: string };
type Role = 'trainee' | 'bcaba' | 'bcba';

function getRoleFromPath(pathname: string, roleParam: string | null): Role {
  if (roleParam === 'trainee' || roleParam === 'bcaba' || roleParam === 'bcba') return roleParam;
  const bcbaSupervisorRoutes = ['/dashboard/roster', '/dashboard/forms', '/dashboard/records', '/dashboard/ceus', '/dashboard/bcba/trainees', '/dashboard/bcaba/trainees', '/dashboard/bcaba/invoices'];
  if (bcbaSupervisorRoutes.some(r => pathname.startsWith(r))) return 'bcba';
  if (pathname === '/dashboard') return 'bcba';
  if (pathname.startsWith('/dashboard/bcaba')) return 'bcaba';
  return 'trainee';
}

const roleLabels: Record<Role, string> = { trainee: 'BCBA Trainee', bcaba: 'BCaBA Trainee', bcba: 'Supervisor' };
const roleCaptions: Record<Role, string> = {
  trainee: 'Logging your own BCBA fieldwork hours',
  bcaba: 'Logging your own BCaBA fieldwork hours',
  bcba: 'Supervising BCaBA and BCBA trainees',
};

// Where clicking each role tab should actually take you. Previously the tabs
// only updated local state (which relabeled the sidebar links) without
// navigating, so clicking a tab appeared to do nothing unless you separately
// clicked a nav link underneath.
const roleDefaultPath: Record<Role, string> = {
  trainee: '/dashboard/fieldwork',
  bcaba: '/dashboard/bcaba',
  bcba: '/dashboard',
};

// Owner/dev accounts that keep the full three-way view toggle for testing.
// Everyone else is locked to the single view their account_type implies.
// (prod owner, local-dev owner)
const OWNER_CLERK_IDS = ['user_3F9tY9Opc2DWMu3q7A51f1kUwKC', 'user_3F5cM0lihS8T7Pv1laXX1nNBNEp'];

// Durable account_type (stored on the professional record) -> which view.
const accountTypeToRole: Record<string, Role> = {
  bcba_trainee: 'trainee',
  bcaba_trainee: 'bcaba',
  supervisor: 'bcba',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const [role, setRole] = useState<Role>(getRoleFromPath(pathname, roleParam));
  useEffect(() => {
    setRole(getRoleFromPath(pathname, roleParam));
  }, [pathname, roleParam]);

  function handleRoleSwitch(r: Role) {
    setRole(r);
    router.push(roleDefaultPath[r]);
  }

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
  const { getToken } = useAuth();

  // Owner/dev keeps the full toggle; everyone else is bound to their account_type.
  const isOwner = !!user && OWNER_CLERK_IDS.includes(user.id);
  const [accountType, setAccountType] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const res = await fetch(`${apiUrl}/professionals/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const pro = await res.json();
        if (!cancelled) setAccountType(pro?.account_type ?? null);
      } catch { /* fall back to path-derived role */ }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  // Non-owner + known account_type => locked to that single view (path/param ignored).
  // Owner, or legacy account with no account_type => fall back to the toggle/path role.
  const lockedRole: Role | null = (!isOwner && accountType && accountTypeToRole[accountType]) ? accountTypeToRole[accountType] : null;
  const effectiveRole: Role = lockedRole ?? role;
  const showToggle = isOwner;
  const [mobileAgentOpen, setMobileAgentOpen] = useState(false);

  // Link any pending Stripe checkout session (from the pay-first landing page flow)
  // to this account before running the subscription-status check below.
  useEffect(() => {
    const linkPendingCheckoutSession = async () => {
      const sessionId = sessionStorage.getItem('pending_checkout_session_id');
      if (!sessionId) return;
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        await fetch(`${apiUrl}/billing/link-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch {
        // If linking fails, fall through to the normal subscription check below,
        // which will redirect to /dashboard/billing if the account isn't active.
      } finally {
        sessionStorage.removeItem('pending_checkout_session_id');
      }
    };
    linkPendingCheckoutSession();
  }, []);

  useEffect(() => {
    const checkOnboarded = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        const meRes = await fetch(`${apiUrl}/professionals/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (meRes.status === 404) { router.push('/onboarding'); return; }
      } catch {}
    };
    checkOnboarded();
  }, []);
  useEffect(() => {
    if (pathname.startsWith('/dashboard/billing')) return;
    const checkSubscription = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        const res = await fetch(`${apiUrl}/billing/status`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 404) return;
        const data = await res.json();
        if (data.subscription_status !== 'active') {
          router.push('/dashboard/billing');
        }
      } catch {}
    };
    checkSubscription();
  }, [pathname]);
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
      if (res.status === 403) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Ask Supervisd is a Pro feature. Head to Billing to subscribe and unlock it.' }]);
        return;
      }
      if (res.status === 401) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Please sign in again to use the assistant.' }]);
        return;
      }
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
    <ComplianceProvider>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr 360px', gridTemplateRows: isMobile ? 'auto 1fr' : '1fr', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {isMobile && (
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, minWidth: 0 }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>Supervisd</div>
            {showToggle ? (
              <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 8, padding: 3, gap: 2, overflowX: 'auto' as const, maxWidth: '50vw' }}>
                {(['trainee', 'bcaba', 'bcba'] as const).map(r => (
                  <button key={r} onClick={() => handleRoleSwitch(r)} style={{ border: 0, background: effectiveRole === r ? 'var(--spruce)' : 'transparent', color: effectiveRole === r ? '#fff' : 'var(--muted)', font: '600 9.5px var(--sans)', lineHeight: 1.2, padding: '5px 7px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ font: '600 10px var(--sans)', color: 'var(--spruce)', background: 'var(--bg)', padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap' as const }}>
                {roleLabels[effectiveRole]}
              </div>
            )}
            <button onClick={() => signOut()} style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted)', padding: '5px 8px', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', padding: '0 12px 12px', gap: 6 }}>
            {(effectiveRole === 'trainee' ? [
              { label: 'Log hours', href: '/dashboard/fieldwork' },
              { label: 'Accrual', href: '/dashboard/compliance' },
              { label: 'Vault', href: '/dashboard/vault' },
              { label: 'Import', href: '/dashboard/import' },
              { label: 'M-FVF', href: '/dashboard/monthly-verification' },
              { label: 'F-FVF', href: '/dashboard/final-verification' },
              { label: 'Billing', href: '/dashboard/billing' },
            ] : effectiveRole === 'bcaba' ? [
              { label: 'Log hours', href: '/dashboard/bcaba' },
              { label: 'Accrual', href: '/dashboard/compliance?role=bcaba' },
              { label: 'M-FVF', href: '/dashboard/bcaba/monthly-verification' },
              { label: 'F-FVF', href: '/dashboard/bcaba/final-verification' },
            ] : [
              { label: 'Today', href: '/dashboard' },
              { label: 'My CEUs', href: '/dashboard/ceus' },
              { label: 'My BCaBA Trainees', href: '/dashboard/bcaba/trainees' },
              { label: 'My BCBA Trainees', href: '/dashboard/bcba/trainees' },
              { label: 'Invoices', href: '/dashboard/bcaba/invoices' },
              { label: 'M-FVF', href: '/dashboard/bcaba/monthly-verification' },
              { label: 'F-FVF', href: '/dashboard/bcaba/final-verification' },
              { label: 'RBT Roster', href: '/dashboard/roster' },
              { label: 'RBT Sign forms', href: '/dashboard/forms' },
              { label: 'RBT Records', href: '/dashboard/records' },
            ]).map(item => (
              <a key={item.label} href={item.href} style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: pathname === item.href ? 'var(--spruce)' : 'var(--bg)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: pathname === item.href ? '#fff' : item.label.startsWith('RBT') ? 'var(--muted)' : 'var(--ink)', opacity: item.label.startsWith('RBT') && pathname !== item.href ? 0.6 : 1, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {item.label.replace('RBT ', '')}
              </a>
            ))}
          </div>
        </div>
      )}

        {!isMobile && <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>Supervisd</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>BACB Compliance Platform</div>
          </div>

          {showToggle ? (
            <div style={{ margin: '12px 12px 4px', background: 'var(--bg)', borderRadius: 10, padding: 4, display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
              {(['trainee', 'bcaba', 'bcba'] as const).map(r => (
                <button key={r} onClick={() => handleRoleSwitch(r)} style={{ border: 0, background: effectiveRole === r ? 'var(--spruce)' : 'transparent', color: effectiveRole === r ? '#fff' : 'var(--muted)', font: '600 12px var(--sans)', textAlign: 'left' as const, padding: '9px 10px', borderRadius: 7, cursor: 'pointer' }}>
                  {roleLabels[r]}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ margin: '12px 12px 4px', background: 'var(--bg)', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--spruce)', flexShrink: 0 }} />
              <span style={{ font: '600 12px var(--sans)', color: 'var(--ink)' }}>{roleLabels[effectiveRole]}</span>
            </div>
          )}
          <p style={{ margin: '0 12px 12px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>
            {roleCaptions[effectiveRole]}
          </p>

          <nav style={{ padding: 8, flex: 1 }}>
            {(effectiveRole === 'trainee' ? [
              { label: 'Log hours', icon: '+', href: '/dashboard/fieldwork' },
              { label: 'Accrual record', icon: '↗', href: '/dashboard/compliance' },
              { label: 'Vault', icon: '▣', href: '/dashboard/vault' },
              { label: 'Import history', icon: '⬆', href: '/dashboard/import' },
              { label: 'M-FVF', icon: '✓', href: '/dashboard/monthly-verification' },
              { label: 'F-FVF', icon: '◆', href: '/dashboard/final-verification' },
            ] : effectiveRole === 'bcaba' ? [
              { label: 'Log hours', icon: '+', href: '/dashboard/bcaba' },
              { label: 'Accrual record', icon: '↗', href: '/dashboard/compliance?role=bcaba' },
              { label: 'M-FVF', icon: '✓', href: '/dashboard/bcaba/monthly-verification' },
              { label: 'F-FVF', icon: '◆', href: '/dashboard/bcaba/final-verification' },
            ] : [
              { label: 'Today', icon: '◎', href: '/dashboard' },
              { label: 'My CEUs', icon: '↗', href: '/dashboard/ceus' },
              { label: 'My BCaBA Trainees', icon: '◈', href: '/dashboard/bcaba/trainees' },
              { label: 'My BCBA Trainees', icon: '◈', href: '/dashboard/bcba/trainees' },
              { label: 'Invoices', icon: '$', href: '/dashboard/bcaba/invoices' },
              { label: 'M-FVF', icon: '✓', href: '/dashboard/bcaba/monthly-verification' },
              { label: 'F-FVF', icon: '◆', href: '/dashboard/bcaba/final-verification' },
              { label: 'RBT Roster', icon: '◉', href: '/dashboard/roster' },
              { label: 'RBT Sign forms', icon: '✦', href: '/dashboard/forms' },
              { label: 'RBT Records', icon: '▣', href: '/dashboard/records' },
            ]).map((item, i, arr) => (
              <Fragment key={item.label}>
                {item.label.startsWith('RBT') && !arr[i - 1]?.label.startsWith('RBT') && (
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', margin: '14px 12px 6px', opacity: 0.7 }}>Not yet available</p>
                )}
                <a href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: 'var(--muted)', fontWeight: 500, marginBottom: 2, textDecoration: 'none', fontSize: 13.5, transition: 'all .15s', opacity: item.label.startsWith('RBT') ? 0.55 : 1 }}>
                  <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
                  {item.label.replace('RBT ', '')}
                </a>
              </Fragment>
            ))}
          </nav>

          <SidebarAccrualWidget />

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--spruce-dim)', border: '1px solid var(--spruce)', color: 'var(--spruce)', fontWeight: 600, fontSize: 12, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "?").toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.firstName || 'Arian'}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>BCBA</div>
            </div>
          </div>
          <button onClick={() => signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 8px', borderRadius: 6, flexShrink: 0 }}>↪ out</button>
        </aside>}

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
        <main style={{ overflowY: 'auto', overflowX: 'hidden', minWidth: 0, background: 'var(--bg)' }}>
          {children}
        </main>

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
                <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 12, fontSize: 13, color: 'var(--muted)' }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <textarea
              placeholder="Ask a compliance question..."
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
    </ComplianceProvider>
    </ApiProvider>
  );
}

// Reads from the shared ComplianceProvider rather than fetching independently,
// so it updates immediately when a track change (or any other compliance-
// affecting action) happens elsewhere on the dashboard -- see the file header
// note in context/compliance-context.tsx for the bug this fixes.
function SidebarAccrualWidget() {
  const { data } = useCompliance();
  const totalHours = Number(data?.totalHours || 0);
  const totalHoursRequired = Number(data?.totalHoursRequired || 2000);
  return (
    <div style={{ margin: 8, padding: 12, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Total accrual</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{totalHours.toFixed(0)}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>/ {totalHoursRequired.toLocaleString()} hrs</span>
      </div>
      <div style={{ height: 4, background: 'var(--border2)', borderRadius: 99, overflow: 'hidden', margin: '8px 0' }}>
        <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--spruce), #5BC891)', width: `${Math.min((totalHours / totalHoursRequired) * 100, 100).toFixed(1)}%` }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>5-yr deadline Aug 2029</div>
    </div>
  );
}