import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Fuse from "fuse.js";
import type { Exercise, Facets, Meta } from "./types";

const MEDIA_CDN =
  "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/";

/** Resolve an upstream relative media path to a CDN URL. */
export function mediaUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return MEDIA_CDN + path.replace(/^\/+/, "");
}

interface DataBundle {
  exercises: Exercise[];
  byId: Map<string, Exercise>;
  facets: Facets;
  meta: Meta | null;
  fuse: Fuse<Exercise>;
}

type Status = "loading" | "ready" | "error";

const DataContext = createContext<
  (DataBundle & { status: Status; error?: string }) | null
>(null);

let cache: Promise<DataBundle> | null = null;

async function loadBundle(): Promise<DataBundle> {
  const base = import.meta.env.BASE_URL;
  const [exercises, facets, meta] = await Promise.all([
    fetch(`${base}data/exercises.json`).then((r) => {
      if (!r.ok) throw new Error(`exercises.json: ${r.status}`);
      return r.json() as Promise<Exercise[]>;
    }),
    fetch(`${base}data/facets.json`).then((r) => r.json() as Promise<Facets>),
    fetch(`${base}data/meta.json`)
      .then((r) => r.json() as Promise<Meta>)
      .catch(() => null),
  ]);

  const byId = new Map(exercises.map((e) => [e.id, e]));
  const fuse = new Fuse(exercises, {
    keys: [
      { name: "name", weight: 3 },
      { name: "target", weight: 2 },
      { name: "muscleGroup", weight: 2 },
      { name: "secondaryMuscles", weight: 1 },
      { name: "equipment", weight: 1 },
      { name: "bodyPart", weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return { exercises, byId, facets, meta, fuse };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    status: Status;
    bundle?: DataBundle;
    error?: string;
  }>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    cache ??= loadBundle();
    cache
      .then((bundle) => alive && setState({ status: "ready", bundle }))
      .catch((err) => {
        cache = null;
        if (alive) setState({ status: "error", error: String(err) });
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => {
    if (state.status === "ready" && state.bundle) {
      return { ...state.bundle, status: "ready" as const };
    }
    const empty: DataBundle = {
      exercises: [],
      byId: new Map(),
      facets: { bodyPart: [], equipment: [], target: [], muscleGroup: [] },
      meta: null,
      fuse: new Fuse<Exercise>([], {}),
    };
    return { ...empty, status: state.status, error: state.error };
  }, [state]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
}
