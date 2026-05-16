import React from 'react'
import { useStore } from '../context/StoreContext'

export default function Footer() {
  const { settings } = useStore()

  return (
    <footer className="site-footer">
      <div className="container footer__inner">
        <div className="footer__brand-row">
          <span className="footer__brand">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {settings.store_name || 'Loja'}
          </span>
          <span className="footer__brand-line" />
        </div>

        <p className="footer__tagline">
          Feito com intenção. Entregue com cuidado.
        </p>

        <nav className="footer__nav">
          <a href="/">Início</a>
          <span className="footer__sep">·</span>
          <a href="/catalogo">Catálogo</a>
          <span className="footer__sep">·</span>
          <a href="/rastreio">Rastrear Pedido</a>
        </nav>

        <div className="footer__copy">© {new Date().getFullYear()} — Todos os direitos reservados</div>
      </div>

      <style>{`
        .site-footer {
          border-top: 1px solid var(--border);
          padding: 4rem 0 2rem;
          margin-top: 2rem;
        }
        .footer__inner { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
        .footer__brand-row { display: flex; align-items: center; gap: 1rem; }
        .footer__brand {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: var(--text);
        }
        .footer__brand-line {
          display: block; width: 60px; height: 1px;
          background: linear-gradient(90deg, var(--accent), transparent);
        }
        .footer__tagline { font-size: 0.875rem; color: var(--text-muted); font-style: italic; font-family: 'Playfair Display', serif; }
        .footer__nav { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
        .footer__nav a {
          font-size: 0.85rem; font-weight: 500; color: var(--text-muted); transition: color 0.2s;
        }
        .footer__nav a:hover { color: var(--accent); }
        .footer__sep { color: var(--border2); }
        .footer__copy { font-size: 0.75rem; color: var(--text-muted); opacity: 0.6; }
      `}</style>
    </footer>
  )
}
