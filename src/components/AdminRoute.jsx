/**
 * AdminRoute.jsx — Protected route wrapper
 *
 * If the user is not authenticated, redirects to /admin/login.
 * The `replace` prop on <Navigate> prevents the login page from
 * being added to the browser history stack (back button works correctly).
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { isAdmin }  = useAuth()
  const location     = useLocation()

  if (!isAdmin) {
    // Pass the attempted URL so we can redirect back after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
