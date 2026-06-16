'use client';
import { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<'rbt' | 'bcba'>('rbt');
  const [credential, setCredential] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const res = await fetch(`${apiUrl}/professionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress,
          email: user.emailAddresses[0]?.emailAddress,
          role,
          credential_number: credential || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      router.push('/dashboard');
    } catch (e) {
      setError('Something went wrong. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8e4', borderRadius: 16, padding: '40px 48px', maxWidth: 480, width: '100%' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#0F2018', letterSpacing: '-.02em', marginBottom: 4 }}>Welcome to Supervisd</div>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7c74', marginBottom: 32 }}>Tell us about your role to get started</p>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7c74', marginBottom: 10 }}>I am a</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['rbt', 'bcba'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ padding: '16px', borderRadius: 10, border: `2px solid ${role === r ? '#1A7A50' : '#e2e8e4'}`, background: role === r ? 'rgba(26,122,80,0.06)' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: role === r ? '#1A7A50' : '#0F2018' }}>{r.toUpperCase()}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7c74', marginTop: 2 }}>
                  {r === 'rbt' ? 'Registered Behavior Technician' : 'Board Certified Behavior Analyst'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7c74', marginBottom: 6 }}>Credential number (optional)</p>
          <input
            style={{ width: '100%', background: '#F0F4F1', border: '1px solid #e2e8e4', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#0F2018', outline: 'none', boxSizing: 'border-box' }}
            placeholder="e.g. RBT-123456"
            value={credential}
            onChange={e => setCredential(e.target.value)}
          />
        </div>

        {error && <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#d97706', marginBottom: 16 }}>{error}</p>}

        <button onClick={handleSubmit} disabled={saving} style={{ width: '100%', background: '#1A7A50', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Setting up your account...' : 'Get started →'}
        </button>
      </div>
    </div>
  );
}
