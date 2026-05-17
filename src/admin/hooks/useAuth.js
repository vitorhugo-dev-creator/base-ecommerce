import React, { useState, useEffect } from 'react'

const API_URL = 'https://base-ecommerce-production.up.railway.app'

function getToken() {
  return localStorage.getItem('admin_token')
}

function setToken(token) {
  localStorage.setItem('admin_token', token)
}

function clearToken() {
  localStorage.removeItem('admin_token')
}

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setAuthenticated(false)
      setLoading(false)
      return
    }

    fetch(`${API_URL}/api/admin/check`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        setAuthenticated(!!d.authenticated)
        setLoading(false)
      })
      .catch(() => {
        setAuthenticated(false)
        setLoading(false)
      })
  }, [])

  async function login(username, password) {
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.success && data.token) {
      setToken(data.token)
      setAuthenticated(true)
    }
    return data
  }

  async function logout() {
    const token = getToken()
    if (token) {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }
    clearToken()
    setAuthenticated(false)
  }

  return { authenticated, loading, login, logout }
}
