import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useData } from "../lib/data";
import { useRoutine, useRoutines } from "../lib/store";
import { Thumb } from "../components/Media";
import { EmptyState } from "../components/ui";
import type { Exercise, RoutineItem } from "../lib/types";

export default function RoutineEditPage() {
  const { id } = useParams();
  const routine = useRoutine(id);
  const navigate = useNavigate();
  const { byId } = useData();

  const renameRoutine = useRoutines((s) => s.renameRoutine);
  const deleteRoutine = useRoutines((s) => s.deleteRoutine);
  const duplicateRoutine = useRoutines((s) => s.duplicateRoutine);
  const reorderItems = useRoutines((s) => s.reorderItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  if (!routine)
    return (
      <EmptyState
        title="Routine not found"
        action={
          <Link to="/routines" className="btn-primary">
            Back to routines
          </Link>
        }
      />
    );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = routine.items.findIndex((it) => it.id === active.id);
    const to = routine.items.findIndex((it) => it.id === over.id);
    if (from !== -1 && to !== -1) reorderItems(routine.id, from, to);
  };

  return (
    <div className="space-y-4">
      <Link to="/routines" className="text-sm text-slate-400">
        ← Routines
      </Link>

      <input
        className="input text-lg font-bold"
        value={routine.name}
        onChange={(e) => renameRoutine(routine.id, e.target.value)}
      />

      <div className="flex gap-2">
        <Link
          to={`/?addTo=${routine.id}`}
          className="btn-primary flex-1"
        >
          + Add exercises
        </Link>
        {routine.items.length > 0 && (
          <Link to={`/routine/${routine.id}/run`} className="btn-ghost flex-1">
            ▶ Start
          </Link>
        )}
      </div>

      {routine.items.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          hint="Tap “Add exercises” to search the library and build this routine."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={routine.items.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {routine.items.map((item, index) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  index={index}
                  routineId={routine.id}
                  name={byId.get(item.exerciseId)?.name ?? item.exerciseId}
                  exercise={byId.get(item.exerciseId)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex gap-2 pt-4">
        <button
          className="btn-ghost flex-1"
          onClick={() => {
            const newId = duplicateRoutine(routine.id);
            if (newId) navigate(`/routine/${newId}`);
          }}
        >
          Duplicate
        </button>
        <button
          className="btn-danger flex-1"
          onClick={() => {
            if (window.confirm(`Delete “${routine.name}”?`)) {
              deleteRoutine(routine.id);
              navigate("/routines");
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function SortableRow({
  item,
  index,
  routineId,
  name,
  exercise,
}: {
  item: RoutineItem;
  index: number;
  routineId: string;
  name: string;
  exercise: Exercise | undefined;
}) {
  const [open, setOpen] = useState(false);
  const updateItem = useRoutines((s) => s.updateItem);
  const removeItem = useRoutines((s) => s.removeItem);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const patch = (p: Partial<RoutineItem>) => updateItem(routineId, index, p);

  return (
    <li ref={setNodeRef} style={style} className="card p-3">
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab touch-none px-1 text-slate-500"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        {exercise && (
          <div className="h-12 w-12 shrink-0">
            <Thumb exercise={exercise} />
          </div>
        )}
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => setOpen((o) => !o)}
        >
          <p className="truncate text-sm font-semibold capitalize">{name}</p>
          <p className="text-xs text-slate-400">
            {item.sets} × {item.reps} · {item.restSec}s rest
          </p>
        </button>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3">
          <label className="text-xs">
            <span className="label">Sets</span>
            <input
              type="number"
              min={1}
              className="input mt-1"
              value={item.sets}
              onChange={(e) => patch({ sets: Math.max(1, +e.target.value || 1) })}
            />
          </label>
          <label className="text-xs">
            <span className="label">Reps</span>
            <input
              className="input mt-1"
              value={item.reps}
              onChange={(e) => patch({ reps: e.target.value })}
            />
          </label>
          <label className="text-xs">
            <span className="label">Rest (s)</span>
            <input
              type="number"
              min={0}
              step={15}
              className="input mt-1"
              value={item.restSec}
              onChange={(e) => patch({ restSec: Math.max(0, +e.target.value || 0) })}
            />
          </label>
          <label className="col-span-3 text-xs">
            <span className="label">Notes</span>
            <input
              className="input mt-1"
              placeholder="e.g. tempo, weight, cues"
              value={item.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>
          <button
            className="btn-danger col-span-3"
            onClick={() => removeItem(routineId, index)}
          >
            Remove exercise
          </button>
        </div>
      )}
    </li>
  );
}
