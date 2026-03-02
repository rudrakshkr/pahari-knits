import React, { useState } from 'react'

const TOPICS = ['Order Status', 'Returns & Exchanges', 'Product Inquiry', 'Partnership', 'Other']

const INPUT_CLASS = `w-full bg-cream-100 border border-line-200 rounded-xl
  px-4 py-3 text-sm text-ink-900 placeholder-ink-200
  focus:outline-none focus:border-navy-400 focus:bg-white transition-colors`

export default function Contact() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [topic, setTopic]     = useState(TOPICS[0])
  const [message, setMessage] = useState('')
  const [sent, setSent]       = useState(false)

  const handleSend = (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setSent(true)
  }

  return (
    <div>
      {/* Page header */}
      <div className="bg-white border-b border-line-200 shadow-[0_2px_8px_rgba(26,36,56,0.05)]">
        <div className="max-w-content mx-auto px-6 py-7">
          <p className="text-[11px] font-semibold text-teal-500 tracking-[0.22em] uppercase mb-1.5">We're Here</p>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 tracking-tight">Get in Touch</h1>
          <p className="text-sm text-ink-400 mt-2">Questions about an order, a weave, or just want to say hello?</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3">
          {[['✉', 'Email', 'support@pahariknits.com'], ['⏱', 'Response', 'Within 24 hrs'], ['🏔', 'Based in', 'Himachal Pradesh']].map(([icon, label, value]) => (
            <div key={label} className="bg-white border border-line-200 rounded-2xl p-4 text-center shadow-card">
              <span className="text-2xl block mb-2">{icon}</span>
              <p className="text-[10px] font-medium text-ink-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xs font-semibold text-navy-700">{value}</p>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-line-200 shadow-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-7">
            <span className="w-1 h-6 rounded-full bg-gold-500" />
            <h2 className="text-base font-bold text-ink-900">Send a Message</h2>
          </div>

          {sent ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center
                              text-white text-2xl font-bold mx-auto mb-5 shadow-btn-gold">✓</div>
              <h3 className="text-xl font-bold text-ink-900 mb-2">Message Sent!</h3>
              <p className="text-sm text-ink-500 mb-6">We'll reply within 24 hours at <strong className="text-navy-700">{email}</strong></p>
              <button
                onClick={() => { setName(''); setEmail(''); setMessage(''); setSent(false) }}
                className="border-2 border-gold-400 text-gold-600 text-sm font-semibold
                           px-5 py-2 rounded-xl hover:bg-gold-100 transition-colors">
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                    Your Name <span className="text-gold-500">*</span>
                  </label>
                  <input value={name} onChange={e => setName(e.target.value)}
                         placeholder="e.g. Priya Sharma" className={INPUT_CLASS} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                    Email Address <span className="text-gold-500">*</span>
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                         placeholder="you@example.com" className={INPUT_CLASS} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">Topic</label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(t => (
                    <button key={t} type="button" onClick={() => setTopic(t)}
                            className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                              topic === t
                                ? 'bg-navy-700 border-navy-700 text-white'
                                : 'bg-cream-100 border-line-200 text-ink-500 hover:border-navy-300'
                            }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">
                  Message <span className="text-gold-500">*</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                          placeholder="Tell us how we can help..." rows={5}
                          className={INPUT_CLASS + ' resize-none'} required />
              </div>

              <button type="submit"
                      className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold uppercase
                                 tracking-wider py-4 rounded-xl shadow-btn-gold transition-colors text-sm mt-1">
                Send Message ✈
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
