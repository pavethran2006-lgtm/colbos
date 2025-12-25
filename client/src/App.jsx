import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const API_BASE = import.meta.env.VITE_API_BASE || ''
  const [networkError, setNetworkError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMe() {
      if (!token) return
      setLoading(true)
      try {
        setNetworkError(null)
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          console.warn('fetch /api/me failed', res.status)
          if (res.status === 401) {
            localStorage.removeItem('token')
            setToken(null)
          }
          setLoading(false)
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch (e) {
        console.error('Network error fetching /api/me', e)
        setNetworkError('Network error: cannot reach backend')
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [token, API_BASE])

  if (!token) return <Login onAuth={(t) => { localStorage.setItem('token', t); setToken(t) }} />
  if (loading || !user) return <div className="loading">Loading…</div>

  return <Dashboard user={user} />
}
