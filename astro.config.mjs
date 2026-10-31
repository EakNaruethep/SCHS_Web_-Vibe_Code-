import { defineConfig } from 'astro/config';

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

export default defineConfig({
  site: 'https://www.schomesquare.co.th',
  // Pages are written as /about-us.html etc. and served without the extension by public/.htaccess
  build: { format: 'file', assets: '_assets' },
  trailingSlash: 'never',
  compressHTML: false,
  vite: { plugins: [searchRewrite] },
});
