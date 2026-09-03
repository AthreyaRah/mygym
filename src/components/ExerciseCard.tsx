import { Link } from "react-router-dom";
import { Thumb } from "./Media";
import type { Exercise } from "../lib/types";

export function ExerciseCard({
  exercise,
  onAdd,
}: {
  exercise: Exercise;
  onAdd?: (id: string) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <Link to={`/exercise/${exercise.id}`} className="block">
        <Thumb exercise={exercise} />
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-semibold capitalize">
            {exercise.name}
          </p>
          <p className="mt-1 text-xs capitalize text-slate-400">
            {exercise.target} · {exercise.equipment}
          </p>
        </div>
      </Link>
      {onAdd && (
        <button
          onClick={() => onAdd(exercise.id)}
          className="btn-primary m-3 mt-0 w-[calc(100%-1.5rem)] !py-2"
        >
          + Add
        </button>
      )}
    </div>
  );
}
