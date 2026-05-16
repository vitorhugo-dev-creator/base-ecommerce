import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { Navigate } from 'react-router-dom'

export default function AdminApp() {
  const { loading, authenticated } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="loading-spinner" />
    </div>
  )
  if (!authenticated) return <Navigate to="/admin/login" replace />
  return null
}
