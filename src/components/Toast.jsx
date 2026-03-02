import React, { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'

export default function Toast() {
  const { toast, dismissToast } = useToast()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (toast) {
      // tiny rAF to ensure mount triggers transition
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [toast])

  if (!toast) return null

  return (
    <div
      className={[
        'fixed top-20 left-1/2 -translate-x-1/2 z-[9999]',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 bg-navy-700 text-white
                      px-4 py-3 rounded-2xl shadow-card-lg
                      border-t-2 border-gold-500 min-w-[260px] max-w-sm">
        {/* Product thumbnail */}
        {toast.imageUrl && (
          <img
            src={toast.imageUrl}
            alt=""
            className="w-10 h-10 rounded-lg object-cover shrink-0"
          />
        )}

        {/* Check icon + message */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-navy-200 font-medium">Added to cart</p>
            <p className="text-sm font-semibold text-white truncate">{toast.name}</p>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismissToast}
          className="text-navy-300 hover:text-white transition-colors ml-1 shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
