import React, { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const url = `${API_BASE}/api/${isRegister ? 'register' : 'login'}`
      const res = await axios.post(url, isRegister ? { email, password, name } : { email, password })
      onAuth(res.data.token)
    } catch (err) {
      if (err?.response) {
        setError(err.response.data?.error || 'Server error')
      } else if (err?.request) {
        setError('Network error: cannot reach server')
      } else {
        setError('Request failed')
      }
      console.error('Login/register error', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="bg-shape shape1" />
      <div className="bg-shape shape2" />
      <div className="bg-shape shape3" />
      <div className="login-overlay">
        <motion.form className="login-card" onSubmit={submit} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <motion.h2 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>{isRegister ? 'Create account' : 'Welcome back'}</motion.h2>
          {isRegister && (
            <motion.input initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <motion.input initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <motion.input initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} type="submit" disabled={isLoading}>{isLoading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}</motion.button>
          {error && <div className="error">{error}</div>}
          <div className="switch" onClick={() => { setIsRegister(!isRegister); setError(null) }}>
            {isRegister ? 'Have an account? Login' : "Don't have an account? Register"}
          </div>
        </motion.form>
      </div>
    </div>
  )
}
