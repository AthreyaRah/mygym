# MyGym

A free, offline-capable web app to **search exercises**, **watch the animation and
posture** for each one, and **build your own workout routines** — all from your
phone. Hosts on GitHub Pages at zero cost, no server or database.

Inspired by [opengym](https://github.com/mixrecords/opengym). Exercise data is
merged from two open datasets:

- [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
  — 1,324 exercises with animated GIFs (© Gym visual)
- [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  — 750×500 public-domain posture photos, shown on exercises whose names match
  (~200 of them)

## Features

- **Browse & search** 1,300+ exercises — fuzzy search plus filters for body part,
  equipment, and target muscle.
- **Exercise detail** — large animated GIF, primary/secondary muscles, equipment,
  and numbered step-by-step instructions.
- **Routines** — create multiple named routines; per exercise set the sets, reps,
  rest, and notes; drag to reorder; duplicate or delete.
- **Run mode** — step through a routine one exercise at a time with the animation,
  your set targets, set check-off, and an automatic rest timer.
- **Backup / transfer** — export all routines to a JSON file and import on another
  device. Routines live in your browser's local storage; nothing is uploaded.
- **PWA** — "Add to Home Screen" on mobile; works offline after the first visit.

## Tech

Vite + React + TypeScript, Tailwind CSS, Fuse.js, zustand, `vite-plugin-pwa`.
Media is hot-linked from the upstream dataset via the jsDelivr CDN, so this repo
stays small (~1 MB of JSON, no image files).

## Local development

```bash
npm install
npm run data     # download + compact the exercise dataset into public/data/
npm run dev      # http://localhost:5173
```

Other scripts:

- `npm run build` — type-check and produce the static site in `dist/`
- `npm run preview` — serve the production build locally
- `node scripts/make-icons.mjs` — regenerate the PWA icons (rarely needed)

## Deploy to your GitHub Pages (free)

1. Create a new repo on GitHub and push this project to the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push. The **Deploy to GitHub Pages** workflow builds and publishes the site to
   `https://<your-user>.github.io/<repo-name>/`.

The workflow automatically sets the correct base path from the repo name. To use a
custom domain instead, add a `public/CNAME` file containing your domain and the
build switches to serving from `/`.

### Keeping exercise data fresh

The generated files in `public/data/` are committed to the repo. The
**Refresh exercise data** workflow re-runs `npm run data` on the 1st of each month
(and on demand from the Actions tab); if the upstream dataset changed, it commits
the update, which triggers a redeploy.

## Data & licensing

- App code and the derived JSON: MIT (see `LICENSE`).
- Animations: © [Gym visual](https://gymvisual.com/), loaded at runtime from the
  upstream repo via jsDelivr — not redistributed here. Attribution shown on every
  exercise page.
- Posture photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db),
  public domain (Unlicense), also hot-linked via jsDelivr.

### Want sharper animations?

The GIFs are the free 180px tier of the Gym visual artwork. A one-time paid
option ([Vital Animations](https://github.com/exercisedb-pro/exercisedb-dataset),
~$49) provides 1080p HD looping MP4s you can self-host — swap the `gif` field and
`AnimatedGif` component to use them.
