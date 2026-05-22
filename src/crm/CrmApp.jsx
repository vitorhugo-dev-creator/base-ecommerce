import React, { useState, useEffect } from 'react'
import CrmHeader from './components/CrmHeader'
import CrmKPIs from './components/CrmKPIs'
import CrmCharts from './components/CrmCharts'
import CrmRankings from './components/CrmRankings'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function CrmApp() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function load() {
      fetch(`${API_URL}/api/public/analytics`).then(r => r.json())
        .then(analytics => {
          Promise.all([
            Promise.resolve(analytics),
            fetch(`${API_URL}/api/public/stats`).then(r => r.json()),
          ]).then(([a, stats]) => {
            setData({ ...a, stats })
            setLoading(false)
          })
        }).catch(() => { setLoading(false) })
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = data?.stats || {}
  const totalOrders = data?.dailyOrders?.reduce((s, d) => s + d.orders, 0) || data?.orderStatusDist?.reduce((s, d) => s + d.count, 0) || 0

  const allKpis = data ? [
    { label: 'Total Pedidos', value: totalOrders.toLocaleString('pt-BR'), color: '#00d4ff', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'Produtos Vendidos', value: data?.topProducts?.reduce((s, p) => s + p.total_qty, 0).toLocaleString('pt-BR') || '0', color: '#00f5a0', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
    { label: 'Visitas (30d)', value: (stats.last30days || 0).toLocaleString('pt-BR'), color: '#a78bfa', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { label: 'Newsletter', value: (stats.subscribers || 0).toLocaleString('pt-BR'), color: '#34d399', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  ] : null

  return (
    <div className="crm-layout">
      <CrmHeader />
      <div style={{ padding: '1.25rem 2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <CrmKPIs data={allKpis} />
        <CrmCharts data={data} />
        <CrmRankings data={data} />
      </div>

      <style>{`
        .crm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.75rem;
        }
        .crm-kpi-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          animation: fadeUp 0.5s ease both;
          transition: border-color 0.2s;
        }
        .crm-kpi-card:hover { border-color: rgba(255,255,255,0.12); }
        .crm-kpi-skeleton {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 12px;
          padding: 1rem 1.25rem;
        }
        .crm-section-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 1.25rem;
        }
        .crm-section-title {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid;
        }
        .crm-rank-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0;
          animation: fadeUp 0.4s ease both;
        }
        .crm-rank-name {
          flex: 1;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.65);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crm-hbar-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.3rem 0;
          animation: fadeUp 0.4s ease both;
        }
        .crm-hbar-track {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          overflow: hidden;
        }
        .crm-hbar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.8s ease;
        }
        .crm-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80px;
          color: rgba(255,255,255,0.15);
          font-size: 0.75rem;
          font-family: Inter, monospace;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1100px) {
          .crm-kpi-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 700px) {
          .crm-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  )
}
