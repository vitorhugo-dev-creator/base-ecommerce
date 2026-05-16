import React from 'react'

export default function TrackingPage() {
  const [code, setCode] = React.useState('')
  const [order, setOrder] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function searchOrder(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const res = await fetch(`/api/orders/track/${code.trim()}`)
      if (!res.ok) throw new Error('Pedido não encontrado')
      const data = await res.json()
      setOrder(data)
    } catch (e) {
      setError('Pedido não encontrado. Verifique o código e tente novamente.')
    }
    setLoading(false)
  }

  const statusInfo = {
    pending: { label: 'Aguardando pagamento', color: '#ffc200', bg: 'rgba(255,194,0,0.15)' },
    paid: { label: 'Pago', color: '#00cc66', bg: 'rgba(0,204,102,0.15)' },
    shipped: { label: 'Enviado', color: '#0099cc', bg: 'rgba(0,153,204,0.15)' },
    delivered: { label: 'Entregue', color: '#33ff33', bg: 'rgba(51,255,51,0.15)' },
    cancelled: { label: 'Cancelado', color: '#ff4444', bg: 'rgba(255,68,68,0.15)' },
  }

  const currentStatus = statusInfo[order?.order_status] || statusInfo.pending

  return (
    <div className="tracking-page">
      <div className="container">
        <div className="tracking-page__header">
          <span className="section-label">Rastreio</span>
          <h1 className="section-title">Acompanhe seu Pedido</h1>
        </div>

        <div className="tracking-page__search">
          <form onSubmit={searchOrder}>
            <div className="tracking-page__input-row">
              <input
                type="text"
                placeholder="Digite o código do pedido (ex: PED-XXXX)"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="tracking-page__input"
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <div className="loading-spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Buscar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="tracking-page__error">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {order && (
          <div className="tracking-page__result animate-fade-up">
            <div className="tracking-page__result-header">
              <div>
                <span className="tracking-page__result-label">Código do Pedido</span>
                <span className="tracking-page__result-code">{order.order_code}</span>
              </div>
              <div
                className="tracking-page__result-status"
                style={{ background: currentStatus.bg, color: currentStatus.color }}
              >
                {currentStatus.label}
              </div>
            </div>

            <div className="tracking-page__timeline">
              {['pending', 'paid', 'shipped', 'delivered'].map((s, i) => {
                const statusOrder = { pending: 0, paid: 1, shipped: 2, delivered: 3, cancelled: -1 }
                const isActive = statusOrder[order.order_status] >= i
                return (
                  <div key={s} className={`tracking-page__step ${isActive ? 'active' : ''} ${order.order_status === s ? 'current' : ''}`}>
                    <div className="tracking-page__step-dot" />
                    <span className="tracking-page__step-label">{statusInfo[s].label}</span>
                  </div>
                )
              })}
            </div>

            <div className="tracking-page__details">
              <div className="tracking-page__detail-card">
                <span className="tracking-page__detail-label">Cliente</span>
                <span className="tracking-page__detail-value">{order.customer_name}</span>
              </div>
              {order.customer_address && (
                <div className="tracking-page__detail-card">
                  <span className="tracking-page__detail-label">Endereço</span>
                  <span className="tracking-page__detail-value">{order.customer_address}</span>
                </div>
              )}
              <div className="tracking-page__detail-card">
                <span className="tracking-page__detail-label">Forma de Pagamento</span>
                <span className="tracking-page__detail-value">{order.payment_method === 'pix' ? 'PIX' : 'Via WhatsApp'}</span>
              </div>
              <div className="tracking-page__detail-card">
                <span className="tracking-page__detail-label">Data do Pedido</span>
                <span className="tracking-page__detail-value">
                  {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="tracking-page__items">
              <h3>Itens do Pedido</h3>
              {order.items.map((item, i) => (
                <div key={i} className="tracking-page__item">
                  <div className="tracking-page__item-info">
                    <span className="tracking-page__item-name">{item.name}</span>
                    <span className="tracking-page__item-qty">{item.qty}x</span>
                  </div>
                  <span className="tracking-page__item-price">
                    R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
              <div className="tracking-page__total">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {order.notes && (
              <div className="tracking-page__notes">
                <span className="tracking-page__detail-label">Observações</span>
                <p>{order.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tracking-page { padding-top: 100px; padding-bottom: 5rem; }
        .tracking-page__header { margin-bottom: 2.5rem; }
        .tracking-page__header .section-title { margin-top: 0.5rem; }
        .tracking-page__search { max-width: 600px; margin: 0 auto 2rem; }
        .tracking-page__input-row { display: flex; gap: 0.75rem; }
        .tracking-page__input { flex: 1; }
        .tracking-page__error {
          display: flex; align-items: center; gap: 0.75rem; max-width: 600px; margin: 0 auto 1.5rem;
          padding: 0.875rem 1.25rem; background: rgba(255,68,68,0.1);
          border: 1px solid rgba(255,68,68,0.3); border-radius: var(--radius-sm);
          color: #ff4444; font-size: 0.875rem;
        }
        .tracking-page__result {
          max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;
        }
        .tracking-page__result-header {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
          padding: 1.5rem; background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: var(--radius); flex-wrap: wrap;
        }
        .tracking-page__result-label {
          display: block; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.4rem;
        }
        .tracking-page__result-code {
          font-size: 1.3rem; font-weight: 800; color: var(--accent); font-family: 'Playfair Display', serif;
        }
        .tracking-page__result-status {
          padding: 0.4rem 1rem; border-radius: 100px; font-size: 0.8rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .tracking-page__timeline {
          display: flex; justify-content: space-between; position: relative;
          padding: 1.5rem 0;
        }
        .tracking-page__timeline::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 2px;
          background: var(--border2); transform: translateY(-50%); z-index: 0;
        }
        .tracking-page__step {
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem; position: relative; z-index: 1;
        }
        .tracking-page__step-dot {
          width: 16px; height: 16px; border-radius: 50%; background: var(--bg3);
          border: 2px solid var(--border2); transition: all 0.3s;
        }
        .tracking-page__step.active .tracking-page__step-dot {
          background: var(--accent); border-color: var(--accent); box-shadow: 0 0 12px rgba(224,112,64,0.5);
        }
        .tracking-page__step.current .tracking-page__step-dot {
          width: 20px; height: 20px; background: var(--accent); border-color: var(--accent);
          box-shadow: 0 0 20px rgba(224,112,64,0.6);
        }
        .tracking-page__step-label { font-size: 0.7rem; font-weight: 500; color: var(--text-muted); text-align: center; }
        .tracking-page__step.active .tracking-page__step-label { color: var(--accent); }
        .tracking-page__details {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
        }
        .tracking-page__detail-card {
          padding: 1rem; background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 0.3rem;
        }
        .tracking-page__detail-label {
          font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--text-muted);
        }
        .tracking-page__detail-value { font-size: 0.9rem; color: var(--text); font-weight: 500; }
        .tracking-page__items {
          padding: 1.5rem; background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: var(--radius); display: flex; flex-direction: column; gap: 0.75rem;
        }
        .tracking-page__items h3 {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.5rem;
        }
        .tracking-page__item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 0; border-bottom: 1px solid var(--border);
        }
        .tracking-page__item:last-of-type { border-bottom: none; }
        .tracking-page__item-info { display: flex; gap: 0.75rem; align-items: center; }
        .tracking-page__item-name { font-size: 0.9rem; color: var(--text); }
        .tracking-page__item-qty { font-size: 0.8rem; color: var(--text-muted); }
        .tracking-page__item-price { font-size: 0.9rem; font-weight: 600; color: var(--accent); }
        .tracking-page__total {
          display: flex; justify-content: space-between; padding-top: 0.75rem;
          border-top: 1px solid var(--border2); font-weight: 700; font-size: 1rem;
        }
        .tracking-page__total span:last-child { color: var(--accent); font-family: 'Playfair Display', serif; font-size: 1.2rem; }
        .tracking-page__notes {
          padding: 1.25rem; background: rgba(255,194,0,0.08); border: 1px solid rgba(255,194,0,0.2);
          border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 0.5rem;
        }
        .tracking-page__notes p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
      `}</style>
    </div>
  )
}
