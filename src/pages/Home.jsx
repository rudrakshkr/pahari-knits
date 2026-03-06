import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

// ── Reusable ornament row ─────────────────────────────────────────────────────
function Ornament({ label }) {
  return (
    <div className="ornament mb-4">
      <span className="ornament-line" />
      <span className="text-xs font-semibold text-gold-500 tracking-[0.22em] uppercase">
        {label}
      </span>
      <span className="ornament-line" />
    </div>
  )
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2">
      <span className="text-2xl font-bold text-navy-700 tracking-tight">{value}</span>
      <span className="text-[11px] font-medium text-ink-400 tracking-wide uppercase">{label}</span>
    </div>
  )
}

// ── Region badge ──────────────────────────────────────────────────────────────
function RegionBadge({ name, emoji }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white border border-line-200
                     rounded-full px-3.5 py-2 text-sm font-semibold text-ink-700
                     shadow-sm hover:border-gold-400 transition-colors">
      <span>{emoji}</span>
      {name}
    </span>
  )
}

// ── Why card ──────────────────────────────────────────────────────────────────
function WhyCard({ icon, title, body, accentBg, delay }) {
  return (
    <div
      className="flex-1 min-w-[200px] max-w-xs bg-white rounded-2xl p-6
                 border border-line-200 shadow-card text-center
                 hover:shadow-card-lg hover:-translate-y-0.5
                 transition-all duration-200 opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center
                   text-3xl mx-auto mb-5"
        style={{ backgroundColor: accentBg }}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink-900 mb-2">{title}</h3>
      <p className="text-sm text-ink-400 leading-relaxed">{body}</p>
    </div>
  )
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── SEO MARKUP ─────────────────────────────────────────────────── */}
      <Helmet>
        <title>PahariKnits | Authentic Himachali Handlooms & Knitwear</title>
        <meta name="description" content="Discover authentic, handcrafted Himachali knitwear, Kullu shawls, and Kinnauri mufflers direct from the artisans of the Himalayas." />
        <meta property="og:title" content="PahariKnits | Authentic Himachali Apparel" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — snowy Himalayan panorama, cream stage at bottom
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[500px] md:h-[560px] overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=90"
          alt="Himalayan snow peaks"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Very subtle full-bleed cream wash — keeps peaks vivid */}
        <div className="absolute inset-0 bg-cream-50/15" />

        {/* Cream stage — bottom 280px where all text lives */}
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-[#F7F5F1]/95 via-[#F7F5F1]/80 to-transparent" />

        {/* Text content — anchored to the cream stage */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center
                        text-center pb-10 px-6 opacity-0 animate-fade-up"
             style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>

          {/* Logo */}
          <img
            src="/logo.png"
            alt="PahariKnits"
            className="w-20 h-20 rounded-2xl object-cover shadow-card
                       ring-2 ring-white mb-4"
          />

          {/* Eyebrow */}
          <div className="ornament mb-2">
            <span className="ornament-line" />
            <span className="text-[11px] font-semibold text-gold-500 tracking-[0.22em] uppercase">
              From the Himalayan Highlands
            </span>
            <span className="ornament-line" />
          </div>

          {/* Brand name */}
          <h1 className="text-5xl md:text-6xl font-bold text-navy-700
                         tracking-tight leading-none mb-1">
            PahariKnits
          </h1>
          <p className="text-[14px] font-medium text-teal-500 tracking-[0.32em] uppercase mb-6">
            Traditional Himachali Apparel
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2.5 bg-navy-700 hover:bg-navy-800
                         text-white text-sm font-bold uppercase tracking-wide
                         px-7 py-3.5 rounded-xl shadow-btn transition-colors duration-150"
            >
              Shop Now
              <span className="w-5 h-5 rounded-md bg-gold-500 flex items-center justify-center text-xs leading-none">→</span>
            </Link>
            <a
              href="#story"
              className="inline-flex items-center gap-2 bg-gold-100 hover:bg-gold-200
                         border border-gold-300 text-gold-600 text-sm font-semibold
                         px-6 py-3.5 rounded-xl transition-colors duration-150"
            >
              Our Story
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      {/* <div className="bg-white border-y border-line-200">
        <div className="max-w-content mx-auto px-6 py-5
                        flex items-center justify-around gap-4">
          <StatChip value="200+" label="Artisans" />
          <span className="h-9 w-px bg-line-200" />
          <StatChip value="4"    label="Valleys"  />
          <span className="h-9 w-px bg-line-200" />
          <StatChip value="100%" label="Handmade" />
          <span className="h-9 w-px bg-line-200 hidden sm:block" />
          <StatChip value="Fair" label="Trade"    />
        </div>
      </div> */}

      {/* ═══════════════════════════════════════════════════════════════════
          OUR STORY — fully centred
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="story" className="py-20 px-6 bg-cream-50 border-b border-line-200">
        <div className="max-w-2xl mx-auto text-center
                        opacity-0 animate-fade-up"
             style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}>

          <Ornament label="Our Story" />

          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 leading-snug mb-5">
            Woven into the fabric<br className="hidden sm:block" /> of the mountains.
          </h2>

          <p className="text-[15px] text-ink-500 leading-relaxed mb-8">
            PahariKnits was born from a simple belief — that the artisans of Himachal Pradesh
            deserve a platform as exceptional as their craft. We partner directly with weavers
            in Palampur, Kullu, Kinnaur, Spiti, and Chamba to bring their work to you, unfiltered and authentic.
          </p>

          {/* Region badges — centred */}
          {/* <div className="flex flex-wrap gap-2.5 justify-center">
            <RegionBadge name="Kullu"   emoji="🏔" />
            <RegionBadge name="Kinnaur" emoji="🌾" />
            <RegionBadge name="Spiti"   emoji="❄️" />
            <RegionBadge name="Chamba"  emoji="🧵" />
          </div> */}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY CHOOSE US — centred heading + bento cards
          NOTE: "The Craft" photo grid is intentionally excluded.
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-cream-50">
        <div className="max-w-content mx-auto">

          {/* Centred section header */}
          <div className="text-center mb-12
                          opacity-0 animate-fade-up"
               style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
            <Ornament label="Why Choose Us" />
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 leading-snug">
              Every thread tells{' '}
              <span className="text-gold-500">a mountain story.</span>
            </h2>
          </div>

          {/* Cards row — centred, wraps on mobile */}
          <div className="flex flex-wrap justify-center gap-5">
            <WhyCard delay={140} icon="🏔" accentBg="#EEF2F9"
              title="Mountain Sourced"
              body="Every yarn traced to high-altitude artisan communities across Himachal Pradesh." />
            <WhyCard delay={240} icon="🤝" accentBg="#FBF2DC"
              title="Fair Trade"
              body="Weavers earn fair wages — always. We believe craft deserves deep respect." />
            <WhyCard delay={340} icon="🧶" accentBg="#E0F4F6"
              title="Hand-Crafted"
              body="No mass production. Only hands, looms, and generations of inherited skill." />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          NEW ARRIVALS BANNER — light earthy theme, no dark overlay
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-6 bg-cream-100 border-y border-line-200">
        <div className="max-w-content mx-auto">
          <div className="relative rounded-3xl overflow-hidden
                          bg-[#F5EFE6] border border-[#E0D0B8]
                          shadow-card-lg">

            {/* Warm amber accent bar at top */}
            <div className="h-1 w-full bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500/40" />

            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 p-8 md:p-10">

              {/* Left: image */}
              <div className="shrink-0 w-full md:w-64 h-48 md:h-52 rounded-2xl overflow-hidden shadow-card">
                <img
                  src="https://images.unsplash.com/photo-1678801868975-32786ae5aeeb?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="New season wool"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Right: copy */}
              <div className="flex-1 text-center md:text-left">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="h-px w-5 bg-gold-500 rounded-full" />
                  <span className="text-[11px] font-semibold text-gold-600 tracking-[0.22em] uppercase">
                    New Season
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-ink-900 leading-snug mb-3">
                  New arrivals<br className="hidden md:block" /> every season.
                </h2>
                <p className="text-[15px] text-ink-500 leading-relaxed mb-6 max-w-sm mx-auto md:mx-0">
                  Freshly woven pieces from mountain artisans — limited quantities,
                  each with a story sewn in.
                </p>

                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2.5 bg-navy-700 hover:bg-navy-800
                             text-white text-sm font-bold uppercase tracking-wide
                             px-7 py-3.5 rounded-xl shadow-btn transition-colors duration-150"
                >
                  Browse Collection
                  <span className="w-5 h-5 rounded-md bg-gold-500 flex items-center justify-center text-xs">→</span>
                </Link>
              </div>
            </div>

            {/* Decorative gold ✦ watermark — bottom right */}
            {/* <span
              className="absolute bottom-4 right-6 text-gold-300 text-7xl
                         font-bold leading-none pointer-events-none select-none opacity-30"
              aria-hidden="true"
            >
              ✦
            </span> */}
          </div>
        </div>
      </section>

    </div>
  )
}
