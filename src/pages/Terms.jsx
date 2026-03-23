import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
    useEffect(() => {
        window.scrollTo(0, 0);
      }, []);
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

          {/* ── NEW SECTION: RETURNS & LOGISTICS ── */}
          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">5. Returns, Refunds & Cancellations</h2>
            <div className="space-y-4">
              <p>
                We stand by the quality of our Himalayan handlooms. However, to protect our artisans and business from fraudulent claims, we enforce a strict verification policy for all return requests.
              </p>
              
              <div>
                <h3 className="font-bold text-navy-800 mb-2">Mandatory Unboxing Video</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>An uncut, continuous unboxing video must be recorded when opening the original sealed package.</li>
                  <li>This video must be submitted to our support team via WhatsApp at <strong>+91 [YOUR NUMBER]</strong> within 48 hours of delivery.</li>
                  <li>Upon successful verification of the product's condition in the video, the return will be initiated.</li>
                  <li><strong>If a valid unboxing video is not provided, the return request will be permanently rejected.</strong></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-navy-800 mb-2">Reverse Logistics Fee</h3>
                <p>
                  For all authorized returns, a flat reverse logistics fee of <strong>₹40</strong> will be deducted from the final refund amount. This fee helps cover a portion of the courier charges required to safely transport the garment back to our facility.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">6. User Accounts</h2>
            <p>
              To use certain features of the site, you may be required to register using your email (via OTP). You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">7. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, images, and software, is the property of PahariKnits and is protected by Indian copyright laws. You may not reproduce, distribute, or create derivative works without our explicit written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">8. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Himachal Pradesh, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}