import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import StoreApp from './store/StoreApp'
import AdminApp from './admin/AdminApp'
import AdminLogin from './admin/pages/Login'
import CrmApp from './crm/CrmApp'

export default function App() {
  return (
    <Routes>
      <Route index element={<StoreApp />} />
      <Route path="/catalogo" element={<StoreApp />} />
      <Route path="/rastreio" element={<StoreApp />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/crm" element={<CrmApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}