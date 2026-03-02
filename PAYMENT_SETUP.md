# PahariKnits — Razorpay Payment Integration Setup

## Quick start (5 steps)

### 1. Get your Razorpay credentials

1. Sign up / log in at https://dashboard.razorpay.com
2. Go to **Settings → API Keys**
3. Click **Generate Test Key** (for development)
4. Copy your `Key ID` and `Key Secret`

---

### 2. Create your `.env` file

Copy the example and fill in your real keys:

```bash
cp .env.example .env
```

Edit `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_actual_secret_here
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX   # same key, prefix VITE_ for browser
```

> ⚠️  **KEY_SECRET must NEVER go in any VITE_ variable.**
> Vite bundles `VITE_*` vars into the browser JS — anyone can read them.
> The secret is only ever used server-side in `server/index.js`.

---

### 3. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

---

### 4. Run both servers

Open two terminal tabs:

```bash
# Terminal 1 — Express backend (port 5000)
cd server && npm run dev

# Terminal 2 — Vite frontend (port 5173)
npm run dev
```

Vite proxies `/api/*` → `localhost:5000` automatically (see `vite.config.js`).

---

### 5. Test a payment

1. Open http://localhost:5173
2. Add items to cart → click **Pay ₹X · GPay / UPI / Card**
3. Use Razorpay test credentials:
   - **Card:** `4111 1111 1111 1111`  · Any future date · CVV `123`
   - **UPI / GPay:** `success@razorpay`
   - **Net Banking:** Any bank → **Success**
4. After success you should land on `/success` with your Payment ID

---

## How the verification works

```
Browser                     Your Server              Razorpay
──────                     ────────────             ────────
Add to cart
Click "Pay"
  │
  ├── POST /api/create-order ──────────────────────────► creates order
  │   ◄── { order_id, amount, currency } ──────────────
  │
  ├── Razorpay modal opens
  │   User pays via GPay / card
  │   Modal calls handler(response)
  │     response = { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  │
  ├── POST /api/verify-payment ──►
  │      HMAC-SHA256(order_id|payment_id, KEY_SECRET)
  │      compare with razorpay_signature
  │      ◄── { success: true }
  │
Navigate to /success
```

The HMAC signature check is the security gate. Without it, a malicious user
could fake a successful payment by calling your backend directly.

---

## Going live

1. Complete Razorpay KYC at https://dashboard.razorpay.com/app/kyc
2. Generate **Live** keys (start with `rzp_live_`)
3. Replace test keys in your production `.env`
4. Set `FRONTEND_ORIGIN` to your actual domain
5. The code requires zero changes — it works identically with live keys
