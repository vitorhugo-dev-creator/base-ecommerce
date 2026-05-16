import React, { useState, useEffect } from 'react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => { loadOrders() }, [])

  function loadOrders() {
    fetch('/api/admin/orders', { credentials: 'include' }).then(r => { if (!r.ok) throw r; return r.json() }).then(setOrders).catch(() => {})
  }

  const filtered = orders.filter(o =>
    !search || o.order_code.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase())
  )

  function openOrder(o) { setSelectedOrder(o); setShowModal(true) }
  function closeModal() { setShowModal(false); setSelectedOrder(null) }

  async function saveStatus(order_status, payment_status) {
    await fetch(`/api/admin/orders/${selectedOrder.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status, payment_status }),
      credentials: 'include'
    })
    loadOrders()
    closeModal()
  }

  const statusBadge = (status) => {
    const map = { pending: 'badge-pending', paid: 'badge-paid', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' }
    const labels = { pending: 'Aguardando', paid: 'Pago', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' }
    return <span className={`badge ${map[status] || 'badge-pending'}`}>{labels[status] || status}</span>
  }

  return (
    <div>
      <div className="toolbar">
        <input type="text" className="search-input" placeholder="Buscar pedido ou cliente..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Código</th><th>Cliente</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum pedido encontrado</td></tr>}
            {filtered.map(o => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700 }}>{o.order_code}</td>
                <td>{o.customer_name}</td>
                <td style={{ fontWeight: 600 }}>R$ {o.total.toFixed(2).replace('.', ',')}</td>
                <td style={{ textTransform: 'uppercase', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{o.payment_method}</td>
                <td>{statusBadge(o.order_status)}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                <td><button className="btn-ghost btn-sm" onClick={() => openOrder(o)}>Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-wide" style={{ position: 'relative' }}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div style={{ padding: '1.5rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Código</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{selectedOrder.order_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Total</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700 }}>R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[['Cliente', selectedOrder.customer_name], ['Email', selectedOrder.customer_email || '—'], ['Telefone', selectedOrder.customer_phone || '—'], ['Endereço', selectedOrder.customer_address || '—']].map(([k, v]) => (
                  <div key={k} style={{ padding: '0.875rem', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{k}</div>
                    <div style={{ fontSize: '0.875rem' }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Itens</h4>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>{item.qty}x</span></span>
                    <span style={{ fontWeight: 600 }}>R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,194,0,0.08)', border: '1px solid rgba(255,194,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffc200', marginBottom: '0.3rem' }}>Observações</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedOrder.notes}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Status do Pedido</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[['pending', 'Aguardando'], ['paid', 'Pago'], ['shipped', 'Enviado'], ['delivered', 'Entregue'], ['cancelled', 'Cancelado']].map(([s, l]) => (
                    <button key={s} onClick={() => saveStatus(s, selectedOrder.payment_status)} className={`btn-ghost btn-sm ${selectedOrder.order_status === s ? 'active' : ''}`} style={selectedOrder.order_status === s ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
