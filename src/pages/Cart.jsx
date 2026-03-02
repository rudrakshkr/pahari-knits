/**
 * Cart.jsx — PahariKnits
 *
 * Payment flow:
 *  1. User clicks "Proceed to Payment"
 *  2. displayRazorpay() calls POST /api/create-order → gets order_id
 *  3. Razorpay checkout modal opens (with GPay via prefetch: true)
 *  4. On success → POST /api/verify-payment with the three Razorpay IDs
 *  5. Server verifies HMAC signature
 *  6. Navigate to /success
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatINR } from '../data/products'

// ── Razorpay brand-matching theme ────────────────────────────────────────────
// color   = modal header / primary UI — we use Rust/Amber to match the
//           "Premium Earthy Boutique" palette
// color_background = modal body bg
// color_text       = text on the colored header
const RAZORPAY_THEME = {
  color:            '#B35938',   // Rust / Amber — earthy accent
  color_background: '#FBF9F6',   // Cream — matches app background
  color_text:       '#FBF9F6',   // Cream text on the rust header
}

// ── Utility: dynamically load the Razorpay checkout script ───────────────────
// Razorpay requires their JS to be loaded at runtime (not bundled).
// This function injects the <script> tag once and resolves when it's ready.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    // If already loaded (e.g. user clicks pay twice) resolve immediately
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }

    const script    = document.createElement('script')
    script.id       = 'razorpay-script'
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async    = true
    script.onload   = () => resolve(true)
    script.onerror  = () => resolve(false) // don't reject — caller handles false
    document.body.appendChild(script)
  })
}

export default function Cart() {
  const navigate = useNavigate()
  const { items, removeFromCart, updateQuantity, totalItems, totalAmount, clearCart } = useCart()
  const [payLoading, setPayLoading] = useState(false)
  const [payError,   setPayError  ] = useState(null)

  // ══════════════════════════════════════════════════════════════════════════
  // displayRazorpay — main payment handler
  //
  // Step-by-step:
  //  1. Load checkout.js (dynamic script injection)
  //  2. POST /api/create-order  →  get Razorpay order_id
  //  3. Open Razorpay modal with prefetch: true (ensures GPay appears)
  //  4. handler.success → POST /api/verify-payment → navigate /success
  //  5. handler.dismiss → restore button state
  // ══════════════════════════════════════════════════════════════════════════
  const displayRazorpay = async () => {
    setPayError(null)
    setPayLoading(true)

    // ── Step 1: load the Razorpay JS SDK ─────────────────────────────────
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      setPayError('Could not load payment gateway. Please check your internet connection.')
      setPayLoading(false)
      return
    }

    // ── Step 2: create a Razorpay order on our backend ───────────────────
    let orderData
    try {
      const res = await fetch('/api/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: totalAmount }), // INR amount
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${res.status}`)
      }

      orderData = await res.json()
    } catch (err) {
      setPayError(`Order creation failed: ${err.message}`)
      setPayLoading(false)
      return
    }

    // ── Step 3: open the Razorpay checkout modal ──────────────────────────
    //
    // Key options explained:
    //   prefetch: true    — pre-fetches payment methods including GPay; this
    //                       is what makes Google Pay show up prominently
    //   method.upi: true  — explicitly enables UPI (covers GPay, PhonePe…)
    //   remember_customer — pre-fills phone/email on repeat visits
    //
    const options = {
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:      orderData.amount,      // in paise (as returned by backend)
      currency:    orderData.currency,    // 'INR'
      name:        'PahariKnits',
      description: `${totalItems} handcrafted ${totalItems === 1 ? 'item' : 'items'} from the Himalayas`,
      image:       '/logo.png',           // your brand logo in the modal
      order_id:    orderData.order_id,

      // ── GPay / UPI prominence ─────────────────────────────────────────
      prefetch:    true,                  // pre-loads GPay, PhonePe, BHIM etc.
      method: {
        upi:        true,                 // enables all UPI apps (GPay, PhonePe)
        card:       true,
        netbanking: true,
        wallet:     true,
        emi:        false,
      },

      // ── Remember customer details ─────────────────────────────────────
      remember_customer: true,

      // ── Theme — Premium Earthy Boutique palette ───────────────────────
      theme: RAZORPAY_THEME,

      // ── Pre-fill (optional — remove if not collecting user info) ──────
      // prefill: {
      //   name:    currentUser?.name  || '',
      //   email:   currentUser?.email || '',
      //   contact: currentUser?.phone || '',
      // },

      // ── Notes (visible in Razorpay dashboard) ─────────────────────────
      notes: {
        items:      items.map(i => i.product.name).join(', '),
        item_count: totalItems,
      },

      // ── Success handler ───────────────────────────────────────────────
      // Razorpay calls this with three IDs once payment is captured.
      // We MUST verify the signature on our server before trusting it.
      handler: async function (response) {
        const {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        } = response

        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            }),
          })

          const verifyData = await verifyRes.json()

          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Verification failed')
          }

          // Payment is confirmed — clear cart and navigate to success page
          clearCart()
          navigate('/success', {
            state: {
              paymentId: razorpay_payment_id,
              orderId:   razorpay_order_id,
              amount:    totalAmount,
            },
          })
        } catch (err) {
          // Verification failed — show error, DO NOT clear cart
          setPayError(
            `Payment received but verification failed. ` +
            `Please contact support with Payment ID: ${razorpay_payment_id}`
          )
          setPayLoading(false)
        }
      },

      // ── Modal close / dismiss handler ────────────────────────────────
      modal: {
        ondismiss: () => {
          setPayLoading(false)
          // User closed modal without paying — just restore the button
        },
        // Prevent accidental closes
        confirm_close: true,
        escape:        false,
      },
    }

    // Open the modal
    const rzp = new window.Razorpay(options)

    // Handle payment failures (e.g. card declined) inside the modal
    rzp.on('payment.failed', (response) => {
      setPayError(
        `Payment failed: ${response.error.description || 'Unknown error'}. ` +
        `Code: ${response.error.code}`
      )
      setPayLoading(false)
      rzp.close()
    })

    rzp.open()
    setPayLoading(false) // restore button while modal is open
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
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

      {/* Payment notice */}
      <div className="max-w-2xl mx-auto px-6 mt-5">
        <div className="flex items-start gap-3 bg-gold-100 border-l-4 border-gold-500
                        rounded-xl px-4 py-3.5 shadow-sm">
          <span className="text-gold-600 mt-0.5">⚑</span>
          <p className="text-sm text-ink-700 leading-relaxed">
            We accept all major payment methods including{' '}
            <strong className="text-navy-700">Google Pay, UPI, Cards & Net Banking</strong>.
            Cash on Delivery (COD) is{' '}
            <strong className="text-[#9A4A2E]">not available</strong>.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        /* ── Empty state ─────────────────────────────────────────────────── */
        <div className="max-w-sm mx-auto text-center py-24 px-6">
          <div className="w-20 h-20 rounded-2xl bg-navy-50 flex items-center justify-center
                          text-4xl mx-auto mb-6">
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

          {/* ── Cart items ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-4 bg-white rounded-2xl p-4
                           border border-line-200 shadow-card"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-[72px] h-[72px] rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-900 leading-snug truncate">{product.name}</p>
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
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center
                               text-navy-700 font-bold text-base hover:bg-navy-50 transition-colors"
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

          {/* ── Order summary ──────────────────────────────────────────────── */}
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

            {/* ── Error banner ─────────────────────────────────────────────── */}
            {payError && (
              <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200
                              rounded-xl px-4 py-3 text-sm text-red-700">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{payError}</span>
              </div>
            )}

            {/* ── Payment button ────────────────────────────────────────────── */}
            <button
              onClick={displayRazorpay}
              disabled={payLoading}
              className={[
                'w-full flex items-center justify-center gap-3 font-bold uppercase',
                'tracking-wider py-4 rounded-xl text-sm transition-all duration-200',
                payLoading
                  ? 'bg-gold-300 text-white cursor-not-allowed'
                  : 'bg-gold-500 hover:bg-gold-600 text-white shadow-btn-gold active:scale-[0.98]',
              ].join(' ')}
            >
              {payLoading ? (
                <>
                  {/* Spinner */}
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4"/>
                    <path  className="opacity-75" fill="currentColor"
                           d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
                  </svg>
                  Preparing Payment…
                </>
              ) : (
                <>
                  {/* GPay / lock icon row */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  Pay {formatINR(totalAmount)} · GPay / UPI / Card
                </>
              )}
            </button>

            {/* Payment method logos row */}
            <div className="mt-4 flex items-center justify-center gap-3">
              {/* GPay */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png"
                alt="Google Pay"
                className="h-5 object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
              <span className="text-line-200">·</span>
              <span className="text-[11px] font-medium text-ink-300 tracking-wide">UPI</span>
              <span className="text-line-200">·</span>
              <span className="text-[11px] font-medium text-ink-300 tracking-wide">Cards</span>
              <span className="text-line-200">·</span>
              <span className="text-[11px] font-medium text-ink-300 tracking-wide">Net Banking</span>
            </div>

            <p className="text-xs text-ink-300 text-center mt-2.5">
              🔒 Secured by Razorpay · PCI-DSS compliant
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
