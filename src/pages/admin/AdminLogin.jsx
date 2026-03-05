/**
 * AdminLogin.jsx — Admin sign-in page
 *
 * POSTs to /api/admin/login.  On success, stores the JWT via AuthContext
 * and redirects to /admin (or the page the user was trying to access).
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const redirectTo   = location.state?.from?.pathname || '/admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading ] = useState(false)
  const [error,    setError   ] = useState(null)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res  = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed')
      }

      login(data.token)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1832] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / brand */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="PahariKnits" className="w-14 h-14 rounded-xl mx-auto mb-4
                                                              ring-2 ring-white/10" />
          <h1 className="text-xl font-bold text-white">PahariKnits</h1>
          <p className="text-sm text-white/40 mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white mb-6">Sign in to continue</h2>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 bg-red-500/10 border border-red-500/20
                            rounded-xl px-4 py-3 text-sm text-red-400">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-sm text-white placeholder-white/20
                           focus:outline-none focus:border-[#B8892E]/60 focus:bg-white/8
                           transition-colors"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10
                             text-sm text-white placeholder-white/20
                             focus:outline-none focus:border-[#B8892E]/60 focus:bg-white/8
                             transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-white/30 hover:text-white/60 transition-colors text-xs"
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={[
                'w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider',
                'transition-all duration-150',
                loading
                  ? 'bg-[#B8892E]/40 text-white/50 cursor-not-allowed'
                  : 'bg-[#B8892E] hover:bg-[#9A7020] text-white shadow-[0_4px_14px_rgba(184,137,46,0.4)]',
              ].join(' ')}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          PahariKnits Admin · Restricted access
        </p>
      </div>
    </div>
  )
}
