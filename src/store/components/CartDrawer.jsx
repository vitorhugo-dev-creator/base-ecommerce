import React from 'react'
import { useStore } from '../StoreContext'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, clearCart, cartTotal } = useStore()
  const [checkout, setCheckout] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', address: '', payment: 'pix', notes: '' })
  const [submitting, setSubmitting] = React.useState(false)
  const [pixQR, setPixQR] = React.useState(null)
  const [orderCode, setOrderCode] = React.useState(null)

  React.useEffect(() => { if (cartOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; return () => { document.body.style.overflow = '' } }, [cartOpen])

  async function submitOrder() {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: form.name, customer_email: form.email, customer_phone: form.phone, customer_address: form.address, payment_method: form.payment, notes: form.notes, items: cart }) })
      const data = await res.json()
      if (data.success) { setOrderCode(data.order_code); setPixQR(data.pixQR || null); clearCart(); setCheckout(false) }
      else alert(data.error || 'Erro ao enviar pedido.')
    } catch { alert('Erro de conexão. Tente novamente.') }
    setSubmitting(false)
  }

  if (!cartOpen) return null

  const hasDiscount = cart.some(i => i.promo_percent > 0)
  const originalTotal = cart.reduce((s, i) => s + i.price * (i.promo_percent > 0 ? i.price / (1 - i.promo_percent / 100) : i.price), 0)
  const discountTotal = originalTotal - cartTotal

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }} onClick={() => setCartOpen(false)} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, maxWidth: '100vw', background: 'var(--bg2)', borderLeft: '1px solid var(--border2)', zIndex: 501, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)', boxShadow: '-8px 0 48px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700 }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <h3>Carrinho</h3>
          </div>
          <button onClick={() => setCartOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '50%', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {!orderCode ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                  <p>Seu carrinho está vazio</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', transition: 'border-color 0.2s' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xs)', overflow: 'hidden', background: 'var(--bg)', flexShrink: 0 }}>
                    {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--bg2)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>R$ {item.price.toFixed(2).replace('.', ',')}</span>
                      {item.promo_percent > 0 && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '100px', letterSpacing: '0.03em' }}>-{item.promo_percent}% OFF</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg)', borderRadius: '100px', padding: '0.2rem 0.4rem' }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', fontSize: '1rem' }}>−</button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', fontSize: '1rem' }}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '50%', transition: 'all 0.2s', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {!checkout ? (
                <>
                  {hasDiscount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ice)', fontWeight: 600 }}>Economia</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ice)' }}>- R$ {discountTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total</span>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', fontWeight: 700 }}>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button disabled={cart.length === 0} onClick={() => setCheckout(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: '#fff', fontSize: '0.9rem', fontWeight: 700, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 16px rgba(224,112,64,0.3)', letterSpacing: '0.02em' }}>
                    <span>Finalizar Pedido</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {[['Nome completo *', 'text', 'name'], ['E-mail', 'email', 'email'], ['WhatsApp', 'tel', 'phone'], ['Endereço de entrega', 'text', 'address']].map(([label, type, field]) => (
                    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label>{label}</label>
                      <input type={type} placeholder={label} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label>Forma de pagamento</label>
                    <select value={form.payment} onChange={e => setForm(p => ({ ...p, payment: e.target.value }))}>
                      <option value="pix">PIX — à vista</option>
                      <option value="whatsapp">Combinar via WhatsApp</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label>Observações</label>
                    <textarea rows="2" placeholder="Alguma observação?" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <button disabled={submitting} onClick={submitOrder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: '#fff', fontSize: '0.9rem', fontWeight: 700, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 16px rgba(224,112,64,0.3)' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {submitting ? 'Enviando...' : 'Confirmar Pedido'}
                  </button>
                  <button onClick={() => setCheckout(false)} style={{ display: 'block', width: '100%', padding: '0.6rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.2s', textAlign: 'center' }}>← Voltar</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', gap: '0.75rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,204,102,0.15)', border: '2px solid rgba(0,204,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00cc66', marginBottom: '0.5rem', animation: 'pulse 2s ease infinite' }}>
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem' }}>Pedido Confirmado!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código: <strong style={{ color: 'var(--accent)' }}>{orderCode}</strong></p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Você receberá a confirmação por WhatsApp/email em breve.</p>
            {pixQR && <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', animation: 'fadeUp 0.5s ease' }}><img src={pixQR} alt="QR PIX" style={{ maxWidth: 180, borderRadius: 'var(--radius-xs)' }} /><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Pague com PIX</p></div>}
            <button onClick={() => { setOrderCode(null); setCartOpen(false) }} className="btn-primary" style={{ marginTop: '1rem' }}>Continuar Comprando</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,204,102,0.3); }
          50% { box-shadow: 0 0 0 16px rgba(0,204,102,0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}