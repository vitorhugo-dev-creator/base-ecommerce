import React, { createContext, useContext, useState, useEffect } from 'react'

const API_URL = 'https://base-ecommerce-production.up.railway.app'

const StoreContext = createContext()

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('store_cart') || '[]') } catch { return [] }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/settings`).then(r => { if (!r.ok) throw r; return r.json() }),
      fetch(`${API_URL}/api/products`).then(r => { if (!r.ok) throw r; return r.json() }),
    ]).then(([settingsData, productsData]) => {
      setSettings(settingsData)
      setProducts(productsData)
    }).catch(() => {})
  }, [])

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    addToast(`${product.name} adicionado ao carrinho`, 'success')
  }
  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)) }
  function updateQty(id, qty) { if (qty <= 0) return removeFromCart(id); setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i)) }
  function clearCart() { setCart([]) }
  function addToast(message, type = 'success') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <StoreContext.Provider value={{ settings, products, cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount, addToast, toasts }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
