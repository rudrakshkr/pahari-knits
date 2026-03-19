import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-line-200 mt-16">
      <div className="max-w-content mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PahariKnits" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <span className="block text-sm font-bold text-navy-700">PahariKnits</span>
            <span className="block text-[10px] text-ink-400 tracking-widest uppercase">Traditional Himachali Apparel</span>
          </div>
        </div>

        {/* Main Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-500">
          {[['/', 'Home'], ['/shop', 'Shop'], ['/cart', 'Cart'], ['/contact', 'Contact']].map(([to, label]) => (
            <Link key={to} to={to} className="hover:text-navy-700 transition-colors">{label}</Link>
          ))}
        </nav>

        {/* Legal Links & Copyright */}
        <div className="flex flex-col items-center md:items-end gap-2 text-xs text-ink-400">
          <div className="flex gap-4">
            <Link to="/refund-policy" className="hover:text-navy-700 transition-colors">Refund Policy</Link>
            <Link to="/terms" className="hover:text-navy-700 transition-colors">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-navy-700 transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-[11px] text-ink-200">© {new Date().getFullYear()} PahariKnits. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}