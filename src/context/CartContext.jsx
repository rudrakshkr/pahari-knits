import React, { createContext, useContext, useState, useCallback } from 'react'
import { getCartTotal, formatINR } from '../data/products'

const CartContext = createContext(undefined)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addToCart = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((id) => setItems(prev => prev.filter(i => i.product.id !== id)), [])

  const updateQuantity = useCallback((id, qty) => {
    if (qty <= 0) setItems(prev => prev.filter(i => i.product.id !== id))
    else setItems(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems  = items.reduce((s, i) => s + i.quantity, 0)
  const totalAmount = getCartTotal(items)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount, formattedTotal: formatINR(totalAmount) }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
