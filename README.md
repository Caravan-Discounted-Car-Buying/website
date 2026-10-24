# Caravan: marketing site + waitlist

Static site for **caravan.zerolink.co.in**. Plain HTML, CSS and vanilla JS. No build step, no npm, no framework, no third-party requests at runtime.

```
caravan/
├── index.html              Landing page (all sections)
├── privacy.html            Privacy note (DRAFT, needs legal review)
├── robots.txt
├── sitemap.xml
├── css/
│   ├── tokens.css          All design variables + @font-face
│   └── styles.css          Layout and components (mobile-first)
├── js/
│   ├── main.js             Scroll fade-ins (off under reduced motion)
│   └── form.js             Waitlist form; WAITLIST_ENDPOINT config at the top
├── assets/
│   ├── fonts/              Subset WOFF2 files + OFL licence texts
│   ├── images/og-image.png Social preview (1200×630)
│   └── svg/favicon.svg
├── apps-script/
│   └── Code.gs             Google Apps Script backend (NOT uploaded to the host)
├── README.md
└── DESIGN.md               Design decisions
```

Total first load: roughly 110 KB, fonts included (HTML/CSS/JS ≈ 17 KB gzipped, fonts ≈ 46 KB, no raster images on the page itself).

---

## 1. Open it locally

Double-click `index.html`. Everything works from `file://` except actually submitting the form (it shows "The waitlist isn't connected yet" until step 2 is done).

For a closer match to production, serve the folder instead:

```bash
cd caravan
python3 -m http.server 8000
# open http://localhost:8000
```

---

## 2. Set up the Google Sheet and Apps Script

Google changes its menus now and then; if a label below doesn't match, look for the closest equivalent.

1. **Create the sheet.** In Google Sheets, create a blank spreadsheet, e.g. "Caravan waitlist". You don't need to add headers; the script adds `timestamp | email | role | city | make` to a tab called `Waitlist` on the first signup.
2. **Open Apps Script.** In that sheet: **Extensions → Apps Script**. This creates a script bound to the sheet.
3. **Paste the code.** Delete the default code, paste the contents of `apps-script/Code.gs`, and save.
4. **Deploy as a web app.** **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - Description: `waitlist v1`
   - Execute as: **Me**
   - Who has access: **Anyone** (required, because visitors aren't signed in to your Google account)

   Click **Deploy**.
5. **Authorise.** Google asks you to grant the script access to your spreadsheet. Because it's your own unpublished script, you'll likely see an "unverified app" warning; choose **Advanced → Go to (project name)**. Only do this for code you've read.
6. **Copy the Web app URL** (it ends in `/exec`).
7. **Connect the site.** Open `js/form.js` and paste the URL into the constant at the top:

   ```js
   var WAITLIST_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
   ```

8. **Test the endpoint** before trusting the form:

   ```bash
   curl -L -H "Content-Type: text/plain;charset=utf-8" \
     -d '{"email":"test@example.com","role":"buyer","city":"Pune","make":""}' \
     "https://script.google.com/macros/s/XXXX/exec"
   # expect: {"ok":true}
   ```

   Run it again and you should get `{"ok":false,"code":"duplicate"}`. Then submit the real form from your deployed site and check that a row appears. Delete the test rows afterwards.

### Things to know about this setup

- **Why the form sends `text/plain` and not JSON.** Sending `Content-Type: application/json` makes the browser send a CORS "preflight" request first, which Apps Script can't answer, so the submission fails before it reaches your script. `text/plain` avoids the preflight, and the script still parses the body as JSON. I tested the front end against a mocked endpoint, not against live Google servers, so **do the test in step 8 and one real browser submission** before you share the link.
- **Editing the script later.** Saving isn't enough. Go to **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. That keeps the same URL. Creating a *new deployment* instead gives you a new URL that you'd have to paste into `form.js` again.
- **Spam.** The honeypot only stops dumb bots that use the form. The `/exec` URL is public, so anyone can post to it directly; the server-side validation and duplicate check in `Code.gs` are the real protection. Apps Script can't see visitor IP addresses, so there's no IP rate limiting. If spam becomes a problem, the next step is a CAPTCHA, which adds a third-party request (ask first).
- **Formula injection.** Any value starting with `=`, `+`, `-` or `@` is stored with a leading apostrophe so it can't run as a spreadsheet formula.
- **Quotas.** Apps Script has daily usage quotas. They should be far above what a waitlist needs, but I haven't checked the current numbers.

---

## 3. Deploy to a static host on caravan.zerolink.co.in

Upload **everything except** `apps-script/` (it's harmless if uploaded, just unnecessary). Any static host works. Common free options are Cloudflare Pages, Netlify and GitHub Pages; check their current free-tier terms yourself.

**Typical flow (any of the three):**

1. Push the `caravan/` folder to a GitHub repo, or drag-and-drop it into the host's dashboard.
2. Build command: none. Output/publish directory: the folder root.
3. In the host's settings, add the custom domain `caravan.zerolink.co.in`.
4. At whoever manages DNS for `zerolink.co.in`, add the record the host tells you to add. Usually that's a **CNAME** record:
   - Name: `caravan`
   - Target: the host's address (e.g. `your-project.pages.dev`, `your-site.netlify.app` or `venomyzer.github.io`)
5. Wait for DNS to propagate and for HTTPS to be issued, then open `https://caravan.zerolink.co.in`.

This doesn't touch the main `zerolink.co.in` site; a subdomain is a separate record.

**After deploying:**

- Check the social preview with a link-preview tool or by pasting the URL into a chat app.
- `sitemap.xml` and `robots.txt` already point at `caravan.zerolink.co.in`. If you change the domain, update those two files plus the `canonical` and `og:` tags in both HTML files.

---

## 4. Before you share the link publicly

- [ ] Replace `hello@example.com` (footer of both pages + privacy note) with a real inbox you check.
- [ ] Fill in the `TODO` items in `privacy.html` (host name, retention period, response time).
- [ ] Have `privacy.html` reviewed by a lawyer. Collecting emails is real personal data, even though the product demo uses fake money.
- [ ] Run the endpoint test in section 2, step 8, and one real submission from the live site.
- [ ] Update `<lastmod>` in `sitemap.xml` when content changes.

## Changing things

- **Colours, spacing, fonts, radii, shadows:** `css/tokens.css` only.
- **Copy:** `index.html`. Keep the content rules: no invented numbers, no savings claims, no real brands, no "secure/protected" money claims, and undecided policies (fees, failed-auction handling) labelled as undecided.
- **Form limits:** change them in both `js/form.js` (`LIMITS`) and `apps-script/Code.gs` (`LIMITS`), then redeploy the script as a new version.
- **Fonts:** the WOFF2 files are subset to the characters the site uses. If you add new symbols or Devanagari words and they render in a fallback font, re-subset from the original OFL fonts with `pyftsubset`, keeping layout features (`--layout-features='*'`) so Devanagari conjuncts don't break.
