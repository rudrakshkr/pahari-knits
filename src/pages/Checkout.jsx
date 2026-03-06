/**
 * Checkout.jsx — PahariKnits
 *
 * Layout: shipping form (left) + order summary (right)
 *
 * All Razorpay logic is moved here verbatim from Cart.jsx:
 *   POST /api/create-order  →  open modal  →  POST /api/verify-payment
 * Nothing in the backend changes.
 *
 * Guard: if cart is empty, redirects straight to /shop.
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatINR } from '../data/products'

// ── Razorpay theme (unchanged from Cart.jsx) ──────────────────────────────────
const RAZORPAY_THEME = {
  color:            '#B35938',
  color_background: '#FBF9F6',
  color_text:       '#FBF9F6',
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script    = document.createElement('script')
    script.id       = 'razorpay-script'
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async    = true
    script.onload   = () => resolve(true)
    script.onerror  = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ── Shared input class ────────────────────────────────────────────────────────
const INPUT = `w-full bg-white border border-line-200 shadow-sm rounded-xl px-4 py-3.5
  text-base text-ink-900 placeholder-ink-300
  focus:outline-none focus:ring-4 focus:ring-navy-400/10 focus:border-navy-400 transition-all`

const LABEL = `block text-[13px] font-bold text-ink-900 uppercase tracking-wide mb-2`

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalItems, totalAmount, clearCart } = useCart()

  // ── Shipping state & Validation ───────────────────────────────────────────
  const [shipping, setShipping] = useState({
    name: '', phone: '', street: '', city: '', state: '', pin: '',
  })
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')

  const setField = (field) => (e) => {
    let value = e.target.value;
    if (field === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
    setShipping(prev => ({ ...prev, [field]: value }))
  }

  // Dedicated handler for PIN to trigger the API fetch
  const handlePinChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setShipping(prev => ({ ...prev, pin: value }));

    if (value.length === 6) {
      setPinLoading(true);
      setPinError('');
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();
        
        if (data[0].Status === 'Success') {
          const location = data[0].PostOffice[0];
          setShipping(prev => ({
            ...prev,
            city: location.District, // Accurately maps to the district/city
            state: location.State
          }));
        } else {
          setPinError('Invalid PIN Code');
          setShipping(prev => ({ ...prev, city: '', state: '' })); // Clear on invalid
        }
      } catch (err) {
        setPinError('Could not verify PIN');
      } finally {
        setPinLoading(false);
      }
    } else {
      // If they backspace, clear the auto-filled data and errors
      setPinError('');
      if (shipping.city || shipping.state) {
        setShipping(prev => ({ ...prev, city: '', state: '' }));
      }
    }
  }

  // Button only activates if all rules are met AND there are no PIN errors
  const shippingComplete = 
    shipping.name.trim().length >= 2 &&
    shipping.phone.length === 10 &&
    shipping.street.trim().length >= 4 &&
    shipping.city.trim().length >= 2 &&
    shipping.state.trim().length >= 2 &&
    shipping.pin.length === 6 &&
    !pinError;

  // ── Payment state ─────────────────────────────────────────────────────────
  const [payLoading, setPayLoading] = useState(false)
  const [payError,   setPayError  ] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // ── Guard: empty cart ─────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-sm mx-auto text-center py-24 px-6">
        <p className="text-5xl mb-4">🧣</p>
        <h2 className="text-xl font-bold text-ink-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-ink-400 mb-8">Add some pieces before checking out.</p>
        <Link to="/shop"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600
                         text-white text-sm font-bold uppercase tracking-wide
                         px-7 py-3.5 rounded-xl shadow-btn-gold transition-colors">
          Browse the Shop
        </Link>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // displayRazorpay — moved verbatim from Cart.jsx, shipping added to
  // the verify-payment body. API calls are unchanged.
  // ══════════════════════════════════════════════════════════════════════════
  const displayRazorpay = async () => {
    setPayError(null)
    setPayLoading(true)

    // Step 1: load SDK
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      setPayError('Could not load payment gateway. Please check your internet connection.')
      setPayLoading(false)
      return
    }

    // Step 2: create Razorpay order
    let orderData
    try {
      const res = await fetch('/api/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: totalAmount }),
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

    // Step 3: open modal
    const options = {
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'PahariKnits',
      description: `${totalItems} handcrafted ${totalItems === 1 ? 'item' : 'items'} from the Himalayas`,
      image:       '/logo.png',
      order_id:    orderData.order_id,
      prefetch:    true,
      method:      { upi: true, card: true, netbanking: true, wallet: true, emi: false },
      remember_customer: true,
      theme:       RAZORPAY_THEME,
      prefill: {
        name:    shipping.name,
        contact: shipping.phone,
      },
      notes: {
        items:      items.map(i => i.product.name).join(', '),
        item_count: totalItems,
        ship_to:    `${shipping.street}, ${shipping.city}, ${shipping.state} — ${shipping.pin}`,
      },

      handler: async function (response) {
        setIsVerifying(true);

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              amount:   totalAmount,
              shipping: { ...shipping, phone: `+91 ${shipping.phone}` },
              items: items.map(({ product, quantity }) => ({
                id:       product.id,
                name:     product.name,
                price:    product.price,
                quantity,
              })),
            }),
          })

          const verifyData = await verifyRes.json()
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Verification failed')
          }

          clearCart()
          navigate('/success', {
            state: {
              paymentId: razorpay_payment_id,
              orderId:   razorpay_order_id,
              amount:    totalAmount,
            },
          })
        } catch (err) {
            setIsVerifying(false);
          setPayError(
            `Payment received but verification failed. ` +
            `Please contact support with Payment ID: ${razorpay_payment_id}`
          )
          setPayLoading(false)
        }
      },

      modal: {
        ondismiss:     () => setPayLoading(false),
        confirm_close: true,
        escape:        false,
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      setPayError(
        `Payment failed: ${response.error.description || 'Unknown error'}. ` +
        `Code: ${response.error.code}`
      )
      setPayLoading(false)
      rzp.close()
    })
    rzp.open()
    setPayLoading(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isVerifying) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
        <div className="relative w-20 h-20 mb-8">
          {/* Faint background circle */}
          <div className="absolute inset-0 border-4 border-line-200 rounded-full"></div>
          {/* Spinning navy circle */}
          <div className="absolute inset-0 border-4 border-navy-700 rounded-full border-t-transparent animate-spin"></div>
          {/* Inner lock icon (optional premium touch) */}
          <div className="absolute inset-0 flex items-center justify-center text-navy-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-ink-900 mb-3 tracking-tight">
          Verifying Payment
        </h2>
        <p className="text-ink-500 text-center max-w-md text-sm leading-relaxed">
          Please don't close this window or click back. We are securely confirming your transaction with the bank.
        </p>
      </div>
    )
  }
  return (
    <div>
      {/* Page header */}
      <div className="bg-white border-b border-line-200 shadow-[0_2px_8px_rgba(26,36,56,0.05)]">
        <div className="max-w-content mx-auto px-6 py-7">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-ink-400 mb-3">
            <Link to="/cart" className="hover:text-navy-700 transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-ink-700 font-medium">Checkout</span>
          </div>
          <p className="text-[11px] font-semibold text-teal-500 tracking-[0.22em] uppercase mb-1.5">
            Final Step
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 tracking-tight">
            Checkout
          </h1>
        </div>
      </div>

      <div className="max-w-content mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">

          {/* ══════════════════════════════════════════
              LEFT — Shipping form
          ══════════════════════════════════════════ */}
          <div className="flex-1 w-full">
            <div className="bg-white rounded-2xl border border-line-200 shadow-card p-6 md:p-8">

              {/* Section header */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center
                                text-white text-xs font-bold shrink-0">
                  1
                </div>
                <h2 className="text-base font-bold text-ink-900">Shipping Information</h2>
              </div>

              <div className="flex flex-col gap-7">
                {/* Name + Phone */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className={LABEL}>Full Name <span className="text-gold-500">*</span></label>
                    <input value={shipping.name} onChange={setField('name')}
                           placeholder="Priya Sharma" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Phone Number <span className="text-gold-500">*</span></label>
                    {/* Upgraded unified input wrapper */}
                    <div className="flex items-center w-full bg-white border border-line-200 shadow-sm rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-navy-400/10 focus-within:border-navy-400 transition-all">
                      <span className="pl-4 pr-3 py-3.5 text-base font-bold text-ink-500 bg-cream-50 border-r border-line-200 select-none">
                        +91
                      </span>
                      <input 
                        value={shipping.phone} 
                        onChange={setField('phone')}
                        placeholder="9876543210" 
                        type="tel" 
                        inputMode="numeric" 
                        className="flex-1 bg-transparent px-3 py-3.5 text-base text-ink-900 placeholder-ink-300 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Street */}
                <div>
                  <label className={LABEL}>Street Address <span className="text-gold-500">*</span></label>
                  <input value={shipping.street} onChange={setField('street')}
                         placeholder="12, Mall Road, Near Bus Stand" className={INPUT} />
                </div>

                {/* City + State + PIN */}
                <div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className={LABEL}>PIN Code <span className="text-gold-500">*</span></label>
                      <div className="relative">
                        <input 
                          value={shipping.pin} 
                          onChange={handlePinChange}
                          placeholder="175131" 
                          inputMode="numeric" 
                          className={`${INPUT} ${pinError ? 'border-red-400 focus:ring-red-400/10' : ''}`} 
                        />
                        {/* Loading spinner inside the input */}
                        {pinLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-navy-400 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* City (Auto-filled) */}
                    <div>
                      <label className={LABEL}>City <span className="text-gold-500">*</span></label>
                      <input 
                        value={shipping.city} 
                        readOnly
                        placeholder="Auto-filled" 
                        className={`${INPUT} bg-cream-50 text-ink-500 cursor-not-allowed focus:ring-0 focus:border-line-200`} 
                      />
                    </div>
                    
                    {/* State (Auto-filled) */}
                    <div>
                      <label className={LABEL}>State <span className="text-gold-500">*</span></label>
                      <input 
                        value={shipping.state} 
                        readOnly
                        placeholder="Auto-filled" 
                        className={`${INPUT} bg-cream-50 text-ink-500 cursor-not-allowed focus:ring-0 focus:border-line-200`} 
                      />
                    </div>
                  </div>
                  
                  {/* Error Message underneath the grid */}
                  {pinError && (
                    <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
                      <span>⚠️</span> {pinError}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment notice */}
              <div className="flex items-start gap-3 bg-gold-100 border-l-4 border-gold-500
                              rounded-xl px-4 py-3.5 mt-7">
                <span className="text-gold-600 mt-0.5 shrink-0">⚑</span>
                <p className="text-sm text-ink-700 leading-relaxed">
                  We accept{' '}
                  <strong className="text-navy-700">Google Pay, UPI, Cards & Net Banking</strong>.
                  COD is <strong className="text-[#9A4A2E]">not available</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              RIGHT — Order summary + Pay button
          ══════════════════════════════════════════ */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white rounded-2xl border border-line-200 shadow-card p-6 sticky top-24">

              {/* Section header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center
                                text-white text-xs font-bold shrink-0">
                  2
                </div>
                <h2 className="text-base font-bold text-ink-900">Order Summary</h2>
              </div>

              {/* Items list */}
              <div className="flex flex-col gap-3 mb-5">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <img src={product.imageUrl} alt={product.name}
                         className="w-12 h-12 rounded-xl object-cover shrink-0
                                    border border-line-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{product.name}</p>
                      <p className="text-xs text-ink-400">Qty {quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-navy-700 shrink-0">
                      {formatINR(product.price * quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2.5 border-t border-line-200 pt-4 mb-4">
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

              {/* Error */}
              {payError && (
                <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200
                                rounded-xl px-4 py-3 text-sm text-red-700">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{payError}</span>
                </div>
              )}

              {/* Incomplete shipping warning */}
              {!shippingComplete && (
                <p className="text-xs text-ink-400 text-center mb-3">
                  Please fill out all fields correctly (10-digit phone, 6-digit PIN).
                </p>
              )}

              {/* Pay button */}
              <button
                onClick={displayRazorpay}
                disabled={payLoading || !shippingComplete}
                className={[
                  'w-full flex items-center justify-center gap-3 font-bold uppercase',
                  'tracking-wider py-4 rounded-xl text-sm transition-all duration-200',
                  payLoading || !shippingComplete
                    ? 'bg-gold-300 text-white cursor-not-allowed'
                    : 'bg-gold-500 hover:bg-gold-600 text-white shadow-btn-gold active:scale-[0.98]',
                ].join(' ')}
              >
                {payLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
                    </svg>
                    Preparing Payment…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    Pay {formatINR(totalAmount)} · GPay / UPI / Card
                  </>
                )}
              </button>

              {/* Payment logos */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png"
                  alt="Google Pay"
                  className="h-5 object-contain opacity-60"
                />
                <span className="text-line-200">·</span>
                <span className="text-[11px] font-medium text-ink-300">UPI</span>
                <span className="text-line-200">·</span>
                <span className="text-[11px] font-medium text-ink-300">Cards</span>
                <span className="text-line-200">·</span>
                <span className="text-[11px] font-medium text-ink-300">Net Banking</span>
              </div>
              <p className="text-xs text-ink-300 text-center mt-2.5">
                🔒 Secured by Razorpay · PCI-DSS compliant
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}