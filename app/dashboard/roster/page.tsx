'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../context/api-context';

type RBT = {
  id: number; name: string; email: string; credential: string;
  totalHours: number; supervisionPct: number; supervisionMet: boolean; restrictedMet: boolean;
};

export default function RosterPage() {
  const { get, post } = useApi();
  const [roster, setRoster] = useState<RBT[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    get('/roster').then(r => setRoster(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');
    try {
      await post('/invites', { email: inviteEmail.trim() });
      setInviteSuccess(true);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const closeModal = () => {
    setShowInvite(false);
    setInviteEmail('');
    setInviteError('');
    setInviteSuccess(false);
  };

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>BCBA</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>Supervisee Roster</h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 0 }}>{roster.length} active trainee{roster.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: 'var(--spruce)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '10px 18px',
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          + Invite RBT
        </button>
      </div>

      {/* Roster list */}
      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : roster.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No RBTs on your roster yet.</p>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              marginTop: 16, backgroundColor: 'var(--spruce)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '10px 20px',
              fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer',
            }}
          >
            Invite your first RBT
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roster.map(rbt => (
            <div key={rbt.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500, color: 'var(--ink)', margin: '0 0 2px' }}>{rbt.name}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>{rbt.email}{rbt.credential ? ` · ${rbt.credential}` : ''}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{Number(rbt.totalHours || 0).toFixed(0)}<span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 2 }}>hrs</span></p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>Total logged</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{Number(rbt.supervisionPct || 0).toFixed(1)}<span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 2 }}>%</span></p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', margin: 0 }}>Supervision</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: rbt.supervisionMet ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: rbt.supervisionMet ? 'var(--spruce)' : 'var(--amber)' }}>{rbt.supervisionMet ? 'Supv ✓' : 'Supv !'}</span>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 10, background: rbt.restrictedMet ? 'rgba(26,122,80,0.1)' : 'rgba(255,160,0,0.1)', color: rbt.restrictedMet ? 'var(--spruce)' : 'var(--amber)' }}>{rbt.restrictedMet ? 'Restr ✓' : 'Restr !'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15,32,24,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', borderRadius: 16, padding: 32,
              width: '100%', maxWidth: 440,
              boxShadow: '0 20px 60px rgba(15,32,24,0.15)',
            }}
          >
            {inviteSuccess ? (
              <>
                <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
                  <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Invite sent!</h2>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Your RBT will receive an email with a link to join Supervisd and get linked to your roster.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 8,
                    backgroundColor: 'var(--spruce)', color: '#fff',
                    border: 'none', fontFamily: 'var(--mono)', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', marginTop: 8,
                  }}
                >
                  Done
                </button>
                <button
                  onClick={() => { setInviteSuccess(false); }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8,
                    backgroundColor: 'transparent', color: 'var(--muted)',
                    border: 'none', fontFamily: 'var(--mono)', fontSize: 12,
                    cursor: 'pointer', marginTop: 6,
                  }}
                >
                  Send another invite
                </button>
              </>
            ) : (
              <>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Invite</p>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Add an RBT to your roster</h2>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
                  They&apos;ll receive an email invitation to create their Supervisd account and appear on your roster.
                </p>

                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  RBT Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="rbt@example.com"
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 8,
                    border: `1px solid ${inviteError ? '#e53935' : 'var(--border)'}`,
                    fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)',
                    backgroundColor: 'var(--surface)', outline: 'none',
                    boxSizing: 'border-box', marginBottom: inviteError ? 6 : 20,
                  }}
                />
                {inviteError && (
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e53935', marginBottom: 16 }}>
                    {inviteError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={closeModal}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 8,
                      backgroundColor: 'transparent', color: 'var(--muted)',
                      border: '1px solid var(--border)', fontFamily: 'var(--mono)',
                      fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    style={{
                      flex: 2, padding: '12px', borderRadius: 8,
                      backgroundColor: inviteLoading || !inviteEmail.trim() ? 'rgba(26,122,80,0.4)' : 'var(--spruce)',
                      color: '#fff', border: 'none', fontFamily: 'var(--mono)',
                      fontSize: 13, fontWeight: 600,
                      cursor: inviteLoading || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}