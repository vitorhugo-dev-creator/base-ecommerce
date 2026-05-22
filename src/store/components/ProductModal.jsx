import React from 'react'
import { useStore } from '../StoreContext'

export default function ProductModal({ product, onClose }) {
  const { addToCart, settings } = useStore()
  const [imgError, setImgError] = React.useState(false)
  const [activeImg, setActiveImg] = React.useState(0)
  const [added, setAdded] = React.useState(false)

  React.useEffect(() => {
    if (product) { document.body.style.overflow = 'hidden'; setImgError(false); setActiveImg(0); setAdded(false) }
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [product])

  if (!product) return null

  const images = [product.image_url, ...(product.extra_images || []).map(i => i.image_url)].filter(Boolean)
  const finalPrice = product.promo_percent > 0 ? product.price * (1 - product.promo_percent / 100) : product.price
  const originalPrice = product.promo_percent > 0 ? product.price : null
  const whatsappLink = settings.store_whatsapp ? `https://wa.me/${settings.store_whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${product.name} — R$ ${finalPrice.toFixed(2).replace('.', ',')}`)}` : '#'

  function handleAdd() {
    addToCart(product)
    setAdded(true)
    setTimeout(() => onClose(), 800)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide" style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg)', marginBottom: '0.75rem' }}>
              {!imgError && images[activeImg] ? <img src={images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border2)' }}><svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>}
              {product.promo_percent > 0 && <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'linear-gradient(135deg,#ff4444,#cc2222)', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '0.3rem 0.75rem', borderRadius: '100px', boxShadow: '0 2px 12px rgba(255,68,68,0.4)' }}>−{product.promo_percent}%</span>}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: 60, height: 60, borderRadius: 'var(--radius-xs)', overflow: 'hidden', border: `2px solid ${i === activeImg ? 'var(--accent)' : 'transparent'}`, padding: 0, background: 'var(--bg)', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {product.category && <span style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)' }}>{product.category}</span>}
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: '700', color: 'var(--text)', lineHeight: 1.2 }}>{product.name}</h2>
            {product.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{product.description}</p>}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent)', fontFamily: "'Playfair Display',serif" }}>R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
              {originalPrice && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>R$ {originalPrice.toFixed(2).replace('.', ',')}</span>}
            </div>

            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {product.tags.map((tag, i) => <span key={`${tag}-${i}`} style={{ padding: '0.25rem 0.75rem', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '500', color: 'var(--text-muted)' }}>{tag.trim()}</span>)}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
              <button
                onClick={handleAdd}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  width: '100%', padding: '0.9rem', background: added ? 'var(--ice)' : 'linear-gradient(135deg,var(--accent),var(--accent2))',
                  color: '#fff', fontSize: '0.9rem', fontWeight: '700', border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', transition: 'all 0.25s', boxShadow: added ? '0 4px 16px rgba(96,165,250,0.4)' : '0 4px 16px rgba(96,165,250,0.35)',
                  letterSpacing: '0.02em', transform: added ? 'scale(1.02)' : 'none'
                }}
              >
                {added ? (
                  <>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Adicionado!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    Adicionar ao Carrinho
                  </>
                )}
              </button>
              {settings.store_whatsapp && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.9rem', background: 'rgba(37,211,102,0.1)', color: '#25d366', fontSize: '0.9rem', fontWeight: '700', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 'var(--radius-sm)', letterSpacing: '0.02em' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.06 6.988 2.944a9.92 9.92 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .whatsapp-btn:hover {
          background: rgba(37,211,102,0.2) !important;
          box-shadow: 0 0 24px rgba(37,211,102,0.25);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .modal-body-grid { grid-template-columns: 1fr !important; }
          .modal-body-grid > div:first-child { border-right: none !important; padding: 1rem !important; }
          .modal-body-grid > div:last-child { padding: 1.25rem !important; }
          .modal-overlay { padding: 0 !important; align-items: flex-end !important; }
          .modal { border-radius: var(--radius) var(--radius) 0 0 !important; max-height: 92vh !important; }
        }
      `}</style>
    </div>
  )
}