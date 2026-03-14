/**
 * AdminPanel.jsx — PahariKnits Admin Dashboard
 * Optimized for Desktop and Mobile Layouts
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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

// ── Add Product modal ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', price: '', category: 'shawl', origin: '', description: '',
  images: '', badge: '', inStock: true, material: '', dimensions: '', care: '', maxQuantity: '',
}

function AddProductModal({ token, onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY_FORM)
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

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add product')
      onAdded(data.product)
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
      <div className="w-full max-w-2xl bg-[#152648] border border-white/10 rounded-2xl
                      shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="font-bold text-white text-base sm:text-lg">Add New Product</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20
                            rounded-xl px-4 py-3 text-sm text-red-400">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="add-product-form" className="space-y-4 sm:space-y-5">
            {/* Row 1: Name */}
            <div>
              <label className={LABEL}>Name *</label>
              <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)}
                required placeholder="Kullu Valley Shawl" />
            </div>

            {/* Row 2: Price, Max Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Price (₹) *</label>
                <input className={INPUT} type="number" min="1" value={form.price}
                  onChange={e => set('price', e.target.value)} required placeholder="2499" />
              </div>
              <div>
                <label className={LABEL}>Max Order Quantity</label>
                <input className={INPUT} type="number" min="1" value={form.maxQuantity}
                  onChange={e => set('maxQuantity', e.target.value)} placeholder="e.g., 10" />
              </div>
            </div>

            {/* Row 3: Category, Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Category *</label>
                <select className={INPUT + ' cursor-pointer'} value={form.category}
                  onChange={e => set('category', e.target.value)}>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Badge</label>
                <select
                  className={INPUT + ' cursor-pointer bg-navy-900 text-white'}
                  value={form.badge}
                  onChange={e => set('badge', e.target.value)}
                >
                  {BADGE_OPTIONS.map(b => (
                    <option key={b} value={b} className="bg-navy-900 text-white">
                      {b || '(none)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Origin */}
            <div>
              <label className={LABEL}>Origin *</label>
              <input className={INPUT} value={form.origin} onChange={e => set('origin', e.target.value)}
                required placeholder="Kullu, Himachal Pradesh" />
            </div>

            {/* Description */}
            <div>
              <label className={LABEL}>Description *</label>
              <textarea className={INPUT + ' resize-none'} rows={3} value={form.description}
                onChange={e => set('description', e.target.value)} required
                placeholder="A detailed description of the product..." />
            </div>

            {/* Images */}
            <div>
              <label className={LABEL}>Image URLs * (comma-separated)</label>
              <textarea className={INPUT + ' resize-none'} rows={2} value={form.images}
                onChange={e => set('images', e.target.value)}
                placeholder="https://images.unsplash.com/..., https://..." />
              <p className="text-[10px] sm:text-xs text-white/25 mt-1">First URL = primary image shown in Shop & Cart</p>
            </div>

            {/* Optional fields: Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Material</label>
                <input className={INPUT} value={form.material}
                  onChange={e => set('material', e.target.value)} placeholder="Pure Himalayan wool..." />
              </div>
              <div>
                <label className={LABEL}>Dimensions</label>
                <input className={INPUT} value={form.dimensions}
                  onChange={e => set('dimensions', e.target.value)} placeholder="200 cm × 100 cm" />
              </div>
            </div>
            <div>
              <label className={LABEL}>Care Instructions</label>
              <input className={INPUT} value={form.care}
                onChange={e => set('care', e.target.value)} placeholder="Hand wash in cold water..." />
            </div>

            {/* In Stock toggle */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => set('inStock', !form.inStock)}
                className={`w-11 h-6 rounded-full transition-all duration-200 border relative flex items-center ${form.inStock
                  ? 'bg-emerald-500 border-emerald-400'
                  : 'bg-white/5 border-white/20'
                  }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${form.inStock ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
              <span className="text-sm font-medium text-white/70">
                {form.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 flex justify-end gap-3 shrink-0">
          <button onClick={onClose}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white/50
                             border border-white/10 hover:border-white/20 hover:text-white/70
                             transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-product-form" disabled={loading}
            className={[
              'px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide',
              'transition-colors flex items-center gap-2',
              loading
                ? 'bg-[#B8892E]/40 text-white/40 cursor-not-allowed'
                : 'bg-[#B8892E] hover:bg-[#9A7020] text-white',
            ].join(' ')}>
            {loading ? <><Spinner /> Saving…</> : 'Add Product'}
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
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm
                             font-semibold text-white/50 hover:text-white/70 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600
                             text-white text-sm font-bold uppercase tracking-wide
                             transition-colors flex items-center justify-center gap-2">
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
  const [loadingP, setLoadingP] = useState(true)
  const [loadingO, setLoadingO] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
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

  useEffect(() => {
    fetchProducts()
    fetchOrders()
  }, [fetchProducts, fetchOrders])

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
      const res = await fetch(`/api/orders/${orderId}/deliver`, { method: 'POST' });
      if (res.ok) {
        setDeliverLoading(true);
      } else {
        console.error('Failed to mark as delivered');
      }
    } finally {
      setDeliverLoading(false);
    }
  }

  const totalRevenue = orders
    .filter(o => o.status.toLowerCase() === 'paid')
    .reduce((s, o) => s + (o.amountINR || 0), 0)

  const inStockCount = products.filter(p => p.inStock).length

  return (
    <div className="min-h-screen bg-[#0E1832] flex flex-col">

      {/* ── Top navigation bar ── */}
      <header className="bg-[#152648] border-b border-white/8 px-4 sm:px-6 py-3.5
                         flex items-center justify-between shrink-0 flex-wrap gap-3 sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">PahariKnits</p>
            <p className="text-white/30 text-[11px]">Admin Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href="/shop" target="_blank" rel="noreferrer"
            className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white/70
                        transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/8
                        hover:border-white/20 whitespace-nowrap">
            View Shop ↗
          </a>
          <button
            onClick={() => { logout(); navigate('/admin/login') }}
            className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-red-400
                       transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/8
                       hover:border-red-500/30 whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5 sm:gap-6">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Products" value={products.length} sub="in catalogue" />
          <StatCard label="Orders" value={orders.length} sub="verified payments" />
          <StatCard label="Revenue" value={totalRevenue ? formatINR(totalRevenue) : '—'}
            sub="paid orders" />
          <StatCard label="In Stock" value={loadingP ? '...' : inStockCount}
            sub="available" />
        </div>

        {/* ── API error banner ── */}
        {apiError && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10
                          border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-xs sm:text-sm text-red-400">⚠ {apiError}</p>
            <button onClick={() => setApiError(null)}
              className="text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none">✕</button>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
          {[
            { key: 'products', label: 'Products', count: products.length },
            { key: 'orders', label: 'Orders', count: orders.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap',
                tab === t.key
                  ? 'bg-white/10 text-white shadow'
                  : 'text-white/40 hover:text-white/60',
              ].join(' ')}
            >
              {t.label}
              <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-bold
                                ${tab === t.key ? 'bg-[#B8892E] text-white' : 'bg-white/10 text-white/30'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            PRODUCTS TAB
        ═══════════════════════════════════════ */}
        {tab === 'products' && (
          <div className="flex flex-col gap-4">
            {/* Tab header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Product Catalogue</h2>
                <p className="text-xs text-white/30 mt-0.5">
                  Changes reflect in the Shop immediately via Neon
                </p>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B8892E] hover:bg-[#9A7020]
                           text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl
                           shadow-[0_4px_14px_rgba(184,137,46,0.35)] transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                Add Product
              </button>
            </div>

            {/* Products table */}
            <div className="bg-[#152648]/60 border border-white/8 rounded-2xl overflow-hidden">
              {loadingP ? (
                <div className="py-16 flex justify-center"><Spinner /></div>
              ) : products.length === 0 ? (
                <div className="py-16 text-center text-white/30 px-4">
                  <p className="text-4xl mb-3">🧶</p>
                  <p className="text-sm">No products yet. Add your first one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/8 bg-white/5">
                        {['Product', 'Category', 'Price', 'Max Qty', 'Badge', 'Stock', ''].map(h => (
                          <th key={h} className="text-left text-[10px] sm:text-[11px] font-semibold text-white/40
                                                  uppercase tracking-widest px-4 py-3 first:pl-5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={p.id}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors
                                        ${i === products.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="px-4 py-3 pl-5">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl} alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />
                              <div className="min-w-0">
                                <p className="font-semibold text-white truncate max-w-[150px] sm:max-w-[180px]">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-white/40 truncate max-w-[150px] sm:max-w-[180px]">
                                  {p.origin}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-white/60 font-medium capitalize">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-[#B8892E]">{formatINR(p.price)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-white/60 font-medium">
                              {p.maxQuantity || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3"><Badge text={p.badge} /></td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
                                              ${p.inStock
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'}`}>
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="px-4 py-3 pr-5 text-right">
                            <button
                              onClick={() => setDelTarget({ type: 'product', id: p.id, label: 'product' })}
                              className="text-white/30 hover:text-red-400 transition-colors
                                         px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            ORDERS TAB
        ═══════════════════════════════════════ */}
        {tab === 'orders' && (
          <div className="flex flex-col gap-4">
            {/* Tab header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Orders</h2>
                <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">
                  Verified Razorpay payments
                </p>
              </div>
              <button onClick={fetchOrders}
                className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white/70
                                 px-3 py-1.5 sm:py-2 rounded-lg border border-white/10 hover:border-white/20
                                 transition-colors flex items-center gap-1">
                <span className="text-sm leading-none">↻</span> Refresh
              </button>
            </div>

            <div className="bg-[#152648]/60 border border-white/8 rounded-2xl overflow-hidden">
              {loadingO ? (
                <div className="py-16 flex justify-center"><Spinner /></div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-white/30 px-4">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="text-sm">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[750px]">
                    <thead>
                      <tr className="border-b border-white/8 bg-white/5">
                        {['Order ID', 'Date', 'Items', 'Total', 'Status', ''].map(h => (
                          <th key={h} className="text-left text-[10px] sm:text-[11px] font-semibold text-white/40
                                                  uppercase tracking-widest px-4 py-3 first:pl-5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o, i) => (
                        <tr key={o.id}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors
                                        ${i === orders.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="px-4 py-3 pl-5">
                            <p className="font-mono text-[11px] sm:text-xs text-white/80 truncate max-w-[120px]">
                              #{o.razorpayPaymentId.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-white/30 font-mono truncate max-w-[120px]">
                              {o.razorpayOrderId}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-[11px] sm:text-xs text-white/50">
                            {fmtDate(o.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-[180px]">
                              {o.items.map((item, ii) => (
                                <p key={ii} className="text-[11px] sm:text-xs text-white/70 truncate">
                                  {item.quantity}× {item.name}
                                </p>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-[#B8892E]">{formatINR(o.amountINR)}</span>
                          </td>
                          <td className="px-4 py-3"><StatusChip status={o.status} /></td>
                          <td className="px-4 py-3 pr-5 text-right">
                            <button
                              onClick={() => setDelTarget({ type: 'order', id: o.id, label: 'order' })}
                              className="text-white/30 hover:text-red-400 transition-colors
                                         px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </td>
                          <td className="px-4 py-3 pr-5 text-right">
                            <button
                              onClick={() => handleDeliver(o.id)}
                              disabled={deliverLoading || o.deliveredAt}
                              className="text-white/30 hover:text-green-400 transition-colors
                                         px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-medium"
                            >
                              {(deliverLoading || o.deliveredAt) ? "Delivered" : "Mark Delivered"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AddProductModal
          token={token}
          onClose={() => setShowAdd(false)}
          onAdded={(p) => {
            setProducts(ps => [...ps, p])
            setShowAdd(false)
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          label={deleteTarget.label}
          loading={delLoading}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  )
}