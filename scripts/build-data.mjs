// Downloads the upstream exercise data and writes a compact, English-only
// version into public/data/ for the app to load.
//
// Sources (both MIT/public-domain data; media hot-linked via jsDelivr, not copied):
//   - https://github.com/hasaneyldrm/exercises-dataset  — 180px animation GIFs (© Gym visual)
//   - https://github.com/yuhonas/free-exercise-db        — 750×500 posture photos (public domain)
//
// Run:  npm run data

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SRC =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const PHOTOS_SRC =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/data");

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

const STOP = new Set(["the", "a", "an", "with", "and", "of", "to", "on", "for"]);

/** Tight key: exact-ish name match ignoring punctuation/spacing. */
function nameKey(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s*[-(].*$/, "") // drop " - Medium Grip", " (Version 2)"
    .replace(/[^a-z0-9]+/g, "");
}

/** Loose key: significant words, sorted — tolerates word-order differences. */
function tokenKey(s) {
  const words = String(s)
    .toLowerCase()
    .replace(/\s*[-(].*$/, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
  return [...new Set(words)].sort().join(" ");
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log(`Fetching animation dataset ...`);
  const raw = await getJson(SRC);
  console.log(`  ${raw.length} exercises.`);

  console.log(`Fetching posture-photo dataset ...`);
  const photoExact = new Map();
  const photoToken = new Map();
  try {
    const photoRaw = await getJson(PHOTOS_SRC);
    for (const e of photoRaw) {
      if (!Array.isArray(e.images) || !e.images.length) continue;
      photoExact.set(nameKey(e.name), e.images);
      const tk = tokenKey(e.name);
      // only keep unambiguous token keys (skip if two different photos collide)
      if (photoToken.has(tk)) photoToken.set(tk, null);
      else photoToken.set(tk, e.images);
    }
    console.log(`  ${photoRaw.length} exercises in photo dataset.`);
  } catch (err) {
    console.warn(`  Skipping photos: ${err.message}`);
  }

  const findPhotos = (name) =>
    photoExact.get(nameKey(name)) ||
    photoToken.get(tokenKey(name)) ||
    [];

  let matched = 0;
  const exercises = raw.map((e) => {
    const steps = e.instruction_steps?.en?.length
      ? e.instruction_steps.en
      : (e.instructions?.en ?? "")
          .split(/(?<=\.)\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

    const photos = findPhotos(e.name);
    if (photos.length) matched++;

    return {
      id: e.id,
      name: e.name,
      category: e.category ?? e.body_part ?? "",
      bodyPart: e.body_part ?? "",
      equipment: e.equipment ?? "",
      target: e.target ?? "",
      muscleGroup: e.muscle_group ?? "",
      secondaryMuscles: Array.isArray(e.secondary_muscles)
        ? e.secondary_muscles
        : [],
      steps,
      // relative paths; the app resolves each to its CDN base
      image: e.image ?? "",
      gif: e.gif_url ?? "",
      photos, // relative to free-exercise-db's exercises/ folder
      attribution: e.attribution ?? "© Gym visual — https://gymvisual.com/",
    };
  });

  exercises.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Matched posture photos for ${matched} / ${exercises.length}.`);

  const facets = {
    bodyPart: uniqueSorted(exercises.map((e) => e.bodyPart)),
    equipment: uniqueSorted(exercises.map((e) => e.equipment)),
    target: uniqueSorted(exercises.map((e) => e.target)),
    muscleGroup: uniqueSorted(exercises.map((e) => e.muscleGroup)),
  };

  const meta = {
    count: exercises.length,
    photosMatched: matched,
    generatedAt: new Date().toISOString(),
    sources: [
      "https://github.com/hasaneyldrm/exercises-dataset",
      "https://github.com/yuhonas/free-exercise-db",
    ],
    gifCdn: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/",
    photoCdn:
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/",
    gifAttribution: "© Gym visual — https://gymvisual.com/",
    photoAttribution: "free-exercise-db (public domain)",
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(resolve(OUT_DIR, "exercises.json"), JSON.stringify(exercises));
  await writeFile(
    resolve(OUT_DIR, "facets.json"),
    JSON.stringify(facets, null, 2),
  );
  await writeFile(resolve(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));

  const bytes = Buffer.byteLength(JSON.stringify(exercises));
  console.log(
    `Wrote ${exercises.length} exercises -> public/data/exercises.json (${(bytes / 1e6).toFixed(2)} MB)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
