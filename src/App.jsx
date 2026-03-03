import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider }  from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import Header        from './components/Header'
import Footer        from './components/Footer'
import Toast         from './components/Toast'
import Home          from './pages/Home'
import Shop          from './pages/Shop'
import Cart          from './pages/Cart'
import Contact       from './pages/Contact'
import Success       from './pages/Success'
import ProductDetail from './pages/ProductDetail'

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <Toast />
        <div className="min-h-screen flex flex-col bg-cream-50">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/"             element={<Home />}          />
              <Route path="/shop"         element={<Shop />}          />
              <Route path="/product/:id"  element={<ProductDetail />} />
              <Route path="/cart"         element={<Cart />}          />
              <Route path="/contact"      element={<Contact />}       />
              <Route path="/success"      element={<Success />}       />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </ToastProvider>
  )
}
