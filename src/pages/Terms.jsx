import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
  return (
    <div className="min-h-screen bg-cream-50 py-16 px-6">
      <Helmet>
        <title>Terms & Conditions | PahariKnits</title>
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-line-100">
        <h1 className="text-3xl font-bold text-navy-800 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-ink-400 mb-8 border-b border-line-100 pb-8">Last updated: {new Date().toLocaleDateString('en-IN')}</p>

        <div className="space-y-8 text-ink-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">1. Introduction</h2>
            <p>
              Welcome to PahariKnits. These Terms and Conditions govern your use of our website and the purchase of our products. By accessing or using our website, you agree to be bound by these Terms. If you do not agree with any part of these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">2. Handmade Product Disclaimer</h2>
            <p>
              Our products are authentically handcrafted by artisans in Himachal Pradesh. Because each item is hand-woven, slight variations in design, color, and size may occur. These are not flaws, but rather the unique signature of the artisan. Images on our website are for illustrative purposes, and the actual product may vary slightly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">3. Pricing and Payments</h2>
            <p>
              All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to change prices at any time without notice. We use Razorpay as our secure payment gateway. By proceeding with a purchase, you agree to Razorpay's terms of service. We do not store your credit card details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">4. Shipping & Delivery</h2>
            <p>
              We strive to dispatch orders promptly. Estimated delivery times are provided for guidance only and are not guaranteed. PahariKnits is not responsible for delays caused by courier partners or unforeseen weather conditions in the Himalayan region.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">5. User Accounts</h2>
            <p>
              To use certain features of the site, you may be required to register using your phone number (via OTP). You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">6. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, images, and software, is the property of PahariKnits and is protected by Indian copyright laws. You may not reproduce, distribute, or create derivative works without our explicit written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Himachal Pradesh, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}