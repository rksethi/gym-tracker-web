import type { ReactNode } from "react";
import {
  IconArrowUp, IconArrowDown, IconLeg, IconShoulder, IconBicep,
  IconTarget, IconHeart, IconDumbbell,
} from "./components/Icons";

export interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
  is_custom: number;
}

export type ExerciseCategory =
  | "push"
  | "pull"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "fullBody";

export const CATEGORIES: { value: ExerciseCategory; label: string; icon: ReactNode }[] = [
  { value: "push", label: "Push", icon: <IconArrowUp size={14} /> },
  { value: "pull", label: "Pull", icon: <IconArrowDown size={14} /> },
  { value: "legs", label: "Legs", icon: <IconLeg size={14} /> },
  { value: "shoulders", label: "Shoulders", icon: <IconShoulder size={14} /> },
  { value: "arms", label: "Arms", icon: <IconBicep size={14} /> },
  { value: "core", label: "Core", icon: <IconTarget size={14} /> },
  { value: "cardio", label: "Cardio", icon: <IconHeart size={14} /> },
  { value: "fullBody", label: "Full Body", icon: <IconDumbbell size={14} /> },
];

export type Intensity = "low" | "moderate" | "high" | "max";

export interface ExerciseSet {
  id: number;
  entry_id: number;
  set_number: number;
  reps: number;
  weight: number;
  unit: "kg" | "lbs";
  is_completed: number;
  intensity: Intensity | null;
  duration_minutes: number | null;
}

export interface WorkoutEntry {
  id: number;
  session_id: number;
  exercise_id: number;
  order_num: number;
  max_heart_rate: number | null;
  exercise_name: string;
  exercise_category: ExerciseCategory;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id: number;
  name: string;
  date: string;
  duration: number;
  is_completed: number;
  entries: WorkoutEntry[];
}

export interface SessionSummary {
  id: number;
  name: string;
  date: string;
  duration: number;
  is_completed: number;
  exercise_count: number;
  total_volume: number;
  total_sets: number;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  exercises: Exercise[];
}

export function categoryLabel(cat: ExerciseCategory): string {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function categoryIcon(cat: ExerciseCategory): ReactNode {
  return CATEGORIES.find((c) => c.value === cat)?.icon ?? <IconDumbbell size={14} />;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}
