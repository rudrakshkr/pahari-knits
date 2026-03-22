import React, { createContext, useContext, useState, useCallback } from 'react'
import { getCartTotal, formatINR } from '../data/products'

const CartContext = createContext(undefined)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addToCart = useCallback((product) => {
    let success = false;
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      const currentQty = existing ? existing.quantity : 0
      
      // Treat null/undefined maxQuantity as Infinity (unlimited stock)
      const maxAllowed = product.maxQuantity !== null && product.maxQuantity !== undefined 
        ? product.maxQuantity 
        : Infinity;

      // Block it if adding one more exceeds the database limit
      if (currentQty >= maxAllowed) {
        success = false;
        return prev;
      }

      success = true;
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1 }]
    })
    return success; // Return boolean so the UI knows if it actually worked
  }, [])

  const removeFromCart = useCallback((id) => setItems(prev => prev.filter(i => i.product.id !== id)), [])

  const updateQuantity = useCallback((id, qty) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === id);
      if (!existing) return prev;

      const maxAllowed = existing.product.maxQuantity !== null && existing.product.maxQuantity !== undefined 
        ? existing.product.maxQuantity 
        : Infinity;

      if (qty <= 0) return prev.filter(i => i.product.id !== id);
      
      // Clamp the quantity: forces it to never exceed maxAllowed
      const safeQty = Math.min(qty, maxAllowed);
      
      return prev.map(i => i.product.id === id ? { ...i, quantity: safeQty } : i)
    });
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