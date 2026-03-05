/**
 * AuthContext.jsx — Admin authentication state
 *
 * Stores the JWT in localStorage under 'pk_admin_token'.
 * Exposes: { token, isAdmin, login, logout }
 *
 * login(token) — stores the token + triggers re-render
 * logout()     — removes the token + redirects to /admin/login
 *
 * Tokens are verified by the backend on every request.
 * We do a lightweight client-side expiry check here just to avoid
 * showing the dashboard when the token is already stale.
 */

import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// ── Simple JWT expiry check (no crypto — just parse the payload) ──────────────
// We never trust client-side checks for actual security — the server enforces
// JWT verification on every admin API call.  This is purely UX.
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const STORAGE_KEY = 'pk_admin_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && !isTokenExpired(stored)) return stored
    localStorage.removeItem(STORAGE_KEY)   // clear stale token
    return null
  })

  const login = useCallback((newToken) => {
    localStorage.setItem(STORAGE_KEY, newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }, [])

  const isAdmin = Boolean(token && !isTokenExpired(token))

  return (
    <AuthContext.Provider value={{ token, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
