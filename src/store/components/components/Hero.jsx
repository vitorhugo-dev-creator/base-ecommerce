import React from 'react'
import { useStore } from '../context/StoreContext'

export default function Hero() {
  const { settings } = useStore()

  return (
    <section className="hero">
      <div className="hero__bg">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
        <div className="hero__grid" />
      </div>

      <div className="container hero__inner">
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-line" />
          <span className="hero__eyebrow-text">{settings.hero_subtitle || 'Qualidade e estilo para você'}</span>
          <span className="hero__eyebrow-line" />
        </div>

        <h1 className="hero__title">
          {settings.hero_title || settings.store_name || 'Descubra nossos produtos'}
        </h1>

        <p className="hero__desc">
          {settings.store_description || 'Bem-vindo à nossa loja! Produtos feitos com intenção, entregues com cuidado.'}
        </p>

        <div className="hero__actions">
          <a href="/catalogo" className="btn-hero">
            <span>Explorar Catálogo</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
          <a href="/rastreio" className="btn-ghost-sm">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Rastrear Pedido
          </a>
        </div>
      </div>

      <style>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-top: 72px;
        }
        .hero__bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .hero__grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(224,112,64,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(224,112,64,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%);
        }
        .hero__orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }
        .hero__orb--1 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(224,112,64,0.5) 0%, transparent 70%);
          top: -20%; left: -10%;
          animation: float1 8s ease-in-out infinite;
        }
        .hero__orb--2 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(192,85,47,0.4) 0%, transparent 70%);
          top: 30%; right: -5%;
          animation: float2 10s ease-in-out infinite;
        }
        .hero__orb--3 {
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(255,122,64,0.3) 0%, transparent 70%);
          bottom: -10%; left: 40%;
          animation: float3 7s ease-in-out infinite;
        }
        @keyframes float1 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(40px, 30px); } }
        @keyframes float2 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-30px, 20px); } }
        @keyframes float3 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(20px, -20px); } }

        .hero__inner {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 6rem 1.5rem;
          max-width: 760px;
          margin: 0 auto;
        }
        .hero__eyebrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.6s ease;
        }
        .hero__eyebrow-line {
          display: block;
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent));
        }
        .hero__eyebrow-line:last-child {
          background: linear-gradient(90deg, var(--accent), transparent);
        }
        .hero__eyebrow-text {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--accent);
        }
        .hero__title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 7vw, 4.5rem);
          font-weight: 700;
          color: var(--text);
          line-height: 1.05;
          margin-bottom: 1.25rem;
          animation: fadeUp 0.6s ease 0.1s both;
          background: linear-gradient(135deg, var(--text) 40%, rgba(240,236,230,0.6) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero__desc {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 540px;
          margin: 0 auto 2.5rem;
          animation: fadeUp 0.6s ease 0.2s both;
        }
        .hero__actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          animation: fadeUp 0.6s ease 0.3s both;
        }
        .btn-hero {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.9rem 2rem;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 24px rgba(224,112,64,0.4), 0 0 0 0 rgba(224,112,64,0.5);
          letter-spacing: 0.02em;
        }
        .btn-hero:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 32px rgba(224,112,64,0.5), 0 0 0 4px rgba(224,112,64,0.15);
        }
        .btn-hero svg { transition: transform 0.2s; }
        .btn-hero:hover svg { transform: translateX(4px); }
        .btn-ghost-sm {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.9rem 1.75rem;
          background: transparent;
          color: var(--text);
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid var(--border2);
          border-radius: 100px;
          transition: all 0.25s ease;
          letter-spacing: 0.02em;
        }
        .btn-ghost-sm:hover {
          background: var(--border);
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </section>
  )
}
