# Uttarakhand Rojgar — Jobs, Results & Admit Card Tracker

Automatically tracks UKPSC, UKSSSC, and Uttarakhand Police recruitment
notices, results, admit cards and answer keys, and publishes them to a
website with zero manual posting.

```
GitHub Actions (scraper, every 3 hrs) → Supabase (Postgres) → Render (Next.js website)
```

## What's in this repo

```
uttarakhand-jobs/
├── frontend/         Next.js website (deploy this to Render)
├── scraper/          Python collectors (run by GitHub Actions, not Render)
├── database/schema.sql   Run once in Supabase's SQL editor
└── .github/workflows/scraper.yml   The schedule that runs the scraper
```

## Setup — do these in order

### 1. Create the database (Supabase, free tier)

1. Go to https://supabase.com → New project.
2. Open the SQL editor → paste the contents of `database/schema.sql` → Run.
3. Go to Project Settings → API. You'll need three values later:
   - `Project URL`
   - `anon public` key (safe for the frontend, read-only via row-level security you can add later)
   - `service_role` key (secret — only for the scraper, never in the frontend)

### 2. Push this repo to GitHub

```bash
cd uttarakhand-jobs
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 3. Add GitHub Actions secrets (so the scraper can write to Supabase)

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `SUPABASE_URL` | your Project URL |
| `SUPABASE_KEY` | your `service_role` key |

The workflow in `.github/workflows/scraper.yml` runs every 3 hours automatically,
and you can also trigger it manually from the **Actions** tab (Run workflow).

### 4. Fix the scraper selectors (important, do this before relying on it)

I could not browse the live UKPSC/UKSSSC/Police websites from where this
code was written, so `scraper/ukpsc.py`, `uksssc.py`, and `police.py` ship
with placeholder CSS selectors marked `# ADJUST ME`. Open each target site,
inspect the actual notice list HTML, and update:

- `LISTING_URL`
- the selector for the repeating row/notice container
- the selector for the date, if the site shows one separately from the title

Test locally before trusting it on a schedule:

```bash
cd scraper
pip install -r requirements.txt
export SUPABASE_URL=...
export SUPABASE_KEY=...
python ukpsc.py
```

### 5. Deploy the website to Render (free tier)

1. Render dashboard → New → Web Service → connect your GitHub repo.
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Environment variables (Render → your service → Environment):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Deploy. Render free web services sleep after inactivity and wake on the
   next request (a few seconds' delay) — fine for this use case since the
   real automation (scraping) runs on GitHub Actions, not on Render.

### 6. Connect your domain

Once you buy the domain: in Render, go to your web service → **Settings →
Custom Domains** → add your domain, then create the CNAME/A record it gives
you at your domain registrar. Render issues the SSL certificate
automatically once DNS propagates (usually within an hour).

## Adding a new source later

1. Copy `scraper/police.py` as a template.
2. Set `DEPARTMENT` and `LISTING_URL`, fix the selectors.
3. Add it to the `COLLECTORS` list in `scraper/main.py`.

No frontend changes needed — new rows just show up under their category
automatically.

## Notes

- All scraped notices link back to the official source; this site never
  claims to be an official government website (see the footer disclaimer).
- Classification (`scraper/classify.py`) is keyword-based on purpose — it's
  free, fast, and predictable. Only add an AI classifier later if you find
  notices routinely falling into the wrong category.
