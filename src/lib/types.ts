export interface Exercise {
  id: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  steps: string[];
  image: string;
  gif: string;
  /** posture photos from free-exercise-db (relative paths), may be empty */
  photos: string[];
  attribution: string;
}

export interface Facets {
  bodyPart: string[];
  equipment: string[];
  target: string[];
  muscleGroup: string[];
}

export interface Meta {
  count: number;
  generatedAt: string;
  source: string;
  mediaCdn: string;
  mediaAttribution: string;
}

export interface RoutineItem {
  id: string;
  exerciseId: string;
  sets: number;
  /** free text: "8-12", "30s", "AMRAP" */
  reps: string;
  restSec: number;
  notes: string;
}

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: RoutineItem[];
}

export interface RoutineExport {
  app: "mygym";
  version: 1;
  exportedAt: string;
  routines: Routine[];
}
