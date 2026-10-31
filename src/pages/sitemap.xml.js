// Builds /sitemap.xml from the content files, so new products/posts/albums appear automatically.
import { pages, products, productUrl, categories, brands, blogs, albums, faq, head } from '../lib/site.js';

export function GET() {
  const now = new Date().toISOString().replace(/\.\d+Z$/, '+00:00');
  const entries = [];
  const add = (path, freq = 'weekly', priority = '0.75') => entries.push({ path, freq, priority });

  add('', 'daily', '1.0');
  Object.entries(pages).forEach(([file, p]) => { if (!file.endsWith('/index.json') && !p.noindex) add(p.url); });
  products.forEach((p) => add(productUrl(p), 'weekly', '0.8'));
  categories.forEach((c) => add(c.url));
  brands.forEach((b) => add(b.url));
  add('/categoryblog');
  [...new Map(blogs.flatMap((b) => b.categories || []).map((c) => [String(c.id), c])).values()].forEach((c) => add(c.url));
  blogs.forEach((b) => add(b.url, 'weekly', '0.8'));
  add('/categoryalbum');
  [...new Map(albums.map((a) => [String(a.category.id), a.category])).values()].forEach((c) => add(c.url));
  albums.forEach((a) => add(a.url));
  [...new Set(faq.map((f) => String(f.category.id)))].forEach((id) => { const c = faq.find((f) => String(f.category.id) === id).category; add(`/faq/${id}/${c.name.toLowerCase().replace(/[()]/g, '').trim().replace(/\s+/g, '-')}`); });

  const seen = new Set();
  const urls = entries.filter((e) => !seen.has(e.path) && seen.add(e.path)).map((e) =>
    `  <url><loc>${head.siteUrl}${encodeURI(e.path)}</loc><lastmod>${now}</lastmod><changefreq>${e.freq}</changefreq><priority>${e.priority}</priority></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
