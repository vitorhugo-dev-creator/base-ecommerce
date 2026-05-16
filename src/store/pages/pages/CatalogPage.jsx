import React from 'react'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

export default function CatalogPage({ onSelect }) {
  const { products } = useStore()
  const [search, setSearch] = React.useState('')
  const [activeCategory, setActiveCategory] = React.useState('all')
  const [sort, setSort] = React.useState('newest')

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sort === 'newest') return b.id - a.id
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div className="catalog-page">
      <div className="container">
        <div className="catalog-page__header">
          <span className="section-label">Catálogo</span>
          <h1 className="section-title">Todos os Produtos</h1>
        </div>

        <div className="catalog-page__filters">
          <div className="catalog-page__search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="catalog-page__sort">
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Mais recentes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A–Z</option>
            </select>
          </div>
        </div>

        <div className="catalog-page__categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={`catalog-page__cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        <div className="catalog-page__count">
          {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
        </div>

        {filtered.length > 0 ? (
          <div className="catalog-page__grid">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} onSelect={onSelect} index={i} />
            ))}
          </div>
        ) : (
          <div className="catalog-page__empty">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      <style>{`
        .catalog-page { padding-top: 100px; padding-bottom: 5rem; }
        .catalog-page__header { margin-bottom: 2.5rem; }
        .catalog-page__header .section-title { margin-top: 0.5rem; }
        .catalog-page__filters {
          display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .catalog-page__search {
          flex: 1; min-width: 220px; position: relative;
        }
        .catalog-page__search svg {
          position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
        }
        .catalog-page__search input { padding-left: 2.75rem; }
        .catalog-page__sort select { width: auto; min-width: 160px; }
        .catalog-page__categories {
          display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;
        }
        .catalog-page__cat-btn {
          padding: 0.45rem 1rem; background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 100px; color: var(--text-muted); font-size: 0.8rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .catalog-page__cat-btn:hover { border-color: var(--accent); color: var(--accent); }
        .catalog-page__cat-btn.active {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          border-color: transparent; color: #fff;
        }
        .catalog-page__count {
          font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;
        }
        .catalog-page__grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem;
        }
        .catalog-page__empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1rem; padding: 4rem 0; color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
