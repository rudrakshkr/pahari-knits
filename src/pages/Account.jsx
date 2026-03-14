import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINR = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
const fmtDate = (isoString) => new Date(isoString).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
});

export default function Account() {
  const { customerPhone, isCustomer, customerLogout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // Local toast state
  const [requestedReturns, setRequestedReturns] = useState(new Set()); // Track returns this session

  // ── Fetch Orders ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isCustomer) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        // Use encodeURIComponent to safely pass the '+' sign in the phone number
        const response = await fetch(`/api/orders?pn=${encodeURIComponent(customerPhone)}`);
        const data = await response.json();

        if (response.ok && data.success) {
          console.log("RAW ORDER DATA:", data.orders);
          // Process return eligibility
          const processedOrders = data.orders.map(order => {
            let returnAllowed = false;
            if (order.deliveredAt) {
              const diffInMs = new Date() - new Date(order.deliveredAt);
              const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
              returnAllowed = diffInDays <= 3;
            }
            return { ...order, returnAllowed };
          });
          setOrders(processedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [customerPhone, isCustomer]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleReturn = async (orderId) => {
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        setRequestedReturns(prev => new Set(prev).add(orderId));
        showToast('Return requested successfully! We will contact you soon.');
      } else {
        showToast('Failed to request return. Please try again.', 'error');
      }
    } catch (error) {
      showToast('An error occurred.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    customerLogout();
    navigate('/login');
  };

  // ── Unauthenticated State ───────────────────────────────────────────────────
  if (!isCustomer && !loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-cream-50 px-6">
        <Helmet><title>Account | PahariKnits</title></Helmet>
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <span className="text-2xl">👤</span>
        </div>
        <h2 className="text-2xl font-bold text-ink-900 mb-2">Account Access</h2>
        <p className="text-ink-400 text-sm mb-6">Please log in to view your orders and account details.</p>
        <Link to="/login" className="bg-navy-700 hover:bg-navy-800 text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-72px)] bg-cream-50 py-10 md:py-16 px-6 relative">
      <Helmet><title>My Account | PahariKnits</title></Helmet>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-slide-down ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-navy-700 text-white'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy-700 tracking-tight mb-2">My Account</h1>
            <p className="text-sm font-medium text-ink-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Logged in as <span className="text-navy-700 font-bold">{customerPhone}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold text-ink-400 uppercase tracking-wider hover:text-red-500 transition-colors py-2 px-4 border border-line-200 rounded-lg bg-white hover:border-red-200"
          >
            Log Out
          </button>
        </div>

        {/* Orders Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-ink-900 border-b border-line-200 pb-3">Order History</h2>

          {loading ? (
            <div className="py-20 flex justify-center">
              <svg className="w-8 h-8 animate-spin text-navy-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
              </svg>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-line-200 rounded-2xl p-10 text-center shadow-sm">
              <p className="text-4xl mb-4">📦</p>
              <h3 className="text-lg font-bold text-ink-900 mb-2">No orders yet</h3>
              <p className="text-sm text-ink-400 mb-6">Looks like you haven't placed any orders with us.</p>
              <Link to="/shop" className="inline-block bg-gold-500 hover:bg-gold-600 text-white text-sm font-bold uppercase tracking-wide px-7 py-3 rounded-xl transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => {
                const hasRequestedReturnLocal = requestedReturns.has(order.id);
                
                return (
                  <div key={order.id} className="bg-white border border-line-200 rounded-2xl shadow-card overflow-hidden transition-all hover:shadow-card-lg">
                    {/* Card Header */}
                    <div className="bg-navy-50/50 border-b border-line-200 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-0.5">Order ID</p>
                        <p className="text-sm font-mono text-navy-700 font-semibold">{order.razorpayOrderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-0.5">Placed On</p>
                        <p className="text-sm font-medium text-ink-900">{fmtDate(order.createdAt)}</p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
                        
                        {/* Items List */}
                        <div className="flex-1">
                          <ul className="space-y-3">
                            {order.items.map((item) => (
                              <li key={item.id} className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">🧣</span>
                                <div>
                                  <p className="text-sm font-bold text-ink-900">{item.name}</p>
                                  <p className="text-xs text-ink-400">Qty: {item.quantity} × {formatINR(item.price)}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Order Summary & Status */}
                        <div className="sm:text-right shrink-0 bg-cream-50 sm:bg-transparent p-4 sm:p-0 rounded-xl">
                          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-navy-700 mb-3">{formatINR(order.amountINR)}</p>
                          
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {order.status}
                          </div>
                        </div>
                      </div>

                      {/* Footer / Delivery & Return */}
                      <div className="pt-5 border-t border-line-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-navy-400 text-lg">🚚</span>
                          <p className="text-sm text-ink-600">
                            {order.deliveredAt ? (
                              <>Delivered on <strong className="text-ink-900">{fmtDate(order.deliveredAt)}</strong></>
                            ) : (
                              <span className="text-amber-600 font-medium">In Transit / Processing</span>
                            )}
                          </p>
                        </div>

                        {/* Return Action */}
                        {order.deliveredAt && (
                          <div className="flex flex-col sm:items-end gap-1.5">
                            <button
                              onClick={() => handleReturn(order.id)}
                              disabled={!order.returnAllowed || hasRequestedReturnLocal}
                              className={[
                                'px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border',
                                !order.returnAllowed || hasRequestedReturnLocal
                                  ? 'bg-cream-50 border-line-200 text-ink-300 cursor-not-allowed'
                                  : 'bg-white border-line-200 text-ink-700 hover:border-navy-400 hover:text-navy-700 shadow-sm'
                              ].join(' ')}
                            >
                              {hasRequestedReturnLocal ? 'Return Requested ✓' : 'Request Return'}
                            </button>
                            
                            {!order.returnAllowed && !hasRequestedReturnLocal && (
                              <p className="text-[10px] text-red-500 font-medium">
                                * Return window closed (3 days)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}