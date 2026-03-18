import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 py-16 px-6">
      <Helmet>
        <title>Refund Policy | PahariKnits</title>
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-line-100">
        <h1 className="text-3xl font-bold text-navy-800 mb-2">Refund & Return Policy</h1>
        <p className="text-sm text-ink-400 mb-8 border-b border-line-100 pb-8">Last updated: {new Date().toLocaleDateString('en-IN')}</p>

        <div className="space-y-8 text-ink-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">1. Return Window</h2>
            <p>
              We stand behind the quality of our handcrafted Himachali apparel. If you are not entirely satisfied with your purchase, you may request a return within <strong>3 days</strong> of the delivery date. After 3 days, we are unfortunately unable to offer you a refund or exchange.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">2. Eligibility for Returns</h2>
            <p className="mb-2">To be eligible for a return, your item must meet the following conditions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>It must be unused and in the same condition that you received it.</li>
              <li>It must have all original tags attached.</li>
              <li>It must be in the original packaging.</li>
            </ul>
            <p className="mt-2 text-xs italic text-ink-400">Note: Because our items are hand-woven, slight variations in pattern or color are natural characteristics of the craft and are not considered defects.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">3. How to Initiate a Return</h2>
            <p>
              To initiate a return, log into your <strong>My Account</strong> dashboard. Navigate to your order history, select the eligible order, and click "Request Return." You will be asked to select the specific items and provide a brief reason for the return.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">4. The Refund Process</h2>
            <p className="mb-2">Once your return request is submitted and the physical item is received at our facility, the process is as follows:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>Inspection:</strong> We will inspect the item to ensure it meets our return criteria.</li>
              <li><strong>Approval:</strong> Your return status in your account will update to "Processing Refund."</li>
              <li><strong>Issuance:</strong> We will initiate the refund via our payment gateway (Razorpay) to your original method of payment.</li>
            </ol>
            <p className="mt-3">
              <strong>Processing Time:</strong> Please allow <strong>5-7 business days</strong> for the refunded amount to reflect in your bank account or credit card statement after the refund is issued.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">5. Non-Refundable Items</h2>
            <p>
              Gift cards, sale items marked as "Final Sale," and worn/washed apparel are strictly non-refundable. 
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy-800 mb-3">6. Contact Us</h2>
            <p>
              If you have any questions concerning our return policy, please visit our <a href="/contact" className="text-gold-600 hover:underline">Contact Page</a> and our team will be happy to assist you.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}