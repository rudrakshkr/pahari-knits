/**
 * PahariKnits — Express + Razorpay payment server
 *
 * Endpoints
 * ─────────
 *  POST /api/create-order    →  creates a Razorpay order
 *  POST /api/verify-payment  →  verifies the HMAC signature after payment
 *
 * Run:
 *   cd server && npm install && npm run dev
 */

'use strict'

const express   = require('express')
const cors      = require('cors')
const crypto    = require('crypto')          // Node built-in — no install needed
const Razorpay  = require('razorpay')
require('dotenv').config({ path: '../.env' }) // load root-level .env

// ── Validate env vars early so the server fails fast ─────────────────────────
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error(
    '\n❌  Missing Razorpay credentials.\n' +
    '    Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.\n'
  )
  process.exit(1)
}

// ── Razorpay client ───────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
})

// ── Express app ───────────────────────────────────────────────────────────────
const app  = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors({
  // In production replace '*' with your actual frontend origin
  // e.g. 'https://pahariknits.com'
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST'],
}))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PahariKnits Payment API' })
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/create-order
//
// Body:   { amount: number }   ← amount in INR (e.g. 2499)
// Returns: { order_id, amount, currency }
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body

    // ── Input validation ──────────────────────────────────────────────────
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number (in INR)',
      })
    }

    // Razorpay requires amount in the smallest currency unit (paise for INR)
    // ₹2,499  →  249900 paise
    const amountInPaise = Math.round(amount * 100)

    // ── Create order with Razorpay ────────────────────────────────────────
    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      // receipt: a short identifier you can use to look up the order later
      receipt:  `pk_order_${Date.now()}`,
      // partial_payment: false  (default — full amount required)
      notes: {
        source:  'pahariknits-web',
        version: '1.0',
      },
    })

    console.log(`✅  Order created: ${order.id}  |  ₹${amount}`)

    return res.status(201).json({
      success:   true,
      order_id:  order.id,
      amount:    order.amount,      // returned in paise
      currency:  order.currency,    // 'INR'
    })
  } catch (err) {
    console.error('create-order error:', err)
    return res.status(500).json({
      success: false,
      error:   'Failed to create Razorpay order. Please try again.',
    })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/verify-payment
//
// Body: {
//   razorpay_order_id:   string,
//   razorpay_payment_id: string,
//   razorpay_signature:  string,
// }
//
// How Razorpay signature verification works:
//   1. Concatenate  razorpay_order_id + "|" + razorpay_payment_id
//   2. HMAC-SHA256 the result using your KEY_SECRET as the key
//   3. Compare the hex digest to razorpay_signature
//   4. If they match → payment is genuine
//
// Returns: { success: true, message: "Payment verified" }
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body

    // ── Validate presence ─────────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error:   'Missing required payment verification fields.',
      })
    }

    // ── Reconstruct the expected signature ────────────────────────────────
    //
    //  Razorpay signs:   "<order_id>|<payment_id>"
    //  using HMAC-SHA256 keyed with your KEY_SECRET
    //
    const body      = razorpay_order_id + '|' + razorpay_payment_id
    const generated = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    // ── Constant-time comparison to prevent timing attacks ─────────────────
    //  crypto.timingSafeEqual requires same-length Buffers
    const genBuf = Buffer.from(generated,           'hex')
    const sigBuf = Buffer.from(razorpay_signature,   'hex')

    // Lengths differ → definitely not equal (but don't leak via timing)
    const lengthMatch = genBuf.length === sigBuf.length
    const sigMatch    = lengthMatch && crypto.timingSafeEqual(genBuf, sigBuf)

    if (!sigMatch) {
      console.warn(`⚠️  Signature mismatch for order ${razorpay_order_id}`)
      return res.status(400).json({
        success: false,
        error:   'Payment signature verification failed. This request may be tampered.',
      })
    }

    // ── Signature is valid — payment is genuine ────────────────────────────
    console.log(`✅  Payment verified: ${razorpay_payment_id}  (order: ${razorpay_order_id})`)

    // TODO: persist the order to your database here
    // e.g. await db.orders.create({ orderId, paymentId, amount, status: 'paid' })

    return res.status(200).json({
      success:    true,
      message:    'Payment verified successfully.',
      payment_id: razorpay_payment_id,
      order_id:   razorpay_order_id,
    })
  } catch (err) {
    console.error('verify-payment error:', err)
    return res.status(500).json({
      success: false,
      error:   'Verification error. Please contact support.',
    })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  PahariKnits Payment API running on http://localhost:${PORT}`)
  console.log(`    POST /api/create-order`)
  console.log(`    POST /api/verify-payment\n`)
})
