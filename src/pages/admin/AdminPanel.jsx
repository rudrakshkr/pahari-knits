/**
 * AdminPanel.jsx — PahariKnits Admin Dashboard
 * Optimized for Desktop and Mobile Layouts (Responsive Card & Table Views)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Helmet } from 'react-helmet-async'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatINR(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const BADGE_OPTIONS = ['', 'Bestseller', 'New Arrival', 'Artisan Pick', 'Limited Edition']
const CATEGORY_OPTIONS = ['shawl', 'muffler', 'socks', 'cap', 'stole']

// ── Reusable components ───────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-[#1A2D50] border border-white/8 rounded-2xl px-4 sm:px-5 py-4">
      <p className="text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

function Badge({ text }) {
  const colours = {
    'Bestseller': 'bg-amber-500/20 text-amber-400',
    'New Arrival': 'bg-teal-500/20 text-teal-400',
    'Artisan Pick': 'bg-blue-500/20 text-blue-400',
    'Limited Edition': 'bg-rose-500/20 text-rose-400',
  }
  if (!text) return <span className="text-white/20 text-xs">—</span>
  return (
    <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${colours[text] ?? 'bg-white/10 text-white/60'}`}>
      {text}
    </span>
  )
}

function StatusChip({ status }) {
  const map = {
    PAID: 'bg-emerald-500/20 text-emerald-400',
    refunded: 'bg-amber-500/20 text-amber-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${map[status] ?? 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  )
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin text-white/40 mx-auto" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z" />
    </svg>
  )
}

// ── Add/Edit Product modal ────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', price: '', category: 'shawl', origin: '', description: '',
  images: '', badge: '', inStock: true, material: '', dimensions: '', care: '', maxQuantity: '',
}

function ProductFormModal({ token, onClose, onSaved, initialData = null }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(
    initialData
      ? { ...initialData, images: initialData.images?.join(', ') || '', badge: initialData.badge || '', maxQuantity: initialData.maxQuantity || '' }
      : EMPTY_FORM
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const imagesArr = form.images.split(',').map(s => s.trim()).filter(Boolean)
    if (imagesArr.length === 0) {
      setError('Please enter at least one image URL.')
      setLoading(false)
      return
    }

    const url = isEdit ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          maxQuantity: form.maxQuantity ? Number(form.maxQuantity) : null,
          images: imagesArr,
          badge: form.badge || null,
          inStock: form.inStock,
          material: form.material || null,
          dimensions: form.dimensions || null,
          care: form.care || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save product')
      onSaved(data.product, isEdit)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#B8892E]/60 transition-colors'
  const LABEL = 'block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#152648] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="font-bold text-white text-base sm:text-lg">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              ⚠ {error}
            </div>
          )}
          <form onSubmit={handleSubmit} id="product-form" className="space-y-4 sm:space-y-5">
            <div>
              <label className={LABEL}>Name *</label>
              <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Kullu Valley Shawl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Price (₹) *</label>
                <input className={INPUT} type="number" min="1" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="2499" />
              </div>
              <div>
                <label className={LABEL}>Max Order Quantity</label>
                <input className={INPUT} type="number" min="1" value={form.maxQuantity} onChange={e => set('maxQuantity', e.target.value)} placeholder="e.g., 10" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Category *</label>
                <select className={INPUT + ' cursor-pointer'} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Badge</label>
                <select className={INPUT + ' cursor-pointer bg-navy-900 text-white'} value={form.badge} onChange={e => set('badge', e.target.value)}>
                  {BADGE_OPTIONS.map(b => <option key={b} value={b} className="bg-navy-900 text-white">{b || '(none)'}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Origin *</label>
              <input className={INPUT} value={form.origin} onChange={e => set('origin', e.target.value)} required placeholder="Kullu, Himachal Pradesh" />
            </div>
            <div>
              <label className={LABEL}>Description *</label>
              <textarea className={INPUT + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} required placeholder="A detailed description of the product..." />
            </div>
            <div>
              <label className={LABEL}>Image URLs * (comma-separated)</label>
              <textarea className={INPUT + ' resize-none'} rows={2} value={form.images} onChange={e => set('images', e.target.value)} placeholder="https://images.unsplash.com/..., https://..." />
              <p className="text-[10px] sm:text-xs text-white/25 mt-1">First URL = primary image shown in Shop & Cart</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Material</label>
                <input className={INPUT} value={form.material} onChange={e => set('material', e.target.value)} placeholder="Pure Himalayan wool..." />
              </div>
              <div>
                <label className={LABEL}>Dimensions</label>
                <input className={INPUT} value={form.dimensions} onChange={e => set('dimensions', e.target.value)} placeholder="200 cm × 100 cm" />
              </div>
            </div>
            <div>
              <label className={LABEL}>Care Instructions</label>
              <input className={INPUT} value={form.care} onChange={e => set('care', e.target.value)} placeholder="Hand wash in cold water..." />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => set('inStock', !form.inStock)} className={`w-11 h-6 rounded-full transition-all duration-200 border relative flex items-center ${form.inStock ? 'bg-emerald-500 border-emerald-400' : 'bg-white/5 border-white/20'}`}>
                <span className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${form.inStock ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-white/70">{form.inStock ? 'In Stock' : 'Out of Stock (Archives product from shop)'}</span>
            </div>
          </form>
        </div>

        <div className="px-5 py-4 border-t border-white/8 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70 transition-colors">Cancel</button>
          <button type="submit" form="product-form" disabled={loading} className={['px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide', 'transition-colors flex items-center gap-2', loading ? 'bg-[#B8892E]/40 text-white/40 cursor-not-allowed' : 'bg-[#B8892E] hover:bg-[#9A7020] text-white'].join(' ')}>
            {loading ? <><Spinner /> Saving…</> : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation ───────────────────────────────────────────────────────
function ConfirmDeleteModal({ label, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#152648] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <p className="text-3xl text-center mb-4">🗑️</p>
        <h3 className="text-base font-bold text-white text-center mb-2">Delete this {label}?</h3>
        <p className="text-sm text-white/40 text-center mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white/50 hover:text-white/70 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2">
            {loading ? <Spinner /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main AdminPanel component
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  
  const [loadingP, setLoadingP] = useState(true)
  const [loadingO, setLoadingO] = useState(false)
  const [loadingR, setLoadingR] = useState(false)
  
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  const [deleteTarget, setDelTarget] = useState(null)
  const [delLoading, setDelLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [deliverLoading, setDeliverLoading] = useState(false);

  const authFetch = useCallback((url, opts = {}) =>
    fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
    }), [token])

  const fetchProducts = useCallback(async () => {
    setLoadingP(true)
    try {
      const res = await authFetch('/api/admin/products')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProducts(data.products)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoadingP(false)
    }
  }, [authFetch])

  const fetchOrders = useCallback(async () => {
    setLoadingO(true)
    try {
      const res = await authFetch('/api/admin/orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrders(data.orders)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoadingO(false)
    }
  }, [authFetch])

  const fetchReturns = useCallback(async () => {
    setLoadingR(true)
    try {
      const res = await authFetch('/api/admin/returns')
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)
      setReturns(data.returns)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoadingR(false)
    }
  }, [authFetch]);

  useEffect(() => {
    fetchProducts()
    fetchOrders()
    fetchReturns()
  }, [fetchProducts, fetchOrders, fetchReturns])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDelLoading(true)
    setApiError(null)

    const url = deleteTarget.type === 'product'
      ? `/api/admin/products/${deleteTarget.id}`
      : `/api/admin/orders/${deleteTarget.id}`

    try {
      const res = await authFetch(url, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error)

      if (deleteTarget.type === 'product') {
        setProducts(ps => ps.filter(p => p.id !== deleteTarget.id))
      } else {
        setOrders(os => os.filter(o => o.id !== deleteTarget.id))
      }
      setDelTarget(null)
    } catch (err) {
      setApiError(err.message)
      setDelTarget(null)
    } finally {
      setDelLoading(false)
    }
  }

  const handleDeliver = async (orderId) => {
    setDeliverLoading(true);
    try {
      const res = await authFetch(`/api/orders/${orderId}/deliver`, { method: 'POST' });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveredAt: new Date().toISOString() } : o));
      } else {
        setApiError('Failed to mark as delivered');
      }
    } finally {
      setDeliverLoading(false);
    }
  }

  const markReceived = async (id) => {
    if (!window.confirm('Have you physically received this item back?')) return;
    try {
      const res = await authFetch('/api/admin/returns', {
        method: 'POST',
        body: JSON.stringify({ id, action: 'receive' }),
      });
      if (res.ok) {
        setReturns(prev => prev.map(r => r.id === id ? { ...r, receivedAt: new Date().toISOString(), status: 'RECEIVED' } : r));
      } else {
        setApiError('Failed to mark as received');
      }
    } catch (error) { setApiError('An error occurred.'); }
  }

  const markRefunded = async (id) => {
    if (!window.confirm('Have you issued the refund on Razorpay?')) return;
    try {
      const res = await authFetch('/api/admin/returns', {
        method: 'POST',
        body: JSON.stringify({ id, action: 'refund' }),
      });
      if (res.ok) {
        setReturns(prev => prev.map(r => r.id === id ? { ...r, refundedAt: new Date().toISOString(), status: 'REFUNDED' } : r));
      } else {
        setApiError('Failed to mark as refunded');
      }
    } catch (error) { setApiError('An error occurred.'); }
  }

  const handleProductSaved = (savedProduct, isEdit) => {
    if (isEdit) {
      setProducts(ps => ps.map(p => p.id === savedProduct.id ? savedProduct : p));
    } else {
      setProducts(ps => [...ps, savedProduct]);
    }
    setShowProductForm(false);
    setEditingProduct(null);
  }

  const totalRevenue = orders
    .filter(o => o.status.toLowerCase() === 'paid')
    .reduce((s, o) => s + (o.amountINR || 0), 0)

  // ── Split Products into Active vs Archived ──
  const activeProducts = products.filter(p => p.inStock)
  const archivedProducts = products.filter(p => !p.inStock)

  // Helper to render a group of products (avoids writing table HTML twice)
  const renderProductList = (list, isArchived) => {
    if (list.length === 0) return null;
    return (
      <>
        {/* Desktop Table View */}
        <div className={`hidden lg:block bg-[#152648]/60 border border-white/8 rounded-2xl overflow-hidden ${isArchived ? 'opacity-80' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/5">
                  {['Product', 'Category', 'Price', 'Max Qty', 'Badge', 'Stock', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3 first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <tr key={p.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i === list.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-3 pl-5"><div className="flex items-center gap-3"><img src={p.imageUrl} alt="" className={`w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10 ${isArchived ? 'grayscale' : ''}`} /><div className="min-w-0"><p className={`font-semibold truncate max-w-[180px] ${isArchived ? 'text-white/60 line-through' : 'text-white'}`}>{p.name}</p><p className="text-[11px] text-white/40 truncate max-w-[180px]">{p.origin}</p></div></div></td>
                    <td className="px-4 py-3"><span className="text-xs text-white/60 font-medium capitalize">{p.category}</span></td>
                    <td className="px-4 py-3"><span className="font-bold text-[#B8892E]">{formatINR(p.price)}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-white/60 font-medium">{p.maxQuantity || '—'}</span></td>
                    <td className="px-4 py-3"><Badge text={p.badge} /></td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${p.inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>{p.inStock ? 'In Stock' : 'Archived'}</span></td>
                    <td className="px-4 py-3 pr-5 text-right whitespace-nowrap">
                      <button onClick={() => setEditingProduct(p)} className="text-white/30 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10 text-xs font-medium mr-1">Edit</button>
                      <button onClick={() => setDelTarget({ type: 'product', id: p.id, label: 'product' })} className="text-white/30 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
          {list.map(p => (
            <div key={p.id} className={`bg-[#152648]/60 border border-white/8 rounded-xl p-4 flex flex-col gap-4 ${isArchived ? 'opacity-80 grayscale' : ''}`}>
              <div className="flex gap-4">
                <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0" alt="" />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className={`font-bold truncate text-sm ${isArchived ? 'text-white/60 line-through' : 'text-white'}`}>{p.name}</p>
                  <p className="text-xs text-white/50 capitalize mb-1">{p.category} • {formatINR(p.price)}</p>
                  <div><Badge text={p.badge} /></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/8 mb-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                  {p.inStock ? 'In Stock' : 'Archived'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingProduct(p)} className="flex-1 text-blue-400 hover:text-blue-300 bg-blue-500/10 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  Edit
                </button>
                <button onClick={() => setDelTarget({ type: 'product', id: p.id, label: 'product' })} className="flex-1 text-red-400 hover:text-red-300 bg-red-500/10 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#0E1832] flex flex-col">
      <Helmet><title>Admin Panel | PahariKnits</title></Helmet>

      {/* ── Top navigation bar ── */}
      <header className="bg-[#152648] border-b border-white/8 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 flex-wrap gap-3 sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">PahariKnits</p>
            <p className="text-white/30 text-[11px]">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/shop" target="_blank" rel="noreferrer" className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white/70 transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/8 hover:border-white/20 whitespace-nowrap">View Shop ↗</a>
          <button onClick={() => { logout(); navigate('/admin/login') }} className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-red-400 transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/8 hover:border-red-500/30 whitespace-nowrap">Sign Out</button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5 sm:gap-6">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Products" value={products.length} sub="in catalogue" />
          <StatCard label="Orders" value={orders.length} sub="verified payments" />
          <StatCard label="Revenue" value={totalRevenue ? formatINR(totalRevenue) : '—'} sub="paid orders" />
          <StatCard label="In Stock" value={loadingP ? '...' : activeProducts.length} sub="available" />
        </div>

        {/* ── API error banner ── */}
        {apiError && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-xs sm:text-sm text-red-400">⚠ {apiError}</p>
            <button onClick={() => setApiError(null)} className="text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none">✕</button>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
          {[
            { key: 'products', label: 'Products', count: products.length },
            { key: 'orders', label: 'Orders', count: orders.length },
            { key: 'returns', label: 'Returns', count: returns.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap',
                tab === t.key ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/60',
              ].join(' ')}
            >
              {t.label}
              <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-[#B8892E] text-white' : 'bg-white/10 text-white/30'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            PRODUCTS TAB
        ═══════════════════════════════════════ */}
        {tab === 'products' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Product Catalogue</h2>
                <p className="text-xs text-white/30 mt-0.5">Manage your active and archived inventory</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
                <button onClick={fetchProducts} className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white/70 px-3 py-1.5 sm:py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors flex items-center gap-1">
                  <span className="text-sm leading-none">↻</span> Refresh
                </button>
                <button onClick={() => setShowProductForm(true)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B8892E] hover:bg-[#9A7020] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(184,137,46,0.35)] transition-colors">
                  <span className="text-lg leading-none">+</span> Add Product
                </button>
              </div>
            </div>
            
            {loadingP ? <div className="py-16 flex justify-center"><Spinner /></div> : products.length === 0 ? (
              <div className="py-16 text-center text-white/30 bg-[#152648]/60 border border-white/8 rounded-2xl">
                <p className="text-4xl mb-3">🧶</p><p className="text-sm">No products found.</p>
              </div>
            ) : (
              <>
                {/* ── Active Products Section ── */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Active Products ({activeProducts.length})
                  </h3>
                  {activeProducts.length === 0 ? (
                    <div className="py-8 text-center text-white/30 border border-white/8 border-dashed rounded-xl">
                      <p className="text-sm">No active products.</p>
                    </div>
                  ) : renderProductList(activeProducts, false)}
                </div>

                {/* ── Archived Products Section ── */}
                {archivedProducts.length > 0 && (
                  <div className="flex flex-col gap-3 mt-4">
                    <h3 className="text-sm font-bold text-white/60 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white/20"></span>
                      Archived / Out of Stock ({archivedProducts.length})
                    </h3>
                    {renderProductList(archivedProducts, true)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            ORDERS TAB
        ═══════════════════════════════════════ */}
        {tab === "orders" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Orders</h2>
                <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">Verified Razorpay payments</p>
              </div>
              <button onClick={fetchOrders} className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white/70 px-3 py-1.5 sm:py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors flex items-center gap-1">
                <span className="text-sm leading-none">↻</span> Refresh
              </button>
            </div>
            
            {loadingO ? <div className="py-16 flex justify-center"><Spinner /></div> : orders.length === 0 ? (
              <div className="py-16 text-center text-white/30 bg-[#152648]/60 border border-white/8 rounded-2xl">
                <p className="text-4xl mb-3">📦</p><p className="text-sm">No orders yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block bg-[#152648]/60 border border-white/8 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/5">
                          {['Order ID', 'Date', 'Items', 'Total', 'Status', '', ''].map((h, index) => (
                            <th key={index} className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3 first:pl-5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o, i) => (
                          <tr key={o.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i === orders.length - 1 ? 'border-b-0' : ''}`}>
                            <td className="px-4 py-3 pl-5"><p className="font-mono text-xs text-white/80 truncate max-w-[120px]">#{o.razorpayPaymentId.slice(-8).toUpperCase()}</p><p className="text-[11px] text-white/30 font-mono truncate max-w-[120px]">{o.razorpayOrderId}</p></td>
                            <td className="px-4 py-3 text-xs text-white/50">{fmtDate(o.createdAt)}</td>
                            <td className="px-4 py-3"><div className="max-w-[180px]">{o.items.map((item, ii) => <p key={ii} className="text-xs text-white/70 truncate">{item.quantity}× {item.name}</p>)}</div></td>
                            <td className="px-4 py-3"><span className="font-bold text-[#B8892E]">{formatINR(o.amountINR)}</span></td>
                            <td className="px-4 py-3"><StatusChip status={o.status} /></td>
                            <td className="px-4 py-3 pr-2 text-right"><button onClick={() => setDelTarget({ type: 'order', id: o.id, label: 'order' })} className="text-white/30 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-medium">Delete</button></td>
                            <td className="px-4 py-3 pr-5 text-right"><button onClick={() => handleDeliver(o.id)} disabled={deliverLoading || o.deliveredAt} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${o.deliveredAt ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>{(deliverLoading || o.deliveredAt) ? "Delivered ✓" : "Mark Delivered"}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 lg:hidden">
                  {orders.map(o => (
                    <div key={o.id} className="bg-[#152648]/60 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono font-bold text-white text-sm">#{o.razorpayPaymentId.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-white/50">{fmtDate(o.createdAt)}</p>
                        </div>
                        <StatusChip status={o.status} />
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 my-1">
                        {o.items.map((item, ii) => (
                          <div key={ii} className="flex justify-between items-center text-xs text-white/70 border-b border-white/5 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0">
                            <span className="truncate pr-2">{item.name}</span>
                            <span className="font-medium shrink-0">x{item.quantity}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center text-sm font-bold text-[#B8892E] pt-2 mt-2 border-t border-white/10">
                          <span>Total</span>
                          <span>{formatINR(o.amountINR)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full pt-1">
                        <button onClick={() => setDelTarget({ type: 'order', id: o.id, label: 'order' })} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-colors">
                          Delete
                        </button>
                        <button onClick={() => handleDeliver(o.id)} disabled={deliverLoading || o.deliveredAt} className={`flex-[2] py-2.5 rounded-lg text-xs font-bold border transition-colors ${o.deliveredAt ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}>
                          {(deliverLoading || o.deliveredAt) ? "Delivered ✓" : "Mark Delivered"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            RETURNS TAB 
        ═══════════════════════════════════════ */}
        {tab === 'returns' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Return Requests</h2>
                <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">Manage customer returns and refunds</p>
              </div>
              <button onClick={fetchReturns} className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white/70 px-3 py-1.5 sm:py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors flex items-center gap-1">
                <span className="text-sm leading-none">↻</span> Refresh
              </button>
            </div>

            {loadingR ? <div className="py-16 flex justify-center"><Spinner /></div> : returns.length === 0 ? (
              <div className="py-16 text-center text-white/30 bg-[#152648]/60 border border-white/8 rounded-2xl">
                <p className="text-4xl mb-3">♻️</p><p className="text-sm">No returns yet. Customers love your products!</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block bg-[#152648]/60 border border-white/8 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/5">
                          <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3 pl-5">Date</th>
                          <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3">Customer & Order</th>
                          <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3">Reason Provided</th>
                          <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3">Items to Return</th>
                          <th className="text-center text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3">Item Status</th>
                          <th className="text-center text-[11px] font-semibold text-white/40 uppercase tracking-widest px-4 py-3 pr-5">Refund Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returns.map((r, i) => (
                          <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i === returns.length - 1 ? 'border-b-0' : ''}`}>
                            <td className="px-4 py-4 pl-5 align-top">
                              <span className="font-medium text-white/80">{fmtDate(r.createdAt)}</span>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="font-bold text-white mb-0.5">{r.order?.shippingName || 'Unknown'}</p>
                              <p className="text-[11px] text-white/50 mb-1">{r.order?.shippingPhone}</p>
                              <p className="font-mono text-[10px] text-[#B8892E]">#{r.order?.razorpayOrderId}</p>
                            </td>
                            <td className="px-4 py-4 align-top max-w-[180px] whitespace-normal">
                              <div className="bg-amber-500/10 text-amber-200/80 border border-amber-500/20 p-2.5 rounded-lg text-[11px] italic">
                                "{r.reason || 'No specific reason provided.'}"
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top whitespace-normal min-w-[180px]">
                              <ul className="space-y-1">
                                {r.order?.items?.filter(item => r.items && r.items.includes(item.id)).map(item => (
                                  <li key={item.id} className="text-[11px] text-white/70 flex justify-between gap-3 border-b border-white/5 pb-1 last:border-0">
                                    <span className="truncate">{item.name}</span>
                                    <span className="font-medium text-white/90 shrink-0">x{item.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 pt-1.5 border-t border-white/10 text-[11px] text-emerald-400 flex justify-between">
                                <span>Refund Due:</span>
                                <span className="font-bold">
                                  {formatINR(r.order?.items?.filter(item => r.items && r.items.includes(item.id)).reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-center">
                              {r.receivedAt ? (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">✓ Received</span>
                                  <span className="text-[9px] text-white/30 mt-1.5">{new Date(r.receivedAt).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <button onClick={() => markReceived(r.id)} className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-bold rounded-lg transition-colors">Mark Received</button>
                              )}
                            </td>
                            <td className="px-4 py-4 pr-5 align-top text-center">
                              {r.refundedAt ? (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">✓ Refunded</span>
                                  <span className="text-[9px] text-white/30 mt-1.5">{new Date(r.refundedAt).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <button onClick={() => markRefunded(r.id)} disabled={!r.receivedAt} className={`inline-flex items-center justify-center w-full px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors border ${r.receivedAt ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'}`} title={!r.receivedAt ? "Must receive item first" : "Issue Refund"}>Mark Refunded</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 lg:hidden">
                  {returns.map(r => (
                    <div key={r.id} className="bg-[#152648]/60 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white text-sm">{r.order?.shippingName || 'Unknown'}</p>
                          <p className="text-xs text-white/50">{fmtDate(r.createdAt)} • {r.order?.shippingPhone}</p>
                        </div>
                        <p className="font-mono text-[10px] text-[#B8892E] bg-[#B8892E]/10 px-2 py-1 rounded">#{r.order?.razorpayOrderId.slice(-8)}</p>
                      </div>

                      <div className="bg-amber-500/10 text-amber-200/80 border border-amber-500/20 p-3 rounded-lg text-[11px] italic my-1">
                        "{r.reason || 'No specific reason provided.'}"
                      </div>

                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Items to Return</p>
                        <ul className="space-y-2">
                          {r.order?.items?.filter(item => r.items && r.items.includes(item.id)).map(item => (
                            <li key={item.id} className="text-xs text-white/70 flex justify-between gap-3">
                              <span className="truncate">{item.name}</span>
                              <span className="font-medium text-white/90 shrink-0">x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 pt-2 border-t border-white/10 text-xs text-emerald-400 flex justify-between items-center">
                          <span>Refund Due:</span>
                          <span className="font-bold text-sm">
                            {formatINR(r.order?.items?.filter(item => r.items && r.items.includes(item.id)).reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/8">
                        {r.receivedAt ? (
                          <div className="bg-emerald-500/10 text-emerald-400 text-xs py-2.5 rounded-lg text-center font-bold flex flex-col items-center justify-center">
                            <span>✓ Received</span>
                            <span className="text-[9px] text-emerald-400/50 mt-0.5">{new Date(r.receivedAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <button onClick={() => markReceived(r.id)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs py-2.5 rounded-lg font-bold border border-blue-500/20 transition-colors">
                            Mark Received
                          </button>
                        )}

                        {r.refundedAt ? (
                          <div className="bg-emerald-500/10 text-emerald-400 text-xs py-2.5 rounded-lg text-center font-bold flex flex-col items-center justify-center">
                            <span>✓ Refunded</span>
                            <span className="text-[9px] text-emerald-400/50 mt-0.5">{new Date(r.refundedAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <button onClick={() => markRefunded(r.id)} disabled={!r.receivedAt} className={`text-xs py-2.5 rounded-lg font-bold border transition-colors ${r.receivedAt ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-white/20 border-white/5'}`}>
                            Mark Refunded
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {(showProductForm || editingProduct) && (
        <ProductFormModal 
          token={token} 
          initialData={editingProduct}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }} 
          onSaved={handleProductSaved} 
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal label={deleteTarget.label} loading={delLoading} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} />
      )}
    </div>
  )
}