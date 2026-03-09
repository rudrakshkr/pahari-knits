import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Feedback() {
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('productId')
  const customerName = searchParams.get('customerName')

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // New state for pre-submission check
  const [alreadyExists, setAlreadyExists] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if feedback already exists on component mount
  useEffect(() => {
    if (!productId || !customerName) {
      setIsChecking(false)
      return
    }

    const checkFeedback = async () => {
      try {
        const res = await fetch(`/api/feedback/check?productId=${productId}&customerName=${customerName}`)
        const data = await res.json()
        if (data.exists) {
          setAlreadyExists(true)
        }
      } catch (error) {
        console.error('Failed to check for existing feedback', error)
        // Optionally show an error to the user
      } finally {
        setIsChecking(false)
      }
    }

    checkFeedback()
  }, [productId, customerName])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0 || !productId || !customerName) return
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback, productId, customerName }),
      })
      
      if (!res.ok) {
        if (res.status === 409) { // Conflict - feedback already exists
          setAlreadyExists(true)
        } else {
          throw new Error('Failed to submit feedback')
        }
      } else {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Feedback submission failed', error)
    } finally {
      setLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-ink-500 animate-pulse">Checking for existing feedback...</p>
      </div>
    )
  }

  if (!productId || !customerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-card p-8 text-center max-w-md w-full mx-auto">
          <h3 className="text-xl font-bold text-red-700 mb-2">Invalid Feedback Link</h3>
        </div>
      </div>
    )
  }

  if (alreadyExists && !submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl border border-line-200 shadow-card p-8 text-center animate-fade-up max-w-md w-full mx-auto">
          <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-btn-gold">👍</div>
          <h3 className="text-xl font-bold text-ink-900 mb-2">Feedback Already Received</h3>
          <p className="text-sm text-ink-500">Thank you! We have already recorded your feedback for this product.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl border border-line-200 shadow-card p-8 text-center animate-fade-up max-w-md w-full mx-auto">
          <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center
                          text-white text-2xl font-bold mx-auto mb-4 shadow-btn-gold">
            ✓
          </div>
          <h3 className="text-xl font-bold text-ink-900 mb-2">Thank You!</h3>
          <p className="text-sm text-ink-500">
            Your feedback helps us weave better experiences for everyone.
          </p>
          <button 
            onClick={() => { setSubmitted(false); setRating(0); setFeedback(''); }}
            className="mt-6 text-xs font-semibold text-navy-700 hover:text-navy-900 uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 animate-fade-up">
      <div className="bg-white rounded-2xl border border-line-200 shadow-card p-6 md:p-8 max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-ink-900">We value your opinion</h3>
          <p className="text-sm text-ink-400 mt-1">
            How was your experience with PahariKnits?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="focus:outline-none transition-transform hover:scale-110 duration-200 p-1"
                aria-label={`Rate ${star} stars`}
              >
                <svg
                  className={`w-8 h-8 transition-colors duration-200 ${
                    star <= (hover || rating) 
                      ? 'text-gold-500 fill-current' 
                      : 'text-line-300 fill-transparent stroke-current stroke-2'
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
          </div>
          
          {/* Feedback Textarea */}
          <div>
            <label htmlFor="feedback" className="sr-only">Your Feedback</label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you liked or how we can improve..."
              className="w-full bg-cream-100 border border-line-200 rounded-xl
                         px-4 py-3 text-sm text-ink-900 placeholder-ink-200
                         focus:outline-none focus:border-navy-400 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className={`w-full flex items-center justify-center gap-2 font-bold uppercase
                        tracking-wider py-3.5 rounded-xl text-sm transition-all duration-200
                        ${loading || rating === 0
                          ? 'bg-line-200 text-ink-300 cursor-not-allowed'
                          : 'bg-navy-700 hover:bg-navy-800 text-white shadow-btn active:scale-[0.98]'
                        }`}
          >
            {loading ? 'Sending...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  )
}