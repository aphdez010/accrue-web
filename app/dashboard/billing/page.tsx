'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApi } from '../../context/api-context';

export default function BillingPage() {
  const { getToken } = useAuth();
  const { get } = useApi();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    get('/billing/status').then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCheckout = async () => {
    setRedirecting(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const base = apiUrl.replace(/\/api$/, '');
      const res = await fetch(`${base}/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setRedirecting(false);
    }
  };

  const handlePortal = async () => {
    setRedirecting(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const base = apiUrl.replace(/\/api$/, '');
      const res = await fetch(`${base}/billing/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setRedirecting(false);
    }
  };

  const isActive = status?.subscription_status === 'active';

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Account</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 32px' }}>Billing</h1>

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : (
        <>
          {/* Status card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', margin: 0 }}>Subscription Status</p>
              <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: isActive ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: isActive ? 'var(--spruce)' : 'var(--amber)' }}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {isActive ? (
              <>
                <p style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Supervisd Pro</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', margin: '0 0 24px' }}>Your subscription is active. All features unlocked.</p>
                <button
                  onClick={handlePortal}
                  disabled={redirecting}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', cursor: redirecting ? 'not-allowed' : 'pointer' }}
                >
                  {redirecting ? 'Redirecting...' : 'Manage subscription'}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Supervisd Pro</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', margin: '0 0 4px' }}>Full BACB compliance tracking for RBTs and BCBAs.</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', margin: '0 0 24px' }}>Includes fieldwork logging, PDF export, digital signatures, document vault, and AI agent.</p>
                <button
                  onClick={handleCheckout}
                  disabled={redirecting}
                  style={{ padding: '12px 28px', borderRadius: 8, border: 'none', background: redirecting ? 'rgba(26,122,80,0.4)' : 'var(--spruce)', color: '#fff', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, cursor: redirecting ? 'not-allowed' : 'pointer', letterSpacing: '0.04em' }}
                >
                  {redirecting ? 'Redirecting...' : 'Subscribe now'}
                </button>
              </>
            )}
          </div>

          {/* Features list */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 16 }}>What's included</p>
            {[
              'Fieldwork hour logging (BACB-compliant)',
              'Compliance dashboard with all BACB metrics',
              'PDF export with digital signature',
              'Document vault (Cloudinary storage)',
              'Ask Supervisd AI agent',
              'BCBA roster + supervisee tracking',
              'RBT invite flow',
              'CEU tracking',
              'Mobile responsive',
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 8 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--spruce)', fontSize: 12 }}>✓</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{feature}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
