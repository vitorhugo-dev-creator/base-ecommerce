import React from 'react'
import { useStore } from '../StoreContext'

export default function ProductCard({ product, onSelect, index = 0 }) {
  const { addToCart } = useStore()
  const [imgError, setImgError] = React.useState(false)
  const [imgLoaded, setImgLoaded] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)
  const cardRef = React.useRef(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const finalPrice = product.promo_percent > 0 ? product.price * (1 - product.promo_percent / 100) : product.price
  const originalPrice = product.promo_percent > 0 ? product.price : null

  return (
    <article
      ref={cardRef}
      className="product-card animate-fade-up"
      style={{ animationDelay: `${index * 0.08}s`, opacity: isVisible ? undefined : 0 }}
      onClick={() => onSelect(product)}
    >
      <div className="product-card__image">
        {!imgError && product.image_url ? (
          isVisible ? (
            <>
              {!imgLoaded && <div className="product-card__skeleton" />}
              <img
                src={product.image_url}
                alt={product.name}
                className={`product-card__img ${imgLoaded ? 'loaded' : ''}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(true) }}
                loading="lazy"
              />
            </>
          ) : (
            <div className="product-card__skeleton" />
          )
        ) : (
          <div className="product-card__placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {product.promo_percent > 0 && (
          <span className="product-card__tag">−{product.promo_percent}%</span>
        )}

        <div className="product-card__overlay">
          <button
            className="product-card__btn"
            onClick={(e) => {
              e.stopPropagation()
              addToCart(product)
            }}
          >
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
        <div className="product-card__footer">
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
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-card:hover {
          border-color: var(--border2);
          transform: translateY(-8px) scale(1.01);
          box-shadow: var(--shadow-lg);
        }
        .product-card__image {
          position: relative;
          aspect-ratio: 1;
          background: var(--bg2);
          overflow: hidden;
        }
        .product-card__skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, var(--bg2) 25%, var(--stone-700) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .product-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s;
          opacity: 0;
        }
        .product-card__img.loaded { opacity: 1; }
        .product-card:hover .product-card__img { transform: scale(1.08); }
        .product-card__placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--stone-600);
        }
        .product-card__tag {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: var(--accent);
          color: var(--cream);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-sm);
          z-index: 2;
        }
        .product-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(26,24,22,0.9) 0%, transparent 50%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 1.5rem;
          opacity: 0;
          transition: opacity 0.35s;
        }
        .product-card:hover .product-card__overlay { opacity: 1; }
        .product-card__btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--accent);
          color: var(--cream);
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transform: translateY(20px);
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-card:hover .product-card__btn {
          transform: translateY(0);
          opacity: 1;
        }
        .product-card__btn:hover {
          background: var(--accent2);
          box-shadow: var(--shadow-md);
        }
        .product-card__body { padding: 1.5rem; }
        .product-card__category {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
          margin-bottom: 0.5rem;
        }
        .product-card__name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
          margin-bottom: 0.75rem;
          transition: color 0.2s;
        }
        .product-card:hover .product-card__name { color: var(--accent); }
        .product-card__footer {
          display: flex;
          align-items: baseline;
          gap: 0.625rem;
        }
        .product-card__price {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text);
        }
        .product-card__original {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-decoration: line-through;
        }
      `}</style>
    </article>
  )
}