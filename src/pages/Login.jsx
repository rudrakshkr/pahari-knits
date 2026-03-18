import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { customerLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/account';

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setStep(2); 
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (data.success) {
        customerLogin(email);
        navigate(from, { replace: true });
      } else {
        setError(data.error || 'Invalid or expired OTP.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-cream-50 px-6 py-16">
      <Helmet>
        <title>Login | PahariKnits</title>
      </Helmet>

      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-card border border-line-100 relative overflow-hidden">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <img src="/logo.png" alt="PahariKnits" className="w-14 h-14 rounded-2xl mx-auto shadow-sm" />
          </Link>
          <h1 className="text-2xl font-bold text-navy-800 tracking-tight">
            {step === 1 ? 'Welcome Back' : 'Verify Your Email'}
          </h1>
          <p className="text-sm text-ink-400 mt-2">
            {step === 1 
              ? 'Enter your email to receive a secure login code.' 
              : <>We sent a 4-digit code to <strong className="text-navy-700">{email}</strong></>
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-ink-400 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-line-200 rounded-xl px-4 py-3.5 text-sm text-navy-900 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all bg-cream-50/30"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-800 hover:bg-navy-900 text-white py-4 rounded-xl font-bold text-sm shadow-btn transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-7 animate-fade-in">
            
            {/* ── UPGRADED MOBILE OTP INPUT ── */}
            <div className="max-w-[240px] mx-auto">
              <label className="block text-xs font-bold text-ink-400 uppercase tracking-widest mb-3 text-center">
                Enter 4-Digit Code
              </label>
              <input
                type="text"
                inputMode="numeric" // 👈 Triggers mobile number pad!
                pattern="[0-9]*"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                placeholder="••••"
                className="w-full border border-line-200 rounded-2xl px-2 py-4 text-3xl sm:text-4xl font-mono text-center tracking-[0.5em] sm:tracking-[0.8em] text-navy-900 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all bg-cream-50/50 placeholder:text-ink-200"
                required
                autoFocus
                style={{ paddingLeft: otp ? '0.5em' : '0' }} // Keeps text perfectly centered despite letter-spacing
              />
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading || otp.length !== 4}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white py-4 rounded-xl font-bold text-sm shadow-btn-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Verify & Login'}
              </button>
              
              <button 
                type="button" 
                onClick={() => { setStep(1); setOtp(''); setError(null); }}
                className="w-full py-3 text-xs font-bold text-ink-400 hover:text-navy-700 transition-colors"
              >
                Wait, I need to change my email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}