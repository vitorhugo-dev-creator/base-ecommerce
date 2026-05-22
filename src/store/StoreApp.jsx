import React, { useState, useEffect } from 'react'
import { StoreProvider, useStore } from './StoreContext'

import { useLocation } from 'react-router-dom'
const API_URL = import.meta.env.VITE_API_URL || ''
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'
import ProductModal from './components/ProductModal'
import CartDrawer from './components/CartDrawer'
import ToastContainer from './components/ToastContainer'
import Footer from './components/Footer'
import CatalogPage from './pages/CatalogPage'
import TrackingPage from './pages/TrackingPage'

function StoreApp() {
  const { settings } = useStore()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const location = useLocation()

  useEffect(() => {
    document.title = settings.store_name || 'Loja'
    if (!location.pathname.includes('/rastreio') && !sessionStorage.getItem('_tracked')) {
      sessionStorage.setItem('_tracked', '1')
      fetch(`${API_URL}/api/track`).catch(() => {})
    }
  }, [settings, location.pathname])

  const isCatalog = location.pathname.includes('/catalogo')
  const isTracking = location.pathname.includes('/rastreio')

  return (
    <>
      <Navbar />
      {isTracking ? (
        <TrackingPage />
      ) : isCatalog ? (
        <CatalogPage onSelect={setSelectedProduct} />
      ) : (
        <>
          <Hero />
          <ProductGrid onSelect={setSelectedProduct} />
        </>
      )}
      <Footer />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer />
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <StoreApp />
    </StoreProvider>
  )
}