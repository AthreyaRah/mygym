import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildExport, useRoutines } from "../lib/store";
import { EmptyState } from "../components/ui";

function download(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RoutinesPage() {
  const routines = useRoutines((s) => s.routines);
  const createRoutine = useRoutines((s) => s.createRoutine);
  const importRoutines = useRoutines((s) => s.importRoutines);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const onImportFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const mode =
        routines.length > 0 &&
        window.confirm(
          "Replace your current routines with the file's contents?\n\nOK = replace · Cancel = merge (keep both)",
        )
          ? "replace"
          : "merge";
      const n = importRoutines(data, mode);
      setMsg(`Imported ${n} routine${n === 1 ? "" : "s"} (${mode}).`);
    } catch (err) {
      setMsg(`Import failed: ${String(err instanceof Error ? err.message : err)}`);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My routines</h1>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (!n) return;
          const id = createRoutine(n);
          setName("");
          navigate(`/routine/${id}`);
        }}
      >
        <input
          className="input"
          placeholder="New routine name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-primary shrink-0" type="submit">
          Create
        </button>
      </form>

      {msg && (
        <p className="card border-indigo-800 bg-indigo-950/40 p-3 text-sm text-indigo-200">
          {msg}
        </p>
      )}

      {routines.length === 0 ? (
        <EmptyState
          title="No routines yet"
          hint="Create one above, or add exercises from the Browse tab."
        />
      ) : (
        <ul className="space-y-2">
          {routines.map((r) => (
            <li key={r.id} className="card flex items-center justify-between p-4">
              <Link to={`/routine/${r.id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.name}</p>
                <p className="text-xs text-slate-400">
                  {r.items.length} exercise{r.items.length === 1 ? "" : "s"}
                </p>
              </Link>
              {r.items.length > 0 && (
                <Link
                  to={`/routine/${r.id}/run`}
                  className="btn-primary !py-2"
                  aria-label={`Start ${r.name}`}
                >
                  ▶ Start
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-2">
        <button
          className="btn-ghost flex-1"
          disabled={routines.length === 0}
          onClick={() =>
            download(
              `mygym-routines-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(buildExport(routines), null, 2),
            )
          }
        >
          Export
        </button>
        <button className="btn-ghost flex-1" onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <p className="text-center text-[11px] text-slate-600">
        Routines are stored only on this device. Export regularly to back up or
        move to another phone.
      </p>
    </div>
  );
}
