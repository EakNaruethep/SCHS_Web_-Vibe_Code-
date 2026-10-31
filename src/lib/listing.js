// Which product listing pages exist and what they show.
import seo from '../data/site/seo.json';
import { categories, brands, products, productsInCategory, productsOfBrand } from './site.js';

const suffix = ' - ส.เจริญโฮมสแควร์';
const home = { text: 'หน้าแรก', url: '/' };

export function categoryPages() {
  return categories.flatMap((c) => {
    const items = productsInCategory(c.id);
    const crumbs = c.id === 'all' ? [home, { text: c.name, url: '/category' }] : [home, ...(c.breadcrumb || []).map((b) => ({ text: b.text, url: b.url }))];
    const page = { title: c.name, seo: { title: c.seo?.title || c.name + suffix, description: c.seo?.description || '' }, breadcrumb: crumbs, items };
    const urls = c.id === 'all' ? ['category'] : [`category/${c.id}`, c.url.replace(/^\//, '')];
    return [...new Set(urls)].map((u) => ({ path: u, page: withSeo(u, page) }));
  });
}

export function brandPages() {
  return brands.flatMap((b) => {
    const page = {
      title: b.name, seo: { title: b.seo?.title || b.name + suffix, description: b.seo?.description || '' },
      breadcrumb: [home, { text: 'แบรนด์สินค้า', url: '/productbrand' }, { text: b.name, url: b.url }], items: productsOfBrand(b.id),
    };
    return [...new Set([`productbrand/${b.id}`, b.url.replace(/^\//, ''), `productbrand/${b.id}/${b.name}`])].map((u) => ({ path: u, page: withSeo(u, page) }));
  });
}

// Prefer the title/description the live site used for this exact URL.
const withSeo = (u, page) => (seo['/' + u] ? { ...page, seo: seo['/' + u] } : page);
