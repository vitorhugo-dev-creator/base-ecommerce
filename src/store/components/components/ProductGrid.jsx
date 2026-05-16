import React from 'react'
import { useStore } from '../context/StoreContext'
import ProductCard from './ProductCard'

export default function ProductGrid({ onSelect }) {
  const { products } = useStore()
  const [visible, setVisible] = React.useState(8)
  const featured = products.slice(0, visible)

  if (!products.length) return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p>Carregando produtos...</p>
    </div>
  )

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-label">Novidades</span>
            <h2 className="section-title">Produtos em Destaque</h2>
          </div>
          <a href="/catalogo" className="section-link">
            Ver todos
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>

        <div className="products-grid">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} onSelect={onSelect} index={i} />
          ))}
        </div>

        {visible < products.length && (
          <div className="grid-more">
            <button className="btn-primary" onClick={() => setVisible(v => v + 8)}>
              Ver mais produtos
            </button>
          </div>
        )}
      </div>

      <style>{`
        .section { padding: 5rem 0; }
        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .grid-more {
          display: flex;
          justify-content: center;
          margin-top: 2.5rem;
        }
      `}</style>
    </section>
  )
}
