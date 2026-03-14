import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Cookies from 'js-cookie';
import { Helmet } from 'react-helmet-async';

// ── Shared UI Constants ───────────────────────────────────────────────────────
const INPUT = `flex-1 bg-transparent px-3 py-3.5 text-base text-ink-900 
  placeholder-ink-300 focus:outline-none`;

const LABEL = `block text-[13px] font-bold text-ink-900 uppercase tracking-wide mb-2`;

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Improved validation: strip non-digits and check length
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter a valid phone number with at least 10 digits.');
      return;
    }

    setLoading(true);

    try {
      // Format dynamically based on your backend needs
      const formattedPhoneNumber = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${digitsOnly}`; // Defaulting to India if no '+' is provided

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Cookies.set('phoneNumber', formattedPhoneNumber, { expires: 3 });
        login(formattedPhoneNumber);
        navigate('/account');
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-cream-50 px-6 py-12">
      <Helmet>
        <title>Login | PahariKnits</title>
      </Helmet>

      <div className="w-full max-w-md bg-white border border-line-200 rounded-3xl shadow-card p-8 sm:p-10 opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-navy-50 text-navy-700 rounded-2xl mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-ink-400">
            Enter your phone number to access your account and track your orders.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phoneNumber" className={LABEL}>
              Phone Number
            </label>
            <div className="flex items-center w-full bg-white border border-line-200 shadow-sm rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-navy-400/10 focus-within:border-navy-400 transition-all">
              <span className="pl-4 pr-3 py-3.5 text-base font-bold text-ink-400 bg-cream-50 border-r border-line-200 select-none">
                📞
              </span>
              <input 
                type="tel" 
                id="phoneNumber" 
                className={INPUT} 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                placeholder="+91 98765 43210" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={[
              'w-full flex items-center justify-center gap-3 font-bold uppercase tracking-wider py-4 rounded-xl text-sm transition-all duration-200',
              loading 
                ? 'bg-gold-300 text-white cursor-not-allowed' 
                : 'bg-gold-500 hover:bg-gold-600 text-white shadow-btn-gold active:scale-[0.98]'
            ].join(' ')}
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
                </svg>
                Sending...
              </>
            ) : (
              'Continue securely'
            )}
          </button>
        </form>

        <p className="text-xs text-ink-400 text-center mt-6">
          By continuing, you agree to PahariKnits' <Link to="/terms" className="text-navy-700 font-medium hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-navy-700 font-medium hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}