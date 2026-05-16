import React, { useState, useEffect } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/dashboard', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/public/stats').then(r => r.json()),
    ]).then(([d, s]) => {
      setStats({ ...d, subscribers: s.subscribers, pageViews: s.last30days })
      setRecentOrders(d.recentOrders || [])
    }).catch(e => {
      setError(e.message)
    }).finally(() => setLoading(false))
  }, [])

  const statusBadge = (status) => {
    const map = { pending: 'badge-pending', paid: 'badge-paid', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' }
    const labels = { pending: 'Aguardando', paid: 'Pago', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' }
    return <span className={`badge ${map[status] || 'badge-pending'}`}>{labels[status] || status}</span>
  }

  if (loading) return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Carregando dashboard...</p>
    </div>
  )

  if (error) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(196,80,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#c45050" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <p style={{ color: '#c45050', fontSize: '0.95rem' }}>Erro ao carregar: {error}</p>
    </div>
  )

  const s = stats || { totalOrders: 0, totalRevenue: 0, totalProducts: 0, pendingOrders: 0, subscribers: 0, pageViews: 0 }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg></div>
          <div className="stat-label">Total de Pedidos</div>
          <div className="stat-value">{s.totalOrders}</div>
          <div className="stat-sub">pedidos realizados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
          <div className="stat-label">Receita Confirmada</div>
          <div className="stat-value">R$ {(s.totalRevenue || 0).toFixed(2).replace('.', ',')}</div>
          <div className="stat-sub">em pagamentos pagos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div>
          <div className="stat-label">Produtos Ativos</div>
          <div className="stat-value">{s.totalProducts}</div>
          <div className="stat-sub">produtos no catálogo</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div className="stat-label">Pedidos Pendentes</div>
          <div className="stat-value">{s.pendingOrders}</div>
          <div className="stat-sub">aguardando ação</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <div className="stat-label">Inscritos Newsletter</div>
          <div className="stat-value">{s.subscribers}</div>
          <div className="stat-sub">assinantes ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
          <div className="stat-label">Visitas (30 dias)</div>
          <div className="stat-value">{s.pageViews}</div>
          <div className="stat-sub">páginas views</div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600 }}>Pedidos Recentes</h2>
        {recentOrders.length > 0 && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Últimos {recentOrders.length}</span>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Código</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>Nenhum pedido registrado ainda</p>
                  </div>
                </td>
              </tr>
            ) : recentOrders.map(o => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'var(--font-body)', color: 'var(--accent)', fontWeight: 700 }}>{o.order_code}</td>
                <td>{o.customer_name}</td>
                <td style={{ fontWeight: 600 }}>R$ {(o.total || 0).toFixed(2).replace('.', ',')}</td>
                <td>{statusBadge(o.order_status)}</td>
                <td style={{ color: 'var(--text-muted)' }}>
                  {o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}