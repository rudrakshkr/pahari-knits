/**
 * AuthContext.jsx — Unified Authentication State
 * Handles both Admin (JWT) and Customer (Email OTP) sessions.
 */

import React, { createContext, useContext, useState, useCallback } from 'react'
import Cookies from 'js-cookie'

const AuthContext = createContext(null)

// ── Admin JWT Expiry Check ────────────────────────────────────────────────────
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const ADMIN_STORAGE_KEY = 'pk_admin_token'

export function AuthProvider({ children }) {
  // ════════════════════════════════════════════════════════════════════════
  // ADMIN STATE (JWT via localStorage)
  // ════════════════════════════════════════════════════════════════════════
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (stored && !isTokenExpired(stored)) return stored
    localStorage.removeItem(ADMIN_STORAGE_KEY)
    return null
  })

  const adminLogin = useCallback((newToken) => {
    localStorage.setItem(ADMIN_STORAGE_KEY, newToken)
    setToken(newToken)
  }, [])

  const adminLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEY)
    setToken(null)
  }, [])

  const isAdmin = Boolean(token && !isTokenExpired(token))

  // ════════════════════════════════════════════════════════════════════════
  // CUSTOMER STATE (Email via Cookies)
  // ════════════════════════════════════════════════════════════════════════
  const [customerEmail, setCustomerEmail] = useState(() => {
    return Cookies.get('customerEmail') || null
  })

  const customerLogin = useCallback((email) => {
    Cookies.set('customerEmail', email, { expires: 30 }) // Remember for 30 days
    setCustomerEmail(email)
  }, [])

  const customerLogout = useCallback(() => {
    Cookies.remove('customerEmail')
    setCustomerEmail(null)
  }, [])

  const isCustomer = Boolean(customerEmail)

  return (
    <AuthContext.Provider value={{
      // Admin API (Preserved so existing admin pages don't break)
      token, isAdmin, login: adminLogin, logout: adminLogout,
      
      // Customer API
      customerEmail, isCustomer, customerLogin, customerLogout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}