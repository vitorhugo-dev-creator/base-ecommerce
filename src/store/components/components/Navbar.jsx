import React from 'react'
import { useStore } from '../context/StoreContext'

export default function Navbar() {
  const { cartCount, setCartOpen } = useStore()
  const [scrolled, setScrolled] = React.useState(false)
  const { settings } = useStore()

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <a href="/" className="navbar__brand">
          <span className="navbar__logo">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span id="store-name-nav">{settings.store_name || 'Loja'}</span>
        </a>

        <ul className="navbar__links">
          <li><a href="/" className={window.location.pathname === '/' ? 'active' : ''}>Início</a></li>
          <li><a href="/catalogo" className={window.location.pathname === '/catalogo' ? 'active' : ''}>Catálogo</a></li>
          <li><a href="/rastreio" className={window.location.pathname === '/rastreio' ? 'active' : ''}>Rastreio</a></li>
        </ul>

        <button className="navbar__cart" onClick={() => setCartOpen(true)} aria-label="Abrir carrinho">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartCount > 0 && (
            <span className="navbar__cart-count">{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </button>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0;
          transition: all 0.3s ease;
        }
        .navbar--scrolled {
          background: rgba(10,10,15,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 4px 32px rgba(0,0,0,0.3);
        }
        .navbar__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
        }
        .navbar__brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
          transition: opacity 0.2s;
        }
        .navbar__brand:hover { opacity: 0.8; }
        .navbar__logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          border-radius: 10px;
          color: #fff;
        }
        .navbar__links {
          display: flex;
          list-style: none;
          gap: 0.25rem;
        }
        .navbar__links a {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
          border-radius: var(--radius-xs);
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .navbar__links a:hover, .navbar__links a.active {
          color: var(--text);
          background: var(--border);
        }
        .navbar__links a.active { color: var(--accent); }
        .navbar__cart {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: var(--radius-sm);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }
        .navbar__cart:hover {
          background: var(--bg3);
          border-color: var(--accent);
          color: var(--accent);
        }
        .navbar__cart-count {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-shadow: 0 2px 8px rgba(224,112,64,0.5);
        }
        @media (max-width: 640px) {
          .navbar__links { display: none; }
          .navbar__inner { padding: 0 1rem; }
        }
      `}</style>
    </nav>
  )
}
