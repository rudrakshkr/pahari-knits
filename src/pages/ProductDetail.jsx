/**
 * ProductDetail.jsx  —  PahariKnits Product Detail Page
 *
 * Layout (desktop, side-by-side):
 * LEFT   — vertical thumbnail strip + large main image with fade transition
 * RIGHT  — breadcrumb · badge · name · origin · price · description
 * accordion (material / care) · qty stepper · Add to Cart + Buy Now
 *
 * Below:  "You Might Also Like" — up to 3 related products from same category
 *
 * Data:   fetched from GET /api/products/:id (Vite proxies to Express)
 * Falls back gracefully to a "not found" state.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { formatINR } from '../data/products'
import { Helmet } from 'react-helmet-async';

// ── Badge colours (matches Shop.jsx) ──────────────────────────────────────────
const BADGE_STYLE = {
  'Bestseller':      'bg-gold-500 text-white',
  'New Arrival':     'bg-teal-500 text-white',
  'Artisan Pick':    'bg-navy-700 text-white',
  'Limited Edition': 'bg-[#7A3820] text-white',
}

// ── Accordion section (Material / Care) ───────────────────────────────────────
function Accordion({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-line-200 last:border-b">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3.5 text-left
                   text-sm font-semibold text-ink-700 hover:text-ink-900
                   transition-colors group"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-transform duration-200
                      ${open ? 'rotate-180' : 'rotate-0'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-40 pb-4' : 'max-h-0'}`}>
        <p className="text-sm text-ink-400 leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

// ── Related product mini-card ──────────────────────────────────────────────────
function RelatedCard({ product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-line-200
                 shadow-card hover:shadow-card-lg hover:-translate-y-0.5
                 transition-all duration-200 flex flex-col"
    >
      <div className="relative overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5
                            rounded-full ${BADGE_STYLE[product.badge] ?? 'bg-ink-500 text-white'}`}>
            {product.badge}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-medium text-teal-500 uppercase tracking-widest mb-1">
          {product.origin}
        </p>
        <h4 className="text-sm font-bold text-ink-900 leading-snug mb-auto">{product.name}</h4>
        <p className="text-base font-bold text-navy-700 mt-3">{formatINR(product.price)}</p>
      </div>
    </Link>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-content mx-auto px-6 py-10 animate-pulse">
      <div className="h-4 w-48 bg-line-200 rounded mb-8" />
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-[55%]">
          <div className="w-full aspect-square bg-line-200 rounded-2xl mb-3" />
          <div className="flex gap-2">
            {[0,1,2,3].map(i => <div key={i} className="w-16 h-16 bg-line-200 rounded-xl" />)}
          </div>
        </div>
        <div className="flex-1 space-y-4 pt-2">
          <div className="h-3 w-20 bg-line-200 rounded" />
          <div className="h-8 w-3/4 bg-line-200 rounded" />
          <div className="h-4 w-1/3 bg-line-200 rounded" />
          <div className="h-24 bg-line-200 rounded" />
          <div className="h-12 bg-line-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
export default function ProductDetail() {
  const { id }             = useParams()
  const navigate           = useNavigate()
  const { addToCart, items } = useCart()
  const { showToast }      = useToast()

  const [product, setProduct]   = useState(null)
  const [related, setRelated]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError  ]   = useState(null)

  // Gallery state
  const [activeImg, setActiveImg]       = useState(0)
  const [imgFading, setImgFading]       = useState(false)  // drives CSS opacity

  // Right-panel state
  const [qty,      setQty     ]         = useState(1)
  const [added,    setAdded   ]         = useState(false)  // brief "Added ✓" feedback

  // ── Fetch product ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setActiveImg(0)
    setQty(1)
    setAdded(false)

    fetch(`/api/products/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'not_found' : 'server_error')
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        setProduct(data.product)
        setRelated(data.related || [])
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  // ── Smart Inventory Calculations ───────────────────────────────────────────
  // Checks what is currently in the user's cart so we don't let them add too many
  const cartItem = items.find(i => i.product.id === product?.id)
  const currentCartQty = cartItem ? cartItem.quantity : 0
  const maxAllowed = product?.maxQuantity !== null && product?.maxQuantity !== undefined ? product.maxQuantity : Infinity
  // How many more can they physically click "add" for?
  const availableToAdd = Math.max(0, maxAllowed - currentCartQty)

  // Auto-correct the quantity stepper if it exceeds the new available amount
  useEffect(() => {
    if (qty > availableToAdd && availableToAdd > 0) {
      setQty(availableToAdd)
    } else if (availableToAdd === 0) {
      setQty(1) // Keep visual at 1, but buttons will be disabled
    }
  }, [availableToAdd, qty])

  // ── Switch gallery image with a brief fade ────────────────────────────────
  const switchImage = useCallback((index) => {
    if (index === activeImg) return
    setImgFading(true)
    setTimeout(() => {
      setActiveImg(index)
      setImgFading(false)
    }, 160)
  }, [activeImg])

  // ── Add to cart ────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product.inStock || availableToAdd === 0) return; // Safety block
    
    const productForCart = {
      ...product,
      imageUrl: product.images[0]
    };

    // Add requested quantity to cart
    for (let i = 0; i < qty; i++) addToCart(productForCart);
    
    showToast(product.name, productForCart.imageUrl);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    setQty(1); // Reset stepper back to 1
  }

  // ── Buy now = add + go to cart ─────────────────────────────────────────────
  const handleBuyNow = () => {
    if (!product.inStock || availableToAdd === 0) {
      navigate('/cart');
      return;
    }

    const productForCart = {
      ...product,
      imageUrl: product.images[0]
    };

    for (let i = 0; i < qty; i++) addToCart(productForCart);
    navigate('/cart');
  }

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) return <Skeleton />

  if (error === 'not_found' || !product) {
    return (
      <div className="max-w-sm mx-auto text-center py-24 px-6">
        <p className="text-5xl mb-4">🧵</p>
        <h2 className="text-xl font-bold text-ink-900 mb-2">Product not found</h2>
        <p className="text-sm text-ink-400 mb-8">This piece may have sold out or moved.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800
                                     text-white text-sm font-bold uppercase tracking-wide
                                     px-7 py-3.5 rounded-xl shadow-btn transition-colors">
          Back to Shop
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto text-center py-24 px-6">
        <p className="text-5xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-ink-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-ink-400 mb-8">Could not load product details. Is the server running?</p>
        <button onClick={() => window.location.reload()}
                className="bg-gold-500 hover:bg-gold-600 text-white text-sm font-bold
                           px-6 py-3 rounded-xl transition-colors">
          Retry
        </button>
      </div>
    )
  }

  // ── Full PDP render ─────────────────────────────────────────────────────────
  return (
    <div className="bg-cream-50 min-h-screen">
      {/* ── SEO & JSON-LD SCHEMA MARKUP ────────────────────────────────────── */}
      <Helmet>
        <title>{product.name} | PahariKnits Himalayan Apparel</title>
        <meta name="description" content={product.description.substring(0, 160)} />
        
        {/* Open Graph (Makes links look beautiful on WhatsApp/Facebook/Twitter) */}
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        <meta property="og:image" content={product.images[0]} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />

        {/* Google Rich Snippet Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.images,
            "description": product.description,
            "brand": {
              "@type": "Brand",
              "name": "PahariKnits"
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "INR",
              "price": product.price,
              "availability": product.inStock 
                ? "https://schema.org/InStock" 
                : "https://schema.org/OutOfStock",
              "itemCondition": "https://schema.org/NewCondition"
            }
          })}
        </script>
      </Helmet>

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-line-200">
        <div className="max-w-content mx-auto px-6 py-3 flex items-center gap-2 text-xs text-ink-400">
          <Link to="/"     className="hover:text-navy-700 transition-colors">Home</Link>
          <span className="text-line-300">/</span>
          <Link to="/shop" className="hover:text-navy-700 transition-colors">Shop</Link>
          <span className="text-line-300">/</span>
          <span className="text-ink-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN LAYOUT — gallery left, info right
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-content mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

          {/* ═══════════════════════════════════
              LEFT — Image gallery
          ═══════════════════════════════════ */}
          <div className="lg:w-[52%] flex flex-col gap-4">

            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-line-200
                            shadow-card aspect-[4/3]">
              <img
                key={activeImg}
                src={product.images[activeImg]}
                alt={`${product.name} — view ${activeImg + 1}`}
                className={`w-full h-full object-cover transition-opacity duration-150
                            ${imgFading ? 'opacity-0' : 'opacity-100'}`}
              />

              {/* Badge overlay */}
              {product.badge && (
                <span className={`absolute top-4 left-4 text-[11px] font-semibold px-3 py-1
                                  rounded-full shadow-sm
                                  ${BADGE_STYLE[product.badge] ?? 'bg-ink-500 text-white'}`}>
                  {product.badge}
                </span>
              )}

              {/* Prev / Next arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => switchImage((activeImg - 1 + product.images.length) % product.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2
                               w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-card
                               flex items-center justify-center text-ink-500 hover:text-ink-900
                               backdrop-blur-sm transition-all"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => switchImage((activeImg + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-card
                               flex items-center justify-center text-ink-500 hover:text-ink-900
                               backdrop-blur-sm transition-all"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => switchImage(i)}
                  className={[
                    'shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden',
                    'border-2 transition-all duration-150 hover:opacity-100',
                    i === activeImg
                      ? 'border-gold-500 opacity-100 shadow-sm'
                      : 'border-line-200 opacity-60 hover:border-gold-300',
                  ].join(' ')}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════
              RIGHT — Product info
          ═══════════════════════════════════ */}
          <div className="flex-1 flex flex-col gap-0">

            {/* Origin tag */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              <span className="text-xs font-semibold text-teal-500 uppercase tracking-[0.18em]">
                {product.origin}
              </span>
            </div>

            {/* Product name */}
            <h1 className="text-3xl md:text-4xl font-bold text-ink-900 leading-tight tracking-tight mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-line-200">
              <span className="text-4xl font-bold text-navy-700 tracking-tight">
                {formatINR(product.price)}
              </span>
              <span className="text-sm text-ink-400 font-medium">incl. all taxes · Free shipping</span>
            </div>

            {/* Description */}
            <p className="text-[15px] text-ink-500 leading-[1.75] mb-6">
              {product.description}
            </p>

            {/* Dimensions */}
            {product.dimensions && (
              <div className="flex items-start gap-2.5 mb-6 bg-navy-50 rounded-xl px-4 py-3
                              border border-navy-100">
                <span className="text-navy-400 shrink-0 mt-0.5">📐</span>
                <p className="text-sm text-ink-700 leading-relaxed">
                  <strong className="text-navy-700">Dimensions: </strong>
                  {product.dimensions}
                </p>
              </div>
            )}

            {/* Accordion — Material + Care */}
            <div className="mb-6">
              <Accordion title="Material & Construction">
                {product.material}
              </Accordion>
              <Accordion title="Care Instructions">
                {product.care}
              </Accordion>
              <Accordion title="Authenticity Guarantee">
                Every PahariKnits piece comes with a hand-signed artisan tag naming the weaver,
                their village, and the technique used. This is not a mass-produced product.
                If you ever have doubts about authenticity, contact us and we will provide
                the full provenance of your piece.
              </Accordion>
            </div>

            {/* ── NEW: URGENCY / STOCK ALERT BADGE ── */}
            {product.inStock && product.maxQuantity !== null && availableToAdd > 0 && (
              <div className={`mb-5 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${
                product.maxQuantity <= 3 
                  ? 'bg-red-50/80 text-red-600 border-red-100' 
                  : 'bg-amber-50/80 text-amber-700 border-amber-100'
              }`}>
                 <span className={product.maxQuantity <= 3 ? "animate-pulse text-lg" : "text-lg"}>
                   {product.maxQuantity <= 3 ? '🔥' : '⚡'}
                 </span>
                 <span className="text-sm font-bold tracking-tight">
                   {product.maxQuantity <= 3 
                     ? `Hurry! Only ${product.maxQuantity} left in stock` 
                     : `Limited availability: ${product.maxQuantity} left`}
                 </span>
              </div>
            )}

            {/* Qty stepper */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-semibold text-ink-700 shrink-0">Quantity</span>
              <div className="flex items-center gap-1.5 bg-cream-100 rounded-full
                              px-2 py-2 border border-line-200">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={!product.inStock || availableToAdd === 0}
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center
                             text-ink-700 font-bold hover:bg-navy-50 transition-colors disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-10 text-center text-base font-bold text-ink-900">{!product.inStock || availableToAdd === 0 ? 0 : qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(q + 1, availableToAdd))}
                  disabled={!product.inStock || qty >= availableToAdd || availableToAdd === 0}
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center
                             text-ink-700 font-bold hover:bg-navy-50 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              
              {/* 👈 NEW: Prioritized Stepper Status Text */}
              {!product.inStock ? (
                <span className="text-xs text-red-400 font-semibold">Out of stock</span>
              ) : maxAllowed !== Infinity && currentCartQty >= maxAllowed ? (
                <span className="text-xs text-red-500 font-semibold">Max limit currently in cart</span>
              ) : maxAllowed !== Infinity && qty >= availableToAdd && availableToAdd > 0 ? (
                <span className="text-xs text-amber-600 font-semibold">Order limit reached</span>
              ) : (
                <span className="text-xs text-teal-500 font-semibold">✓ In stock</span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 flex-wrap">
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || availableToAdd === 0}
                className={[
                  'flex-1 min-w-[160px] inline-flex items-center justify-center gap-2.5',
                  'font-bold text-sm uppercase tracking-wide py-4 rounded-xl',
                  'transition-all duration-150',
                  !product.inStock || availableToAdd === 0
                    ? 'bg-line-200 text-ink-400 cursor-not-allowed'
                    : added
                      ? 'bg-teal-500 text-white'
                      : 'bg-gold-500 hover:bg-gold-600 text-white shadow-btn-gold active:scale-[0.98]'
                ].join(' ')}
              >
                {!product.inStock ? (
                  "Sold Out"
                ) : availableToAdd === 0 ? (
                  "Limit Reached"
                ) : added ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Added to Cart
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"/>
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                disabled={!product.inStock || availableToAdd === 0}
                className={[
                  'flex-1 min-w-[160px] inline-flex items-center justify-center',
                  'font-bold text-sm uppercase tracking-wide py-4 rounded-xl',
                  'transition-all duration-150 border-2',
                  !product.inStock || availableToAdd === 0
                    ? 'border-line-200 text-ink-300 bg-transparent cursor-not-allowed'
                    : 'border-navy-700 text-navy-700 hover:bg-navy-700 hover:text-white active:scale-[0.98]'
                ].join(' ')}
              >
                Buy Now
              </button>
            </div>

            {/* Trust signals */}
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                ['🔒', 'Secure checkout'],
                ['🔄', 'Easy returns'],
                ['🚚', 'Free delivery'],
                // ['🏔', 'Artisan verified'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-ink-400 font-medium">
                  <span>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
            {/* Delivery & Exchange Note */}
            <div className="mt-5 bg-navy-50 rounded-xl px-4 py-3.5 border border-navy-100 flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <span className="text-navy-400 shrink-0 text-sm mt-0.5">🚚</span>
                <p className="text-[13px] text-ink-600 leading-relaxed">
                  <strong className="text-navy-700">Estimated Delivery:</strong> Arrives in 7 to 10 days
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-navy-400 shrink-0 text-sm mt-0.5">📦</span>
                <p className="text-[13px] text-ink-600 leading-relaxed">
                  <strong className="text-navy-700">Easy Returns:</strong> In case of returns, they should be placed within 3 days of delivery. After that no return will be accepted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}