import React from 'react'
import { useStore } from '../context/StoreContext'

export default function ProductModal({ product, onClose }) {
  const { addToCart, settings } = useStore()
  const [imgError, setImgError] = React.useState(false)
  const [activeImg, setActiveImg] = React.useState(0)

  React.useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden'
      setImgError(false)
      setActiveImg(0)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [product])

  if (!product) return null

  const images = [
    product.image_url,
    ...(product.extra_images || []).map(i => i.image_url)
  ].filter(Boolean)

  const finalPrice = product.promo_percent > 0
    ? product.price * (1 - product.promo_percent / 100)
    : product.price

  const whatsappLink = settings.store_whatsapp
    ? `https://wa.me/${settings.store_whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${product.name} — R$ ${finalPrice.toFixed(2).replace('.', ',')}`)}`
    : '#'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--product">
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-product__layout">
          <div className="modal-product__gallery">
            <div className="modal-product__main-img">
              {!imgError && images[activeImg] ? (
                <img src={images[activeImg]} alt={product.name} onError={() => setImgError(true)} />
              ) : (
                <div className="modal-product__img-placeholder">
                  <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
              {product.promo_percent > 0 && (
                <span className="modal-product__promo-badge">−{product.promo_percent}%</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="modal-product__thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`modal-product__thumb ${i === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="modal-product__info">
            {product.category && (
              <span className="modal-product__category">{product.category}</span>
            )}
            <h2 className="modal-product__name">{product.name}</h2>
            {product.description && (
              <p className="modal-product__desc">{product.description}</p>
            )}

            <div className="modal-product__price-wrap">
              <span className="modal-product__price">
                R$ {finalPrice.toFixed(2).replace('.', ',')}
              </span>
              {product.promo_percent > 0 && (
                <span className="modal-product__original">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>

            {product.tags?.length > 0 && (
              <div className="modal-product__tags">
                {product.tags.map(tag => (
                  <span key={tag} className="modal-product__tag">{tag.trim()}</span>
                ))}
              </div>
            )}

            <div className="modal-product__actions">
              <button
                className="modal-product__add-btn"
                onClick={() => { addToCart(product); onClose() }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Adicionar ao Carrinho
              </button>
              {settings.store_whatsapp && (
                <a href={whatsappLink} target="_blank" rel="noopener" className="modal-product__whatsapp-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.06 6.988 2.944a9.92 9.92 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal--product { position: relative; max-width: 900px; }
        .modal-product__layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 640px) {
          .modal-product__layout { grid-template-columns: 1fr; }
        }
        .modal-product__gallery {
          padding: 1.5rem;
          border-right: 1px solid var(--border);
        }
        @media (max-width: 640px) { .modal-product__gallery { border-right: none; border-bottom: 1px solid var(--border); } }
        .modal-product__main-img {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--bg);
        }
        .modal-product__main-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .modal-product__img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--border2);
        }
        .modal-product__promo-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: linear-gradient(135deg, #ff4444, #cc2222);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          box-shadow: 0 2px 12px rgba(255,68,68,0.4);
        }
        .modal-product__thumbs {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
          flex-wrap: wrap;
        }
        .modal-product__thumb {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-xs);
          overflow: hidden;
          border: 2px solid transparent;
          padding: 0;
          cursor: pointer;
          background: var(--bg);
          transition: border-color 0.2s;
        }
        .modal-product__thumb.active { border-color: var(--accent); }
        .modal-product__thumb img { width: 100%; height: 100%; object-fit: cover; }
        .modal-product__info {
          padding: 2rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .modal-product__category {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
        }
        .modal-product__name {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }
        .modal-product__desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .modal-product__price-wrap {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          padding: 1rem 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .modal-product__price {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--accent);
          font-family: 'Playfair Display', serif;
        }
        .modal-product__original {
          font-size: 1rem;
          color: var(--text-muted);
          text-decoration: line-through;
        }
        .modal-product__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .modal-product__tag {
          padding: 0.25rem 0.75rem;
          background: var(--bg3);
          border: 1px solid var(--border2);
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        .modal-product__actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
        }
        .modal-product__add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(224,112,64,0.35);
          letter-spacing: 0.02em;
        }
        .modal-product__add-btn:hover {
          box-shadow: 0 6px 24px rgba(224,112,64,0.5);
          transform: translateY(-2px);
        }
        .modal-product__whatsapp-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.9rem;
          background: rgba(37, 211, 102, 0.1);
          color: #25d366;
          font-size: 0.9rem;
          font-weight: 700;
          border: 1px solid rgba(37, 211, 102, 0.3);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.02em;
        }
        .modal-product__whatsapp-btn:hover {
          background: rgba(37, 211, 102, 0.2);
          border-color: rgba(37, 211, 102, 0.6);
        }
      `}</style>
    </div>
  )
}
