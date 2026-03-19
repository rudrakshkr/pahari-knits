import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider }  from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider }  from './context/AuthContext'
import AdminRoute        from './components/AdminRoute'
import Header        from './components/Header'
import Footer        from './components/Footer'
import Toast         from './components/Toast'
import Home          from './pages/Home'
import Shop          from './pages/Shop'
import Cart          from './pages/Cart'
import Contact       from './pages/Contact'
import Success       from './pages/Success'
import ProductDetail from './pages/ProductDetail'
import AdminLogin    from './pages/admin/AdminLogin'
import AdminPanel    from './pages/admin/AdminPanel'
import Checkout from './pages/Checkout'
import Feedback from './components/Feedback';
import Login from './pages/Login';
import Account from './pages/Account'
import Terms from './pages/Terms'
import RefundPolicy from './pages/RefundPolicy'
import PrivacyPolicy from './pages/PrivacyPolicy';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <Toast />
          <Routes>

            {/* ── Admin routes — no Header/Footer, their own chrome ── */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />

            {/* ── Customer-facing routes — with Header/Footer ── */}
            <Route path="/*" element={
              <div className="min-h-screen flex flex-col bg-cream-50">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/"            element={<Home />}          />
                    <Route path="/shop"         element={<Shop />}          />
                    <Route path="/product/:id"  element={<ProductDetail />} />
                    <Route path="/cart"         element={<Cart />}          />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/contact"      element={<Contact />}       />
                    <Route path="/success"      element={<Success />}       />
                    <Route path="/feedback"      element={<Feedback />}       />
                    <Route path="/login"      element={<Login />}       />
                    <Route path="/account"      element={<Account />}       />
                    <Route path="/terms"        element={<Terms />}         />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />

          </Routes>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
