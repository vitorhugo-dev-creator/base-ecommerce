import React, { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

const STATUS_INFO = {
  pending: { label: 'Aguardando pagamento', color: '#ffc200', bg: 'rgba(255,194,0,0.15)' },
  paid: { label: 'Pago', color: '#00cc66', bg: 'rgba(0,204,102,0.15)' },
  shipped: { label: 'Enviado', color: '#0099cc', bg: 'rgba(0,153,204,0.15)' },
  delivered: { label: 'Entregue', color: '#33ff33', bg: 'rgba(51,255,51,0.15)' },
  cancelled: { label: 'Cancelado', color: '#ff4444', bg: 'rgba(255,68,68,0.15)' },
}

export default function TrackingPage() {
  const [code, setCode] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchOrder(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true); setError(''); setOrder(null)
    try {
      const res = await fetch(`${API_URL}/api/orders/track/${code.trim()}`)
      if (!res.ok) throw new Error()
      setOrder(await res.json())
    } catch { setError('Pedido não encontrado. Verifique o código e tente novamente.') }
    setLoading(false)
  }

  const currentStatus = STATUS_INFO[order?.order_status] || STATUS_INFO.pending
  const statusOrder = { pending: 0, paid: 1, shipped: 2, delivered: 3, cancelled: -1 }

  return (
    <div style={{ paddingTop: 100, paddingBottom: '5rem' }} className="tracking-page">
      <div className="container">
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="section-label">Rastreio</span>
          <h1 className="section-title">Acompanhe seu Pedido</h1>
        </div>

        <form onSubmit={searchOrder} style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }} className="tracking-form">
            <input type="text" placeholder="Digite o código do pedido (ex: PED-XXXX)" value={code} onChange={e => setCode(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                : <><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Buscar</>
              }
            </button>
          </div>
        </form>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 600, margin: '0 auto 1.5rem', padding: '0.875rem 1.25rem', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#ff4444', fontSize: '0.875rem' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        {order && (
          <div className="animate-fade-up" style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Código do Pedido</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)', fontFamily: "'Playfair Display',serif" }}>{order.order_code}</span>
              </div>
              <div style={{ padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: currentStatus.bg, color: currentStatus.color }}>
                {currentStatus.label}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '1.5rem 0' }} className="tracking-stepper">
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'var(--border2)', transform: 'translateY(-50%)', zIndex: 0 }} />
              {['pending', 'paid', 'shipped', 'delivered'].map((s, i) => {
                const isActive = statusOrder[order.order_status] >= i
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: statusOrder[order.order_status] === i ? 20 : 16, height: statusOrder[order.order_status] === i ? 20 : 16, borderRadius: '50%', background: isActive ? 'var(--accent)' : 'var(--bg3)', border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border2)'}`, transition: 'all 0.3s', boxShadow: isActive ? '0 0 12px rgba(224,112,64,0.5)' : 'none' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text-muted)', textAlign: 'center' }}>{STATUS_INFO[s].label}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="tracking-info-grid">
              {[['Cliente', order.customer_name], ['Forma de Pagamento', order.payment_method === 'pix' ? 'PIX' : 'Via WhatsApp'], ['Data', new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })], ['Endereço', order.customer_address || '—']].map(([label, value]) => (
                <div key={label} style={{ padding: '1rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Itens do Pedido</h3>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.qty}x</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border2)', fontWeight: 700, fontSize: '1rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)', fontFamily: "'Playfair Display',serif", fontSize: '1.2rem' }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {order.notes && (
              <div style={{ padding: '1.25rem', background: 'rgba(255,194,0,0.08)', border: '1px solid rgba(255,194,0,0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffc200' }}>Observações</span>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{order.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .tracking-page { padding-top: 80px !important; }
          .tracking-form { flex-direction: column !important; }
          .tracking-form button { width: 100% !important; justify-content: center !important; }
          .tracking-info-grid { grid-template-columns: 1fr !important; }
          .tracking-stepper { overflow-x: auto !important; gap: 0.5rem !important; padding: 1rem 0.5rem !important; }
          .tracking-stepper > div { min-width: 70px !important; }
          .tracking-stepper > div span { font-size: 0.6rem !important; }
        }
      `}</style>
    </div>
  )
}
