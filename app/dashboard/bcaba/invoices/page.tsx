'use client';
import { useEffect, useState } from 'react';
import { useApi } from '../../../context/api-context';

function pad(n: number) { return n < 10 ? '0' + n : String(n); }

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(0,0,0,0.05)', color: 'var(--muted)' },
  sent: { bg: 'rgba(45,143,214,0.1)', color: 'var(--sky)' },
  paid: { bg: 'rgba(26,122,80,0.1)', color: 'var(--spruce)' },
};

export default function InvoicesPage() {
  const { get, post, patch } = useApi();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [err, setErr] = useState('');
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [checkoutLinks, setCheckoutLinks] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const today = new Date();
  const monthYear = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const monthLabel = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const load = () => {
    setLoading(true);
    get('/invoices').then((r: any) => {
      setInvoices(Array.isArray(r?.invoices) ? r.invoices : []);
    }).catch(() => setErr('Failed to load invoices')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function draftMonthly() {
    setDrafting(true); setErr('');
    try {
      const r: any = await post('/invoices/draft-monthly', { monthYear });
      load();
      if (r?.created?.length === 0 && r?.message) {
        setErr(r.message);
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to draft invoices');
    } finally {
      setDrafting(false);
    }
  }

  async function saveAmount(id: number) {
    const amount = amounts[id];
    if (!amount) return;
    try {
      await patch(`/invoices/${id}`, { amount: parseFloat(amount) });
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to update amount');
    }
  }

  async function sendInvoice(id: number, paymentMethod: 'stripe' | 'manual') {
    setSendingId(id); setErr('');
    try {
      const email = emails[id];
      const r: any = await post(`/invoices/${id}/send`, { paymentMethod, email: email || undefined });
      if (r?.checkoutUrl) {
        setCheckoutLinks(prev => ({ ...prev, [id]: r.checkoutUrl }));
      }
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to send invoice');
    } finally {
      setSendingId(null);
    }
  }

  async function markPaid(id: number) {
    try {
      await patch(`/invoices/${id}/mark-paid`, {});
      load();
    } catch (e: any) {
      setErr(e.message || 'Failed to mark paid');
    }
  }

  function copyLink(id: number, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function emailLink(inv: any, url: string) {
    const subject = encodeURIComponent(`Supervision invoice — ${inv.period_start} to ${inv.period_end}`);
    const body = encodeURIComponent(`Hi,\n\nHere's your supervision invoice for ${inv.period_start} to ${inv.period_end} (${Number(inv.hours_covered).toFixed(1)} hrs): $${Number(inv.amount).toFixed(2)}\n\nPay here: ${url}\n\nThanks!`);
    const to = inv.trainee_email || '';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  const grouped = {
    draft: invoices.filter(i => i.status === 'draft'),
    sent: invoices.filter(i => i.status === 'sent'),
    paid: invoices.filter(i => i.status === 'paid'),
  };

  return (
    <div style={{ padding: 40, maxWidth: 960, width: '100%', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Supervision Billing</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 24px' }}>Invoices</h1>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', margin: 0 }}>{monthLabel}</p>
        <button onClick={draftMonthly} disabled={drafting} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: 12, cursor: drafting ? 'not-allowed' : 'pointer', opacity: drafting ? 0.6 : 1 }}>
          {drafting ? 'Drafting...' : `Draft ${monthLabel} Invoices`}
        </button>
      </div>

      {err && (
        <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', margin: 0 }}>{err}</p>
        </div>
      )}

      {loading ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      ) : invoices.length === 0 ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>No invoices yet. Click &quot;Draft {monthLabel} Invoices&quot; to generate them from logged fieldwork hours.</p>
      ) : (
        <>
          {(['draft', 'sent', 'paid'] as const).map(status => (
            grouped[status].length > 0 && (
              <div key={status} style={{ marginBottom: 28 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 12 }}>
                  {status} ({grouped[status].length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {grouped[status].map(inv => (
                    <div key={inv.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                            {inv.full_name || ''}
                          </p>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
                            {inv.period_start} to {inv.period_end} · {Number(inv.hours_covered).toFixed(1)} hrs
                          </p>
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const, background: statusColors[inv.status]?.bg, color: statusColors[inv.status]?.color }}>
                          {inv.status}
                        </span>
                      </div>

                      {inv.status === 'draft' && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount ($)"
                            defaultValue={inv.amount || ''}
                            onChange={e => setAmounts(prev => ({ ...prev, [inv.id]: e.target.value }))}
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', width: 120 }}
                          />
                          <button onClick={() => saveAmount(inv.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)', cursor: 'pointer' }}>
                            Save
                          </button>
                          <input
                            type="email"
                            placeholder="Trainee email (optional)"
                            defaultValue={inv.trainee_email || ''}
                            onChange={e => setEmails(prev => ({ ...prev, [inv.id]: e.target.value }))}
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', width: 220 }}
                          />
                          <div style={{ flex: 1 }} />
                          <button onClick={() => sendInvoice(inv.id, 'stripe')} disabled={sendingId === inv.id || !inv.amount} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: !inv.amount ? 'not-allowed' : 'pointer', opacity: !inv.amount ? 0.5 : 1 }}>
                            Send via Stripe
                          </button>
                          <button onClick={() => sendInvoice(inv.id, 'manual')} disabled={sendingId === inv.id || !inv.amount} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)', cursor: !inv.amount ? 'not-allowed' : 'pointer', opacity: !inv.amount ? 0.5 : 1 }}>
                            Send Manually
                          </button>
                        </div>
                      )}

                      {inv.status === 'sent' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                          <p style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>${Number(inv.amount).toFixed(2)}</p>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>via {inv.payment_method}</span>
                          <div style={{ flex: 1 }} />
                          {checkoutLinks[inv.id] && (
                            <>
                              <button onClick={() => copyLink(inv.id, checkoutLinks[inv.id])} style={{ background: 'transparent', border: '1px solid var(--sky)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sky)', cursor: 'pointer' }}>
                                {copiedId === inv.id ? '✓ Copied' : 'Copy Checkout Link'}
                              </button>
                              <button onClick={() => emailLink(inv, checkoutLinks[inv.id])} style={{ background: 'transparent', border: '1px solid var(--sky)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sky)', cursor: 'pointer' }}>
                                Email Link
                              </button>
                            </>
                          )}
                          {inv.payment_method === 'manual' && (
                            <button onClick={() => markPaid(inv.id)} style={{ background: 'var(--spruce)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                              Mark Paid
                            </button>
                          )}
                        </div>
                      )}

                      {inv.status === 'paid' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <p style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: 'var(--spruce)', margin: 0 }}>${Number(inv.amount).toFixed(2)}</p>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                            paid {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </>
      )}
    </div>
  );
}