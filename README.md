# PahariKnits 🏔️🧣

PahariKnits is a full-stack, direct-to-consumer (D2C) e-commerce platform built to sell authentic, handcrafted Himalayan apparel. Engineered for performance and security, the application features a robust two-tiered authentication system, cart-aware inventory management, and a comprehensive admin dashboard for handling catalog updates, order fulfillment, and strict reverse logistics.

## ✨ Key Features

### Customer Experience
* **Modern Storefront:** Fully responsive UI built with React and Tailwind CSS, featuring active/archived product views and dynamic category filtering.
* **Frictionless Checkout:** Passwordless Email OTP authentication reduces friction during the buying process, tightly integrated with the Razorpay API for live payment processing.
* **Customer Dashboard:** A dedicated account portal where users can track order statuses (Paid, In Transit, Delivered) and manage their purchase history.
* **Transparent Return Pipeline:** Customers can initiate returns within a 3-day delivery window. The UI strictly enforces and communicates business policies, including mandatory unboxing video verification and automated ₹40 reverse logistics fee deductions. Return rejections display real-time admin reasoning directly on the user's dashboard.

### Admin Dashboard (CMS)
* **Secure Access:** JWT-authenticated protected routes ensure only verified administrators can access the store's backend.
* **Real-Time Analytics:** High-level overview of total revenue, active orders, pending returns, and active catalog size.
* **Catalog Management:** Create, edit, and archive products. Supports rich data including multiple image URLs, badge assignments (e.g., "Bestseller"), dimensions, and material care instructions.
* **Order Fulfillment:** Track Razorpay payment verification, view itemized receipts, and mark orders as delivered.
* **Reverse Logistics Engine:** A multi-step return management system allowing admins to process physical item receipts, issue Razorpay refunds, or formally reject fraudulent return requests with custom feedback.

## 🛠️ Tech Stack

* **Frontend:** React, React Router, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (hosted on Neon)
* **ORM:** Prisma
* **Authentication:** JSON Web Tokens (JWT) for Admin, Passwordless Email OTP for Customers
* **Payments:** Razorpay API

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed and a PostgreSQL database set up.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pahariknits.git
   cd pahariknits
   ```

2. **Install dependencies:**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in your root directory and add the following keys:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

   # Security
   JWT_SECRET="your_super_secret_jwt_key"

   # Razorpay
   RAZORPAY_KEY_ID="your_razorpay_key_id"
   RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

   # Email
   SMTP_HOST="your_smtp_host"
   SMTP_PORT=587
   SMTP_USER="your_email@domain.com"
   SMTP_PASS="your_email_password"
   ```

4. **Initialize the Database:**
   Push the Prisma schema to your PostgreSQL database.
   ```bash
   npx prisma db push
   ```

5. **Run the Application:**
   ```bash
   # Start the backend server
   npm run server

   # Start the React frontend
   npm run client
   ```

## 🗄️ Database Schema Highlights

The application relies on a highly relational PostgreSQL schema managed by Prisma:
* **`Product`**: Tracks inventory (`inStock`, `maxQuantity`), pricing, categories, and dynamic image arrays.
* **`Order` & `OrderItem`**: Stores Razorpay transaction IDs, shipping details, itemized carts, and delivery timestamps.
* **`Return`**: Manages the reverse logistics lifecycle with timestamps for `receivedAt`, `refundedAt`, and `rejectedAt` alongside custom `rejectionReason` tracking.

## 📄 License

This project is proprietary and built specifically for PahariKnits. All rights reserved.
