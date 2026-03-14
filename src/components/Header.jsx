import React, { useState, useEffect } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/contact', label: 'Contact' },
]

// NavLink demands `end` on the root path so /shop doesn't also activate /
function AppNavLink({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        ['nav-link', isActive ? 'active' : ''].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

export default function Header() {
  const { totalItems } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isLoggedIn } = useAuth();

  // Add a subtle shadow once user scrolls down
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 6)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])
  const { logout } = useAuth();

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isProductPage = pathname.startsWith('/product/');

  return (
    <header
      className={[
        'sticky top-0 z-50 bg-white border-b border-line-200 transition-shadow duration-200',
        scrolled ? 'shadow-[0_2px_16px_rgba(26,36,56,0.08)]' : '',
      ].join(' ')}
    >
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* ── Mobile Back Button (Only on Product Pages) ─────────────────── */}
        {isProductPage && (
          <button
            onClick={() => navigate(-1)}
            className="md:hidden flex items-center gap-2 text-navy-700 hover:text-gold-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-tight">Back</span>
          </button>
        )}

        {/* ── Logo ────────────────────────────────────────────────────────── */}
        <Link to="/" className={`${isProductPage ? 'hidden md:flex' : 'flex'} items-center gap-3 shrink-0 group`}>
          <img
            src="/logo.png"
            alt="PahariKnits logo"
            className="w-10 h-10 rounded-xl object-cover shadow-sm
                       ring-1 ring-line-200 group-hover:ring-gold-400 transition-all duration-200"
          />
          <div className="leading-none">
            <span className="block text-[17px] font-bold text-navy-700 tracking-tight">
              PahariKnits
            </span>
            <span className="block text-[10px] font-medium text-ink-400 tracking-[0.18em] uppercase mt-0.5">
              Himachali Apparel
            </span>
          </div>
        </Link>

        {/* ── Desktop nav ─────────────────────────────────────────────────── */}
        {/* ── Desktop nav ─────────────────────────────────────────────────── */}
        {!isProductPage && (
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map(n => <AppNavLink key={n.to} {...n} />)}
          </nav>
        )}

        {/* ── Right actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              [
                'relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold',
                'transition-colors duration-150',
                isActive
                  ? 'bg-navy-700 text-white'
                  : 'bg-cream-100 text-ink-700 hover:bg-navy-50 hover:text-navy-700',
              ].join(' ')
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1
                               bg-gold-500 text-white text-[10px] font-bold rounded-full
                               flex items-center justify-center leading-none animate-slide-down">
                {totalItems}
              </span>
            )}
          </NavLink>

          {/* Mobile hamburger */}
          {!isProductPage && (
            <button
              className="md:hidden p-2 rounded-lg text-ink-500 hover:bg-cream-100 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          )}

          <div className="flex items-center">
            <NavLink
              to="/login" className="text-gray-700 hover:text-gray-900"
            >
              {/* Avatar Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </NavLink>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown menu ─────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden border-t border-line-200 bg-white px-6 pb-4 pt-3 flex flex-col gap-1 animate-slide-down">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                [
                  'px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-navy-50 text-navy-700'
                    : 'text-ink-500 hover:bg-cream-100 hover:text-ink-900',
                ].join(' ')
              }
            >
              {n.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
