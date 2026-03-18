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
  const { customerEmail, isCustomer, customerLogout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [returnModal, setReturnModal] = useState({ 
    isOpen: false, 
    order: null, 
    reason: '', 
    selectedItems: [],
    step: 'form' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch Orders ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isCustomer) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        // Changed pn= to email=
        const response = await fetch(`/api/orders?email=${encodeURIComponent(customerEmail)}`);
        const data = await response.json();

        if (response.ok && data.success) {
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
  }, [customerEmail, isCustomer]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openReturnModal = (order) => {
    setReturnModal({ isOpen: true, order: order, reason: '', selectedItems: [], step: 'form' });
  };

  const closeReturnModal = () => {
    setReturnModal({ isOpen: false, order: null, reason: '', selectedItems: [], step: 'form' });
  };

  const proceedToConfirm = () => {
    if (returnModal.selectedItems.length === 0) {
      showToast('Please select at least one item to return.', 'error');
      return;
    }
    if (!returnModal.reason.trim()) {
      showToast('Please provide a reason for the return.', 'error');
      return;
    }
    setReturnModal(prev => ({ ...prev, step: 'confirm' }));
  };

  const handleItemToggle = (itemId) => {
    setReturnModal(prev => {
      const isSelected = prev.selectedItems.includes(itemId);
      return {
        ...prev,
        selectedItems: isSelected 
          ? prev.selectedItems.filter(id => id !== itemId) 
          : [...prev.selectedItems, itemId]
      };
    });
  };

  const confirmReturn = async () => {
    if (returnModal.selectedItems.length === 0 || !returnModal.reason.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: returnModal.order.id, 
          reason: returnModal.reason,
          items: returnModal.selectedItems
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === returnModal.order.id 
              ? { ...order, returnRequest: { receivedAt: null, items: returnModal.selectedItems } } 
              : order
          )
        );
        showToast('Return requested successfully!');
        closeReturnModal();
      } else {
        showToast(data.error || 'Failed to request return.', 'error');
      }
    } catch (error) {
      showToast('An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
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
        <div className={`fixed top-24 left-0 right-0 mx-auto w-max z-[100] px-6 py-3 rounded-full shadow-lg text-sm font-bold flex items-center justify-center gap-2 animate-slide-down ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-navy-700 text-white'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.message}
        </div>
      )}

      {/* Return Reason Modal Overlay */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-line-100">
            {returnModal.step === 'form' ? (
              /* ── STEP 1: SELECTION FORM ── */
              <>
                <div className="px-6 py-5 border-b border-line-100 flex justify-between items-center bg-white">
                  <h3 className="text-xl font-bold text-navy-800">Return Request</h3>
                  <button onClick={closeReturnModal} className="text-ink-300 hover:text-red-500 transition-colors text-xl">✕</button>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-4">1. Select items to return</p>
                  <div className="space-y-2 mb-6 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {returnModal.order?.items?.map(item => (
                      <label key={item.id} className={`flex items-start gap-3 p-3 border rounded-2xl cursor-pointer transition-all ${returnModal.selectedItems.includes(item.id) ? 'border-gold-400 bg-gold-50/30' : 'border-line-100 hover:border-line-300'}`}>
                        <input type="checkbox" className="mt-1 w-4 h-4 text-gold-500 rounded border-line-200 focus:ring-gold-500" checked={returnModal.selectedItems.includes(item.id)} onChange={() => handleItemToggle(item.id)} />
                        <div>
                          <p className="text-sm font-bold text-navy-900">{item.name}</p>
                          <p className="text-[11px] text-ink-400 font-medium">Qty: {item.quantity} × {formatINR(item.price)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">2. Reason</p>
                    <p className={`text-[10px] font-bold ${returnModal.reason.length >= 200 ? 'text-red-500' : 'text-ink-300'}`}>{returnModal.reason.length}/200</p>
                  </div>
                  <textarea className="w-full border border-line-100 bg-cream-50/30 rounded-2xl p-4 text-sm text-navy-900 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 min-h-[90px] resize-none transition-all placeholder:text-ink-200" placeholder="Why are you returning these?" value={returnModal.reason} maxLength={200} onChange={(e) => setReturnModal(prev => ({ ...prev, reason: e.target.value }))}></textarea>
                </div>
                <div className="px-6 py-5 bg-cream-50/50 flex justify-end gap-3">
                  <button onClick={closeReturnModal} className="px-6 py-2.5 text-sm font-bold text-ink-400 hover:text-navy-700 transition-colors">Cancel</button>
                  <button onClick={proceedToConfirm} className="bg-navy-800 hover:bg-navy-900 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-navy-800/20 transition-all active:scale-95">Continue</button>
                </div>
              </>
            ) : (
              /* ── STEP 2: BEAUTIFUL CONFIRMATION ── */
              <div className="p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-bounce-short">⚠️</div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">Final Confirmation</h3>
                <p className="text-ink-500 text-sm leading-relaxed mb-8">
                  You are requesting a return for <span className="text-navy-800 font-bold">{returnModal.selectedItems.length} item(s)</span>. <br/>
                  This action <span className="text-red-500 font-bold underline decoration-2 underline-offset-4">cannot be undone</span> once submitted.
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={confirmReturn} disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    {isSubmitting ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : 'Yes, Request Return'}
                  </button>
                  <button onClick={() => setReturnModal(prev => ({ ...prev, step: 'form' }))} disabled={isSubmitting} className="w-full py-3 text-sm font-bold text-ink-400 hover:text-navy-800 transition-colors">
                    Wait, go back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Page UI remains unchanged */}
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy-700 tracking-tight mb-2">My Account</h1>
            <p className="text-sm font-medium text-ink-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Logged in as <span className="text-navy-700 font-bold">{customerEmail}</span>
            </p>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-ink-400 uppercase tracking-wider hover:text-red-500 transition-colors py-2 px-4 border border-line-200 rounded-lg bg-white hover:border-red-200">
            Log Out
          </button>
        </div>

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
                return (
                  <div key={order.id} className="bg-white border border-line-200 rounded-2xl shadow-card overflow-hidden transition-all hover:shadow-card-lg">
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

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
                        <div className="flex-1">
                          <ul className="space-y-3">
                            {order.items.map((item) => {
                              const isReturned = order.returnRequest?.items?.includes(item.id);
                              const isRefunded = isReturned && order.returnRequest?.refundedAt;
                              const isReceived = isReturned && order.returnRequest?.receivedAt && !order.returnRequest?.refundedAt;
                              const isPending = isReturned && !order.returnRequest?.receivedAt;

                              return (
                                <li key={item.id} className="flex items-start gap-3">
                                  <span className={`text-lg mt-0.5 ${isReturned ? 'opacity-50 grayscale' : ''}`}>🧣</span>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className={`text-sm font-bold ${isReturned ? 'text-ink-500' : 'text-ink-900'}`}>
                                        {item.name}
                                      </p>
                                      {isRefunded && <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-emerald-200">Refunded</span>}
                                      {isReceived && <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-blue-200">Processing Refund</span>}
                                      {isPending && <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-amber-200">Returning</span>}
                                    </div>
                                    <p className={`text-xs mt-0.5 ${isReturned ? 'text-ink-300 line-through' : 'text-ink-400'}`}>
                                      Qty: {item.quantity} × {formatINR(item.price)}
                                    </p>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        <div className="sm:text-right shrink-0 bg-cream-50 sm:bg-transparent p-4 sm:p-0 rounded-xl">
                          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-navy-700 mb-3">{formatINR(order.amountINR)}</p>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {order.status}
                          </div>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-line-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-navy-400 text-lg">🚚</span>
                          <p className="text-sm text-ink-600">
                            {order.deliveredAt ? <>Delivered on <strong className="text-ink-900">{fmtDate(order.deliveredAt)}</strong></> : <span className="text-amber-600 font-medium">In Transit / Processing</span>}
                          </p>
                        </div>

                        {order.deliveredAt && (
                          <div className="flex flex-col sm:items-end gap-1.5 mt-4 sm:mt-0">
                            {order.returnRequest ? (
                              order.returnRequest.refundedAt ? (
                                <div className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">Refund Issued ✓</div>
                              ) : order.returnRequest.receivedAt ? (
                                <div className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">Item Received (Processing Refund)</div>
                              ) : (
                                <div className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">Return Pending...</div>
                              )
                            ) : (
                              <>
                                <button
                                  onClick={() => openReturnModal(order)}
                                  disabled={!order.returnAllowed}
                                  className={[
                                    'px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border',
                                    !order.returnAllowed ? 'bg-cream-50 border-line-200 text-ink-300 cursor-not-allowed' : 'bg-white border-line-200 text-ink-700 hover:border-navy-400 hover:text-navy-700 shadow-sm'
                                  ].join(' ')}
                                >
                                  Request Return
                                </button>
                                {!order.returnAllowed && <p className="text-[10px] text-red-500 font-medium">* Return window closed (3 days)</p>}
                              </>
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