import React from 'react'

export default function CrmKPIs({ data }) {
  if (!data) return (
    <div className="crm-kpi-grid">
      {[...Array(6)].map((_, i) => <div key={i} className="crm-kpi-skeleton"><div className="skeleton" style={{ height: 32, width: 80, borderRadius: 6 }} /><div className="skeleton" style={{ height: 14, width: 60, borderRadius: 4, marginTop: 6 }} /></div>)}
    </div>
  )

  return (
    <div className="crm-kpi-grid">
      {data.map((kpi, i) => (
        <div key={i} className="crm-kpi-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: kpi.color }}>{kpi.icon}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: kpi.color, fontFamily: 'Inter, monospace' }}>{kpi.value}</div>
        </div>
      ))}
    </div>
  )
}
