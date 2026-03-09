import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useCart } from '../context/CartContext'
import { formatINR } from '../data/products'

export default function Cart() {
  const navigate = useNavigate()
  const { items, removeFromCart, updateQuantity, totalItems, totalAmount } = useCart()

  return (
    <div>
      <Helmet>
        <title>Your Cart | PahariKnits</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Page header */}
      <div className="bg-white border-b border-line-200 shadow-[0_2px_8px_rgba(26,36,56,0.05)]">
        <div className="max-w-content mx-auto px-6 py-7">
          <p className="text-[11px] font-semibold text-teal-500 tracking-[0.22em] uppercase mb-1.5">
            Your Selection
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 tracking-tight">
            Cart{totalItems > 0 ? ` (${totalItems})` : ''}
          </h1>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="max-w-sm mx-auto text-center py-24 px-6">
          <div className="w-20 h-20 rounded-2xl bg-navy-50 flex items-center justify-center text-4xl mx-auto mb-6">
            🧣
          </div>
          <h2 className="text-xl font-bold text-ink-900 mb-2">Your cart is empty</h2>
          <p className="text-sm text-ink-400 mb-8 leading-relaxed">
            Discover our handcrafted Himachali apparel and add pieces you love.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600
                       text-white text-sm font-bold uppercase tracking-wide
                       px-7 py-3.5 rounded-xl shadow-btn-gold transition-colors"
          >
            Browse the Shop
          </Link>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

          {/* Cart items */}
          <div className="flex flex-col gap-3">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-4 bg-white rounded-2xl p-4
                           border border-line-200 shadow-card"
              >
                <Link
                  to={`/product/${product.id}`}
                  className="shrink-0 block rounded-xl overflow-hidden
                             ring-2 ring-transparent hover:ring-gold-400 transition-all"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-[72px] h-[72px] object-cover hover:scale-105 transition-transform duration-200"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${product.id}`}
                    className="font-bold text-ink-900 leading-snug truncate block hover:text-navy-700 transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-teal-500 font-medium mt-0.5">{product.origin}</p>
                  <p className="text-base font-bold text-navy-700 mt-1">
                    {formatINR(product.price * quantity)}
                  </p>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center gap-1 bg-navy-50 rounded-full px-1.5 py-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center
                               text-navy-700 font-bold text-base hover:bg-navy-50 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-ink-900">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, product.maxQuantity != null ? Math.min(quantity + 1, product.maxQuantity) : quantity + 1)}
                    disabled={product.maxQuantity != null && quantity >= product.maxQuantity}
                    className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center
                               text-navy-700 font-bold text-base hover:bg-navy-50 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(product.id)}
                  className="text-ink-200 hover:text-ink-500 transition-colors p-1 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Order summary + CTA */}
          <div className="bg-white rounded-2xl border border-line-200 shadow-card p-6">
            <h2 className="text-sm font-bold text-ink-900 uppercase tracking-widest mb-5">
              Order Summary
            </h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">
                  Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
                <span className="font-semibold text-ink-700">{formatINR(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Shipping</span>
                <span className="font-bold text-teal-500">FREE</span>
              </div>
            </div>

            <div className="border-t border-dashed border-line-200 pt-4
                            flex justify-between items-center mb-6">
              <span className="font-bold text-ink-900">Total</span>
              <span className="text-2xl font-bold text-navy-700">{formatINR(totalAmount)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-3 bg-gold-500
                         hover:bg-gold-600 text-white font-bold uppercase tracking-wider
                         py-4 rounded-xl text-sm shadow-btn-gold transition-colors
                         active:scale-[0.98]"
            >
              Proceed to Checkout
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}