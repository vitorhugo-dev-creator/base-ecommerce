import React from 'react'
import { useStore } from '../context/StoreContext'

const API_URL = 'https://base-ecommerce-production.up.railway.app'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, clearCart, cartTotal } = useStore()
  const [checkout, setCheckout] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', address: '', payment: 'pix', notes: '' })
  const [submitting, setSubmitting] = React.useState(false)
  const [pixQR, setPixQR] = React.useState(null)
  const [orderCode, setOrderCode] = React.useState(null)

  React.useEffect(() => {
    if (cartOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [cartOpen])

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submitOrder() {
    if (!form.name.trim()) return alert('Informe seu nome completo.')
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_address: form.address,
          payment_method: form.payment,
          notes: form.notes,
          items: cart
        })
      })
      const data = await res.json()
      if (data.success) {
        setOrderCode(data.order_code)
        setPixQR(data.pixQR || null)
        clearCart()
        setCheckout(false)
      } else {
        alert(data.error || 'Erro ao enviar pedido.')
      }
    } catch (e) {
      alert('Erro de conexão. Tente novamente.')
    }
    setSubmitting(false)
  }

  if (!cartOpen) return null

  return (
    <>
      <div className="cart-backdrop" onClick={() => setCartOpen(false)} />
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <h3>Carrinho</h3>
          </div>
          <button className="cart-close" onClick={() => setCartOpen(false)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {!orderCode ? (
          <>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  <p>Seu carrinho está vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__img">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <div className="cart-item__img-placeholder" />
                      )}
                    </div>
                    <div className="cart-item__info">
                      <span className="cart-item__name">{item.name}</span>
                      <span className="cart-item__price">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="cart-item__qty">
                      <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                    <button className="cart-item__remove" onClick={() => removeFromCart(item.id)}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              {!checkout ? (
                <>
                  <div className="cart-total">
                    <span className="cart-total-label">Total</span>
                    <span className="cart-total-value">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button
                    className="btn-checkout"
                    disabled={cart.length === 0}
                    onClick={() => setCheckout(true)}
                  >
                    <span>Finalizar Pedido</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </>
              ) : (
                <div className="checkout-form">
                  <div className="checkout-field">
                    <label>Nome completo *</label>
                    <input type="text" placeholder="Seu nome completo" value={form.name}
                      onChange={e => handleFormChange('name', e.target.value)} />
                  </div>
                  <div className="checkout-row">
                    <div className="checkout-field">
                      <label>E-mail</label>
                      <input type="email" placeholder="email@exemplo.com" value={form.email}
                        onChange={e => handleFormChange('email', e.target.value)} />
                    </div>
                    <div className="checkout-field">
                      <label>WhatsApp</label>
                      <input type="tel" placeholder="(00) 00000-0000" value={form.phone}
                        onChange={e => handleFormChange('phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="checkout-field">
                    <label>Endereço de entrega</label>
                    <input type="text" placeholder="Rua, número, bairro, cidade - UF" value={form.address}
                      onChange={e => handleFormChange('address', e.target.value)} />
                  </div>
                  <div className="checkout-field">
                    <label>Forma de pagamento</label>
                    <select value={form.payment} onChange={e => handleFormChange('payment', e.target.value)}>
                      <option value="pix">PIX — à vista</option>
                      <option value="whatsapp">Combinar via WhatsApp</option>
                    </select>
                  </div>
                  <div className="checkout-field">
                    <label>Observações</label>
                    <textarea placeholder="Alguma observação? Cor, tamanho..." rows="2" value={form.notes}
                      onChange={e => handleFormChange('notes', e.target.value)} />
                  </div>
                  <button className="btn-checkout" disabled={submitting} onClick={submitOrder}>
                    {submitting ? 'Enviando...' : (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Confirmar Pedido
                      </>
                    )}
                  </button>
                  <button className="btn-back" onClick={() => setCheckout(false)}>← Voltar</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="order-success">
            <div className="order-success__icon">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3>Pedido Confirmado!</h3>
            <p className="order-success__code">Código: <strong>{orderCode}</strong></p>
            <p className="order-success__msg">Você receberá a confirmação por WhatsApp/email em breve.</p>
            {pixQR && (
              <div className="order-success__qr">
                <img src={pixQR} alt="QR Code PIX" />
                <p>Pague com PIX usando o QR Code acima</p>
              </div>
            )}
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setOrderCode(null); setCartOpen(false) }}>
              Continuar Comprando
            </button>
          </div>
        )}
      </div>

      <style>{`
        .cart-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 500;
          backdrop-filter: blur(4px); animation: fadeIn 0.2s ease;
        }
        .cart-drawer {
          position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 100vw;
          background: var(--bg2); border-left: 1px solid var(--border2);
          z-index: 501; display: flex; flex-direction: column;
          animation: slideInRight 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: -8px 0 48px rgba(0,0,0,0.4);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .cart-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
        }
        .cart-title {
          display: flex; align-items: center; gap: 0.75rem;
          font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700;
        }
        .cart-title svg { color: var(--accent); }
        .cart-close {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; background: var(--bg3); border: 1px solid var(--border2);
          border-radius: 50%; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .cart-close:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
        .cart-items { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .cart-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1rem; padding: 3rem 0; color: var(--text-muted); text-align: center;
        }
        .cart-item {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 0.875rem; background: var(--bg3); border: 1px solid var(--border);
          border-radius: var(--radius-sm); transition: border-color 0.2s;
        }
        .cart-item:hover { border-color: var(--border2); }
        .cart-item__img {
          width: 56px; height: 56px; border-radius: var(--radius-xs); overflow: hidden;
          background: var(--bg); flex-shrink: 0;
        }
        .cart-item__img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item__img-placeholder { width: 100%; height: 100%; background: var(--bg2); }
        .cart-item__info { flex: 1; min-width: 0; }
        .cart-item__name { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cart-item__price { font-size: 0.8rem; color: var(--accent); font-weight: 600; }
        .cart-item__qty {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--bg); border-radius: 100px; padding: 0.2rem 0.4rem;
        }
        .cart-item__qty button {
          width: 24px; height: 24px; border-radius: 50%; border: none;
          background: var(--bg2); color: var(--text); cursor: pointer; font-size: 1rem;
          display: flex; align-items: center; justify-content: center; transition: background 0.2s;
        }
        .cart-item__qty button:hover { background: var(--accent); color: #fff; }
        .cart-item__qty span { font-size: 0.8rem; font-weight: 600; min-width: 20px; text-align: center; }
        .cart-item__remove {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border: none; background: transparent;
          color: var(--text-muted); cursor: pointer; border-radius: 50%;
          transition: all 0.2s; flex-shrink: 0;
        }
        .cart-item__remove:hover { background: rgba(255,68,68,0.15); color: #ff4444; }
        .cart-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.875rem; }
        .cart-total { display: flex; align-items: center; justify-content: space-between; }
        .cart-total-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; }
        .cart-total-value { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: var(--text); }
        .btn-checkout {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.9rem; background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff; font-size: 0.9rem; font-weight: 700; border: none; border-radius: var(--radius-sm);
          cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 16px rgba(224,112,64,0.3);
          letter-spacing: 0.02em;
        }
        .btn-checkout:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(224,112,64,0.5); }
        .btn-checkout:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-back {
          display: block; width: 100%; padding: 0.6rem; background: transparent;
          border: none; color: var(--text-muted); font-size: 0.85rem; cursor: pointer;
          transition: color 0.2s; text-align: center;
        }
        .btn-back:hover { color: var(--text); }
        .checkout-form { display: flex; flex-direction: column; gap: 0.875rem; }
        .checkout-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .checkout-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .order-success {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 2rem; gap: 0.75rem;
        }
        .order-success__icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(0,204,102,0.15); border: 2px solid rgba(0,204,102,0.3);
          display: flex; align-items: center; justify-content: center; color: #00cc66;
          margin-bottom: 0.5rem;
        }
        .order-success h3 { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: var(--text); }
        .order-success__code { font-size: 0.9rem; color: var(--text-muted); }
        .order-success__code strong { color: var(--accent); font-size: 1.1rem; }
        .order-success__msg { font-size: 0.85rem; color: var(--text-muted); }
        .order-success__qr { margin-top: 1rem; padding: 1rem; background: var(--bg3); border-radius: var(--radius-sm); }
        .order-success__qr img { max-width: 180px; border-radius: var(--radius-xs); }
        .order-success__qr p { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }
      `}</style>
    </>
  )
}
