import { useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useData } from "../lib/data";
import { useRoutine, useRoutines } from "../lib/store";
import { ExerciseCard } from "../components/ExerciseCard";
import { EmptyState, Spinner } from "../components/ui";
import type { Exercise } from "../lib/types";

const RENDER_CAP = 240;

type FacetKey = "bodyPart" | "equipment" | "target";
const FACET_LABEL: Record<FacetKey, string> = {
  bodyPart: "Body part",
  equipment: "Equipment",
  target: "Target muscle",
};
const FACET_KEYS: FacetKey[] = ["bodyPart", "equipment", "target"];

export default function BrowsePage() {
  const { status, exercises, facets, fuse } = useData();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  const addTo = params.get("addTo") ?? undefined;
  const addRoutine = useRoutine(addTo);
  const addExercise = useRoutines((s) => s.addExercise);

  const selected: Record<FacetKey, Set<string>> = {
    bodyPart: new Set(params.getAll("bodyPart")),
    equipment: new Set(params.getAll("equipment")),
    target: new Set(params.getAll("target")),
  };
  const activeCount = FACET_KEYS.reduce((n, k) => n + selected[k].size, 0);

  const toggleFacet = (key: FacetKey, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const current = next.getAll(key);
        next.delete(key);
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        updated.forEach((v) => next.append(key, v));
        return next;
      },
      { replace: true },
    );
  };

  const clearFacets = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams();
        const at = prev.get("addTo");
        if (at) next.set("addTo", at);
        return next;
      },
      { replace: true },
    );

  const results = useMemo<Exercise[]>(() => {
    if (status !== "ready") return [];
    let list = deferredQ.trim()
      ? fuse.search(deferredQ.trim()).map((r) => r.item)
      : exercises;
    for (const key of FACET_KEYS) {
      const set = new Set(params.getAll(key));
      if (set.size) list = list.filter((e) => set.has(e[key]));
    }
    return list;
  }, [status, deferredQ, exercises, fuse, params]);

  if (status === "loading") return <Spinner label="Loading exercises…" />;

  return (
    <div className="space-y-4">
      {addRoutine && (
        <div className="card flex items-center justify-between gap-2 border-indigo-800 bg-indigo-950/40 p-3 text-sm">
          <span>
            Adding to <strong>{addRoutine.name}</strong> ·{" "}
            {addRoutine.items.length} exercises
          </span>
          <Link to={`/routine/${addRoutine.id}`} className="btn-primary !py-1.5">
            Done
          </Link>
        </div>
      )}

      <div className="space-y-2">
        <input
          className="input"
          placeholder="Search exercises, muscles, equipment…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        <div className="flex items-center justify-between">
          <button
            className={`chip ${activeCount ? "chip-on" : ""}`}
            onClick={() => setShowFilters((s) => !s)}
          >
            Filters{activeCount ? ` · ${activeCount}` : ""}
          </button>
          <span className="text-xs text-slate-500">
            {results.length} match{results.length === 1 ? "" : "es"}
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="card space-y-4 p-4">
          {FACET_KEYS.map((key) => (
            <div key={key}>
              <p className="label mb-2">{FACET_LABEL[key]}</p>
              <div className="flex flex-wrap gap-2">
                {facets[key].map((value) => (
                  <button
                    key={value}
                    className={`chip capitalize ${
                      selected[key].has(value) ? "chip-on" : ""
                    }`}
                    onClick={() => toggleFacet(key, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {activeCount > 0 && (
            <button className="btn-ghost w-full" onClick={clearFacets}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {results.length === 0 ? (
        <EmptyState
          title="No exercises match"
          hint="Try fewer filters or another search term."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {results.slice(0, RENDER_CAP).map((e) => (
              <ExerciseCard
                key={e.id}
                exercise={e}
                onAdd={addTo ? (id) => addExercise(addTo, id) : undefined}
              />
            ))}
          </div>
          {results.length > RENDER_CAP && (
            <p className="py-2 text-center text-xs text-slate-500">
              Showing first {RENDER_CAP} of {results.length}. Refine your search
              to see more.
            </p>
          )}
        </>
      )}
    </div>
  );
}
