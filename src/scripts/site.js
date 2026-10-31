// Small replacements for the behaviour Makewebeasy's Vue app provided.

// Desktop menu: items that don't fit on one line go into "เพิ่มเติม", as on Makewebeasy.
const navbar = document.getElementById('elemenu');
const more = document.getElementById('menu_more');
if (navbar && more) {
  const moreList = more.querySelector('.menu-list-container');
  const items = [...navbar.children].filter((li) => li !== more);
  const asTop = (li, top) => {
    li.classList.toggle('nav-item', top);
    li.classList.toggle('dropdown', top);
    li.querySelector(':scope > a').classList.toggle('dropdown-item', !top);
    li.querySelector(':scope > a').classList.toggle('d-flex', !top);
  };
  const fit = () => {
    items.forEach((li) => { asTop(li, true); navbar.insertBefore(li, more); });
    more.classList.add('d-none');
    if (!navbar.offsetParent) return;
    const col = navbar.closest('.col-center') || navbar.parentElement;
    const used = () => [...navbar.children].reduce((w, li) => w + (li.classList.contains('d-none') ? 0 : li.offsetWidth), 0);
    for (let i = items.length - 1; i > 0 && used() > col.clientWidth; i--) {
      more.classList.remove('d-none');
      asTop(items[i], false);
      moreList.prepend(items[i]);
    }
  };
  fit();
  document.fonts?.ready.then(fit);
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 100); });
  more.querySelector(':scope > a').addEventListener('click', (e) => e.preventDefault());
}

// Search boxes (header, phone search bar, search page): go to /search/{keyword} like Makewebeasy.
// BASE is '' on the real site and '/SCHS_Web_-Vibe_Code-' on the GitHub Pages preview (astro.config.mjs)
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const searchUrl = (q) => BASE + '/search/' + encodeURIComponent(q);
document.querySelectorAll('[data-site-search], #topSearchBar input').forEach((box) => {
  const go = () => { const q = box.value.trim(); if (q) location.href = searchUrl(q); };
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  const group = box.closest('.input-group');
  group?.querySelector('.input-group-text, [data-search-go]')?.addEventListener('click', go);
});

// Search page (/search/{keyword}/{tab}): the list of products, posts, albums and pages is in #search-data.
const searchPage = document.querySelector('[data-search-page]');
if (searchPage) {
  const data = JSON.parse(document.getElementById('search-data').textContent);
  // GitHub Pages has no .htaccess: its 404 page sends /search/{keyword}/{tab} here as ?path=, put the address back
  const sent = new URLSearchParams(location.search).get('path');
  if (sent) history.replaceState(null, '', BASE + '/search/' + sent);
  const parts = location.pathname.slice(BASE.length).split('/').filter(Boolean).slice(1).map(decodeURIComponent);
  const q = (parts[0] || new URLSearchParams(location.search).get('q') || '').trim();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const found = Object.fromEntries(Object.entries(data).map(([k, list]) => [k, words.length ? list.filter((x) => words.every((w) => x.t.includes(w))) : []]));
  const total = Object.values(found).reduce((n, l) => n + l.length, 0);
  const labels = { product: 'สินค้า', content: 'บทความ', album: 'แกลเลอรี่', page: 'หน้าเพจ' };
  const tabs = Object.keys(labels).filter((k) => found[k].length);
  const tab = tabs.includes(parts[1]) ? parts[1] : tabs[0];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  searchPage.querySelector('[data-site-search]').value = q;
  document.title = `ค้นหา "${q}" - ส.เจริญโฮมสแควร์`;
  searchPage.querySelector('[data-search-summary]').textContent = total
    ? `ผลการค้นหาสำหรับ "${q}" พบ ${total} รายการ` : `Not found search result for "${q}"`;
  searchPage.querySelector('[data-search-tabs]').innerHTML = tabs.map((k) =>
    `<a href="${searchUrl(q)}/${k}"><button type="button" class="btn btn-secondary${k === tab ? ' active' : ''}">${labels[k]} <span>(${found[k].length})</span></button></a>`).join(' ');
  if (!tabs.length) searchPage.querySelector('[data-search-tabs]').remove();
  if (tab === 'product') {
    const box = searchPage.querySelector('[data-search-products]');
    box.hidden = false;
    box.querySelector('[data-grid]').innerHTML = found.product.map((x, i) => x.html.replace('<div class="mwe-page-product-cell">', `<div class="mwe-page-product-cell" data-i="${i}">`)).join('');
    searchPage.querySelector('[data-search-results]').remove();
  } else if (tab) {
    searchPage.querySelector('[data-search-products]').remove();
    searchPage.querySelector('[data-search-results]').innerHTML = found[tab].map((x) =>
      `<div class="search-data-list"><div class="search-data-row d-flex">${x.img ? `<div class="search-data-image-thumb"><a href="${x.url}"><img src="${x.img}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;"></a></div> ` : ''}<div class="search-data-detail"><div><a href="${x.url}">${esc(x.name)}</a></div>${x.sub ? ` <div>${esc(x.sub)}</div>` : ''}</div></div> <hr></div>`).join('');
  } else {
    searchPage.querySelector('[data-search-products]').remove();
    searchPage.querySelector('[data-search-results]').remove();
  }
}

// Phone side menu (Makewebeasy "menu-sidenav-mobile-01"): like live, tapping a row that has a submenu (name or arrow)
// opens that submenu; a row without one, or the title row at the top of a submenu, opens its page.
const sidenav = document.querySelector('#menu-sidenav-mobile-01');
if (sidenav) {
  const data = JSON.parse(document.querySelector('#sidenav-data')?.textContent || '[]');
  const overlay = sidenav.querySelector('#side-nav-overlay');
  const lv = (n) => sidenav.querySelector(`#side-nav-lv${n}`);
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const trail = []; // menu nodes opened at levels 2..4
  const item = (n, cls, i = -1) => `<li data-i="${i}"${n.children?.length ? ' data-has-sub' : ''}><div class="${cls}"><div class="menu-text${n.children?.length ? '' : ' pr-20'}"><span>${esc(n.name)}</span> <a href="${encodeURI(n.url)}" target="_self" style="display:none;">${esc(n.name)}</a></div>${n.children?.length ? ' <div class="menu-arrow"><i class="fal fa-angle-right"></i></div>' : ''}</div></li>`;
  const open = (show) => {
    lv(1).classList.toggle('expand', show);
    overlay.classList.toggle('hide', !show);
    document.body.style.overflow = show ? 'hidden' : '';
    if (!show) { [2, 3, 4].forEach((n) => { lv(n).classList.remove('expand'); lv(n).classList.add('hide'); }); trail.length = 0; }
  };
  const drill = (level, node) => {
    trail.length = level - 2;
    trail.push(node);
    const panel = lv(level);
    panel.querySelector('.label').textContent = level === 2 ? 'Home' : trail[level - 3].name;
    panel.querySelector('.menu-list-container').innerHTML = `<ul id="menu-level${level}" class="menu-list">${item({ ...node, children: [] }, 'menu-list-item-title')}${node.children.map((c, i) => item(c, 'menu-list-item', i)).join('')}</ul>`;
    panel.classList.remove('hide');
    requestAnimationFrame(() => panel.classList.add('expand'));
  };
  const back = (level) => { const panel = lv(level); panel.classList.remove('expand'); setTimeout(() => panel.classList.add('hide'), 200); trail.length = level - 2; };
  document.querySelectorAll('[data-sidenav-open]').forEach((b) => b.addEventListener('click', () => open(true)));
  overlay.addEventListener('click', () => open(false));
  sidenav.addEventListener('click', (e) => {
    if (e.target.closest('.close-btn')) return open(false);
    const panel = e.target.closest('.side-nav');
    const level = Number(panel?.id.replace('side-nav-lv', '')) || 1;
    if (e.target.closest('.back-btn')) return back(level);
    const li = e.target.closest('li');
    if (!li) return;
    if (li.hasAttribute('data-has-sub')) {
      const node = (level === 1 ? data : trail[level - 2].children)[Number(li.dataset.i)];
      if (node && level < 4) drill(level + 1, node);
      return;
    }
    const a = li.querySelector('a'); if (a) location.href = a.href;
  });
}

// Phone product pictures: swipe sideways (CSS scroll snap); the "1/3" counter follows
document.querySelectorAll('[data-phone-gallery]').forEach((g) => {
  const list = g.querySelector('.slick-list');
  const paging = g.querySelector('.image-paging');
  const n = g.querySelectorAll('.slick-slide').length;
  list.addEventListener('scroll', () => { if (paging) paging.textContent = `${Math.round(list.scrollLeft / list.clientWidth) + 1}/${n}`; }, { passive: true });
});

// Phone search icon slides the search bar open under the header (the theme CSS animates #topSearchBar.show)
document.querySelectorAll('[data-search-toggle]').forEach((b) => b.addEventListener('click', () => {
  const bar = document.querySelector('#topSearchBar');
  const header = b.closest('#topZone');
  document.querySelector('#section-header')?.style.setProperty('--searchbar-top', `${header.offsetHeight}px`);
  bar.style.display = '';
  const show = bar.classList.toggle('show');
  b.querySelector('#layout-icon')?.classList.toggle('collapsed', !show);
  if (show) bar.querySelector('input')?.focus();
}));

// Cookie consent banner
const pdpa = document.getElementById('pdpa-wrapper');
const CONSENT = 'schs-cookie-consent';
let consented = false;
try { consented = localStorage.getItem(CONSENT) === '1'; } catch {}
if (pdpa && !consented) pdpa.classList.add('show');
document.getElementById('btnAcceptPd')?.addEventListener('click', () => {
  try { localStorage.setItem(CONSENT, '1'); } catch {}
  pdpa?.classList.remove('show');
});
document.getElementById('btn_setting_cookie')?.addEventListener('click', () => { window.location.href = BASE + '/cookies-policy'; });

// Back to top button
const toTop = document.getElementById('toTop');
if (toTop) {
  const onScroll = () => toTop.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Collapsible blocks (product short description, FAQ answers)
document.querySelectorAll('[data-collapse-target]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const box = document.getElementById(link.dataset.collapseTarget);
    if (!box) return;
    const open = !box.classList.contains('show');
    box.classList.toggle('show', open);
    link.querySelector('.rotate-animate')?.classList.toggle('rotate-180', open);
  });
});

// Swipe / mouse drag for the sliders (slick allowed both): the row follows the finger, then moves one step
// (dir 1 = next, -1 = previous) or springs back (0).
function addSwipe(area, track, step) {
  let x0 = null, y0 = 0, base = 0, moved = false;
  area.style.touchAction = 'pan-y';
  area.addEventListener('dragstart', (e) => e.preventDefault());
  area.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    x0 = e.clientX; y0 = e.clientY; moved = false;
    base = new DOMMatrix(getComputedStyle(track).transform).m41;
  });
  area.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    if (!moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - y0)) {
      moved = true; track.style.transition = 'none'; area.setPointerCapture(e.pointerId);
    }
    if (moved) track.style.transform = `translate3d(${base + dx}px, 0px, 0px)`;
  });
  const end = (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (moved) step(dx < -40 ? 1 : dx > 40 ? -1 : 0);
  };
  area.addEventListener('pointerup', end);
  area.addEventListener('pointercancel', end);
  // a drag isn't a click on the picture/product underneath
  area.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
}

// Product sliders (Makewebeasy product widget = slick, 4 per view and 4 per step, 2 on phones and at 576px and below, not infinite, dots + arrows).
// The theme CSS reads the sizes from CSS variables, so we set the same ones Makewebeasy's script sets.
document.querySelectorAll('[data-product-slider]').forEach((root) => {
  const track = root.querySelector('.slick-track');
  const slides = [...track.children];
  const dots = root.querySelector('.slick-dots');
  const prev = root.querySelector('.slick-prev');
  const next = root.querySelector('.slick-next');
  let page = 0;
  let cell = 0;
  const html = document.documentElement;
  const perView = () => (html.classList.contains('schs-mobile') ? 2 : 4);
  // phone sizes (smaller text, arrows outside) as Makewebeasy sets them for phones and windows 768px wide or less
  const base = root.getAttribute('style');
  const mobile = root.dataset.mobileStyle || '';
  let wasPhone = null;
  const pages = () => Math.max(1, Math.ceil((slides.length - perView()) / perView()) + 1);
  const first = () => Math.min(page * perView(), Math.max(0, slides.length - perView())); // first slide shown
  const place = () => {
    const phone = html.classList.contains('schs-mobile') || html.classList.contains('schs-tablet');
    if (phone !== wasPhone) { root.setAttribute('style', phone ? `${base}; ${mobile}` : base); wasPhone = phone; }
    const w = root.clientWidth;
    const listW = w + 15;
    cell = listW / perView();
    root.style.setProperty('--widget-product-slick-slider-width', `${w}px`);
    root.style.setProperty('--widget-product-slick-list-width', `${listW}px`);
    root.style.setProperty('--widget-product-cell-width', `${cell}px`);
    root.style.setProperty('--widget-product-cell-percent', `0 0 ${100 / perView()}%`);
    root.style.setProperty('--widget-product-cell-max-width', `${100 / perView()}%`);
    const index = first();
    slides.forEach((s, i) => {
      s.style.width = `${cell}px`;
      const on = i >= index && i < index + perView();
      s.classList.toggle('slick-active', on);
      s.classList.toggle('slick-current', i === index);
      s.setAttribute('aria-hidden', String(!on));
    });
    track.style.width = `${cell * slides.length}px`;
    track.style.transform = `translate3d(${-index * cell}px, 0px, 0px)`;
    const n = pages();
    if (dots.children.length !== n) dots.innerHTML = Array.from({ length: n }, (_, i) => `<li><button>${i + 1}</button></li>`).join('');
    [...dots.children].forEach((li, i) => li.classList.toggle('slick-active', i === page));
    dots.style.display = n > 1 ? 'block' : 'none';
    prev.style.display = page > 0 ? '' : 'none';
    next.style.display = page < n - 1 ? '' : 'none';
  };
  const go = (i) => { page = Math.min(pages() - 1, Math.max(0, i)); track.style.transition = 'transform .5s ease'; place(); };
  prev.addEventListener('click', () => go(page - 1));
  next.addEventListener('click', () => go(page + 1));
  dots.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) go([...dots.children].indexOf(li)); });
  addSwipe(root.querySelector('.slick-list'), track, (d) => go(page + d));
  window.addEventListener('resize', () => { page = Math.min(page, pages() - 1); place(); });
  place();
});

// Album photo columns (vue-masonry-css): photo i goes to column i % cols; 2 columns at 600px and below.
document.querySelectorAll('[data-masonry]').forEach((root) => {
  const items = [...root.querySelectorAll('.item')];
  let current = 0;
  const layout = () => {
    const cols = window.innerWidth <= 600 ? Number(root.dataset.colsPhone) : Number(root.dataset.cols);
    if (cols === current) return;
    current = cols;
    const n = Math.min(cols, items.length);
    const columns = Array.from({ length: n }, () => {
      const c = document.createElement('div');
      c.setAttribute('style', `box-sizing: border-box; background-clip: padding-box; width: ${(100 / cols).toFixed(4)}%; border-width: 0px 0px 0px 16px; border-style: solid; border-color: transparent;`);
      return c;
    });
    items.forEach((it, i) => columns[i % n].append(it));
    root.replaceChildren(...columns);
  };
  layout();
  window.addEventListener('resize', layout);
});

// Image galleries (Makewebeasy's image-gallery widget is slick with centerMode, variableWidth and infinite):
// the current picture sits in the middle, copies on both sides make the row endless, arrows/dots move one picture.
document.querySelectorAll('[data-gallery]').forEach((root) => {
  const list = root.querySelector('.slick-list');
  const track = root.querySelector('.slick-track');
  const real = [...track.children];
  if (real.length < 2) return;
  const n = real.length;
  const copy = (s) => { const c = s.cloneNode(true); c.classList.add('slick-cloned'); c.setAttribute('aria-hidden', 'true'); return c; };
  track.prepend(...real.map(copy));
  track.append(...real.map(copy));
  const all = [...track.children];
  const dots = root.querySelector('.slick-dots');
  if (dots) dots.innerHTML = real.map((_, i) => `<li><button type="button">${i + 1}</button></li>`).join('');
  let index = 0;
  // Phones and narrow windows: Makewebeasy switched the gallery to its "mobile" variant (its own picture height, data-phone-fit-hr)
  const phoneFitHr = Number(root.dataset.phoneFitHr) || 0;
  const setPhone = () => {
    const cls = document.documentElement.classList;
    const phone = cls.contains('schs-mobile');
    const tablet = cls.contains('schs-tablet');
    const swap = (el) => { el.classList.toggle('mobile', phone); el.classList.toggle('tablet', tablet); el.classList.toggle('desktop', !phone && !tablet); };
    [root, root.closest('.wrapper-image-gallery'), ...root.querySelectorAll('.slide-wrapper')].filter(Boolean).forEach(swap);
    if (phone && phoneFitHr) root.style.setProperty('--wrapper-slick-fit-hr', `${phoneFitHr}px`);
    else if (!phone && root.dataset.desktopFitHr) root.style.setProperty('--wrapper-slick-fit-hr', root.dataset.desktopFitHr);
  };
  root.dataset.desktopFitHr = root.style.getPropertyValue('--wrapper-slick-fit-hr');
  const place = (animate) => {
    setPhone();
    root.style.setProperty('--wrapper-slick-fit-w-max', `${list.clientWidth}px`);
    const s = all[index + n];
    const padLeft = parseFloat(getComputedStyle(list).paddingLeft) || 0;
    const x = s.offsetLeft + s.offsetWidth / 2 - (list.clientWidth / 2 - padLeft);
    track.style.transition = animate ? 'transform .5s ease' : 'none';
    track.style.transform = `translate3d(${-x}px, 0px, 0px)`;
    all.forEach((el, i) => el.classList.toggle('slick-current', i === index + n));
    const at = ((index % n) + n) % n;
    dots?.querySelectorAll('li').forEach((li, i) => li.classList.toggle('slick-active', i === at));
  };
  const go = (i) => { index = i; place(true); };
  track.addEventListener('transitionend', () => { if (index < 0 || index >= n) { index = ((index % n) + n) % n; place(false); } });
  root.querySelector('.slick-prev')?.addEventListener('click', () => go(index - 1));
  root.querySelector('.slick-next')?.addEventListener('click', () => go(index + 1));
  dots?.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) go([...dots.children].indexOf(li)); });
  const ms = Number(root.dataset.autoplay);
  if (ms) setInterval(() => go(index + 1), ms);
  addSwipe(list, track, (d) => go(index + d));
  track.querySelectorAll('img').forEach((img) => img.addEventListener('load', () => place(false)));
  window.addEventListener('resize', () => place(false));
  place(false);
});

// Product options in two groups (product 38280: ขนาด + เกรด), like Makewebeasy: tap marks one value per group (tap again
// to clear) and shows it next to the SKU; once every group has a value, that option's own page opens (its SKU code and
// picture). Values that have no option next to the current pick are greyed out. Clearing a value on an option's page
// goes back to the product's page with the other value still picked.
const optionData = document.querySelector('[data-option-variants]');
if (optionData) {
  const { base, variants } = JSON.parse(optionData.textContent);
  const buttons = [...document.querySelectorAll('[data-option][data-value]')];
  const picked = [];
  buttons.forEach((b) => { picked[+b.dataset.option] ??= b.classList.contains('active') ? b.dataset.value : null; });
  const onVariantPage = picked.every(Boolean);
  const match = (vals) => variants.find((v) => v.values.every((x, i) => vals[i] == null || x === vals[i]));
  const show = () => {
    buttons.forEach((b) => {
      const g = +b.dataset.option, on = picked[g] === b.dataset.value;
      const off = !on && !match(picked.map((x, i) => (i === g ? b.dataset.value : x)));
      const span = b.querySelector('span');
      b.classList.toggle('active', on); span.classList.toggle('active', on);
      b.classList.toggle('disabled', off); span.classList.toggle('disabled', off);
      b.querySelector('.fa-check')?.remove();
      if (on) b.insertAdjacentHTML('beforeend', '<i class="fas fa-check"></i>');
    });
    const text = document.querySelector('[data-option-text]');
    if (text) { text.hidden = !picked.some(Boolean); text.querySelector('.product-option').textContent = picked.filter(Boolean).join(', '); }
  };
  if (!onVariantPage) {
    try {
      const kept = JSON.parse(sessionStorage.getItem('schs-options') || 'null');
      sessionStorage.removeItem('schs-options');
      if (Array.isArray(kept) && kept.length === picked.length) { picked.splice(0, picked.length, ...kept); show(); }
    } catch {}
  }
  buttons.forEach((b) => b.addEventListener('click', () => {
    const g = +b.dataset.option, next = picked.slice();
    next[g] = next[g] === b.dataset.value ? null : b.dataset.value;
    // A greyed-out value clears the pick it doesn't go with
    if (next[g] && !match(next)) next.forEach((x, i) => { if (i !== g) next[i] = null; });
    if (next.every(Boolean)) { location.href = match(next).url; return; }
    if (onVariantPage) {
      try { sessionStorage.setItem('schs-options', JSON.stringify(next)); } catch {}
      location.href = base;
      return;
    }
    picked.splice(0, picked.length, ...next);
    show();
  }));
}

// Product page: thumbnails swap the main image, tabs switch panels
// Product image "Hover to zoom" (Makewebeasy used vue-hover-zoom): 2x zoom that follows the mouse.
document.querySelectorAll('[data-zoom]').forEach((box) => {
  const img = box.querySelector('img');
  box.addEventListener('mousemove', (e) => {
    const r = box.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    box.classList.add('zooming');
  });
  box.addEventListener('mouseleave', () => box.classList.remove('zooming'));
});

// Share button next to the SKU opens a small LINE share menu.
document.querySelectorAll('[data-share-dropdown]').forEach((dd) => {
  const btn = dd.querySelector('button');
  btn.addEventListener('click', (e) => { e.stopPropagation(); const open = dd.classList.toggle('show'); dd.querySelector('.dropdown-menu').classList.toggle('show', open); btn.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', () => { dd.classList.remove('show'); dd.querySelector('.dropdown-menu').classList.remove('show'); });
});

document.querySelectorAll('[data-product-gallery]').forEach((g) => {
  const main = g.querySelector('[data-main-image]');
  g.querySelectorAll('[data-thumb]').forEach((t) => t.addEventListener('click', () => {
    main.src = t.dataset.thumb; main.alt = t.dataset.alt;
    g.querySelectorAll('.selected-to-watch').forEach((x) => x.classList.remove('selected-to-watch'));
    t.classList.add('selected-to-watch');
  }));
});
document.querySelectorAll('[data-tabs]').forEach((box) => {
  box.querySelectorAll('[data-tab]').forEach((tab) => tab.addEventListener('click', () => {
    box.querySelectorAll('[data-tab]').forEach((x) => { x.classList.toggle('active', x === tab); x.firstElementChild?.classList.toggle('active', x === tab); });
    box.querySelectorAll('[data-tab-panel]').forEach((p) => { p.hidden = p.dataset.tabPanel !== tab.dataset.tab; });
  }));
});

// Product listings: sort dropdown and 20-per-page pagination (done in the browser, like the old site)
document.querySelectorAll('[data-listing]').forEach((box) => {
  const grid = box.querySelector('[data-grid]');
  const pager = box.querySelector('[data-pager]');
  const cells = [...grid.children];
  const PER = 20;
  let page = 1;
  const sorters = [
    (a, b) => a.dataset.i - b.dataset.i,
    (a, b) => b.dataset.date.localeCompare(a.dataset.date),
    (a, b) => a.dataset.i - b.dataset.i,
    (a, b) => (Number(a.dataset.price) || Infinity) - (Number(b.dataset.price) || Infinity),
    (a, b) => (Number(b.dataset.price) || -1) - (Number(a.dataset.price) || -1),
    (a, b) => a.dataset.name.localeCompare(b.dataset.name, 'th'),
  ];
  const render = () => {
    const pages = Math.max(1, Math.ceil(cells.length / PER));
    page = Math.min(page, pages);
    [...grid.children].forEach((c, i) => { c.style.display = i >= (page - 1) * PER && i < page * PER ? '' : 'none'; });
    const li = (label, p, { active = false, disabled = false } = {}) =>
      `<li class="page-item${active ? ' active' : ''}${disabled ? ' disabled' : ''}" role="presentation"><button type="button" class="page-link" data-page="${p}" ${disabled ? 'disabled' : ''}>${label}</button></li>`;
    pager.innerHTML = li('<i class="far fa-chevron-left"></i>', page - 1, { disabled: page === 1 }) +
      Array.from({ length: pages }, (_, i) => li(i + 1, i + 1, { active: i + 1 === page })).join('') +
      li('<i class="far fa-chevron-right"></i>', page + 1, { disabled: page === pages });
  };
  pager.addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    page = Number(b.dataset.page); render(); box.scrollIntoView({ behavior: 'smooth' });
  });
  const dd = box.querySelector('.customer-normalselect');
  dd?.querySelector('[data-dropdown-toggle]').addEventListener('click', () => dd.querySelector('.dropdown-menu').classList.toggle('show'));
  dd?.querySelectorAll('[data-sort]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    dd.querySelectorAll('.active').forEach((x) => x.classList.remove('active'));
    a.classList.add('active'); a.parentElement.classList.add('active');
    dd.querySelector('.customer-normalselect-selected').textContent = a.textContent.trim();
    dd.querySelector('.dropdown-menu').classList.remove('show');
    cells.sort(sorters[a.dataset.sort]).forEach((c) => grid.appendChild(c));
    page = 1; render();
  }));
  render();
});

// FAQ accordions: [data-toggle="collapse"][data-target="#id"]; one open per accordion, icon flips.
document.querySelectorAll('[data-toggle="collapse"][data-target]').forEach((head) => {
  head.addEventListener('click', () => {
    const box = document.querySelector(head.dataset.target);
    if (!box) return;
    const open = !box.classList.contains('show');
    box.classList.toggle('show', open);
    head.setAttribute('aria-expanded', String(open));
    head.closest('.faq-card')?.classList.toggle('faq-open', open);
  });
});

// Contact form (/contact): same checks and messages as Makewebeasy's form, sent to /contact-send.php,
// which emails it (Hostatom PHP). The math question comes from the PHP script.
const contact = document.querySelector('[data-contact-form]');
if (contact) {
  const q = contact.querySelector('[data-captcha-q]');
  const answer = contact.querySelector('input[name="captcha"]');
  const token = contact.querySelector('input[name="token"]');
  const accept = contact.querySelector('input[name="accept"]');
  const submit = contact.querySelector('button[type="submit"]');
  const type = contact.querySelector('input[name="type"]');
  const dd = contact.querySelector('#customer-normalselect');
  const captchaNote = contact.querySelector('.label-captcha');
  let tried = false;

  const newQuestion = () => {
    answer.value = '';
    fetch(BASE + '/contact-send.php', { cache: 'no-store' }).then((r) => r.json())
      .then((d) => { q.textContent = d.q; token.value = d.token; })
      .catch(() => { q.textContent = '?'; });
  };
  newQuestion();
  contact.querySelector('[data-captcha-refresh]').addEventListener('click', newQuestion);

  const toggle = (open) => { dd.classList.toggle('show', open); dd.querySelector('.dropdown-menu').classList.toggle('show', open); dd.querySelector('button').setAttribute('aria-expanded', String(open)); };
  dd.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); toggle(!dd.classList.contains('show')); });
  document.addEventListener('click', () => toggle(false));
  dd.querySelectorAll('.dropdown-item').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    type.value = a.textContent.trim();
    dd.querySelector('.customer-normalselect-selected').textContent = type.value;
    toggle(false);
    if (tried) check();
  }));

  contact.querySelector('.accept-label').addEventListener('click', (e) => { if (!e.target.closest('a')) { accept.checked = !accept.checked; accept.dispatchEvent(new Event('change')); } });
  accept.addEventListener('change', () => { submit.classList.toggle('readonly', !accept.checked); if (tried) check(); });

  const setError = (field, text) => {
    const box = field.closest('.field');
    let msg = box.querySelector('.field-error');
    (field.matches('input[type=hidden]') ? dd : field).classList.toggle('error', !!text);
    if (!text) { msg?.remove(); return; }
    if (!msg) { msg = document.createElement('div'); msg.className = 'field-error'; msg.style.cssText = 'color: rgb(217, 83, 79); font-size: 14px; position: absolute; bottom: -20px;'; box.append(msg); }
    msg.textContent = text;
  };
  const check = () => {
    let ok = true;
    contact.querySelectorAll('.field.required input, .field.required textarea').forEach((f) => {
      const v = f.value.trim();
      const text = !v ? 'กรุณากรอกข้อมูล' : f.dataset.check === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'รูปแบบอีเมลไม่ถูกต้อง' : '';
      setError(f, text);
      if (text) ok = false;
    });
    const noAnswer = !answer.value.trim();
    answer.classList.toggle('error', noAnswer); captchaNote.classList.toggle('error', noAnswer);
    let acceptMsg = contact.querySelector('.accept-error');
    if (!accept.checked && !acceptMsg) { acceptMsg = document.createElement('div'); acceptMsg.className = 'fs-sa-14 text-danger mt-gd-half accept-error'; acceptMsg.textContent = 'กรุณายอมรับนโยบายความเป็นส่วนตัว'; contact.querySelector('.accept-wrapper').after(acceptMsg); }
    if (accept.checked) acceptMsg?.remove();
    return ok && !noAnswer && accept.checked;
  };
  contact.querySelectorAll('input, textarea').forEach((f) => f.addEventListener('input', () => { if (tried) check(); }));

  const status = (text, error) => {
    let s = contact.querySelector('.status-msg');
    if (!s) { s = document.createElement('div'); s.className = 'status-msg'; contact.append(s); }
    s.classList.toggle('error', !!error);
    s.textContent = text;
  };
  const errors = {
    captcha: 'คำตอบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
    limit: 'ส่งข้อความหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง หรือติดต่อเราทาง LINE หรือโทรศัพท์',
  };
  contact.addEventListener('submit', (e) => {
    e.preventDefault();
    tried = true;
    if (!check() || submit.disabled) return;
    submit.disabled = true;
    fetch(contact.action, { method: 'POST', body: new FormData(contact) })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          contact.reset(); type.value = ''; tried = false;
          dd.querySelector('.customer-normalselect-selected').textContent = 'กรุณาเลือก';
          submit.classList.add('readonly');
          status('ส่งข้อความเรียบร้อยแล้ว ขอบคุณที่ติดต่อเรา');
        } else {
          if (d.error === 'captcha') { answer.classList.add('error'); captchaNote.classList.add('error'); }
          status(errors[d.error] || 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อเราทาง LINE หรือโทรศัพท์', true);
        }
        newQuestion();
      })
      .catch(() => status('ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อเราทาง LINE หรือโทรศัพท์', true))
      .finally(() => { submit.disabled = false; });
  });
}
