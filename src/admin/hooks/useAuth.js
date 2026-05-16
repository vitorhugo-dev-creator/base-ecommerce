import React, { useState, useEffect } from 'react'

const API_URL = 'https://base-ecommerce-production.up.railway.app'

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/check`, { credentials: 'include' }).then(r => r.json()).then(d => {
      setAuthenticated(d.authenticated)
      setLoading(false)
    }).catch(() => { setAuthenticated(false); setLoading(false) })
  }, [])

  async function login(username, password) {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    })
    const data = await res.json()
    if (data.success) setAuthenticated(true)
    return data
  }

  async function logout() {
    await fetch(`${API_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' })
    setAuthenticated(false)
  }

  return { authenticated, loading, login, logout }
}
