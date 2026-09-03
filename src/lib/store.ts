import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Routine, RoutineItem, RoutineExport } from "./types";

const uid = () =>
  (crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

const now = () => new Date().toISOString();

const DEFAULT_ITEM: Omit<RoutineItem, "id" | "exerciseId"> = {
  sets: 3,
  reps: "8-12",
  restSec: 90,
  notes: "",
};

interface RoutineState {
  routines: Routine[];

  createRoutine: (name: string) => string;
  renameRoutine: (id: string, name: string) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => string | undefined;

  addExercise: (routineId: string, exerciseId: string) => void;
  removeItem: (routineId: string, index: number) => void;
  updateItem: (
    routineId: string,
    index: number,
    patch: Partial<RoutineItem>,
  ) => void;
  reorderItems: (routineId: string, from: number, to: number) => void;

  replaceAll: (routines: Routine[]) => void;
  importRoutines: (data: unknown, mode: "merge" | "replace") => number;
}

function touch(r: Routine): Routine {
  return { ...r, updatedAt: now() };
}

export const useRoutines = create<RoutineState>()(
  persist(
    (set, get) => ({
      routines: [],

      createRoutine: (name) => {
        const id = uid();
        const routine: Routine = {
          id,
          name: name.trim() || "Untitled routine",
          createdAt: now(),
          updatedAt: now(),
          items: [],
        };
        set((s) => ({ routines: [routine, ...s.routines] }));
        return id;
      },

      renameRoutine: (id, name) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? touch({ ...r, name: name.trim() || r.name }) : r,
          ),
        })),

      deleteRoutine: (id) =>
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      duplicateRoutine: (id) => {
        const src = get().routines.find((r) => r.id === id);
        if (!src) return undefined;
        const copy: Routine = {
          ...src,
          id: uid(),
          name: `${src.name} (copy)`,
          createdAt: now(),
          updatedAt: now(),
          items: src.items.map((it) => ({ ...it })),
        };
        set((s) => ({ routines: [copy, ...s.routines] }));
        return copy.id;
      },

      addExercise: (routineId, exerciseId) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === routineId
              ? touch({
                  ...r,
                  items: [
                    ...r.items,
                    { id: uid(), exerciseId, ...DEFAULT_ITEM },
                  ],
                })
              : r,
          ),
        })),

      removeItem: (routineId, index) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === routineId
              ? touch({ ...r, items: r.items.filter((_, i) => i !== index) })
              : r,
          ),
        })),

      updateItem: (routineId, index, patch) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === routineId
              ? touch({
                  ...r,
                  items: r.items.map((it, i) =>
                    i === index ? { ...it, ...patch } : it,
                  ),
                })
              : r,
          ),
        })),

      reorderItems: (routineId, from, to) =>
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== routineId) return r;
            const items = [...r.items];
            const [moved] = items.splice(from, 1);
            items.splice(to, 0, moved);
            return touch({ ...r, items });
          }),
        })),

      replaceAll: (routines) => set({ routines }),

      importRoutines: (data, mode) => {
        const incoming = parseExport(data);
        set((s) => {
          if (mode === "replace") return { routines: incoming };
          const usedIds = new Set(s.routines.map((r) => r.id));
          const merged = incoming.map((r) =>
            usedIds.has(r.id) ? { ...r, id: uid() } : r,
          );
          return { routines: [...s.routines, ...merged] };
        });
        return incoming.length;
      },
    }),
    { name: "mygym.routines.v1", version: 1 },
  ),
);

function parseExport(data: unknown): Routine[] {
  const list = Array.isArray(data)
    ? data
    : (data as RoutineExport | null)?.routines;
  if (!Array.isArray(list)) throw new Error("Not a MyGym export file.");
  return list.map((raw): Routine => {
    const r = raw as Partial<Routine>;
    if (!r.name || !Array.isArray(r.items))
      throw new Error("Export file has a malformed routine.");
    return {
      id: typeof r.id === "string" ? r.id : uid(),
      name: r.name,
      createdAt: r.createdAt ?? now(),
      updatedAt: r.updatedAt ?? now(),
      items: r.items.map((it) => ({
        id: typeof (it as RoutineItem).id === "string" ? (it as RoutineItem).id : uid(),
        exerciseId: String((it as RoutineItem).exerciseId),
        sets: Number((it as RoutineItem).sets) || DEFAULT_ITEM.sets,
        reps: String((it as RoutineItem).reps ?? DEFAULT_ITEM.reps),
        restSec: Number((it as RoutineItem).restSec) || DEFAULT_ITEM.restSec,
        notes: String((it as RoutineItem).notes ?? ""),
      })),
    };
  });
}

export function buildExport(routines: Routine[]): RoutineExport {
  return { app: "mygym", version: 1, exportedAt: now(), routines };
}

export function useRoutine(id: string | undefined) {
  return useRoutines((s) => s.routines.find((r) => r.id === id));
}
