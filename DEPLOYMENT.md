# Deploying MediAssist AI (free tier)

This deploys the backend to **Render** and the frontend to **Vercel** — both
have genuinely free tiers, no credit card required for this setup.

> **Honest caveat before you deploy:** Render's free web service tier uses
> *ephemeral* disk storage — meaning your SQLite user database, uploaded
> files, and FAISS indexes get **wiped every time the service restarts or
> redeploys** (Render also spins the service down after ~15 minutes of
> inactivity, so it will happen more often than you'd expect). This is fine
> for a portfolio demo where someone clicks around once, but it is **not**
> suitable for real users who expect their accounts/documents to persist.
> If you need real persistence, you'd need a paid Render plan with a
> persistent disk attached, or migrate to a proper hosted database.

---

## Part 1 — Deploy the backend to Render

1. Push your code to GitHub if you haven't already (`git push`).
2. Go to https://dashboard.render.com/blueprints and click **New Blueprint Instance**.
3. Connect your GitHub repo. Render will detect `render.yaml` at the repo root automatically.
4. Render will show you the `mediassist-backend` service it's about to create. Click **Apply**.
5. Once created, go to the service's **Environment** tab and set the two secret values `render.yaml` intentionally left blank:
   - `GEMINI_API_KEY` — your real Gemini key
   - `FRONTEND_URL` — you can leave this as `http://localhost:5173` for now; **come back and update it** once you have your real Vercel URL from Part 2
6. Wait for the first deploy to finish (~2-5 minutes — it's installing PyTorch/sentence-transformers, so it's not instant). Note the URL Render gives you, e.g. `https://mediassist-backend.onrender.com`.
7. Sanity check: visit `https://your-backend-url.onrender.com/api/health` in a browser — you should see `{"status": "✅ MediAssist AI is running!", ...}`.

---

## Part 2 — Deploy the frontend to Vercel

1. Go to https://vercel.com/new and import the same GitHub repo.
2. When Vercel asks for the **Root Directory**, set it to `frontend` (important — otherwise it'll try to build from the repo root and fail).
3. Vercel auto-detects Vite; you shouldn't need to change build settings.
4. Before deploying, add an environment variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://your-backend-url.onrender.com/api` (the URL from Part 1, Step 6 — note the `/api` suffix)
5. Click **Deploy**. Once it's live, note your Vercel URL, e.g. `https://mediassist-ai.vercel.app`.

---

## Part 3 — Connect the two

Go back to Render → your backend service → **Environment** tab, and update:
- `FRONTEND_URL` = your real Vercel URL from Part 2, Step 5

Render will auto-redeploy with the new value. This is what makes CORS actually accept requests from your live frontend once `DEBUG=false` (which `render.yaml` already sets).

---

## Testing the live deployment

Visit your Vercel URL, sign up for a new account, and try uploading a document. If something fails, check:
- Render service logs (Render dashboard → your service → **Logs** tab) for backend errors
- Browser DevTools → Network tab for the actual failing request/response

## Alternative: GitHub Pages instead of Vercel

GitHub Pages works too, but needs two extra bits of config Vercel handles automatically:
1. In `frontend/vite.config.js`, add `base: '/your-repo-name/'` (GitHub Pages serves your site from a subpath, not the domain root).
2. You'd need a GitHub Actions workflow to build and push `frontend/dist` to a `gh-pages` branch on every push.

Given the extra complexity for no cost benefit over Vercel, Vercel is the simpler choice unless you specifically want everything under a single `github.io` domain.