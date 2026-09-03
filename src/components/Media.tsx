import { useState } from "react";
import { mediaUrl, photoUrl } from "../lib/data";
import type { Exercise } from "../lib/types";

/** Thumbnail used in lists. */
export function Thumb({ exercise }: { exercise: Exercise }) {
  const [loaded, setLoaded] = useState(false);
  const src = mediaUrl(exercise.image || exercise.gif);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-800">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-800" />}
      <img
        src={src}
        alt={exercise.name}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/**
 * Large animated GIF for the detail / run views.
 * The source is only 180×180, so it is displayed near native size to stay crisp.
 */
export function AnimatedGif({ exercise }: { exercise: Exercise }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const gif = mediaUrl(exercise.gif);
  const fallback = mediaUrl(exercise.image);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-slate-800 bg-white">
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      <img
        key={failed ? fallback : gif}
        src={failed ? fallback : gif}
        alt={`${exercise.name} animation`}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) {
            setFailed(true);
            setLoaded(false);
          }
        }}
        className={`h-full w-full object-contain transition-opacity ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/** High-res posture photos (start / peak) from free-exercise-db, when available. */
export function PosturePhotos({ exercise }: { exercise: Exercise }) {
  if (!exercise.photos.length) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Posture reference
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {exercise.photos.map((p, i) => (
          <img
            key={p}
            src={photoUrl(p)}
            alt={`${exercise.name} — ${i === 0 ? "start" : "end"} position`}
            loading="lazy"
            decoding="async"
            className="w-full rounded-xl border border-slate-800 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
