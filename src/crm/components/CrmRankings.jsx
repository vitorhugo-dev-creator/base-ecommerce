import React from 'react'

const COLORS = ['#00f5a0', '#00d4ff', '#a855f7', '#ff2d78', '#ffc200', '#f97316', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16']

export default function CrmRankings({ data }) {
  const topProducts = data?.topProducts?.slice(0, 8) || []
  const topCustomers = data?.topCustomers?.slice(0, 8) || []
  const productPerf = data?.productPerformance?.filter(p => p.units_sold > 0).slice(0, 8) || []
  const maxRevenue = productPerf.length ? Math.max(...productPerf.map(p => p.revenue), 1) : 1

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem' }}>
      <div className="crm-section-card">
        <div className="crm-section-title" style={{ color: '#ff2d78', borderColor: '#ff2d7840' }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
          Produtos
        </div>
        {topProducts.length === 0 && <div className="crm-empty">Sem dados</div>}
        {topProducts.map((p, i) => (
          <div key={p.name} className="crm-rank-row" style={{ animationDelay: `${i * 0.06}s` }}>
            <span style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: COLORS[i], fontWeight: 700, minWidth: 18 }}>{i + 1}</span>
            <span className="crm-rank-name" title={p.name}>{p.name.length > 20 ? p.name.slice(0, 20) + '..' : p.name}</span>
            <span style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{p.total_qty}u · R${p.total_revenue.toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div className="crm-section-card">
        <div className="crm-section-title" style={{ color: '#ffd700', borderColor: '#ffd70040' }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Clientes
        </div>
        {topCustomers.length === 0 && <div className="crm-empty">Sem dados</div>}
        {topCustomers.map((c, i) => (
          <div key={c.customer_email || i} className="crm-rank-row" style={{ animationDelay: `${i * 0.06}s` }}>
            <span style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: COLORS[i], fontWeight: 700, minWidth: 18 }}>{i + 1}</span>
            <span className="crm-rank-name">{c.customer_name.split(' ')[0]}</span>
            <span style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{c.order_count}p · R${(c.total_spent || 0).toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div className="crm-section-card">
        <div className="crm-section-title" style={{ color: '#f97316', borderColor: '#f9731640' }}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
          Performance
        </div>
        {productPerf.length === 0 && <div className="crm-empty">Sem dados</div>}
        {productPerf.map((p, i) => {
          const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0
          const color = COLORS[i % COLORS.length]
          return (
            <div key={p.name} className="crm-hbar-row" style={{ animationDelay: `${i * 0.06}s` }}>
              <span className="crm-rank-name" style={{ flexShrink: 0, maxWidth: 160 }} title={`${p.name} — R$${p.revenue.toFixed(2)}`}>{p.name.length > 22 ? p.name.slice(0, 22) + '..' : p.name}</span>
              <div className="crm-hbar-track">
                <div className="crm-hbar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span style={{ fontFamily: 'Inter', fontSize: '0.7rem', fontWeight: 700, color, minWidth: 70, textAlign: 'right' }}>R${p.revenue.toFixed(0)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
