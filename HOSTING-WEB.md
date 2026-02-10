# Hosting OSM Boundary Extractor on Your Domain (Web)

This app can run in the browser. To host it on **your own domain** (e.g. `https://osmextract.yourdomain.com` or `https://yourdomain.com`), you need a **web build** and a place to serve it, then point your domain there.

---

## 1. What you need (checklist)

| What | Details |
|------|--------|
| **Domain name** | The URL you want (e.g. `app.yourdomain.com` or `yourdomain.com`). You must own it and have access to its **DNS settings**. |
| **DNS access** | Ability to add records at your registrar or DNS host (e.g. CNAME, A, or TXT for verification). |
| **Hosting** | Either **Expo EAS Hosting** (paid for custom domain) or **your own hosting** (e.g. Netlify, Vercel, or your server) where you can upload the built files. |
| **SSL (HTTPS)** | Recommended. EAS and most static hosts (Netlify, Vercel, etc.) provide it when you use their custom domain. |

---

## 2. Build the web app

From the project root:

```bash
npm install
npm run export:web
```

Or, if you prefer the CLI directly (use `-p web` to avoid token issues in PowerShell):

```bash
npx expo export -p web
```

This creates a **`dist`** folder with static files (HTML, JS, CSS, assets). You will upload this folder (or its contents) to your hosting.

- Re-run this command whenever you change the app and want to deploy an update.

---

## 3. Two ways to get it on your domain

### Option A: Host the `dist` folder yourself (any domain you own)

You **don’t** need an Expo paid plan. You only need:

1. **A place to host static files**, for example:
   - **Netlify** – drag-and-drop `dist` or connect Git and set build command to `npx expo export --platform web` and publish directory to `dist`.
   - **Vercel** – same idea: set output directory to `dist` and build to `npx expo export --platform web`.
   - **Your own server** – copy `dist` to the web root (e.g. `/var/www/html` or your server’s public folder).
   - **GitHub Pages** – push the contents of `dist` to a `gh-pages` branch or use a GitHub Action to build and deploy.

2. **Point your domain to that host** using DNS:
   - **Subdomain** (e.g. `app.yourdomain.com`): usually a **CNAME** record:  
     `app` → your host’s URL (e.g. `your-site.netlify.app` or the host’s target they give you).
   - **Apex domain** (e.g. `yourdomain.com`): use the **A** or **ALIAS/ANAME** records your host tells you (Netlify/Vercel show this in “Custom domain” or “Domain” settings).

3. **Turn on HTTPS** in the host’s dashboard (most do it automatically once DNS is correct).

**Info you need for Option A:**

- Your **domain name** (e.g. `app.yourdomain.com`).
- **Hosting provider** and an account (Netlify, Vercel, your server, etc.).
- **DNS** access to create CNAME/A (and any records the host asks for).

---

### Option B: Expo EAS Hosting + custom domain (Expo paid plan)

Expo can host the app and you attach your domain to that deployment.

1. **Export and deploy:**
   ```bash
   npm run export:web
   eas deploy --prod
   ```
   You get a URL like `https://osmextract-rn--xxxx.expo.app`.

2. **Add your domain in Expo:**
   - Open [expo.dev](https://expo.dev) → your project → **Hosting** → **Settings**.
   - Under **Custom domain**, enter your domain (e.g. `app.yourdomain.com` or `yourdomain.com`).

3. **DNS:** Expo will show you exactly which records to add at your DNS provider:
   - **Verification** (TXT record).
   - **SSL** (CNAME for certificate validation).
   - **Traffic** (CNAME for subdomains or A for apex).

Add them in the order Expo suggests, then use “Refresh” until all checks pass.

**Info you need for Option B:**

- **Expo account** and a **paid EAS plan** (custom domain is not on the free plan).
- Your **domain name**.
- **DNS** access to add the TXT, CNAME, and/or A records Expo shows.

---

## 4. Optional: Base path (if the app is not at the root)

If the app should live at a **path** on your domain (e.g. `https://yourdomain.com/osmextract/` instead of `https://yourdomain.com/`), you need to set the base URL before building.

In **`app.json`**, under `expo`, add (or extend) `web`:

```json
"web": {
  "favicon": "./assets/favicon.png",
  "baseUrl": "/osmextract/"
}
```

Then build again: `npm run export:web`. Your hosting must serve the app from that path (e.g. Netlify/Vercel “Base directory” or a subfolder and correct “Publish directory”).

---

## 5. Quick reference

| Goal | What you need |
|------|----------------|
| **Build** | `npm run export:web` (or `npx expo export -p web`) → use the **`dist`** folder. |
| **Your domain** | Domain name + DNS access (CNAME/A/TXT as required). |
| **Self-host (free/cheap)** | Netlify, Vercel, or your server; point domain to the host; enable HTTPS. |
| **Expo-hosted + your domain** | EAS paid plan; `eas deploy --prod`; add custom domain in Expo; add DNS records Expo gives you. |

---

## 6. Web vs mobile note

This app uses **react-native-maps** (Apple/Google Maps on devices). On **web**, the map may use a different provider or require extra configuration. Test the web build locally with `npx expo start --web` before deploying to your domain.
