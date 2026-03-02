/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── PahariKnits brand palette ─────────────────────────────
        // Backgrounds
        cream: {
          50:  '#F7F5F1',   // main page bg — warm off-white
          100: '#F0EDE7',   // alternate section bg
          200: '#E8E2D8',   // hover tint / borders
        },
        // Primary navy (logo, CTAs, text)
        navy: {
          50:  '#EEF2F9',
          100: '#D0DCEF',
          200: '#9AB2D9',
          600: '#253F78',
          700: '#1D3461',   // ← main brand navy
          800: '#152648',
          900: '#0E1832',
        },
        // Gold accent (knitting needles from logo, CTAs)
        gold: {
          100: '#FBF2DC',
          200: '#F0D98C',
          300: '#DFC060',
          400: '#C9A84C',
          500: '#B8892E',   // ← main CTA gold
          600: '#9A7020',
          700: '#7A5614',
        },
        // Teal — origin tags, eyebrow labels
        teal: {
          500: '#2A7A8A',
          400: '#3D96A8',
          100: '#E0F2F6',
        },
        // Text hierarchy — warm ink tones
        ink: {
          900: '#1A2438',
          700: '#2D3E56',
          500: '#4A5A72',
          400: '#6A7A90',
          200: '#A0AABB',
        },
        // Borders
        line: {
          100: '#F0F2F5',
          200: '#E4E8F0',
          300: '#C8D2DE',
        },
        // Warm earthy tones for the New Arrivals banner
        stone: {
          warm:   '#F5EFE6',
          amber:  '#C47C2B',
          sienna: '#A0522D',
          terra:  '#7B3A1E',
        },
      },

      fontFamily: {
        sans:    ['Fira Sans', 'system-ui', 'sans-serif'],
        display: ['Fira Sans', 'system-ui', 'sans-serif'],
      },

      boxShadow: {
        card:   '0 4px 20px rgba(26,36,56,0.08)',
        'card-lg': '0 8px 32px rgba(26,36,56,0.12)',
        btn:    '0 4px 14px rgba(13,26,46,0.22)',
        'btn-gold': '0 4px 14px rgba(184,137,46,0.40)',
      },

      maxWidth: {
        content: '1120px',
      },

      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'slide-down': 'slideDown 0.25s ease forwards',
      },
    },
  },
  plugins: [],
}
