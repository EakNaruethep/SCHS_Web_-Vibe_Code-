# schs-web: how to edit the ส.เจริญโฮมสแควร์ website

Static Astro site that copies https://www.schomesquare.co.th/ (moved off Makewebeasy). The owner (Eak) edits
only by asking an AI, so every change should be a small edit to a content file, then `npm run build`.
Keep the look identical to the old site: reuse the existing markup/classes, don't restyle.

## Working with Eak (always follow)

- Eak writes in Thai: reply in Thai.
- **Every reply uses this format** (headings exactly as written, bullets under each; write "-" when a part is empty):

  ```
  What I have done:
  * ...

  Remaining Action:
  * ...

  Waiting Your Decision
  * ...
  ```
- Branching: GitHub Flow as below. Content edits straight to `main`; layout/code on a branch + PR, squash-merge.
- **Do not deploy to GitHub Pages unless Eak asks.** Otherwise commit, push and test locally.
- Eak tests on their PC in `D:\Workspace\Claude\SCHS_Web_(Vibe_Code)\schs-web-git` with `git pull` + `npm run dev`
  (for a PR: `git fetch` + `git checkout <branch>`). `start-dev.bat` in the repo root does pull + install + dev + open browser.
- When Eak sets a new standing rule, add it to this list.

## Git workflow (GitHub Flow)

Repo: https://github.com/EakNaruethep/SCHS_Web_-Vibe_Code-. `main` is always deployable: whatever is on `main`
is what goes on Hostatom.

- **Content edits go straight to `main`**: text, prices, pictures, adding/hiding/reordering products, blog posts,
  albums, FAQ, menu entries, page sections (anything only in `src/data`, `src/sections` or `public/images`).
  Run `npm run build` first; commit only if it passes.
- **Layout or code changes go on a branch + pull request**: anything in `src/layouts`, `src/lib`, `src/pages`,
  `src/scripts`, `src/styles`, `src/partials`, `astro.config.mjs`, `public/.htaccess`, `public/contact-send.php`,
  or dependencies. Name the branch for the change: `feat/...`, `fix/...`, `content/...` (for a big content batch
  Eak wants to review first). Keep it short-lived, open a PR to `main`, wait for the Build check and Eak's OK,
  then **squash-merge** and delete the branch. Never push layout/code changes directly to `main`.
- Small commits with clear messages that say what changed for a visitor ("Add product X", "Fix phone menu
  overlap"). Never force-push `main` or rewrite its history.
- **Tag every deploy** to Hostatom with the date: `git tag v2026.10.31 && git push origin v2026.10.31`
  (a second deploy that day: `v2026.10.31.2`). To roll back, build the previous tag and upload it.
- The Build check (`.github/workflows/build.yml`) runs `npm ci && npm run build` on every PR and push to `main`.

## Where content lives (src/data)

| What | File(s) | Notes |
|---|---|---|
| Products | `data/products/<id>.json` | One file each. `order` sets position (lower first), `enabled: false` hides it. |
| Product categories | `data/categories.json` | `id`, `name`, `url`, `breadcrumb`, `seo`, `order`. A product joins a category via its `categories` list / `categoryPath`. `products` = product ids in the order the category page lists them (products not in it go last, by `order`). |
| Brands | `data/brands.json` | Product `brand.id` links to it. |
| Blog posts | `data/blog/<id>.json` | Newest `datePublished` first. `html` is the article body; `cover.src` the picture; `related` = ids. `status: "draft"` hides it. |
| Albums (ผลงาน) | `data/albums/<id>.json` | `order` sets position; `images` (each with `order`, `src`, `alt`). |
| FAQ | `data/faq.json` | Shown on /faq, /faq/39 and the home page FAQ widget. `order`, `enabled`. |
| Menu | `data/site/menu.json` | Header + mobile menu tree. |
| Site settings | `data/site/head.json` | Site name/url, Google Analytics id, chat widget id, favicon. |
| Captured SEO | `data/site/seo.json` | Titles/descriptions the old site used for list pages (fallback only). |
| Component styles | `data/site/styles.json` | CSS variables copied from Makewebeasy per component. Don't edit unless asked. |

Images live in `public/images/<folder>/...` (same folder names as Makewebeasy: 01_Home, 02_Aboutus,
03_Products, 04_Category, 05_Portfolio, 06_Blog, 07_edit). Reference them as `/images/03_Products/x.webp`.

### Builder pages (home, about-us, contact, catalog, faq, portfolios…)

Each is `data/pages/<key>.json` + ordered section files in `src/sections/<key>/NN-<id>.html`.

- **Reorder** sections: reorder the `sections` array in the JSON (file names don't need renaming).
- **Hide** a section: add `"hidden": true` to its entry. **Remove**: delete the entry (and the file).
- **Add** a section: copy a similar section file, edit its text/images, add it to `sections`.
- Edit text directly in the section HTML. Keep classes and inline CSS variables as they are.
- Widgets filled from data at build time:
  - `<div data-mwe-products="id,id,..."></div>`: product carousel (home page), in that order.
  - `<div data-category="39" data-mwe-faq="page|widget"></div>`: FAQ items from faq.json.

## Recipes

- **Add a product**: copy a similar `data/products/*.json`, give it a new unique `id` (and `skuId`), set
  `name`, `slug` (URL part, lowercase, dashes), `sku`, `price`/`salePrice`/`showPrice`, `brand`, `categories` +
  `categoryPath`, `intro`/`introHtml`, `images`, `tabs`, `tags`, `related`, `seo`, `order`, set `urls` to `[]`.
  Add its id to the category's `products` list in `categories.json` where it should appear.
  Products with options can list `variants` (`skuId`, `sku`, `values`, `images`); each variant URL in `urls`
  (`/product/<id>-<skuId>/<slug>`) then shows that option's SKU code and pictures. With two option groups (38280),
  `values` lists one value per group in order and a missing combination is greyed out.
  Put pictures in `public/images/03_Products/`. URL becomes `/product/<id>-<skuId>/<slug>` (single) or
  `/product/<id>/<slug>` (with options). Add it to the home carousel only if asked.
- **Add a blog post**: new `data/blog/<id>.json` with `id`, `title`, `url` (`/blog/<id>/<slug>`), `intro`,
  `cover`, `categories` (`[{"id":1066,"name":"บทความ","url":"/categoryblog/1066/บทความ"}]`), `tags`, `author`,
  `datePublished`, `dateUpdated`, `related`, `seo{title,description}`, `html`.
- **Add an album**: new `data/albums/<id>.json`, images in `public/images/05_Portfolio/`.
- **Prices**: only Kingfisher items show prices (`showPrice`). Everything else is "quote via LINE".
- Tags: any string in a product/blog `tags` array gets a `/tag/<tag>` page automatically.

## Build, check, publish

```
npm install          # once
npm run dev          # http://localhost:4321 while editing
npm run build        # writes dist/ (≈190 pages + sitemap.xml)
```

- `dist/` is what goes on Hostatom (Apache): upload everything inside it, including the hidden `.htaccess`,
  into `public_html`. `.htaccess` maps `/about-us` to `about-us.html` so URLs match the old site exactly.
- CSS warnings like `Expected "]"` during build come from the copied Makewebeasy CSS and are harmless.
- **GitHub Pages preview**: https://eaknaruethep.github.io/SCHS_Web_-Vibe_Code-/ (`.github/workflows/pages.yml`).
  Only deploy when Eak asks: run the "Pages preview" workflow by hand (Actions > Pages preview > Run workflow).
  Otherwise just commit, push and check the change locally (`npm run dev` / `npm run build`). It builds with `PAGES_BASE=/SCHS_Web_-Vibe_Code-`, and the `schs-pages-preview`
  step in astro.config.mjs puts that folder in front of every "/..." link, marks pages noindex, and sends
  /search/... through 404.html. No PHP there, so the contact form only works on Hostatom. Keep writing links as "/...".
- Never break existing URLs (Google ranks them). If a URL must change, add a 301 in `public/.htaccess`.

## Code map

- `src/layouts/Base.astro`: `<head>`, header/footer (from `src/partials/shell-*.html`), menu, cookie banner.
- `src/lib/site.js` data loading and helpers; `src/lib/cards.js` product/blog/FAQ HTML; `src/lib/listing.js`
  category/brand page lists; `src/lib/menu.js` menus.
- `src/pages/…` one route per page type (product, category, productbrand, blog, categoryblog, album,
  categoryalbum, faq, tag, builder pages, sitemap.xml, 404).
- `src/scripts/site.js` browser behaviour ("More" menu, phone side menu, search, product sliders, image galleries,
  album photo columns, hover zoom, share, tabs, sort/pagination, FAQ, cookies).
- `src/styles/makeweb/` Makewebeasy's own theme files (Bootstrap build, slick, customer-main, Sarabun font) and
  `runtime.css` (CSS their app added in the browser). `makeweb-components.css` = per-component CSS from the pages.
  `site.css` = our fixes. `phone.css` = phone sizes: Makewebeasy sent phones different inline CSS variables and
  markup. Base.astro sets classes on <html> like Makewebeasy decides its "device": `schs-phone` (phone user agent),
  `schs-mobile` (phone, or a window 576px wide or less) and `schs-tablet` (577-768px window). phone.css applies the
  phone sizes under `html.schs-mobile` and the phone-only layout (`.schs-phone-only` instead of `.schs-desktop-only`,
  product page bottom bar...) under `html.schs-phone`. A narrow desktop window otherwise keeps the desktop markup and
  the theme's own responsive CSS, as on live.
- Header: `src/partials/shell-top.html` holds both the desktop header and the phone header (`header-mobile-layout-1`).
  Desktop browsers switch to the phone header below 1110px with the big logo (site.css), like live.
- Search: boxes go to `/search/{keyword}` (tabs `/product`, `/content`, `/album`, `/page`). src/pages/search.astro
  is one page holding the searchable list; .htaccess sends every /search/... address to it and site.js shows the
  results. Pages tab = menu pages only, products sorted by id, like live.
- Floating LINE/phone buttons bottom right = Chatcone widget (head.json `chatconeId`), loaded from widget.chatcone.com.
- Maps use Google's keyless embed (Makewebeasy's map key only works on their domain).

## Contact form
- Markup is in src/sections/contact/01-*.html (`form[data-contact-form]`), checks and sending in src/scripts/site.js.
- public/contact-send.php emails each message to `MAIL_TO` (schs.contact@gmail.com; change it at the top of the file).
  GET gives the math question, POST sends. Spam protection: signed math question, hidden "website" field,
  3-second minimum, one use per question, 5 messages per hour per address. It writes its secret key to
  `.contact-secret.php` on first use (blocked in .htaccess). Needs PHP, so `npm run dev` can't send; test on Hostatom.

## Known gaps

- Font Awesome Pro (Makewebeasy's light/regular icons) is a paid licence, so Font Awesome 5 Free icons stand in.
  A few thin icons (arrows, chevrons) look slightly bolder than on the old site.
- "Related articles" under a blog post are fixed lists (`related`); Makewebeasy picked them at random.
- Tag pages list each product once (Makewebeasy repeated a product once per option) and have no
  "หน้าเพจ" tab, because page tags weren't in the downloaded data.
