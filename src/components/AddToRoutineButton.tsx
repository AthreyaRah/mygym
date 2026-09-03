import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoutines } from "../lib/store";
import { Modal } from "./ui";

export function AddToRoutineButton({ exerciseId }: { exerciseId: string }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const navigate = useNavigate();

  const routines = useRoutines((s) => s.routines);
  const addExercise = useRoutines((s) => s.addExercise);
  const createRoutine = useRoutines((s) => s.createRoutine);

  const addTo = (routineId: string, name: string) => {
    addExercise(routineId, exerciseId);
    setAdded(name);
    setTimeout(() => {
      setOpen(false);
      setAdded(null);
    }, 900);
  };

  return (
    <>
      <button className="btn-primary w-full" onClick={() => setOpen(true)}>
        + Add to routine
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add to routine">
        {added ? (
          <p className="py-6 text-center text-sm text-emerald-400">
            Added to “{added}” ✓
          </p>
        ) : (
          <div className="space-y-4">
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {routines.length === 0 && (
                <p className="text-sm text-slate-400">No routines yet — create one below.</p>
              )}
              {routines.map((r) => (
                <button
                  key={r.id}
                  className="btn-ghost w-full justify-between"
                  onClick={() => addTo(r.id, r.name)}
                >
                  <span className="truncate">{r.name}</span>
                  <span className="text-xs text-slate-400">{r.items.length}</span>
                </button>
              ))}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const name = newName.trim();
                if (!name) return;
                const id = createRoutine(name);
                addExercise(id, exerciseId);
                setOpen(false);
                navigate(`/routine/${id}`);
              }}
            >
              <input
                className="input"
                placeholder="New routine name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button className="btn-primary shrink-0" type="submit">
                Create
              </button>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}
