# ส.เจริญโฮมสแควร์ website (new, self-hosted)

A copy of www.schomesquare.co.th that you own and host on Hostatom. Same pages, same addresses.

## 1. See it on your computer

Needs Node.js 20 or newer (https://nodejs.org, the "LTS" installer).

Get the code once (needs Git, https://git-scm.com) and run it:

```
git clone https://github.com/EakNaruethep/SCHS_Web_-Vibe_Code-.git schs-web
cd schs-web
npm install
npm run dev
```

Then open http://localhost:4321 in your browser. Press Ctrl+C in the terminal to stop.

## 2. Change content

Ask Claude, for example:

- "Add a new product: พุกเคมี M12 แบบตอก Kingfisher, price 95 baht, picture attached"
- "Move the FAQ section above the blog section on the home page"
- "Hide the product … / remove the album …"
- "Write a blog post about …"

Claude follows `CLAUDE.md` in this folder, which explains where everything lives.

## 3. How changes are saved (GitHub)

The site lives at https://github.com/EakNaruethep/SCHS_Web_-Vibe_Code-. The `main` branch is always the version
that is (or can be) live.

- **Content changes** (text, prices, pictures, products, blog posts, albums, FAQ, menu) are saved straight to `main`.
- **Layout or code changes** go on their own branch and a pull request (PR). You look at the PR on GitHub,
  check the green "Build" tick, and press **Squash and merge**, then **Delete branch**.
- **Each time you upload to Hostatom**, tag that version with the date, e.g. `v2026.10.31`, so you can go back to it.
  Ask Claude: "tag this deploy".

## 4. Publish to Hostatom

1. Run `npm run build`. This creates the `dist` folder (the finished website).
2. Log in to Hostatom (DirectAdmin / cPanel) → File Manager → `public_html`
   (or use FileZilla with your FTP login).
3. Upload **everything inside `dist`** into `public_html`, including the hidden file `.htaccess`.
4. When the domain points to Hostatom and SSL is active, open `public/.htaccess`, remove the `#` in front
   of the 3 "https://www" lines, build and upload again.
5. Test the contact form: send a message from /contact and check that it arrives at schs.contact@gmail.com
   (look in Spam the first time and mark it "Not spam"). If nothing arrives, ask Hostatom support to
   allow PHP `mail()` for the site. To send to another address, change `MAIL_TO` at the top of
   `public/contact-send.php`.

Then tag the version (see 3). Only after you check the site on Hostatom, switch the domain away from Makewebeasy.
