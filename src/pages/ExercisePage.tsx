import { Link, useNavigate, useParams } from "react-router-dom";
import { useData } from "../lib/data";
import { AnimatedGif } from "../components/Media";
import { AddToRoutineButton } from "../components/AddToRoutineButton";
import { EmptyState, Spinner } from "../components/ui";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium capitalize text-slate-300">
      {children}
    </span>
  );
}

export default function ExercisePage() {
  const { id } = useParams();
  const { status, byId } = useData();
  const navigate = useNavigate();

  if (status === "loading") return <Spinner />;
  const exercise = id ? byId.get(id) : undefined;
  if (!exercise)
    return (
      <EmptyState
        title="Exercise not found"
        action={
          <Link to="/" className="btn-primary">
            Back to browse
          </Link>
        }
      />
    );

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-400">
        ← Back
      </button>

      <h1 className="text-xl font-bold capitalize">{exercise.name}</h1>

      <AnimatedGif exercise={exercise} />

      <div className="flex flex-wrap gap-2">
        <Badge>{exercise.bodyPart}</Badge>
        <Badge>{exercise.equipment}</Badge>
        <Badge>🎯 {exercise.target}</Badge>
      </div>

      <div className="card space-y-2 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Primary muscle group</span>
          <span className="font-medium capitalize">{exercise.muscleGroup}</span>
        </div>
        {exercise.secondaryMuscles.length > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Secondary</span>
            <span className="text-right font-medium capitalize">
              {exercise.secondaryMuscles.join(", ")}
            </span>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          How to perform
        </h2>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <AddToRoutineButton exerciseId={exercise.id} />

      <p className="pt-2 text-center text-[11px] text-slate-600">
        Animation {exercise.attribution}
      </p>
    </div>
  );
}
