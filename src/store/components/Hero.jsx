import React from 'react'
import { useStore } from '../StoreContext'

export default function Hero() {
  const { settings } = useStore()

  return (
    <section className="hero">
      {/* Organic Background Blobs */}
      <div className="hero__blobs">
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--3" />
      </div>

      {/* Grain Texture Overlay */}
      <div className="hero__grain" />

      <div className="container hero__content">
        <div className="hero__left">
          <div className="hero__eyebrow">
            <span className="hero__eyebrow-line" />
            <span className="hero__eyebrow-text">{settings.hero_subtitle || 'Qualidade e estilo para você'}</span>
          </div>

          <h1 className="hero__title">
            {settings.hero_title || settings.store_name || 'Descubra nossos produtos'}
          </h1>

          <p className="hero__desc">
            {settings.store_description || 'Bem-vindo à nossa loja! Produtos feitos com intenção, entregues com cuidado.'}
          </p>

          <div className="hero__actions">
            <a href="/vitordev/catalogo" className="btn-hero">
              <span>Explorar Catálogo</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
            <a href="/vitordev/rastreio" className="btn-ghost-hero">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Rastrear Pedido
            </a>
          </div>
        </div>

        <div className="hero__right">
          <div className="hero__visual">
            <div className="hero__shape hero__shape--1" />
            <div className="hero__shape hero__shape--2" />
            <div className="hero__shape hero__shape--3" />
            <div className="hero__badge">
              <span className="hero__badge-number">100%</span>
              <span className="hero__badge-text">Feito à mão</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 80px;
          overflow: hidden;
        }
        .hero__blobs {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .hero__blob {
          position: absolute;
          filter: blur(80px);
          opacity: 0.5;
        }
        .hero__blob--1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
          top: -10%;
          left: -5%;
          animation: blob 12s ease-in-out infinite;
        }
        .hero__blob--2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--ice) 0%, transparent 70%);
          bottom: 0;
          right: 10%;
          animation: blob 15s ease-in-out infinite reverse;
        }
        .hero__blob--3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, var(--ice-dark) 0%, transparent 70%);
          top: 40%;
          right: 30%;
          animation: blob 10s ease-in-out infinite;
        }
        .hero__grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.6;
        }
        .hero__content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          padding: 4rem 2rem;
        }
        .hero__left {
          max-width: 540px;
        }
        .hero__eyebrow {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .hero__eyebrow-line {
          display: block;
          width: 50px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent));
        }
        .hero__eyebrow-text {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--accent);
        }
        .hero__title {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 600;
          color: var(--text);
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }
        .hero__desc {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }
        .hero__actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .btn-hero {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2.25rem;
          background: var(--accent);
          color: var(--cream);
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: var(--radius-full);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-md), 0 0 0 0 rgba(196,131,106,0.4);
        }
        .btn-hero:hover {
          background: var(--accent2);
          transform: translateY(-3px) scale(1.02);
          box-shadow: var(--shadow-lg), 0 0 0 6px rgba(196,131,106,0.1);
        }
        .btn-hero svg { transition: transform 0.25s; }
        .btn-hero:hover svg { transform: translateX(5px); }
        .btn-ghost-hero {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 1.75rem;
          background: transparent;
          color: var(--text);
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid var(--border2);
          border-radius: var(--radius-full);
          transition: all 0.35s ease;
        }
        .btn-ghost-hero:hover {
          background: rgba(196,131,106,0.1);
          border-color: var(--accent);
          color: var(--accent);
        }
        .hero__right {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .hero__visual {
          position: relative;
          width: 400px;
          height: 400px;
        }
        .hero__shape {
          position: absolute;
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: blob 8s ease-in-out infinite;
        }
        .hero__shape--1 {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--accent) 0%, var(--ice-dark) 100%);
          opacity: 0.8;
        }
        .hero__shape--2 {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          background: linear-gradient(135deg, var(--ice) 0%, var(--ice-dark) 100%);
          animation-delay: -2s;
          opacity: 0.6;
        }
        .hero__shape--3 {
          width: 40%;
          height: 40%;
          bottom: 10%;
          right: 10%;
          background: var(--sand-300);
          animation-delay: -4s;
          opacity: 0.3;
        }
        .hero__badge {
          position: absolute;
          bottom: 20%;
          left: -10%;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: var(--radius);
          padding: 1.25rem 1.5rem;
          text-align: center;
          box-shadow: var(--shadow-lg);
        }
        .hero__badge-number {
          display: block;
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent);
          line-height: 1;
        }
        .hero__badge-text {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        @media (max-width: 968px) {
          .hero__content {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 3rem 2rem;
          }
          .hero__left { max-width: 100%; }
          .hero__eyebrow { justify-content: center; }
          .hero__actions { justify-content: center; }
          .hero__right { display: none; }
        }
      `}</style>
    </section>
  )
}