// ─────────────────────────────────────────────────────────────────────────────
// products.js  —  PahariKnits product catalogue (frontend)
//
// Each product now has an `images` array (3–4 Unsplash URLs).
// `imageUrl` is a computed alias for images[0] so all existing
// code (Shop, Cart, Toast) keeps working without a single edit.
// ─────────────────────────────────────────────────────────────────────────────

const withImageUrl = (p) => ({ ...p, imageUrl: p.images[0] })

export const PRODUCTS = [
  withImageUrl({
    id:       'pk-001',
    name:     'Kullu Valley Shawl',
    price:    2499,
    category: 'shawl',
    origin:   'Kullu, Himachal Pradesh',
    badge:    'Bestseller',
    inStock:  true,
    material: 'Pure Himalayan wool — hand-spun and naturally dyed',
    dimensions: '200 cm x 100 cm · weight approx. 380 g',
    care:     'Hand wash in cold water with mild soap. Dry flat in shade. Do not wring.',
    description:
      'Hand-woven on traditional pit looms passed down through generations, this pure wool shawl carries the iconic bold geometric patterns — the "Kullu buti" — that have defined Himachali textile identity for centuries. Each shawl takes a skilled weaver three to five days to complete. The tightly woven twill structure traps air efficiently, making it warm in the mountains yet breathable in milder weather. No two pieces are identical. The slight variations in pattern and tone are a hallmark of genuine hand-weaving, not a flaw.',
    images: [
      'https://images.unsplash.com/photo-1732476342752-6870145d1f9c?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1737988007411-e85aa733efa1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1638786023988-d27bed11e076?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1510574457807-3d9bf494ff6b?q=80&w=801&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ],
  }),
  withImageUrl({
    id:       'pk-002',
    name:     'Kinnauri Striped Muffler',
    price:    899,
    category: 'muffler',
    origin:   'Kinnaur, Himachal Pradesh',
    badge:    'New Arrival',
    inStock:  true,
    material: 'Angora-blend wool (70% wool, 30% Angora) — hand-woven',
    dimensions: '170 cm x 28 cm · weight approx. 120 g',
    care:     'Dry clean recommended. If hand-washing, use cold water; reshape and dry flat.',
    description:
      'The distinctive burgundy, ivory, and mustard stripe of Kinnaur is one of the most recognisable weaving signatures in all of Himachal Pradesh. This muffler is crafted from an Angora-blend that gives it an exceptionally soft hand-feel while maintaining the structural integrity needed to hold the crisp stripe pattern. Despite its featherlight weight, the dense weave provides surprising warmth — a favourite among trekkers in the Baspa Valley. Fringed ends are hand-finished and knotted, never machine-cut.',
    images: [
      'https://images.unsplash.com/photo-1517496267011-39d56c54984d?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1695603438043-1b9ab6ebe1a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1669626495508-58acf2311688?q=80&w=947&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1728034261963-3ff8c2490788?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ],
  }),
  withImageUrl({
    id:       'pk-003',
    name:     'Spiti Hand-Knit Woolen Socks',
    price:    349,
    category: 'socks',
    origin:   'Spiti Valley, Himachal Pradesh',
    badge:    null,
    inStock:  true,
    material: 'Unbleached Himalayan sheep wool — hand-knit',
    dimensions: 'Available in S / M / L — length approx. 28 cm (M)',
    care:     'Hand wash only in cold water. Air dry. Avoid tumble drying.',
    description:
      'At 3,800 metres above sea level, Spiti winters are unforgiving — and these socks were designed for exactly that. Knitted by artisan women of the Spiti high desert cooperatives using thick, unbleached local wool, they are structured with a reinforced heel and toe for durability and a ribbed cuff that keeps them in place all day. The natural lanolin present in minimally processed wool makes them naturally moisture-resistant. Equally beloved for cold mornings at the writing desk as for sub-zero mountain nights.',
    images: [
      'https://images.unsplash.com/photo-1739640081476-fd55589f8838?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1631180543602-727e1197619d?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1566563634870-d566ab58a4df?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ],
  }),
  withImageUrl({
    id:       'pk-004',
    name:     'Chamba Embroidered Stole',
    price:    1799,
    category: 'stole',
    origin:   'Chamba, Himachal Pradesh',
    badge:    'Artisan Pick',
    inStock:  true,
    material: 'Pashmina-blend base (60% pashmina, 40% silk) with silk embroidery thread',
    dimensions: '190 cm x 70 cm · weight approx. 160 g',
    care:     'Dry clean only. Store folded in a muslin cloth away from direct light.',
    description:
      'The "Chamba Rumal" is a UNESCO-recognised embroidery tradition — a double-sided chain stitch in silk thread so precise that both faces of the fabric are equally finished. This stole adapts the ancient motifs (flowering vines, deer, peacocks) into a contemporary wearable form on a gossamer pashmina-silk base. Each stole is the work of a single artisan over two to three weeks. The colours are achieved with natural dyes sourced from local flowers, bark, and minerals — meaning no two dye lots are ever precisely the same.',
    images: [
      'https://images.unsplash.com/photo-1761724794779-6b21b4a317c7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1697781826540-20cff4de8acd?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1576073383268-a8aae73f33bd?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1760837992224-e73b2ba6f1c6?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ],
  }),
  withImageUrl({
    id:       'pk-005',
    name:     "Manali Shepherd's Cap",
    price:    599,
    category: 'cap',
    origin:   'Manali, Himachal Pradesh',
    badge:    null,
    inStock:  true,
    material: 'Dense felted wool — hand-blocked and hand-finished',
    dimensions: 'One size fits most (internal circumference 56–60 cm)',
    care:     'Spot clean only with a damp cloth. Re-block by steaming gently if misshapen.',
    description:
      'Known locally as the "Himachali topi," this cap has been worn by shepherds and farmers of the Kullu-Manali corridor for as long as anyone can remember. Our version honours the traditional form — dense felted wool, a wide-brimmed fold, and the distinctive geometric banding in contrasting tones — while using finer wool and tighter felting for a contemporary finish. Felting is done by hand, a slow process of pressing and shrinking wet wool fibres until they lock permanently. The result is a cap that sheds light rain, holds its shape indefinitely, and improves with age.',
    images: [
      'https://images.unsplash.com/photo-1699347611474-5be693bee31e?q=80&w=723&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1720534490358-bc2ad29d51d5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1589831377283-33cb1cc6bd5d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1604532057336-2c4a09f71330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ],
  }),
  withImageUrl({
    id:       'pk-006',
    name:     'Rampur Double-Weave Shawl',
    price:    3299,
    category: 'shawl',
    origin:   'Rampur Bushahr, Himachal Pradesh',
    badge:    'Limited Edition',
    inStock:  true,
    material: 'Fine merino wool — double-weave, hand-woven on a fly-shuttle loom',
    dimensions: '210 cm x 105 cm · weight approx. 520 g',
    care:     'Dry clean only. Store in a cedar box or with cedar balls to protect against moths.',
    description:
      'Double-weave is one of the most technically demanding techniques in handloom weaving: two separate cloth layers are woven simultaneously on the same loom, interlinked at the selvedges, each face carrying its own distinct pattern. When you reverse the shawl, the colours invert — what was the foreground becomes the background. This Rampur piece uses merino wool for exceptional softness and drape. There are fewer than a dozen weavers in Himachal Pradesh who still practise double-weave at this quality level. We work with one family in Rampur Bushahr who has maintained the tradition for four generations. Each shawl is numbered and signed by the weaver.',
    images: [
      'https://plus.unsplash.com/premium_photo-1725721362512-2f47d969e554?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1688502769136-3d1bdee7b222?q=80&w=1493&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1700671788328-eecc12128f68?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1768514188394-03b802d6e648?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ],
  }),
]

export const CATEGORIES = [
  { key: 'all',     label: 'All',      emoji: '✦'  },
  { key: 'shawl',   label: 'Shawls',   emoji: '🧣' },
  { key: 'muffler', label: 'Mufflers', emoji: '🧤' },
  { key: 'socks',   label: 'Socks',    emoji: '🧦' },
  { key: 'cap',     label: 'Caps',     emoji: '🧢' },
  { key: 'stole',   label: 'Stoles',   emoji: '🪡' },
]

export function formatINR(amount) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function getCartTotal(items) {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}
