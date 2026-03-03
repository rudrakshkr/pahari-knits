/**
 * PahariKnits — Express backend
 *
 * Routes
 * ──────
 *  GET  /api/products         →  all products (catalogue)
 *  GET  /api/products/:id     →  single product by id
 *  POST /api/create-order     →  create Razorpay order
 *  POST /api/verify-payment   →  verify Razorpay HMAC signature
 */

'use strict'

const express  = require('express')
const cors     = require('cors')
const crypto   = require('crypto')
const Razorpay = require('razorpay')
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { PrismaPg }     = require('@prisma/adapter-pg')
const { Pool }         = require('pg')

// Setup Database Connection for Prisma 7
const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

// ── Validate env ──────────────────────────────────────────────────────────────
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('\n❌  Missing Razorpay credentials in .env\n')
  process.exit(1)
}

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })

const app  = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors({
  origin:  process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST'],
}))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PahariKnits API' }) // Removed PRODUCTS.length
})

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/products
//
// Returns all products. Supports optional ?category= filter.
// e.g. GET /api/products?category=shawl
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query
    const results = await prisma.product.findMany({
      where: category ? { category: category.toLowerCase() } : {}
    })
    res.json({ success: true, count: results.length, products: results })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database fetch failed' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/products/:id
//
// Returns a single product's full details including the images array.
// Also returns `related` — up to 3 products from the same category.
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    })

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }

    const related = await prisma.product.findMany({
      where: { 
        category: product.category,
        id: { not: product.id } 
      },
      take: 3
    })

    res.json({ success: true, product, related })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database error' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/create-order
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be a positive number (INR)' })
    }

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  `pk_order_${Date.now()}`,
      notes:    { source: 'pahariknits-web' },
    })

    console.log(`✅  Order created: ${order.id}  |  ₹${amount}`)
    res.status(201).json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency })
  } catch (err) {
    console.error('create-order error:', err)
    res.status(500).json({ success: false, error: 'Failed to create Razorpay order.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/verify-payment
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing verification fields.' })
    }

    const generated = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const genBuf    = Buffer.from(generated,          'hex')
    const sigBuf    = Buffer.from(razorpay_signature,  'hex')
    const sigMatch  = genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf)

    if (!sigMatch) {
      console.warn(`⚠️  Signature mismatch for order ${razorpay_order_id}`)
      return res.status(400).json({ success: false, error: 'Payment signature verification failed.' })
    }

    // --- ADD THIS PRISMA 7 LOGIC HERE ---
    try {
      await prisma.order.create({
        data: {
          amount: req.body.amount || 0, // Pass amount from frontend to save it
          status: 'PAID',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        }
      })
      console.log(`📡 Database updated: Order ${razorpay_order_id} marked as PAID`)
    } catch (dbErr) {
      console.error('❌ Database Save Error:', dbErr)
      // We don't necessarily want to fail the request if the payment was successful 
      // but the DB log failed, but you should log it for manual reconciliation.
    }
    // -------------------------------------

    console.log(`✅  Payment verified: ${razorpay_payment_id}`)
    res.status(200).json({ success: true, message: 'Payment verified.', payment_id: razorpay_payment_id, order_id: razorpay_order_id })
  } catch (err) {
    console.error('verify-payment error:', err)
    res.status(500).json({ success: false, error: 'Verification error. Contact support.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/contact
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, topic, message } = req.body
    await prisma.contactMessage.create({
      data: { name, email, topic, message }
    })
    res.status(201).json({ success: true, message: 'Message saved!' })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save message' })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  PahariKnits API  →  http://localhost:${PORT}`)
  console.log(`    GET  /api/products`)
  console.log(`    GET  /api/products/:id`)
  console.log(`    POST /api/create-order`)
  console.log(`    POST /api/verify-payment\n`)
})
