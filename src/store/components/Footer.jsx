import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../StoreContext'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Footer() {
  const { settings } = useStore()
  const [email, setEmail] = useState('')
  const [subStatus, setSubStatus] = useState('')

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!email) return
    setSubStatus('loading')
    try {
      const res = await fetch(`${API_URL}/api/newsletter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) { setSubStatus('success'); setEmail('') }
      else setSubStatus('error')
    } catch { setSubStatus('error') }
  }

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '5rem 0 2.5rem',
      marginTop: '4rem',
      background: 'linear-gradient(180deg, transparent 0%, rgba(13,13,16,0.5) 100%)'
    }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text)'
          }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent)" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {settings.store_name || 'Loja'}
          </span>
          <span style={{ display: 'block', width: 80, height: 1, background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
        </div>

        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            Receba novidades e ofertas exclusivas
          </p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem', maxWidth: 360, margin: '0 auto' }}>
            <input
              type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', minWidth: 0 }}
            />
            <button type="submit" disabled={subStatus === 'loading'} style={{ padding: '0.75rem 1.25rem', background: 'var(--accent)', color: 'var(--cream)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background = 'var(--accent2)'; e.target.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.target.style.background = 'var(--accent)'; e.target.style.transform = 'translateY(0)' }}
            >
              {subStatus === 'loading' ? '...' : subStatus === 'success' ? '✓' : 'Assinar'}
            </button>
          </form>
          {subStatus === 'success' && <p style={{ fontSize: '0.75rem', color: '#00cc66', marginTop: '0.5rem' }}>Inscrito! Obrigado.</p>}
          {subStatus === 'error' && <p style={{ fontSize: '0.75rem', color: '#ff4444', marginTop: '0.5rem' }}>Tente novamente.</p>}
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            ['/', 'Início'], ['/catalogo', 'Catálogo'], ['/rastreio', 'Rastrear Pedido']
          ].map(([path, label]) => (
            <React.Fragment key={path}>
              <Link to={path} style={{
                fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)',
                transition: 'color 0.2s', padding: '0.25rem 0.5rem'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >{label}</Link>
              <span style={{ color: 'var(--border2)' }}>·</span>
            </React.Fragment>
          ))}
        </nav>
        <div style={{
          marginTop: '2rem', paddingTop: '2rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.6
        }}>
          Feito à mão com intenção — {new Date().getFullYear()}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          footer { padding: 3rem 0 2rem !important; margin-top: 2rem !important; }
          footer form { flex-direction: column !important; }
          footer form input { width: 100% !important; }
          footer form button { width: 100% !important; }
        }
      `}</style>
    </footer>
  )
}