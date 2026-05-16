import React from 'react'
import { useStore } from '../context/StoreContext'

export default function ProductCard({ product, onSelect, index = 0 }) {
  const { addToCart } = useStore()
  const [imgError, setImgError] = React.useState(false)

  const finalPrice = product.promo_percent > 0
    ? product.price * (1 - product.promo_percent / 100)
    : product.price

  const originalPrice = product.promo_percent > 0 ? product.price : null

  return (
    <article
      className="product-card animate-fade-up"
      style={{ animationDelay: `${index * 0.07}s` }}
      onClick={() => onSelect(product)}
    >
      <div className="product-card__img-wrap">
        {!imgError && product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="product-card__img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-card__img-placeholder">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {product.promo_percent > 0 && (
          <span className="product-card__promo">−{product.promo_percent}%</span>
        )}

        <div className="product-card__overlay">
          <button className="product-card__quick-add" onClick={(e) => { e.stopPropagation(); addToCart(product) }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Adicionar
          </button>
        </div>
      </div>

      <div className="product-card__body">
        {product.category && (
          <span className="product-card__category">{product.category}</span>
        )}
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__pricing">
          <span className="product-card__price">
            R$ {finalPrice.toFixed(2).replace('.', ',')}
          </span>
          {originalPrice && (
            <span className="product-card__original">
              R$ {originalPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .product-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          opacity: 0;
        }
        .product-card:hover {
          border-color: var(--border2);
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 12px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(224,112,64,0.1);
        }
        .product-card__img-wrap {
          position: relative;
          aspect-ratio: 1;
          background: var(--bg2);
          overflow: hidden;
        }
        .product-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .product-card:hover .product-card__img { transform: scale(1.06); }
        .product-card__img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--border2);
        }
        .product-card__promo {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          background: linear-gradient(135deg, #ff4444, #cc2222);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 100px;
          letter-spacing: 0.04em;
          box-shadow: 0 2px 8px rgba(255,68,68,0.4);
        }
        .product-card__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .product-card:hover .product-card__overlay { opacity: 1; }
        .product-card__quick-add {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.25rem;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          transform: translateY(8px);
          transition: all 0.25s ease;
        }
        .product-card:hover .product-card__quick-add { transform: translateY(0); }
        .product-card__quick-add:hover { box-shadow: 0 4px 16px rgba(224,112,64,0.5); }
        .product-card__body {
          padding: 1.25rem;
        }
        .product-card__category {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
          margin-bottom: 0.5rem;
        }
        .product-card__name {
          font-family: 'Playfair Display', serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
          margin-bottom: 0.6rem;
          transition: color 0.2s;
        }
        .product-card:hover .product-card__name { color: var(--accent); }
        .product-card__pricing {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .product-card__price {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
        }
        .product-card__original {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-decoration: line-through;
        }
      `}</style>
    </article>
  )
}
