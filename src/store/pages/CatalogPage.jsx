import React, { useState } from 'react'
import { useStore } from '../StoreContext'
import ProductCard from '../components/ProductCard'

export default function CatalogPage({ onSelect }) {
  const { products } = useStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sort, setSort] = useState('newest')

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sort === 'newest') return b.id - a.id
      if (sort === 'price-asc') return (a.price * (1 - (a.promo_percent||0) / 100)) - (b.price * (1 - (b.promo_percent||0) / 100))
      if (sort === 'price-desc') return (b.price * (1 - (b.promo_percent||0) / 100)) - (a.price * (1 - (a.promo_percent||0) / 100))
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div style={{ paddingTop: 100, paddingBottom: '5rem' }} className="catalog-page">
      <div className="container">
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="section-label">Catálogo</span>
          <h1 className="section-title">Todos os Produtos</h1>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }} className="catalog-toolbar">
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.75rem' }} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
            <option value="newest">Mais recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A–Z</option>
          </select>
        </div>

        <div className="catalog-categories" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '0.45rem 1rem', background: activeCategory === cat ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--bg2)', border: `1px solid ${activeCategory === cat ? 'transparent' : 'var(--border2)'}`, borderRadius: '100px', color: activeCategory === cat ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }} className="catalog-grid">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} onSelect={onSelect} index={i} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .catalog-page { padding-top: 80px !important; }
          .catalog-toolbar { flex-direction: column !important; }
          .catalog-toolbar > div { min-width: 0 !important; width: 100% !important; }
          .catalog-toolbar select { width: 100% !important; min-width: 0 !important; }
          .catalog-categories { gap: 0.4rem !important; }
          .catalog-categories button { font-size: 0.75rem !important; padding: 0.35rem 0.75rem !important; }
          .catalog-grid { gap: 1rem !important; grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 400px) {
          .catalog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
