import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  // Scroll to top when the page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 py-16 px-6 sm:px-12">
      <Helmet>
        <title>Privacy Policy | PahariKnits</title>
      </Helmet>

      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-card border border-line-100">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-navy-800 mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-ink-400 text-sm">Last updated: March 2026</p>
        </div>

        <div className="space-y-8 text-navy-900 leading-relaxed text-sm md:text-base">
          
          <section>
            <h2 className="text-xl font-bold text-navy-800 mb-3 border-b border-line-100 pb-2">1. Introduction</h2>
            <p className="text-ink-400">
              Welcome to PahariKnits. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-navy-800 mb-3 border-b border-line-100 pb-2">2. The Data We Collect</h2>
            <p className="text-ink-400 mb-3">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-5 space-y-2 text-ink-400">
              <li><strong>Identity & Contact Data:</strong> Includes first name, last name, email address (used for secure OTP login), delivery address, and telephone number.</li>
              <li><strong>Financial Data:</strong> We do not store your credit card or payment details on our servers. All payments are securely processed via Razorpay.</li>
              <li><strong>Transaction Data:</strong> Details about payments to and from you and other details of products you have purchased from us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-navy-800 mb-3 border-b border-line-100 pb-2">3. How We Use Your Data</h2>
            <p className="text-ink-400 mb-3">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 text-ink-400">
              <li>To process and deliver your order, manage payments, and handle returns.</li>
              <li>To securely authenticate your account using Email One-Time Passwords (OTPs).</li>
              <li>To communicate with you about your order status or respond to your contact form inquiries.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-navy-800 mb-3 border-b border-line-100 pb-2">4. Data Security</h2>
            <p className="text-ink-400">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. Access to your personal data is limited to those employees and third parties (like Razorpay and our shipping partners) who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-navy-800 mb-3 border-b border-line-100 pb-2">5. Governing Law</h2>
            <p className="text-ink-400">
              This Privacy Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with this policy shall be subject to the exclusive jurisdiction of the courts in Himachal Pradesh, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-navy-800 mb-3 border-b border-line-100 pb-2">6. Contact Us</h2>
            <p className="text-ink-400">
              If you have any questions about this privacy policy or our privacy practices, please contact us via our <Link to="/contact" className="text-gold-500 hover:text-gold-600 font-bold underline decoration-2 underline-offset-2">Contact Page</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}