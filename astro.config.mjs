import { defineConfig } from 'astro/config';
import { readdir, readFile, writeFile, rm, copyFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `npm run dev` has no .htaccess: send /search/{keyword}/... to the search page like the live server does.
const searchRewrite = {
  name: 'schs-search-rewrite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (/^\/search\/[^?]/.test(req.url)) req.url = '/search';
      next();
    });
  },
};

// GitHub Pages preview (.github/workflows/pages.yml) builds with PAGES_BASE=/SCHS_Web_-Vibe_Code-, so the site lives
// in that folder. The pages and data write links as "/images/...", "/product/...", so after the build this puts the
// folder in front of them, marks every page noindex (Google should only index the real site) and makes the 404 page
// send /search/... addresses to the search page (Pages can't use .htaccess). Normal builds are untouched.
const base = process.env.PAGES_BASE?.replace(/\/$/, '') || '';
const pagesPreview = {
  name: 'schs-pages-preview',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      if (!base) return;
      const root = fileURLToPath(dir);
      const local = `(?!/|${base.slice(1)}(?:/|"|'|\\)))`;
      const html = new RegExp(`(=["']|=\\\\"|:"|url\\(['"]?)/${local}`, 'g');
      const css = new RegExp(`(url\\(['"]?)/${local}`, 'g');
      for (const name of await readdir(root, { recursive: true })) {
        const f = join(root, name);
        if (f.endsWith('.html')) {
          let s = (await readFile(f, 'utf8')).replace(html, `$1${base}/`);
          s = s.replace('<head>', '<head>\n    <meta name="robots" content="noindex" />');
          if (f === join(root, '404.html')) s = s.replace('<head>', `<head>\n    <script>(function () {
      var p = location.pathname, s = '${base}/search/';
      if (p.indexOf(s) === 0) location.replace('${base}/search?path=' + encodeURIComponent(p.slice(s.length)));
    })();</script>`);
          await writeFile(f, s);
        } else if (f.endsWith('.css')) {
          await writeFile(f, (await readFile(f, 'utf8')).replace(css, `$1${base}/`));
        }
      }
      // "/category" is both category.html and a folder; Pages may open the folder, so give it the page as index.html
      for (const name of await readdir(root, { recursive: true })) {
        const dirOf = join(root, name.replace(/\.html$/, ''));
        if (name.endsWith('.html') && await stat(dirOf).then((d) => d.isDirectory(), () => false))
          await copyFile(join(root, name), join(dirOf, 'index.html')).catch(() => {});
      }
      // No PHP on GitHub Pages
      await rm(join(root, 'contact-send.php'), { force: true });
      await rm(join(root, '.htaccess'), { force: true });
    },
  },
};

export default defineConfig({
  site: 'https://www.schomesquare.co.th',
  base: base || undefined,
  // Pages are written as /about-us.html etc. and served without the extension by public/.htaccess
  build: { format: 'file', assets: '_assets' },
  trailingSlash: 'never',
  compressHTML: false,
  integrations: [pagesPreview],
  vite: { plugins: [searchRewrite] },
});
