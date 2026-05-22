import React from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const pageMap = { dashboard: 'dashboard', products: 'products', orders: 'orders', settings: 'settings' }
  const raw = location.pathname.replace('/admin/', '').replace('/admin', '')
  const currentPage = pageMap[raw] || 'dashboard'

  function handleNav(page) { setSidebarOpen(false); navigate(`/admin/${page}`) }

  async function doLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <Sidebar currentPage={currentPage} onNavigate={handleNav} onLogout={doLogout} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <main className="admin-main">
        <div className="admin-topbar">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>
            {currentPage === 'dashboard' ? 'Dashboard' : currentPage === 'products' ? 'Produtos' : currentPage === 'orders' ? 'Pedidos' : currentPage === 'settings' ? 'Configurações' : 'Dashboard'}
          </h1>
          <a href="/" target="_blank" className="store-link-btn">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Ver Loja
          </a>
        </div>
        <div className="admin-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function AdminApp() {
  const { loading, authenticated } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="loading-spinner" />
    </div>
  )
  if (!authenticated) return <Navigate to="/admin/login" replace />

  return <AdminLayout />
}