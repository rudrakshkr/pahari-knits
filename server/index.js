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
 *  POST /api/feedback             Save user feedback to DB
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

const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const Razorpay = require('razorpay')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const otpStore = new Map();

// ── Prisma 7 + Standard Postgres Driver ───────────────────────────────────────
// We are using the standard 'pg' pool. It is much more stable for Express 
// apps on local environments than the Neon Serverless edge driver.
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

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
  ['RAZORPAY_KEY_ID', RAZORPAY_KEY_ID],
  ['RAZORPAY_KEY_SECRET', RAZORPAY_KEY_SECRET],
  ['DATABASE_URL', process.env.DATABASE_URL],
  ['JWT_SECRET', JWT_SECRET],
  ['ADMIN_USERNAME', ADMIN_USERNAME],
  ['ADMIN_PASSWORD', ADMIN_PASSWORD],
].filter(([, v]) => !v).map(([k]) => k)

if (missingVars.length) {
  console.error(`\n❌  Missing required env vars: ${missingVars.join(', ')}\n`)
  process.exit(1)
}

// ── Razorpay client (preserved exactly) ──────────────────────────────────────
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
})

// ── Nodemailer transporter ────────────────────────────────────────────────────
let mailer = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  mailer = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    family: 4,
  })
  console.log('✉️  Nodemailer configured to send from:', process.env.EMAIL_USER)
} else {
  console.warn('⚠️  EMAIL_USER or EMAIL_PASS missing in .env. Emails will not be sent.')
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
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
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: '🏔️ PahariKnits API is running securely!' 
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — GET /api/products
// Reads from Neon via Prisma. Supports ?category= filter.
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query
    const products = await prisma.product.findMany({
      where: category ? { category: category.toLowerCase() } : undefined,
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
      where: { category: product.category, NOT: { id: product.id } },
      take: 3,
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
      amount: Math.round(amount * 100),   // paise
      currency: 'INR',
      receipt: `pk_order_${Date.now()}`,
      notes: { source: 'pahariknits-web' },
    })

    console.log(`✅  Order created: ${order.id}  |  ₹${amount}`)
    res.status(201).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (err) {
    console.error('create-order error:', err)
    res.status(500).json({ success: false, error: 'Failed to create Razorpay order.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — POST /api/login
//
// Logs in user by standardizing the phone number and checking the orders table.
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/login', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required.' });
    }

    // 1. Standardize the format to match the database exactly: "+91 XXXXXXXXXX"
    const digitsOnly = phoneNumber.replace(/\D/g, ''); // Remove all non-numbers
    const tenDigitNumber = digitsOnly.slice(-10);      // Grab just the last 10 digits
    const dbFormattedPhone = `+91 ${tenDigitNumber}`;  // Add the exact prefix + space

    // 2. Check if the phone number exists in the orders table
    const order = await prisma.order.findFirst({
      where: { shippingPhone: dbFormattedPhone },
      include: { items: true },
    });

    if (!order) {
      return res.status(401).json({ success: false, error: 'No orders found for this phone number.' });
    }

    // 3. If valid, return all orders associated with it
    const orders = await prisma.order.findMany({
      where: { shippingPhone: dbFormattedPhone },
      include: { items: true },
      orderBy: { createdAt: 'desc' } // Newest orders first
    });

    console.log(`✅  Login successful for: ${dbFormattedPhone}`);
    res.json({ success: true, message: 'Login successful.', orders });

  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — POST /api/returns
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/returns', async (req, res) => {
  try {
    const { orderId, reason, items } = req.body; // 👈 Now accepts 'items'

    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order ID and at least one item are required.' });
    }

    const existingReturn = await prisma.return.findFirst({
      where: { orderId: orderId }
    });

    if (existingReturn) {
      return res.status(409).json({ success: false, error: 'Return already requested for this order.' });
    }

    const returnRequest = await prisma.return.create({
      data: { 
        orderId: orderId,
        reason: reason || 'No reason provided',
        items: items // 👈 Saves the array of selected item IDs to the DB
      },
    });

    console.log(`✅  Return requested for order: ${orderId} | Items: ${items.length}`);
    res.json({ success: true, message: 'Return requested successfully.', return: returnRequest });

  } catch (err) {
    console.error('return error:', err);
    res.status(500).json({ success: false, error: 'Failed to request return.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — GET /api/admin/returns
// Fetches all returns, including the full order details and items.
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/returns', requireAdmin, async (req, res) => {
  try {
    const returns = await prisma.return.findMany({
      include: {
        order: {
          include: { items: true } // Pulls in the products so you know what to expect in the mail
        }
      },
      orderBy: { createdAt: 'desc' } // Newest return requests at the top
    });

    res.json({ success: true, returns });

  } catch (err) {
    console.error('GET /api/admin/returns error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch returns.' });
  };
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — POST /api/admin/returns
// Handles both "Mark Received" and "Mark Refunded" actions.
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/returns', requireAdmin, async (req, res) => {
  try {
    const { id, action } = req.body;
    let dataToUpdate = {};

    if (action === 'receive') {
      dataToUpdate = { receivedAt: new Date(), status: 'RECEIVED' };
      console.log(`📦  Return ${id} marked as received!`);
    } else if (action === 'refund') {
      dataToUpdate = { refundedAt: new Date(), status: 'REFUNDED' };
      console.log(`💸  Return ${id} marked as refunded!`);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action.' });
    }
    
    const updatedReturn = await prisma.return.update({
      where: { id: id },
      data: dataToUpdate,
    })

    res.json({ success: true, return: updatedReturn });

  } catch (err) {
    console.error('POST /api/admin/returns error:', err);
    res.status(500).json({ success: false, error: 'Failed to process return.' });
  };
});


// API endpoint to update the delivery date
app.post('/api/orders/:id/deliver', async (req, res) => {
  const orderId = req.params.id;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { deliveredAt: new Date() },
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    console.log(`✅  Order ${orderId} marked as delivered.`);
    res.json({ success: true, message: 'Order marked as delivered.', order: updatedOrder });

  } catch (err) {
    console.error('deliver error:', err);
    res.status(500).json({ success: false, error: 'Failed to update delivery status.' });
  }
});





// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — GET /api/orders
//
// Fetches orders using the same smart phone number formatting.
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/orders', async (req, res) => {
  try {
    const email = req.query.email;

    if (email) {
      const standardizedEmail = email.toLowerCase().trim();

      const orders = await prisma.order.findMany({
        where: { shippingEmail: standardizedEmail },
        include: { items: true, returnRequest: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, orders });
    } else {
      res.status(400).json({ success: false, error: 'Email is required!' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
});

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
      shipping,
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing verification fields.' })
    }

    // ── HMAC verification (PRESERVED) ────────────────────────────────────
    const generated = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const genBuf = Buffer.from(generated, 'hex')
    const sigBuf = Buffer.from(razorpay_signature, 'hex')
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
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amountINR: Math.round(amount),
            status: 'PAID',

            // ── Shipping ──────────────────────────────
            shippingName: shipping?.name || null,
            shippingPhone: shipping?.phone || null,
            shippingEmail: shipping?.email.toLowerCase() || null,
            shippingStreet: shipping?.street || null,
            shippingCity: shipping?.city || null,
            shippingState: shipping?.state || null,
            shippingPin: shipping?.pin || null,

            items: {
              create: items.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
            },
          },
        })
        console.log(`💾  Order saved to DB: ${razorpay_order_id}`)

        // ── NEW: Send Order Confirmation Email ────────────────────────────
        if (mailer && shipping?.email) {
          try {
            // Generate table rows for the items they bought
            const itemsHtml = items.map(item =>
              `<tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #1A2D50;">${item.name} (x${item.quantity})</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #1A2D50; font-weight: bold;">₹${item.price * item.quantity}</td>
              </tr>`
            ).join('');

            await mailer.sendMail({
              from: `"PahariKnits" <${process.env.EMAIL_USER}>`,
              to: shipping.email.toLowerCase(),
              subject: `Order Confirmed: #${razorpay_payment_id.slice(-8).toUpperCase()}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden;">
                  <div style="background-color: #1A2D50; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; letter-spacing: 1px;">PahariKnits</h1>
                    <p style="color: #B8892E; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Order Confirmed</p>
                  </div>
                  
                  <div style="padding: 30px 20px; background-color: #FFFFFF;">
                    <p style="font-size: 16px; color: #374151; line-height: 1.5; margin-top: 0;">Hi <strong>${shipping.name}</strong>,</p>
                    <p style="font-size: 15px; color: #4B5563; line-height: 1.6;">Thank you for your purchase! We have received your order and are preparing it for shipment from the Himalayas. Here are your details:</p>
                    
                    <div style="background-color: #FBF9F6; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #F3F4F6;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #1A2D50;">${razorpay_order_id}</span></p>
                      <p style="margin: 0; font-size: 14px; color: #6B7280;"><strong>Shipping To:</strong><br/>
                      <span style="color: #1A2D50;">${shipping.street}<br/>
                      ${shipping.city}, ${shipping.state} - ${shipping.pin}</span></p>
                    </div>

                    <h3 style="color: #1A2D50; font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #B8892E; padding-bottom: 8px; display: inline-block;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 16px 8px 8px 8px; font-weight: bold; text-align: right; color: #6B7280;">Total Paid:</td>
                        <td style="padding: 16px 8px 8px 8px; font-weight: bold; text-align: right; color: #B8892E; font-size: 18px;">₹${amount}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                    <p style="margin: 0; font-size: 12px; color: #9CA3AF;">If you have any questions or need to request a return, simply log in to your account or reply to this email.</p>
                  </div>
                </div>
              `
            });
            console.log(`📧  Order receipt sent to ${shipping.email}`);
          } catch (emailErr) {
            console.error('Failed to send order confirmation email:', emailErr);
          }
        }

        // ── NEW: Admin "New Order" Alert ──────────────────────────────────
        if (mailer) {
          try {
            // Use the same logic your friend used for the contact form
            const adminEmail = (process.env.CONTACT_EMAIL || process.env.EMAIL_USER || "").trim();
            
            if (adminEmail) {
              const itemsListText = items.map(i => `${i.quantity}x ${i.name}`).join('\n');
              
              await mailer.sendMail({
                from: `"PahariKnits Alerts" <${process.env.EMAIL_USER}>`,
                to: adminEmail,
                subject: `[New Order] ₹${amount} from ${shipping.name}`,
                text: `You just received a new order!\n\nCustomer: ${shipping.name}\nEmail: ${shipping.email}\nPhone: ${shipping.phone}\nAmount: ₹${amount}\n\nItems:\n${itemsListText}\n\nLog in to your admin panel to view shipping details.`,
                html: `
                  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <div style="background-color: #1A2D50; padding: 24px 32px; border-bottom: 4px solid #10B981;">
                      <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">
                        🛍️ New Order Received
                      </h2>
                      <p style="color: #9CA3AF; margin: 8px 0 0 0; font-size: 14px;">
                        Action required: Ready for fulfillment
                      </p>
                    </div>

                    <div style="padding: 32px;">
                      
                      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Customer Details</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                          <tr>
                            <td style="padding: 4px 0; color: #6B7280; width: 60px;">Name:</td>
                            <td style="padding: 4px 0; color: #111827; font-weight: 600;">${shipping.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #6B7280;">Email:</td>
                            <td style="padding: 4px 0; color: #111827; font-weight: 500;">
                              <a href="mailto:${shipping.email}" style="color: #2563EB; text-decoration: none;">${shipping.email}</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #6B7280;">Phone:</td>
                            <td style="padding: 4px 0; color: #111827; font-weight: 500;">${shipping.phone}</td>
                          </tr>
                        </table>
                      </div>

                      <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        ${items.map(i => `
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #374151; font-size: 14px;">
                              <span style="color: #9CA3AF; font-weight: 600; margin-right: 8px;">${i.quantity}x</span> ${i.name}
                            </td>
                          </tr>
                        `).join('')}
                        <tr>
                          <td style="padding: 16px 0 0 0; font-size: 18px; color: #111827; font-weight: 700; text-align: right;">
                            Total: <span style="color: #10B981;">₹${amount}</span>
                          </td>
                        </tr>
                      </table>

                      <div style="text-align: center; margin-top: 32px;">
                        <a href="https://pahariknits.com/admin" style="display: inline-block; background-color: #B8892E; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">
                          View in Admin Dashboard
                        </a>
                      </div>
                      
                    </div>
                  </div>
                `
              });
              console.log(`🛎️  Admin alert sent to ${adminEmail}`);
            }
          } catch (adminErr) {
            console.error('Failed to send admin order alert:', adminErr);
          }
        }
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
      success: true,
      message: 'Payment verified.',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
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
        from: `"PahariKnits Site" <${sender}>`,
        to: recipientEmail,
        replyTo: email,
        subject: `[PahariKnits Contact] ${topic} — from ${name}`,
        text: `Name:    ${name}\nEmail:   ${email}\nTopic:   ${topic}\n\n${message}`,
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

// ── 1. Route to SEND the OTP ──
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

  // Generate a random 4-digit code (e.g., 4829)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store it in memory for 10 minutes
  otpStore.set(email.toLowerCase(), { 
    otp, 
    expiresAt: Date.now() + 10 * 60 * 1000 
  });

  try {
    // 👈 FIXED: Changed 'transporter' to 'mailer'
    if (!mailer) {
       console.warn('⚠️  Nodemailer is not configured. OTP printed to console instead.');
       console.log(`\n🔑  [DEV MODE] OTP for ${email} is: ${otp}\n`);
       return res.json({ success: true, message: 'OTP generated (Dev Mode)' });
    }

    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your PahariKnits Login Code',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #1A2D50;">PahariKnits Login</h2>
          <p>Your one-time secure login code is:</p>
          <h1 style="font-size: 40px; color: #B8892E; letter-spacing: 4px;">${otp}</h1>
          <p style="color: #666; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `
    });
    res.json({ success: true, message: 'OTP sent!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// ── 2. Route to VERIFY the OTP ──
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email.toLowerCase());

  // Check if it exists, matches, and isn't expired
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  }

  // Success! Delete the OTP so it can't be used again
  otpStore.delete(email.toLowerCase());
  
  // 👈 ADDED: Log the successful verification for your terminal
  console.log(`✅  Email verified: ${email}`);
  
  res.json({ success: true, email });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — GET /api/feedback/check
//
// Checks if feedback already exists for a given product and customer.
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/feedback/check', async (req, res) => {
  try {
    const { productId, customerName } = req.query;

    if (!productId || !customerName) {
      return res.status(400).json({ success: false, error: 'productId and customerName are required.' });
    }

    // Check if the product itself exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      // Use 404 Not Found if the product doesn't exist
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        productId: productId,
      },
    });

    res.json({ success: true, exists: !!existingFeedback });
  } catch (err) {
    console.error('feedback check error:', err);
    res.status(500).json({ success: false, error: 'Failed to check feedback.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC — POST /api/feedback
//
// Saves user feedback (rating + message) to the database.
// Now includes productId and customerName, with a uniqueness check.
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/feedback', async (req, res) => {
  try {
    const { rating, feedback, productId, customerName } = req.body

    // Basic validation
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'A rating between 1 and 5 is required.' })
    }
    if (!productId || !customerName) {
      return res.status(400).json({ success: false, error: 'productId and customerName are required' });
    }
    console.log(`🌟  New Feedback — Rating: ${rating}/5 for product ${productId} by ${customerName}`)

    await prisma.feedback.create({
      data: {
        rating: rating,
        message: feedback || null,
        productId,
        customerName,
      }
    })
    console.log(`💾  Feedback saved to database!`)

    res.status(201).json({ success: true, message: 'Feedback received. Thank you!' })
  } catch (err) {
    // Prisma's P2002 code indicates a unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Feedback for this product already exists.' });
    }
    console.error('feedback error:', err)
    res.status(500).json({ success: false, error: 'Failed to save feedback.' })
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
      badge, inStock, material, dimensions, care, maxQuantity,
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
        badge: badge || null,
        inStock: inStock ?? true,
        material: material || null,
        dimensions: dimensions || null,
        care: care || null,
        maxQuantity: maxQuantity ? Number(maxQuantity) : null,
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
  console.log(`    POST   /api/login`)
  console.log(`    GET    /api/feedback/check      (DB check)`)
  console.log(`    POST   /api/feedback            (DB write)`)
  console.log(`    POST   /api/admin/login         (JWT)`)
  console.log(`    GET    /api/admin/products      (admin)`)
  console.log(`    POST   /api/admin/products      (admin)`)
  console.log(`    DELETE /api/admin/products/:id  (admin)`)
  console.log(`    GET    /api/admin/returns        (admin)`)
  console.log(`    GET    /api/admin/orders        (admin)`)
  console.log(`    DELETE /api/admin/orders/:id    (admin)\n`)
})
