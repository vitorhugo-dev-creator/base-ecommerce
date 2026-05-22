import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../StoreContext'
import ProductCard from './ProductCard'

export default function ProductGrid({ onSelect }) {
  const { products } = useStore()
  const [visible, setVisible] = useState(8)
  const featured = products.slice(0, visible)

  if (!products.length) return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)' }}>Carregando produtos...</p>
    </div>
  )

  return (
    <section className="products-section">
      <div className="container">
        <div className="products-section__header">
          <div>
            <span className="section-label">Novidades</span>
            <h2 className="section-title">Produtos em Destaque</h2>
          </div>
          <Link to="/catalogo" className="section-link">
            Ver todos
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>

        <div className="products-grid">
          {featured.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelect}
              index={i}
            />
          ))}
        </div>

        {visible < products.length && (
          <div className="products-section__more">
            <button className="btn-ghost" onClick={() => setVisible(v => v + 8)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ver mais produtos
            </button>
          </div>
        )}
      </div>

      <style>{`
        .products-section {
          padding: 6rem 0;
        }
        .products-section__header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 3rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.75rem;
        }
        .products-section__more {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
        }
        @media (max-width: 640px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          .products-section { padding: 3rem 0; }
          .products-section__header { flex-direction: column; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; }
          .products-section__header .section-title { font-size: 1.5rem; }
        }
        @media (max-width: 400px) {
          .products-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}