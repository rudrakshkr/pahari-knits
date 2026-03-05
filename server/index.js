/**
 * PahariKnits — Express backend
 *
 * Public routes
 * ─────────────
 *  GET  /api/health
 *  GET  /api/products             ?category=
 *  GET  /api/products/:id
 *  POST /api/create-order         Razorpay — unchanged
 *  POST /api/verify-payment       Razorpay HMAC + Prisma order write
 *  POST /api/contact              Nodemailer dual-write (DB + email)
 *
 * Admin routes  (require Bearer JWT)
 * ─────────────
 *  POST   /api/admin/login
 *  GET    /api/admin/products
 *  POST   /api/admin/products
 *  DELETE /api/admin/products/:id
 *  GET    /api/admin/orders
 *  DELETE /api/admin/orders/:id
 */

'use strict'
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express    = require('express')
const cors       = require('cors')
const crypto     = require('crypto')
const Razorpay   = require('razorpay')
const jwt        = require('jsonwebtoken')
const nodemailer = require('nodemailer')

// ── Prisma 7 + Standard Postgres Driver ───────────────────────────────────────
// We are using the standard 'pg' pool. It is much more stable for Express 
// apps on local environments than the Neon Serverless edge driver.
const { PrismaClient } = require('@prisma/client')
const { PrismaPg }     = require('@prisma/adapter-pg')
const { Pool }         = require('pg')

console.log("DEBUG: Connection String is:", process.env.DATABASE_URL ? "FOUND" : "MISSING");

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not defined in .env")
  process.exit(1)
}

// Initialize standard Postgres connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Validate required env vars ────────────────────────────────────────────────
const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  JWT_SECRET,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} = process.env

const missingVars = [
  ['RAZORPAY_KEY_ID',    RAZORPAY_KEY_ID],
  ['RAZORPAY_KEY_SECRET',RAZORPAY_KEY_SECRET],
  ['DATABASE_URL',       process.env.DATABASE_URL],
  ['JWT_SECRET',         JWT_SECRET],
  ['ADMIN_USERNAME',     ADMIN_USERNAME],
  ['ADMIN_PASSWORD',     ADMIN_PASSWORD],
].filter(([, v]) => !v).map(([k]) => k)

if (missingVars.length) {
  console.error(`\n❌  Missing required env vars: ${missingVars.join(', ')}\n`)
  process.exit(1)
}

// ── Razorpay client (preserved exactly) ──────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
})

// ── Nodemailer transporter ────────────────────────────────────────────────────
let mailer = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  mailer = nodemailer.createTransport({
    service: 'gmail', // This handles the host/port automatically for Gmail
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  console.log('✉️  Nodemailer configured to send from:', process.env.EMAIL_USER)
} else {
  console.warn('⚠️  EMAIL_USER or EMAIL_PASS missing in .env. Emails will not be sent.')
}

// ── Express app ───────────────────────────────────────────────────────────────
const app  = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors({
  origin:  process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  // Allow the Authorization header so admin JWT calls work cross-origin
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Helper: normalise Prisma product to the shape the frontend expects ────────
// Adds `imageUrl` alias (images[0]) so Shop, ProductDetail, Cart all work
// without any change — they already read product.imageUrl.
function normaliseProduct(p) {
  return { ...p, imageUrl: p.images[0] ?? null }
}

// ══════════════════════════════════════════════════════════════════════════════
// JWT ADMIN MIDDLEWARE
//
// Verifies Bearer token from Authorization header.
// Attach to any route that should be admin-only.
// ══════════════════════════════════════════════════════════════════════════════
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or malformed Authorization header.' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.admin = payload   // { username, role, iat, exp }
    next()
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token.'
    return res.status(401).json({ success: false, error: msg })
  }
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const count = await prisma.product.count().catch(() => -1)
  res.json({ status: 'ok', service: 'PahariKnits API', dbProducts: count })
})

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — GET /api/products
// Reads from Neon via Prisma. Supports ?category= filter.
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query
    const products = await prisma.product.findMany({
      where:   category ? { category: category.toLowerCase() } : undefined,
      orderBy: { createdAt: 'asc' },
    })
    res.json({ success: true, count: products.length, products: products.map(normaliseProduct) })
  } catch (err) {
    console.error('GET /api/products error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch products.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — GET /api/products/:id
// Returns full product + related (same category, excl. self).
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      return res.status(404).json({ success: false, error: `Product "${req.params.id}" not found.` })
    }

    const related = await prisma.product.findMany({
      where:   { category: product.category, NOT: { id: product.id } },
      take:    3,
      orderBy: { createdAt: 'asc' },
    })

    res.json({
      success: true,
      product: normaliseProduct(product),
      related: related.map(normaliseProduct),
    })
  } catch (err) {
    console.error('GET /api/products/:id error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch product.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — POST /api/create-order  (Razorpay — PRESERVED EXACTLY)
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount } = req.body
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be a positive number (INR)' })
    }

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),   // paise
      currency: 'INR',
      receipt:  `pk_order_${Date.now()}`,
      notes:    { source: 'pahariknits-web' },
    })

    console.log(`✅  Order created: ${order.id}  |  ₹${amount}`)
    res.status(201).json({
      success:   true,
      order_id:  order.id,
      amount:    order.amount,
      currency:  order.currency,
    })
  } catch (err) {
    console.error('create-order error:', err)
    res.status(500).json({ success: false, error: 'Failed to create Razorpay order.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — POST /api/verify-payment
//
// PRESERVED Razorpay HMAC verification.
// ADDED: persists verified order to Neon via Prisma.
//
// Body: {
//   razorpay_order_id, razorpay_payment_id, razorpay_signature,
//   amount,   ← total in INR (added by frontend for DB write)
//   items,    ← [{ id, name, price, quantity }] (added by frontend)
// }
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      items,
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing verification fields.' })
    }

    // ── HMAC verification (PRESERVED) ────────────────────────────────────
    const generated = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const genBuf   = Buffer.from(generated,           'hex')
    const sigBuf   = Buffer.from(razorpay_signature,  'hex')
    const sigMatch = genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf)

    if (!sigMatch) {
      console.warn(`⚠️  Signature mismatch for order ${razorpay_order_id}`)
      return res.status(400).json({ success: false, error: 'Payment signature verification failed.' })
    }

    console.log(`✅  Payment verified: ${razorpay_payment_id}`)

    // ── Persist order to Neon ─────────────────────────────────────────────
    // Only runs after signature is confirmed — payment is genuine.
    if (amount && Array.isArray(items) && items.length > 0) {
      try {
        await prisma.order.create({
          data: {
            razorpayOrderId:   razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amountINR:         Math.round(amount),
            status:            'PAID',
            items: {
              create: items.map(item => ({
                productId: item.id,
                name:      item.name,
                price:     item.price,
                quantity:  item.quantity,
              })),
            },
          },
        })
        console.log(`💾  Order saved to DB: ${razorpay_order_id}`)
      } catch (dbErr) {
        // DB write failure does NOT fail the response — payment already succeeded.
        // Log the error; you can reconcile manually from the Razorpay dashboard.
        console.error('DB order write failed (payment still valid):', dbErr.message)
      }
    } else {
      // ADD THIS:
      console.log("❌ DB Save Skipped! Missing data:", { 
        hasAmount: !!amount, 
        hasItems: !!items, 
        itemsLength: items?.length 
      });
    }

    res.status(200).json({
      success:    true,
      message:    'Payment verified.',
      payment_id: razorpay_payment_id,
      order_id:   razorpay_order_id,
    })
  } catch (err) {
    console.error('verify-payment error:', err)
    res.status(500).json({ success: false, error: 'Verification error. Contact support.' })
  }
})
// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — POST /api/contact
//
// Dual-write: saves ContactMessage to DB + sends email via Nodemailer.
// If SMTP is not configured, still returns 200 (form works, email is skipped).
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, topic, message } = req.body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, error: 'name, email, and message are required.' })
    }

    console.log(`📬  Contact form — ${name} <${email}> [${topic}]`)

    // ── 1. SAVE TO DATABASE (This was missing!) ──────────────────────────
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        topic: topic || 'Other',
        message
      }
    })
    console.log(`💾  Contact message saved to database!`)

    // ── 2. Send email if SMTP is configured ──────────────────────────────
    if (mailer) {
      const sender = (process.env.EMAIL_USER || "").trim()
      const recipientEmail = (process.env.CONTACT_EMAIL || "").trim() || sender

      await mailer.sendMail({
        from:    `"PahariKnits Site" <${sender}>`,
        to:      recipientEmail,
        replyTo: email,
        subject: `[PahariKnits Contact] ${topic} — from ${name}`,
        text:    `Name:    ${name}\nEmail:   ${email}\nTopic:   ${topic}\n\n${message}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#1D3461">New contact message</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:4px 8px;color:#666">Name</td><td style="padding:4px 8px"><strong>${name}</strong></td></tr>
              <tr><td style="padding:4px 8px;color:#666">Email</td><td style="padding:4px 8px"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:4px 8px;color:#666">Topic</td><td style="padding:4px 8px">${topic}</td></tr>
            </table>
            <div style="margin-top:16px;padding:16px;background:#F7F5F1;border-radius:8px">
              <p style="margin:0;white-space:pre-wrap">${message}</p>
            </div>
          </div>
        `,
      })
      console.log(`📧  Contact email sent to ${recipientEmail}`)
    }

    res.status(200).json({ success: true, message: 'Message received. We will reply within 24 hours.' })
  } catch (err) {
    console.error('contact error:', err)
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — POST /api/admin/login
//
// Credentials are stored purely in .env (ADMIN_USERNAME, ADMIN_PASSWORD).
// No DB lookup — keeps attack surface minimal.
// Returns a JWT valid for 8 hours.
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body

  const cleanUser = (ADMIN_USERNAME || "").trim();
  const cleanPass = (ADMIN_PASSWORD || "").trim();

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'username and password are required.' })
  }

  if (username.length !== cleanUser.length || password.length !== cleanPass.length) {
    return res.status(401).json({ success: false, error: 'Invalid credentials.' })
  }

  // ── Constant-time comparison to prevent user enumeration ─────────────────
  const userMatch = crypto.timingSafeEqual(
    Buffer.from(username),
    Buffer.from(cleanUser)
  )
  const passMatch = crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(cleanPass)
  )

  if (!userMatch || !passMatch) {
    console.warn(`⚠️  Failed admin login attempt for username: "${username}"`)
    // Deliberately vague — don't reveal whether username or password was wrong
    return res.status(401).json({ success: false, error: 'Invalid credentials.' })
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  console.log(`🔑  Admin login: ${username}`)
  res.json({ success: true, token })
})

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — GET /api/admin/products
// Returns all products with full detail (no related query needed here).
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } })
    res.json({ success: true, products: products.map(normaliseProduct) })
  } catch (err) {
    console.error('admin GET products error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch products.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — POST /api/admin/products
//
// Body: { name, price, category, origin, description, images, badge?,
//         inStock?, material?, dimensions?, care? }
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const {
      name, price, category, origin, description, images,
      badge, inStock, material, dimensions, care,
    } = req.body

    // Minimal validation
    const required = { name, price, category, origin, description }
    const missing = Object.entries(required)
      .filter(([, v]) => !v && v !== 0)
      .map(([k]) => k)

    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` })
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: 'images must be a non-empty array of URLs.' })
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ success: false, error: 'price must be a positive number (INR).' })
    }

    const product = await prisma.product.create({
      data: {
        name, price: Math.round(price), category: category.toLowerCase(),
        origin, description, images,
        badge:      badge      || null,
        inStock:    inStock    ?? true,
        material:   material   || null,
        dimensions: dimensions || null,
        care:       care       || null,
      },
    })

    console.log(`➕  Product added: ${product.id} — ${product.name}`)
    res.status(201).json({ success: true, product: normaliseProduct(product) })
  } catch (err) {
    console.error('admin POST product error:', err)
    res.status(500).json({ success: false, error: 'Failed to create product.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — DELETE /api/admin/products/:id
//
// Cannot delete a product that is referenced in existing orders (Prisma will
// throw P2003 foreign key violation — caught and returned as a 409).
// ══════════════════════════════════════════════════════════════════════════════
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    console.log(`🗑️   Product deleted: ${req.params.id}`)
    res.json({ success: true, deletedId: req.params.id })
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete: this product is referenced in existing orders. Archive it (set inStock=false) instead.',
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Product not found.' })
    }
    console.error('admin DELETE product error:', err)
    res.status(500).json({ success: false, error: 'Failed to delete product.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — GET /api/admin/orders
// Returns all orders with their items, newest first.
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, orders })
  } catch (err) {
    console.error('admin GET orders error:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — DELETE /api/admin/orders/:id
// Deletes the order and its items (Cascade defined in schema).
// ══════════════════════════════════════════════════════════════════════════════
app.delete('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } })
    console.log(`🗑️   Order deleted: ${req.params.id}`)
    res.json({ success: true, deletedId: req.params.id })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Order not found.' })
    }
    console.error('admin DELETE order error:', err)
    res.status(500).json({ success: false, error: 'Failed to delete order.' })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  PahariKnits API  →  http://localhost:${PORT}`)
  console.log(`    GET    /api/products`)
  console.log(`    GET    /api/products/:id`)
  console.log(`    POST   /api/create-order        (Razorpay)`)
  console.log(`    POST   /api/verify-payment      (Razorpay + DB write)`)
  console.log(`    POST   /api/contact             (Nodemailer)`)
  console.log(`    POST   /api/admin/login         (JWT)`)
  console.log(`    GET    /api/admin/products      (admin)`)
  console.log(`    POST   /api/admin/products      (admin)`)
  console.log(`    DELETE /api/admin/products/:id  (admin)`)
  console.log(`    GET    /api/admin/orders        (admin)`)
  console.log(`    DELETE /api/admin/orders/:id    (admin)\n`)
})
