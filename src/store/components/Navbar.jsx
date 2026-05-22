import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../StoreContext'

export default function Navbar() {
  const { cartCount, setCartOpen, settings } = useStore()
  const [scrolled, setScrolled] = React.useState(false)
  const [addingToCart, setAddingToCart] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const location = useLocation()

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  React.useEffect(() => {
    if (cartCount > 0) {
      setAddingToCart(true)
      const t = setTimeout(() => setAddingToCart(false), 600)
      return () => clearTimeout(t)
    }
  }, [cartCount])

  React.useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  React.useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span className="navbar__name">{settings.store_name || 'Loja'}</span>
        </Link>

        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>
            Início
          </Link>
          <Link to="/catalogo" className={`navbar__link ${location.pathname.includes('/catalogo') ? 'active' : ''}`}>
            Catálogo
          </Link>
          <Link to="/rastreio" className={`navbar__link ${location.pathname.includes('/rastreio') ? 'active' : ''}`}>
            Rastreio
          </Link>
        </div>

        <div className="navbar__actions">
          <button
            className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>

          <button
            className={`navbar__cart ${addingToCart ? 'navbar__cart--bounce' : ''}`}
            onClick={() => setCartOpen(true)}
            aria-label="Carrinho"
          >
            {addingToCart && <div className="navbar__cart-ring" />}
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cartCount > 0 && <span className="navbar__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
          </button>
        </div>
      </div>

      {menuOpen && <div className="navbar__backdrop" onClick={() => setMenuOpen(false)} />}

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .navbar--scrolled {
          background: rgba(26, 24, 22, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-md);
        }
        .navbar__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
        }
        .navbar__brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text);
          transition: opacity 0.2s;
        }
        .navbar__brand:hover { opacity: 0.8; }
        .navbar__logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 14px;
          color: var(--cream);
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s;
        }
        .navbar__brand:hover .navbar__logo { transform: rotate(10deg) scale(1.05); }
        .navbar__name {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 600;
        }
        .navbar__actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .navbar__links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .navbar__link {
          padding: 0.625rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius-xs);
          transition: all 0.25s;
        }
        .navbar__link:hover {
          color: var(--text);
          background: rgba(96,165,250,0.08);
        }
        .navbar__link.active {
          color: var(--accent);
          background: rgba(96,165,250,0.12);
        }
        .navbar__hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 14px;
          cursor: pointer;
          padding: 10px;
          transition: all 0.25s;
        }
        .navbar__hamburger:hover {
          background: var(--bg3);
          border-color: var(--accent);
        }
        .navbar__hamburger span {
          display: block;
          width: 18px;
          height: 2px;
          background: var(--text);
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .navbar__hamburger--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .navbar__hamburger--open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .navbar__hamburger--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .navbar__cart {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 14px;
          color: var(--text);
          cursor: pointer;
          transition: all 0.25s;
        }
        .navbar__cart:hover {
          background: var(--bg3);
          border-color: var(--accent);
          color: var(--accent);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(96,165,250,0.2);
        }
        .navbar__cart--bounce {
          animation: cartPulse 0.5s ease;
        }
        .navbar__cart-ring {
          position: absolute;
          inset: -4px;
          border-radius: 16px;
          border: 2px solid var(--accent);
          animation: ringExpand 0.5s ease forwards;
          pointer-events: none;
        }
        .navbar__cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          min-width: 22px;
          height: 22px;
          padding: 0 5px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: var(--cream);
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }
        .navbar__backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: -1;
          animation: fadeIn 0.2s ease;
        }
        @keyframes cartPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); box-shadow: 0 0 30px rgba(96,165,250,0.4); }
          100% { transform: scale(1); }
        }
        @keyframes ringExpand {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @media (max-width: 768px) {
          .navbar__inner { height: 64px; }
          .navbar__name { font-size: 1.1rem; }
          .navbar__logo { width: 36px; height: 36px; }
          .navbar__cart { width: 40px; height: 40px; }
          .navbar__hamburger { display: flex; }
          .navbar__links {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            flex-direction: column;
            background: rgba(22, 27, 34, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border);
            padding: 1rem;
            gap: 0.25rem;
            transform: translateY(-110%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 99;
          }
          .navbar__links--open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: all;
          }
          .navbar__link {
            width: 100%;
            padding: 0.875rem 1.25rem;
            font-size: 1rem;
          }
        }
        @media (max-width: 480px) {
          .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(10,13,18,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </nav>
  )
}