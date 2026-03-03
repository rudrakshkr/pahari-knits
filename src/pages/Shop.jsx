import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCTS, CATEGORIES, formatINR } from '../data/products'
import { useCart }  from '../context/CartContext'
import { useToast } from '../context/ToastContext'

const BADGE_STYLE = {
  'Bestseller':      'bg-gold-500 text-white',
  'New Arrival':     'bg-teal-500 text-white',
  'Artisan Pick':    'bg-navy-700 text-white',
  'Limited Edition': 'bg-[#7A3820] text-white',
}

function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { showToast } = useToast()

  const handleAddToCart = (e) => {
    // Stop the click from bubbling up to the <Link> wrapper
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    showToast(product.name, product.imageUrl)
  }

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-line-200
                        shadow-card hover:shadow-card-lg hover:-translate-y-0.5
                        transition-all duration-200 flex flex-col group">

      {/* ── Image — clicking navigates to PDP ── */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-[1.03]
                     transition-transform duration-300"
        />
        {product.badge && (
          <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1
                            rounded-full tracking-wide ${BADGE_STYLE[product.badge] ?? 'bg-ink-500 text-white'}`}>
            {product.badge}
          </span>
        )}
        {/* Origin scrim */}
        <div className="absolute bottom-0 left-0 right-0 h-16
                        bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="text-[11px] font-medium text-white/90 tracking-wide uppercase">
            {product.origin}
          </span>
        </div>
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-5">

        {/* Product name links to PDP */}
        <Link
          to={`/product/${product.id}`}
          className="text-lg font-bold text-ink-900 leading-snug mb-2
                     hover:text-navy-700 transition-colors"
        >
          {product.name}
        </Link>

        <p className="text-sm text-ink-400 leading-relaxed mb-5 flex-1">
          {product.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-line-100">
          <div>
            <p className="text-[10px] font-medium text-ink-200 uppercase tracking-widest mb-0.5">
              Price
            </p>
            <p className="text-xl font-bold text-navy-700">{formatINR(product.price)}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick-view link */}
            <Link
              to={`/product/${product.id}`}
              className="w-9 h-9 rounded-xl border border-line-200 flex items-center justify-center
                         text-ink-400 hover:border-navy-300 hover:text-navy-700 transition-colors"
              title="View details"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                         -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </Link>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600
                         text-white text-sm font-bold px-4 py-2.5 rounded-xl
                         shadow-btn-gold transition-colors duration-150"
            >
              Add to Cart
              <span className="w-5 h-5 rounded-md bg-white/20 flex items-center
                               justify-center text-xs leading-none">+</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Shop() {
  const [active, setActive] = useState('all')

  const filtered = active === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === active)

  return (
    <div>
      {/* Page header */}
      <div className="bg-white border-b border-line-200
                      shadow-[0_2px_8px_rgba(26,36,56,0.05)]">
        <div className="max-w-content mx-auto px-6 py-7
                        flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-teal-500
                          tracking-[0.22em] uppercase mb-1.5">
              Handcrafted in Himachal
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-900
                           tracking-tight leading-none">
              The Collection
            </h1>
          </div>
          <span className="shrink-0 bg-navy-50 text-navy-700 text-sm font-semibold
                           px-4 py-2 rounded-full border border-navy-100">
            {filtered.length} pieces
          </span>
        </div>

        {/* Category filter */}
        <div className="max-w-content mx-auto px-4 pb-3
                        flex items-center gap-2 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={[
                'inline-flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full',
                'text-sm font-semibold border transition-all duration-150',
                active === cat.key
                  ? 'bg-navy-700 border-navy-700 text-white shadow-sm'
                  : 'bg-white border-line-200 text-ink-400 hover:border-navy-200 hover:text-ink-700',
              ].join(' ')}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-content mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🧶</p>
            <h3 className="text-xl font-bold text-ink-900 mb-2">Nothing here yet</h3>
            <p className="text-sm text-ink-400">
              Our weavers are crafting this category. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Footer ornament */}
        <div className="mt-16 py-10 border border-dashed border-line-200
                        rounded-2xl bg-navy-50 text-center">
          <div className="ornament mb-3">
            <span className="ornament-line" />
            <span className="text-gold-500">✦</span>
            <span className="ornament-line" />
          </div>
          <h3 className="text-xl font-bold text-ink-900 mb-2">
            More authentic apparel coming soon...
          </h3>
          <p className="text-sm text-ink-400 max-w-xs mx-auto leading-relaxed">
            Our artisans are at the loom. New shawls, blankets, and woven jackets each season.
          </p>
        </div>
      </div>
    </div>
  )
}
