import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useData } from "../lib/data";
import { useRoutine } from "../lib/store";
import { AnimatedGif } from "../components/Media";
import { RestTimer } from "../components/RestTimer";
import { EmptyState } from "../components/ui";

export default function RunPage() {
  const { id } = useParams();
  const routine = useRoutine(id);
  const { byId } = useData();
  const navigate = useNavigate();

  const [idx, setIdx] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [resting, setResting] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [finished, setFinished] = useState(false);

  const totalSets = useMemo(
    () => routine?.items.reduce((sum, it) => sum + it.sets, 0) ?? 0,
    [routine],
  );

  if (!routine || routine.items.length === 0)
    return (
      <EmptyState
        title="Nothing to run"
        action={
          <Link to="/routines" className="btn-primary">
            Back to routines
          </Link>
        }
      />
    );

  const item = routine.items[idx];
  const exercise = byId.get(item.exerciseId);

  const advance = () => {
    setCompletedSets((n) => n + 1);
    if (setNo < item.sets) {
      setSetNo((n) => n + 1);
    } else if (idx < routine.items.length - 1) {
      setIdx((i) => i + 1);
      setSetNo(1);
    } else {
      setFinished(true);
    }
  };

  const completeSet = () => {
    const isLastSetOverall =
      idx === routine.items.length - 1 && setNo === item.sets;
    if (item.restSec > 0 && !isLastSetOverall) {
      setResting(true);
    } else {
      advance();
    }
  };

  const endRest = () => {
    setResting(false);
    advance();
  };

  if (finished)
    return (
      <div className="space-y-5 py-10 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold">Workout complete</h1>
        <p className="text-slate-400">
          {routine.name} · {totalSets} sets
        </p>
        <button
          className="btn-primary mx-auto"
          onClick={() => navigate(`/routine/${routine.id}`)}
        >
          Done
        </button>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/routine/${routine.id}`)}
          className="text-sm text-slate-400"
        >
          ✕ End
        </button>
        <span className="text-sm text-slate-400">
          Exercise {idx + 1} / {routine.items.length}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-[width]"
          style={{ width: `${(completedSets / totalSets) * 100}%` }}
        />
      </div>

      <h1 className="text-center text-xl font-bold capitalize">
        {exercise?.name ?? item.exerciseId}
      </h1>

      {resting ? (
        <RestTimer seconds={item.restSec} onDone={endRest} onSkip={endRest} />
      ) : (
        <>
          {exercise && <AnimatedGif exercise={exercise} />}

          <div className="card flex items-center justify-around p-4 text-center">
            <div>
              <p className="label">Set</p>
              <p className="text-2xl font-bold">
                {setNo}
                <span className="text-base font-normal text-slate-500">
                  {" "}
                  / {item.sets}
                </span>
              </p>
            </div>
            <div>
              <p className="label">Target reps</p>
              <p className="text-2xl font-bold">{item.reps}</p>
            </div>
          </div>

          {item.notes && (
            <p className="card p-3 text-sm text-slate-300">📝 {item.notes}</p>
          )}

          <button className="btn-primary w-full py-4 text-base" onClick={completeSet}>
            Complete set
          </button>

          <div className="flex justify-between text-sm text-slate-400">
            <button
              disabled={idx === 0 && setNo === 1}
              onClick={() => {
                if (setNo > 1) setSetNo((n) => n - 1);
                else if (idx > 0) {
                  const prev = routine.items[idx - 1];
                  setIdx((i) => i - 1);
                  setSetNo(prev.sets);
                }
              }}
            >
              ← Previous set
            </button>
            <button
              onClick={() => {
                if (idx < routine.items.length - 1) {
                  setIdx((i) => i + 1);
                  setSetNo(1);
                } else setFinished(true);
              }}
            >
              Skip exercise →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
