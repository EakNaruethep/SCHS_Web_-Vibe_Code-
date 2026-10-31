// HTML for product cards, shared by the home page widgets, listings and related products.
import { productById, productUrl, productImages, priceInfo, baht, enc, NO_IMAGE, faq } from './site.js';
import styles from '../data/site/styles.json';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function priceHtml(p, cls = 'mwe-page-product-price') {
  const pr = priceInfo(p);
  if (!pr) return '';
  return pr.sale
    ? `<div class="${cls} d-flex justify-content-center align-items-baseline flex-wrap gap-gd-1"><span class="product-sale-price">${baht(pr.sale)}</span><span class="product-price">${baht(pr.price)}</span></div>`
    : `<div class="${cls}"><span class="product-sale-price">${baht(pr.price)}</span></div>`;
}

// Card used on category / brand / tag listings ("mwe-page-product" markup)
export function listingCard(p) {
  const [img, hover] = productImages(p);
  const pr = priceInfo(p);
  const url = enc(productUrl(p));
  const badge = pr?.discount ? `<div class="mwe-page-product-badge-discount">-${pr.discount}%</div>` : '';
  const hoverImg = hover ? `<img alt="${esc(hover.alt || p.name)}" class="hover" loading="lazy" src="${enc(hover.src)}" style="object-fit:cover;" title="${esc(hover.title || p.name)}">` : '';
  return `<div class="mwe-page-product-cell"><div class="mwe-page-product-item d-flex flex-column"><div class="mwe-page-product-image"><div class="mwe-page-product-wrapper-badge-left"></div><div class="mwe-page-product-wrapper-badge-rigth"><div class="d-flex justify-content-end align-items-center">${badge}</div></div><a href="${url}"><img alt="${esc(img.alt || p.name)}" class="${hover ? 'default' : ''}" loading="lazy" src="${enc(img.src)}" style="object-fit:cover;" title="${esc(img.title || p.name)}">${hoverImg}</a></div><div class="mwe-page-product-detail flex-grow-1"><div class=""><div class="mwe-page-product-name"><a href="${url}"><h3 class="mb-0">${esc(p.name)}</h3></a></div>${priceHtml(p)}</div></div></div></div>`;
}

// Card used by the "สินค้าที่เกี่ยวข้อง" block on product pages
export function relatedCard(p) {
  const [img] = productImages(p);
  return `<a class="comp-product-relate-item" href="${enc(productUrl(p))}"><div class="product-relate-item-wrapper" style='--badge-discount-font-size:16px;--product-name-font-size:20px;--product-name-font-family:"Kanit_SemiBold", "Tahoma";--product-name-font-weight:normal;--product-name-font-style:normal;--product-name-text-decoration:unset;--product-name-font-color:rgba(var(--tpc-24), 100%);--product-price-font-size:20px;--product-price-special-font-size:18px;--product-price-font-family:"Kanit_Regular", "Tahoma";--product-price-font-weight:normal;--product-price-font-style:normal;--product-price-text-decoration:unset;--product-price-font-color:rgba(var(--tpc-24), 100%);--product-card-background-color:rgba(var(--tpc-11), 100%);--product-card-border-color:rgba(var(--tpc-51), 100%);--product-card-text-align:center;--product-card-padding:16px;--product-badge-size:60px;--widget-product-badge-crop-y:0px;'><div class="product-relate-item-image layout-square resize-crop"><img alt="${esc(img.alt || p.name)}" loading="lazy" src="${enc(img.src)}" title="${esc(img.title || p.name)}"><div class="pdr-badge-right"></div></div><div class="product-relate-item-detail"><h3 class="product-name">${esc(p.name)}</h3>${priceHtml(p, 'product-relate-item-price')}</div></div></a>`;
}

// Product slider used by the home page "สินค้าขายดี" widgets (Makewebeasy "mwe-widget-product-layout-slide" markup;
// site.js sizes the cells and moves the track, 4 per view on desktop and 2 on phones like the live slick settings)
export function productSlider(ids) {
  const items = ids.map(productById).filter(Boolean);
  if (!items.length) return '';
  const img = (i, p, cls) => `<img loading="lazy" src="${enc(i.src)}" alt="${esc(i.alt || p.name)}" title="${esc(i.title || p.name)}" class="${cls}" style="object-fit: cover;">`;
  const cells = items.map((p, n) => {
    const [first, hover] = productImages(p);
    const url = enc(productUrl(p));
    return `<div tabindex="-1" data-index="${n}" class="slick-slide"><div><div tabindex="-1" class="mwe-widget-product-layout-slide-product-cell" style="width: 100%; display: inline-block;"><div class="mwe-widget-product-layout-slide-item d-flex flex-column"><div class="mwe-widget-product-layout-slide-image"><div class="mwe-widget-product-layout-slide-wrapper-badge-left"> </div> <div class="mwe-widget-product-layout-slide-wrapper-badge-rigth"> <div class="d-flex justify-content-end align-items-center"></div></div> <a href="${url}">${img(first, p, hover ? 'default' : '')}${hover ? ' ' + img(hover, p, 'hover') : ''}</a> </div> <div class="mwe-widget-product-layout-slide-detail flex-grow-1"><div class=""><div class="mwe-widget-product-layout-slide-name"><a href="${url}"><h3 class="mb-0">${esc(p.name)}</h3></a></div></div></div></div></div></div></div>`;
  }).join('');
  return `<div class="mwe-widget-product"><div class="mwe-widget-product-layout-slide-wrapper-product justify-content-start arrow-layout-04  pb-gd-4" style='${styles['widget.product-slide']}' data-product-slider data-mobile-style="${esc(styles['widget.product-slide.mobile'])}"><div dir="ltr" class="slick-slider slick-initialized"><div class="slick-list"><div class="slick-track" style="opacity: 1;">${cells}</div></div><ul class="slick-dots" style="display: block;"></ul></div> <div class="custom-arrow slick-prev" style="display:none"></div> <div class="custom-arrow slick-next"></div></div></div>`;
}

// Replace widget placeholders left in section HTML by the import
export function fillWidgets(html) {
  return html
    .replace(/<div data-mwe-products="([^"]*)"><\/div>/g, (_, ids) => productSlider(ids.split(',')))
    .replace(/<div data-category="([^"]*)" data-mwe-faq="([^"]*)"><\/div>|<div data-mwe-faq="([^"]*)" data-category="([^"]*)"><\/div>/g,
      (_, c1, k1, k2, c2) => faqItems(c1 || c2, k1 || k2));
}

// FAQ accordion items from src/data/faq.json. kind 'page' = /faq page markup, 'widget' = home page FAQ widget.
export function faqItems(category, kind = 'page') {
  const items = faq.filter((f) => f.enabled !== false && (!category || String(f.category?.id) === String(category)))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const w = kind === 'widget';
  const ic = w ? 'wdg-faq-icon' : 'faq-icon';
  const sep = w ? '_' : '';
  return items.map((f) => {
    const icons = (side, active) => `<span class="mr-16 float-${side} ${ic}${active}"><i class="fal fa-chevron-down"></i></span> <span class="mr-16 float-${side} ${ic}"><i class="fal fa-chevron-down"></i></span> <span class="mr-16 float-${w ? side : 'left'} ${ic}"><i class="fal fa-plus"></i> </span>`;
    const card = `<div class="card faq-card"><div class="card-header faq-card-header cursor-pointer" id="heading${sep}${f.id}"><div aria-controls="collapse${f.id}" aria-expanded="false" data-target="#collapse${f.id}" data-toggle="collapse"><div class="faq-question">${icons('left', '')} <div>${f.question}</div> ${icons('right', w ? ' icon-active' : ' active')}</div></div></div> <div aria-labelledby="heading${sep}${f.id}" class="collapse" data-parent="#accordion${sep}${f.id}" id="collapse${f.id}"><div class="card-body faq-card-body"><div class="style-tinymce">${f.answerHtml}</div></div></div></div>`;
    return w ? `<div class="mb-16" id="accordion_${f.id}">${card}</div>` : `<div id="accordion${f.id}"><div style="margin-bottom:16px;">${card}</div></div>`;
  }).join('');
}

// Blog card used by the blog list pages (Makewebeasy "page-blog-05" layout).
export function blogCard(b) {
  const url = enc(b.url);
  const img = b.cover?.src || NO_IMAGE;
  return `<div class="wrapper-content"><div class="wrapper-detail"><div class="wrapper-img cursor-pointer"><a href="${url}"><img src="${enc(img)}" alt="${esc(b.title)}" loading="lazy" style="object-fit:contain;"></a></div>`
    + `<div class="wrapper-detail-content"><div class="blog-lable-name text-break cursor-pointer"><a href="${url}"><h3>${b.title}</h3></a></div>`
    + `<div class="blog-lable-intro text-break mt-gd-1"><div>${b.intro || ''}</div></div><div class="d-flex flex-wrap gap-gd-1 mt-gd-1 justify-content-start"></div></div></div></div>`;
}

// Small related-post card under a blog post.
export function blogRelatedCard(b) {
  const url = enc(b.url);
  return `<div class="wrapper-blog-relate-content"><div class="wrapper-img-blog-relate cursor-pointer"><a href="${url}"><img src="${enc(b.cover?.src || NO_IMAGE)}" alt="${esc(b.title)}" loading="lazy" style="object-fit:contain;"></a></div>`
    + `<div class="padding-blog-relate"><div class="blog-relate-name"><a href="${url}"><div>${b.title}</div></a></div>`
    + `<div class="mt-10 blog-relate-introduction"><div>${b.intro || ''}</div></div><div class="d-flex flex-wrap gap-gd-1 mt-gd-1 justify-content-start"></div></div></div>`;
}
