import React from 'react'

export default function CrmHeader() {
  return (
    <header className="crm-header">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00f5a0" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter, monospace', fontSize: '0.875rem', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>CRM ANALYTICS</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Command Center</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a href="/" target="_blank" className="crm-link-btn">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Ver Loja
          </a>
          <a href="/admin" className="crm-link-btn crm-link-btn--accent">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Admin
          </a>
        </div>
      </div>

      <style>{`
        .crm-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.4);
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
          text-decoration: none;
        }
        .crm-link-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .crm-link-btn--accent {
          background: rgba(0,245,160,0.08);
          border-color: rgba(0,245,160,0.2);
          color: #00f5a0;
        }
        .crm-link-btn--accent:hover { background: rgba(0,245,160,0.15); }
      `}</style>
    </header>
  )
}
