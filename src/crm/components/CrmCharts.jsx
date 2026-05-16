import React, { useState, useEffect } from 'react'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function AnimatedBar({ height, delay, color }) {
  const [h, setH] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setH(height), delay * 100)
    return () => clearTimeout(t)
  }, [height, delay])
  return <div style={{ height: h, background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 12px ${color}60` }} />
}

function MonthlyChart({ data }) {
  const [active, setActive] = useState(null)
  if (!data?.length) return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace', fontSize: '0.8rem' }}>
      Sem dados de faturamento
    </div>
  )

  const maxRev = Math.max(...data.map(m => m.revenue), 1)
  const months = MESES.map((name, i) => {
    const m = data.find(x => parseInt(x.month) === i + 1)
    return { name, revenue: m?.revenue || 0, orders: m?.orders || 0 }
  })

  return (
    <div>
      <div className="crm-bar-chart">
        {months.map((m, i) => (
          <div
            key={i}
            className={`bar ${active === i ? 'active' : ''}`}
            style={{ '--bar-height': `${m.revenue > 0 ? Math.max((m.revenue / maxRev) * 150, 6) : 6}px` }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <AnimatedBar
              height={m.revenue > 0 ? Math.max((m.revenue / maxRev) * 150, 6) : 6}
              delay={i * 0.05}
              color={active === i ? '#00f5a0' : '#00f5a060'}
            />
          </div>
        ))}
      </div>
      {active !== null && (
        <div style={{ textAlign: 'center', marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(0,245,160,0.08)', borderRadius: 8, animation: 'fadeIn 0.3s ease' }}>
          <span style={{ fontFamily: 'Inter, monospace', fontSize: '0.75rem', color: '#00f5a0', fontWeight: 700 }}>
            {months[active].name} — {months[active].revenue > 0 ? `R$ ${months[active].revenue.toFixed(2).replace('.', ',')}` : 'sem dados'} · {months[active].orders} pedidos
          </span>
        </div>
      )}
    </div>
  )
}

function DailyChart({ data }) {
  if (!data?.length) return (
    <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace', fontSize: '0.8rem' }}>
      Sem dados de pedidos
    </div>
  )
  const maxOrders = Math.max(...data.map(d => d.orders), 1)
  return (
    <div>
      <div className="crm-dots-chart">
        {[...Array(30)].map((_, i) => {
          const dayData = data.find(d => new Date(d.day).getDate() === i + 1)
          const intensity = dayData ? dayData.orders / maxOrders : 0
          return (
            <div
              key={i}
              className={`crm-dot ${dayData ? 'has-order' : ''}`}
              style={{
                width: 10 + intensity * 6,
                height: 10 + intensity * 6,
                background: dayData ? `rgba(0,245,160,${0.3 + intensity * 0.7})` : 'rgba(255,255,255,0.05)',
                boxShadow: dayData ? `0 0 ${intensity * 12}px rgba(0,245,160,${intensity * 0.5})` : 'none'
              }}
              title={dayData ? `${dayData.day}: ${dayData.orders} pedidos — R$ ${(dayData.revenue || 0).toFixed(2)}` : `Dia ${i + 1}`}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0 0.25rem' }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>30 dias</span>
        <span style={{ fontSize: '0.6rem', color: '#00f5a0', fontFamily: 'Inter, monospace' }}>{data.length}/30 dias com pedidos</span>
      </div>
    </div>
  )
}

function PaymentDonut({ data }) {
  if (!data?.length) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace', fontSize: '0.8rem' }}>
      Sem dados de pagamento
    </div>
  )
  const colors = ['#00f5a0', '#ffc200', '#00d4ff', '#ff2d78']
  const total = data.reduce((s, d) => s + d.count, 0)
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div className="crm-donut-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          {data.map((d, i) => {
            const pct = (d.count / total) * 100
            const dash = (pct / 100) * 251
            const el = (
              <circle
                key={i} cx="50" cy="50" r="40" fill="none"
                stroke={colors[i % colors.length]} strokeWidth="12"
                strokeDasharray={`${dash} ${251 - dash}`} strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray 1s ease, stroke-dashoffset 1s ease' }}
              />
            )
            offset += dash
            return el
          })}
          <text x="50" y="46" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="Inter" fontWeight="600">{total}</text>
          <text x="50" y="58" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="Inter">pedidos</text>
        </svg>
      </div>
      <div className="crm-legend">
        {data.map((d, i) => (
          <div key={i} className="crm-legend-item" style={{ animation: 'fadeIn 0.5s ease', animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
            <div className="crm-legend-dot" style={{ background: colors[i % colors.length], boxShadow: `0 0 8px ${colors[i % colors.length]}60` }} />
            <div>
              <div style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{d.payment_method || 'N/I'}</div>
              <div style={{ fontFamily: 'Inter', fontSize: '0.65rem', color: colors[i % colors.length], fontWeight: 700 }}>{d.count} ({(d.count / total * 100).toFixed(0)}%)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusRings({ data }) {
  const statusColors = { pending: '#ffc200', paid: '#00cc66', shipped: '#0099cc', delivered: '#33ff33', cancelled: '#ff4444' }
  const statusLabels = { pending: 'Aguardando', paid: 'Pago', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' }
  if (!data?.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace', fontSize: '0.8rem' }}>
      Sem dados de status
    </div>
  )

  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="crm-status-rings" style={{ animation: 'fadeIn 0.5s ease' }}>
      {data.map((d, i) => {
        const pct = total > 0 ? (d.count / total) : 0
        const r = 32, circ = 2 * Math.PI * r
        const fill = pct * circ
        const color = statusColors[d.order_status] || '#888'
        return (
          <div key={i} className="crm-ring" style={{ animation: `fadeIn 0.4s ease ${i * 0.1}s both`, cursor: 'default' }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={r} fill="none" stroke={color + '15'} strokeWidth="6" />
              <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 6px ${color}60)` }} />
            </svg>
            <div style={{ fontFamily: 'Inter', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>{statusLabels[d.order_status] || d.order_status}</div>
            <div style={{ fontFamily: 'Inter', fontSize: '1rem', fontWeight: 800, color, textShadow: `0 0 12px ${color}60` }}>{d.count}</div>
            <div style={{ fontFamily: 'Inter', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{(pct * 100).toFixed(0)}%</div>
          </div>
        )
      })}
    </div>
  )
}

export default function CrmCharts({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
      <div className="analytics-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00f5a0, transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00f5a0', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
              Faturamento Mensal
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: 2, fontFamily: 'Inter' }}>Receita por mês (últimos 12 meses)</div>
          </div>
        </div>
        <MonthlyChart data={data?.monthlyRevenue} />
      </div>

      <div className="analytics-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00d4ff, transparent)' }} />
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Pedidos por Dia
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: 2, fontFamily: 'Inter' }}>Últimos 30 dias</div>
        </div>
        <DailyChart data={data?.dailyOrders} />
      </div>

      <div className="analytics-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #ffc200, transparent)' }} />
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffc200', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Métodos de Pagamento
          </div>
        </div>
        <PaymentDonut data={data?.paymentMethods} />
      </div>

      <div className="analytics-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #a855f7, transparent)' }} />
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Status dos Pedidos
          </div>
        </div>
        <StatusRings data={data?.orderStatusDist} />
      </div>
    </div>
  )
}