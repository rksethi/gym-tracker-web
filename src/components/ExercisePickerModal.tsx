import { useEffect, useState } from "react";
import { api } from "../api";
import type { Exercise, ExerciseCategory } from "../types";
import { CATEGORIES, categoryIcon } from "../types";
import { IconPlus, IconCheckCircle, IconCircle } from "./Icons";

export default function ExercisePickerModal({ onAdd, onClose }: { onAdd: (ids: number[]) => void; onClose: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [createCategory, setCreateCategory] = useState<ExerciseCategory>("push");
  const [createError, setCreateError] = useState("");

  useEffect(() => { api.exercises.list().then(setExercises); }, []);

  const filtered = exercises.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const exactMatch = search.trim() && exercises.some((e) => e.name.toLowerCase() === search.trim().toLowerCase());

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    try {
      const exercise = await api.exercises.create(search.trim(), createCategory);
      setExercises((prev) => [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)));
      setSelected((prev) => new Set(prev).add(exercise.id));
      setSearch("");
      setShowCreate(false);
      setCreateError("");
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create exercise");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 overflow-hidden">
      <div className="bg-surface rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden border-t border-surface-300 sm:border">
        <div className="px-4 py-3 border-b border-surface-300 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-sm text-gray-400">Cancel</button>
          <h3 className="font-bold text-sm">Add Exercises</h3>
          <button
            onClick={() => onAdd(Array.from(selected))}
            disabled={selected.size === 0}
            className="text-sm font-bold text-accent-400 disabled:opacity-30"
          >
            Add ({selected.size})
          </button>
        </div>

        <div className="px-4 py-2 border-b border-surface-300 shrink-0">
          <input
            type="text"
            placeholder="Search or create exercises..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowCreate(false); setCreateError(""); }}
            className="w-full bg-surface-200 border border-surface-400 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-accent-400"
          />
        </div>

        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-surface-300 shrink-0">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${!selectedCategory ? "bg-accent-500 text-gray-900" : "bg-surface-200 text-gray-400"}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${selectedCategory === c.value ? "bg-accent-500 text-gray-900" : "bg-surface-200 text-gray-400"}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {search.trim() && !exactMatch && (
            <div className="px-4 py-2 border-b border-surface-300">
              {showCreate ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Create "<span className="text-gray-100 font-medium">{search.trim()}</span>" as:</p>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value as ExerciseCategory)}
                    className="w-full bg-surface-200 border border-surface-400 rounded-lg px-3 py-2 text-sm text-gray-100 focus:ring-1 focus:ring-accent-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {createError && <p className="text-red-400 text-xs">{createError}</p>}
                  <button
                    onClick={handleCreate}
                    className="w-full py-2 rounded-lg bg-accent-500 text-gray-900 text-sm font-semibold hover:bg-accent-400"
                  >
                    Create & Select
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full py-2 rounded-lg text-accent-400 text-sm font-medium hover:bg-accent-500/10 inline-flex items-center justify-center gap-1"
                >
                  <IconPlus size={14} /> Create "{search.trim()}"
                </button>
              )}
            </div>
          )}

          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => toggle(e.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-100 border-b border-surface-300/50 ${selected.has(e.id) ? "bg-accent-500/10" : ""}`}
            >
              <span>{categoryIcon(e.category)}</span>
              <span className="text-sm flex-1">{e.name}</span>
              <span className={selected.has(e.id) ? "text-accent-400" : "text-gray-600"}>
                {selected.has(e.id) ? <IconCheckCircle size={20} /> : <IconCircle size={20} />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
