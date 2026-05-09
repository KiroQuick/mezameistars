# Security Review — Meža meistars

**Project:** mezameistars (static HTML/JS furniture storefront)
**Scope:** All `.html`, `.js`, `.css` files in repo root, `js/`, `css/`, `images/`, `assets/`
**Date:** 2026-05-09
**Reviewer:** Claude Code

---

## Summary

This is a **client-side only static website** (no backend API, no server-side processing, no database). The security surface is therefore limited to the browser. The most significant risks are **CDN supply-chain compromise** (no SRI), **missing CSP**, and **a DOM XSS vector via `innerHTML` in the language switcher**.

**Risk Rating:** Medium — the site handles no authenticated sessions, no payments, and no sensitive data collection. However, the checkout flow creates a false sense of security (form looks real but submits nowhere).

---

## Findings

### 🔴 HIGH-1 — Missing Subresource Integrity (SRI) on all CDN assets

**Location:** All HTML files (`index.html`, `product.html`, `checkout.html`, `gallery.html`, `commission.html`, `product-river-table.html`, `product-serving-board.html`)

**Issue:** Every external script and stylesheet is loaded without integrity hashes:
- `cdn.tailwindcss.com`
- `cdnjs.cloudflare.com` (GSAP, ScrollTrigger)
- `cdn.jsdelivr.net` (Lenis)
- `fonts.googleapis.com`
- `fonts.gstatic.com`

**Impact:** If any of these CDNs are compromised or hijacked, arbitrary JavaScript executes in the context of your domain. This could deface the site, steal cart data from `localStorage`, or redirect users to phishing pages.

**Fix:** Add `integrity` and `crossorigin` attributes to all `<script>` and `<link rel="stylesheet">` tags referencing external hosts.

```html
<!-- Before -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

<!-- After -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
        integrity="sha256-..."
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
```

Note: `cdn.tailwindcss.com` does **not** provide stable SRI hashes (it compiles on-the-fly). Consider switching to a pinned npm build or `https://cdn.tailwindcss.com` with a specific version query parameter, or self-host Tailwind.

---

### 🟡 MEDIUM-1 — DOM XSS vector via `innerHTML` in language switcher

**Location:** `index.html:1684-1687`

```js
document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
  var key = el.getAttribute('data-i18n-html');
  if (t[key] !== undefined) el.innerHTML = t[key];
});
```

**Issue:** `innerHTML` is used to inject translation strings. The translation dictionary is currently hardcoded and safe, but this pattern is dangerous. If the translation source is ever loaded from an external JSON file, URL parameter, or `localStorage`, unsanitized HTML/JS will execute.

**Impact:** Stored or reflected XSS. An attacker could inject `<img src=x onerror=alert(1)>` into a translation string.

**Fix:** Replace `innerHTML` with `textContent` for all translation values. If HTML formatting is truly needed, use a safe HTML sanitizer (DOMPurify) or switch to `insertAdjacentHTML` with an allowlist. Since the only HTML currently used is `<em>` and `<br>`, consider splitting the string and wrapping parts in `createElement` instead.

```js
// Safer: use textContent for everything
el.textContent = t[key];
```

---

### 🟡 MEDIUM-2 — Missing Content Security Policy (CSP)

**Location:** All HTML files (missing `<meta http-equiv>` or HTTP header)

**Issue:** No CSP is defined. The browser has no restriction on where scripts, styles, images, or connections can load from.

**Impact:**
- An injected script (e.g., via XSS or compromised CDN) can exfiltrate cart data, send requests anywhere, or load additional malware.
- The site is vulnerable to clickjacking (no `frame-ancestors` directive).

**Fix:** Add a strict CSP meta tag. Start with a report-only policy, then enforce.

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data:;
               connect-src 'self';
               frame-ancestors 'none';
               base-uri 'self';
               form-action 'self';
               upgrade-insecure-requests;">
```

Note: `'unsafe-inline'` is required for the inline `tailwind.config` blocks. If you move Tailwind config to an external file, you can remove `'unsafe-inline'`.

---

### 🟡 MEDIUM-3 — Cart stored in `localStorage` without integrity checks

**Location:** `js/main.js:8`, `checkout.html:377`

**Issue:** The shopping cart is serialized to `localStorage` as plain JSON. Price values are stored alongside quantities. There is no server-side validation because there is no server.

**Impact:** A user can trivially modify `mm_cart` in DevTools to change prices, quantities, or product names. Since the checkout form does not actually submit to a backend, this is currently harmless, but it creates a broken trust boundary. If a real payment processor (Stripe, etc.) is ever integrated client-side, price manipulation becomes a critical vulnerability.

**Fix:** If/when a backend is added, **never trust prices from the client**. Always look up prices server-side by product ID. For now, document that the cart is client-side decorative only.

---

### 🟢 LOW-1 — Checkout form has no actual submission endpoint

**Location:** `checkout.html:403-425`

**Issue:** The checkout form intercepts submit, waits 2 seconds, shows a toast, and clears the cart. No data is sent anywhere. No email is dispatched. No order is recorded.

**Impact:** Users may believe their order was placed. The business receives no order data. This is a **functional/UX bug with security-adjacent impact** (data loss, missed revenue).

**Fix:** Integrate an actual backend endpoint (email service like Formspree, EmailJS, or a serverless function) to receive the order details. If staying static, use a form backend service:

```html
<form action="https://formspree.io/f/YOUR_ID" method="POST">
```

---

### 🟢 LOW-2 — PII (email & phone) exposed in plain HTML

**Location:** `index.html:1066`, `index.html:1069`, footer sections across all files

**Issue:** `Mezameistars387@gmail.com` and `+371 29494004` are hardcoded in plain text in multiple files.

**Impact:** Scraping bots will harvest this contact information for spam/phishing. No direct security vulnerability, but a privacy/reputation concern.

**Fix:** Consider obfuscating with a simple JS reverse-string technique, or use a contact form instead of a `mailto:` link. This is a trade-off against usability.

---

### 🟢 LOW-3 — `target="_blank"` links without `rel="noopener noreferrer"` in some places

**Location:** Footer social links in `index.html:1107-1123` have `rel="noopener noreferrer"` (good). Some other pages have placeholder `#` links without it. Check all external links.

**Impact:** Minor. `noopener` prevents the opened page from accessing `window.opener`. `noreferrer` prevents referrer leakage.

**Fix:** Ensure **every** `<a>` with `target="_blank"` has `rel="noopener noreferrer"`.

---

### 🟢 LOW-4 — No `X-Frame-Options` or CSP `frame-ancestors`

**Location:** Entire site (static, no headers configured)

**Impact:** The site could be embedded in a malicious iframe for clickjacking attacks. Since there are no authenticated actions (no login, no payments), the practical risk is low.

**Fix:** Add CSP with `frame-ancestors 'none'` as shown in MEDIUM-2.

---

### 🟢 LOW-5 — Google Fonts preconnect without strict referrer policy

**Location:** All HTML files

**Issue:** Google Fonts and other CDNs receive the `Referer` header on every request, leaking the current page URL to third parties.

**Fix:** Add a referrer policy meta tag:

```html
<meta name="referrer" content="strict-origin-when-cross-origin">
```

---

### 🟢 LOW-6 — No HTTPS enforcement in code

**Location:** All HTML files

**Issue:** Links use relative paths (good), but there is no `<meta>` or JS redirect to force HTTPS. Vercel auto-redirects HTTP→HTTPS by default, so this is mostly theoretical.

**Fix:** Add to `<head>`:

```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests;">
```

Or configure Vercel to enforce HTTPS in project settings.

---

## Non-Findings (Things That Look Risky But Are Actually OK)

| Area | Observation | Verdict |
|---|---|---|
| **Commission form `mailto:`** | `index.html:1393` builds a `mailto:` URL with `encodeURIComponent()` on all user inputs. | Safe — no injection possible. |
| **Gallery inline `onclick`** | `checkout.html:131` uses inline `onclick` to close cart. | Low risk — no user input involved. |
| **GSAP animation values** | `gsap.to()` is called with hardcoded or computed numeric values. | Safe — no user input drives animation parameters. |
| **localStorage key names** | Keys like `mm_lang`, `mm_cart` are hardcoded. | Safe. |

---

## Recommendations (Priority Order)

1. **Add SRI hashes** to all CDN `<script>` and `<link>` tags. Use [SRI Hash Generator](https://www.srihash.org/).
2. **Add CSP** (`<meta http-equiv="Content-Security-Policy">`) with strict `script-src`, `frame-ancestors 'none'`, and `upgrade-insecure-requests`.
3. **Replace `innerHTML` with `textContent`** in the language switcher (`index.html:1684`).
4. **Add `rel="noopener noreferrer"`** to every external link.
5. **Add `<meta name="referrer">`** to limit referrer leakage.
6. **Document the checkout as non-functional** or integrate a real form backend (Formspree, EmailJS, or Vercel Serverless Function).
7. **When adding a backend**, validate all prices server-side; never trust `localStorage` cart totals.

---

## Scorecard

| Category | Score | Notes |
|---|---|---|
| XSS Prevention | C | `innerHTML` usage, no CSP |
| Injection Prevention | B | `encodeURIComponent` used correctly for mailto |
| Supply Chain / SRI | D | No integrity hashes on any CDN |
| Data Storage | B | localStorage cart is tamperable but client-only |
| HTTPS / Transport | A | Vercel handles TLS automatically |
| Privacy / PII | C | Email/phone exposed in plain HTML |
| Clickjacking | C | No `X-Frame-Options` or CSP frame-ancestors |
| Overall | C+ | Fix HIGH-1 and MEDIUM-1/2 to reach B+ |
