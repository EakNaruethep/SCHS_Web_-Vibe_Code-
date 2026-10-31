// Loads every content file and exposes helpers shared by the page templates.
const load = (mods) => Object.values(mods);
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.id).localeCompare(String(b.id));

export const allProducts = load(import.meta.glob('../data/products/*.json', { eager: true, import: 'default' }));
export const products = allProducts.filter((p) => p.enabled !== false).sort(byOrder);
export const blogs = load(import.meta.glob('../data/blog/*.json', { eager: true, import: 'default' }))
  .filter((b) => b.status !== 'draft')
  .sort((a, b) => String(b.datePublished).localeCompare(String(a.datePublished)));
export const albums = load(import.meta.glob('../data/albums/*.json', { eager: true, import: 'default' })).sort(byOrder);
import categoriesData from '../data/categories.json';
export const categories = categoriesData;
export { default as brands } from '../data/brands.json';
export { default as faq } from '../data/faq.json';
export { default as head } from '../data/site/head.json';
export const pages = import.meta.glob('../data/pages/*.json', { eager: true, import: 'default' });
export const sectionFiles = import.meta.glob('../sections/**/*.html', { eager: true, query: '?raw', import: 'default' });
export const partials = import.meta.glob('../partials/*.html', { eager: true, query: '?raw', import: 'default' });

export const enc = (u) => encodeURI(u);
// Strip HTML comments (editor notes) from rich text before it goes on the page.
export const stripComments = (h) => String(h || "").replace(/<!--[\s\S]*?-->/g, "");
export const NO_IMAGE = '/images/03_Products/No_Product.webp';

export const productById = (id) => products.find((p) => String(p.id) === String(id));

export function productUrl(p) {
  return p.type === 'variants' || !p.skuId ? `/product/${p.id}/${p.slug}` : `/product/${p.id}-${p.skuId}/${p.slug}`;
}

export function productImages(p) {
  const imgs = [...(p.images || [])].sort((a, b) => (b.default ? 1 : 0) - (a.default ? 1 : 0));
  return imgs.length ? imgs : [{ src: NO_IMAGE, alt: p.name, title: p.name }];
}

export const baht = (n) => '฿' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

export function priceInfo(p) {
  if (!p.showPrice || !p.price) return null;
  const sale = p.salePrice && p.salePrice < p.price ? p.salePrice : null;
  return { price: p.price, sale, discount: sale ? Math.round((1 - sale / p.price) * 100) : 0 };
}

export const categoryById = (id) => categories.find((c) => c.id === id);
export const categoryUrl = (c) => c.url;

// Products in a category: a product belongs to every category on its path.
// Order: the category's `products` list (its order on the live site), then any others by `order`.
export function productsInCategory(id) {
  const list = id === 'all' ? products : products.filter((p) => (p.categories || []).some((c) => c.id === id || c.id.startsWith(id + '-')));
  const ranked = categoryById(id)?.products || [];
  const rank = (p) => { const i = ranked.indexOf(String(p.id)); return i < 0 ? ranked.length : i; };
  return [...list].sort((a, b) => rank(a) - rank(b));
}
export const productsOfBrand = (id) => products.filter((p) => p.brand && String(p.brand.id) === String(id));
export const productsWithTag = (tag) => products.filter((p) => (p.tags || []).includes(tag));
export const allTags = () => [...new Set(products.flatMap((p) => p.tags || []))];

export const thaiDate = (s) => {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T') + '+07:00');
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' });
};
export { default as menu } from '../data/site/menu.json';
