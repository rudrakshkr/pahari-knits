const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// 1. Setup the connection pool using your environment variable
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Initialize the adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

const PRODUCTS = [
  {
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
    description: 'Hand-woven on traditional pit looms, this pure wool shawl features iconic "Kullu buti" geometric patterns. A skilled artisan takes days to complete each unique piece, creating a breathable yet warm layer that defines Himachali textile heritage.',
    images: [
      'https://images.unsplash.com/photo-1732476342752-6870145d1f9c?q=80&w=1469&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1737988007411-e85aa733efa1?q=80&w=687&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1638786023988-d27bed11e076?q=80&w=735&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510574457807-3d9bf494ff6b?q=80&w=801&auto=format&fit=crop',
    ],
  },
  {
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
    description: 'Featuring the distinctive stripes of the Baspa Valley, this Angora-blend muffler offers exceptional softness and warmth. Each piece is hand-finished with knotted fringes, maintaining a crisp pattern that is lightweight yet incredibly durable.',
    images: [
      'https://images.unsplash.com/photo-1517496267011-39d56c54984d?q=80&w=1074&auto=format&fit=crop',
      'https://plus.unsplash.com/premium_photo-1695603438043-1b9ab6ebe1a8?q=80&w=687&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1669626495508-58acf2311688?q=80&w=947&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1728034261963-3ff8c2490788?q=80&w=1470&auto=format&fit=crop',
    ],
  },
  {
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
    description: 'Knitted by artisan women in the Spiti high desert, these thick socks are crafted from unbleached local wool for sub-zero protection. Naturally moisture-resistant and reinforced for durability, they are a winter essential for extreme cold.',
    images: [
      'https://images.unsplash.com/photo-1739640081476-fd55589f8838?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1631180543602-727e1197619d?q=80&w=764&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566563634870-d566ab58a4df?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=687&auto=format&fit=crop',
    ],
  },
  {
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
    description: 'Adapting UNESCO-recognized embroidery, this gossamer pashmina-silk stole features precise double-sided silk motifs. Dyed with local botanicals, each piece represents weeks of intricate hand-stitching by master artisans in Chamba.',
    images: [
      'https://images.unsplash.com/photo-1761724794779-6b21b4a317c7?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1697781826540-20cff4de8acd?q=80&w=1074&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576073383268-a8aae73f33bd?q=80&w=687&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1760837992224-e73b2ba6f1c6?q=80&w=1470&auto=format&fit=crop',
    ],
  },
  {
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
    description: 'The traditional "Himachali topi" crafted from dense felted wool. This weather-resistant cap features iconic geometric banding and a structured hand-blocked finish, offering timeless mountain style that improves with age.',
    images: [
      'https://images.unsplash.com/photo-1699347611474-5be693bee31e?q=80&w=723&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1720534490358-bc2ad29d51d5?q=80&w=687&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589831377283-33cb1cc6bd5d?q=80&w=687&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1604532057336-2c4a09f71330?q=80&w=687&auto=format&fit=crop',
    ],
  },
  {
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
    description: 'A technical masterpiece, this reversible double-weave shawl features inverted colors on each side. Woven from fine merino wool by a heritage family in Rampur, it is one of the rarest examples of high-level Himachali handloom.',
    images: [
      'https://plus.unsplash.com/premium_photo-1725721362512-2f47d969e554?q=80&w=1143&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1688502769136-3d1bdee7b222?q=80&w=1493&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1700671788328-eecc12128f68?q=80&w=687&auto=format&fit=crop',
      'https://plus.unsplash.com/premium_photo-1768514188394-03b802d6e648?q=80&w=687&auto=format&fit=crop',
    ],
  }
];

async function main() {
  console.log('--- Starting Seed Process ---');
  
  for (const product of PRODUCTS) {
    const result = await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
    console.log(`✅ Upserted: ${result.name} (${result.id})`);
  }
  
  console.log('--- Seed Finished Successfully ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });