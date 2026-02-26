import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Exercise, ExerciseCategory } from "../types";
import { CATEGORIES, categoryIcon, categoryLabel } from "../types";

export default function Library() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showAddCustom, setShowAddCustom] = useState(false);

  useEffect(() => { api.exercises.list().then(setExercises); }, []);

  const filtered = exercises.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const grouped = CATEGORIES.reduce<Record<string, Exercise[]>>((acc, cat) => {
    const items = filtered.filter((e) => e.category === cat.value);
    if (items.length > 0) acc[cat.value] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <div className="flex gap-2">
          <Link
            to="/library/templates"
            className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-medium hover:bg-gray-200 transition"
          >
            📋 Templates
          </Link>
          <button
            onClick={() => setShowAddCustom(true)}
            className="px-3 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition"
          >
            ＋ Add
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search exercises..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-500"
      />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${!selectedCategory ? "bg-accent-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          All ({exercises.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = exercises.filter((e) => e.category === c.value).length;
          return (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${selectedCategory === c.value ? "bg-accent-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c.icon} {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Exercise List */}
      {Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No exercises found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              {categoryIcon(cat as ExerciseCategory)} {categoryLabel(cat as ExerciseCategory)}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {items.map((e) => (
                <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm">{e.name}</span>
                  {e.is_custom === 1 && (
                    <span className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-full font-medium">Custom</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Add Custom Exercise Modal */}
      {showAddCustom && (
        <AddCustomExerciseModal
          onClose={() => setShowAddCustom(false)}
          onAdded={(exercise) => {
            setExercises((prev) => [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)));
            setShowAddCustom(false);
          }}
        />
      )}
    </div>
  );
}

function AddCustomExerciseModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (e: Exercise) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("push");
  const [error, setError] = useState("");

  async function save() {
    try {
      const exercise = await api.exercises.create(name.trim(), category);
      onAdded(exercise);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-lg font-bold">Add Custom Exercise</h3>

        <input
          type="text"
          placeholder="Exercise name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          autoFocus
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-500"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 disabled:opacity-30"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
