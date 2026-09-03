// Downloads the upstream exercise dataset and writes a compact,
// English-only version into public/data/ for the app to load.
//
// Upstream: https://github.com/hasaneyldrm/exercises-dataset  (MIT data/code)
// Media (images/GIFs) are © Gym visual and are NOT copied here — the app
// hot-links them from the upstream repo via the jsDelivr CDN.
//
// Run:  npm run data

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SRC =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/data");

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

async function main() {
  console.log(`Fetching ${SRC} ...`);
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const raw = await res.json();
  console.log(`Got ${raw.length} exercises (${(JSON.stringify(raw).length / 1e6).toFixed(1)} MB raw).`);

  const exercises = raw.map((e) => {
    const steps =
      e.instruction_steps?.en?.length
        ? e.instruction_steps.en
        : (e.instructions?.en ?? "")
            .split(/(?<=\.)\s+/)
            .map((s) => s.trim())
            .filter(Boolean);

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
      // relative paths inside the upstream repo; resolved to a CDN URL in the app
      image: e.image ?? "",
      gif: e.gif_url ?? "",
      attribution: e.attribution ?? "© Gym visual — https://gymvisual.com/",
    };
  });

  exercises.sort((a, b) => a.name.localeCompare(b.name));

  const facets = {
    bodyPart: uniqueSorted(exercises.map((e) => e.bodyPart)),
    equipment: uniqueSorted(exercises.map((e) => e.equipment)),
    target: uniqueSorted(exercises.map((e) => e.target)),
    muscleGroup: uniqueSorted(exercises.map((e) => e.muscleGroup)),
  };

  const meta = {
    count: exercises.length,
    generatedAt: new Date().toISOString(),
    source: "https://github.com/hasaneyldrm/exercises-dataset",
    mediaCdn: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/",
    mediaAttribution: "© Gym visual — https://gymvisual.com/",
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    resolve(OUT_DIR, "exercises.json"),
    JSON.stringify(exercises),
  );
  await writeFile(
    resolve(OUT_DIR, "facets.json"),
    JSON.stringify(facets, null, 2),
  );
  await writeFile(resolve(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));

  const bytes = Buffer.byteLength(JSON.stringify(exercises));
  console.log(
    `Wrote ${exercises.length} exercises -> public/data/exercises.json (${(bytes / 1e6).toFixed(2)} MB)`,
  );
  console.log(`Wrote facets.json and meta.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
