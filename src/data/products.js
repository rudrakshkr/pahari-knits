export const PRODUCTS = [
  { id:'pk-001', name:'Kullu Valley Shawl', price:2499, category:'shawl', origin:'Kullu, Himachal Pradesh', description:'Hand-woven on traditional pit looms, this pure wool shawl carries the iconic geometric patterns of the Kullu valley. A warm embrace of mountain heritage.', imageUrl:'https://images.unsplash.com/photo-1732476342752-6870145d1f9c?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', badge:'Bestseller', inStock:true },
  { id:'pk-002', name:'Kinnauri Striped Muffler', price:899, category:'muffler', origin:'Kinnaur, Himachal Pradesh', description:'Crafted from soft Angora-blend wool in the earthy burgundy and ivory stripe typical of Kinnauri weaving traditions. Lightweight yet incredibly warm.', imageUrl:'https://images.unsplash.com/photo-1517496267011-39d56c54984d?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', badge:'New Arrival', inStock:true },
  { id:'pk-003', name:'Spiti Hand-Knit Woolen Socks', price:349, category:'socks', origin:'Spiti Valley, Himachal Pradesh', description:'Thick, hand-knit socks made by artisan women of the Spiti high desert. Designed to brave sub-zero winters — equally perfect for cold mornings at home.', imageUrl:'https://images.unsplash.com/photo-1739640081476-fd55589f8838?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', inStock:true },
  { id:'pk-004', name:'Chamba Embroidered Stole', price:1799, category:'stole', origin:'Chamba, Himachal Pradesh', description:"A fine pashmina-blend stole adorned with the signature 'Chamba Rumal' embroidery motifs. Each piece is a wearable work of art, weeks in the making.", imageUrl:'https://images.unsplash.com/photo-1761724794779-6b21b4a317c7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', badge:'Artisan Pick', inStock:true },
  { id:'pk-005', name:"Manali Shepherd's Cap", price:599, category:'cap', origin:'Manali, Himachal Pradesh', description:'The traditional topi reimagined — dense felted wool, a folded brim, and subtle geometric banding. A cultural icon that doubles as a modern winter essential.', imageUrl:'https://images.unsplash.com/photo-1699347611474-5be693bee31e?q=80&w=723&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', inStock:true },
  { id:'pk-006', name:'Rampur Double-Weave Shawl', price:3299, category:'shawl', origin:'Rampur Bushahr, Himachal Pradesh', description:'The rare double-weave technique produces a shawl reversible in two distinct patterns. Made with merino wool, it is heirloom quality — meant to be passed down.', imageUrl:'https://plus.unsplash.com/premium_photo-1725721362512-2f47d969e554?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', badge:'Limited Edition', inStock:true },
]

export const CATEGORIES = [
  { key:'all', label:'All', emoji:'✦' },
  { key:'shawl', label:'Shawls', emoji:'🧣' },
  { key:'muffler', label:'Mufflers', emoji:'🧤' },
  { key:'socks', label:'Socks', emoji:'🧦' },
  { key:'cap', label:'Caps', emoji:'🧢' },
  { key:'stole', label:'Stoles', emoji:'🪡' },
]

export function formatINR(amount) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function getCartTotal(items) {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}
