/**
 * Success.jsx — Post-payment confirmation page
 *
 * Receives state from Cart.jsx navigate('/success', { state: { ... } })
 * Falls back gracefully if navigated to directly.
 */
import React, { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

// Tiny confetti burst — pure CSS, no dependency
function ConfettiBurst() {
  const COLORS = ['#B8892E', '#1D3461', '#2A7A8A', '#B35938', '#C9A84C']
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id:    i,
    color: COLORS[i % COLORS.length],
    left:  `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    dur:   `${0.8 + Math.random() * 0.6}s`,
    size:  `${6 + Math.random() * 6}px`,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id}
          className="absolute rounded-sm opacity-0"
          style={{
            left:             p.left,
            top:              '-10px',
            width:            p.size,
            height:           p.size,
            backgroundColor:  p.color,
            animation:        `confettiFall ${p.dur} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0)   rotate(0deg);   opacity: 1; }
          100% { transform: translateY(340px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function Success() {
  const { state } = useLocation()
  const paymentId = state?.paymentId
  const orderId   = state?.orderId
  const amount    = state?.amount

  // Short ID shown to user: last 8 chars of payment ID
  const shortId = paymentId
    ? paymentId.slice(-8).toUpperCase()
    : '--------'

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center
                    bg-cream-50 px-6 py-16">

      {/* ── SEO MARKUP (PRIVATE PAGE) ──────────────────────────────────── */}
      <Helmet>
        <title>Order Confirmed | PahariKnits</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="relative max-w-md w-full text-center">
        {/* Confetti */}
        <ConfettiBurst />

        {/* Card */}
        <div className="relative bg-white rounded-3xl border border-line-200
                        shadow-card-lg px-8 py-12 z-10">

          {/* Big check circle */}
          <div className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center
                          text-white text-4xl font-bold mx-auto mb-6
                          shadow-[0_6px_24px_rgba(184,137,46,0.40)]">
            ✓
          </div>

          {/* Ornament */}
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <span className="h-px w-7 bg-gold-400 rounded-full opacity-60" />
            <span className="text-[11px] font-semibold text-gold-500 tracking-[0.22em] uppercase">
              Payment Confirmed
            </span>
            <span className="h-px w-7 bg-gold-400 rounded-full opacity-60" />
          </div>

          <h1 className="text-2xl font-bold text-ink-900 mb-2">
            Thank you for your order!
          </h1>
          <p className="text-sm text-ink-400 leading-relaxed mb-8">
            Your handcrafted Himachali pieces are being prepared with care.
            You'll receive a confirmation email shortly.
          </p>

          {/* Order details */}
          {paymentId && (
            <div className="bg-cream-100 rounded-2xl p-5 text-left space-y-3 mb-8
                            border border-line-200">
              <DetailRow label="Payment ID"  value={`#${shortId}`} />
              {amount && (
                <DetailRow
                  label="Amount Paid"
                  value={`₹${amount.toLocaleString('en-IN')}`}
                  highlight
                />
              )}
              <DetailRow label="Status" value="✅  Paid & Verified" />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/shop"
              className="flex-1 inline-flex items-center justify-center gap-2
                         bg-navy-700 hover:bg-navy-800 text-white text-sm font-bold
                         uppercase tracking-wide px-6 py-3.5 rounded-xl
                         shadow-btn transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center
                         bg-cream-100 hover:bg-cream-200 border border-line-200
                         text-ink-700 text-sm font-semibold px-6 py-3.5 rounded-xl
                         transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Below-card tagline */}
        <p className="mt-6 text-xs text-ink-300 leading-relaxed max-w-xs mx-auto">
          Every purchase directly supports artisan weavers in Kullu, Kinnaur,
          Spiti, and Chamba. Thank you. 🏔
        </p>
      </div>
    </div>
  )
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-400 font-medium">{label}</span>
      <span className={highlight ? 'font-bold text-navy-700' : 'font-semibold text-ink-700'}>
        {value}
      </span>
    </div>
  )
}
