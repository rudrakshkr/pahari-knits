import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(undefined)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { name, imageUrl }

  const showToast = useCallback((name, imageUrl) => {
    setToast({ name, imageUrl })
    setTimeout(() => setToast(null), 2400)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  return (
    <ToastContext.Provider value={{ toast, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
