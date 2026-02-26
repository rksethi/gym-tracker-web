import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Exercise, WorkoutTemplate } from "../types";
import { CATEGORIES, categoryIcon } from "../types";

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { api.templates.list().then(setTemplates); }, []);

  async function deleteTemplate(id: number) {
    await api.templates.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function startFromTemplate(template: WorkoutTemplate) {
    const session = await api.sessions.create(template.name, template.id);
    navigate(`/workout/${session.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Templates</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition"
        >
          ＋ New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">Create a workout template to quickly start workouts.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{t.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startFromTemplate(t)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-accent-500 text-white font-medium hover:bg-accent-600"
                    >
                      ▶ Start
                    </button>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">{t.exercises.length} exercises</p>
                <div className="flex flex-wrap gap-2">
                  {t.exercises.map((e) => (
                    <span key={e.id} className="text-xs bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1">
                      {categoryIcon(e.category)} {e.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTemplateModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => {
            setTemplates((prev) => [...prev, t]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Template Modal
// ---------------------------------------------------------------------------

function CreateTemplateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (t: WorkoutTemplate) => void;
}) {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<"name" | "exercises">("name");

  useEffect(() => { api.exercises.list().then(setAllExercises); }, []);

  const filtered = allExercises.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  function toggleExercise(exercise: Exercise) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
        setExercises((e) => e.filter((ex) => ex.id !== exercise.id));
      } else {
        next.add(exercise.id);
        setExercises((e) => [...e, exercise]);
      }
      return next;
    });
  }

  async function save() {
    const template = await api.templates.create(name.trim(), exercises.map((e) => e.id));
    template.exercises = exercises;
    onCreated(template);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-sm text-gray-500">Cancel</button>
          <h3 className="font-bold text-sm">New Template</h3>
          {step === "name" ? (
            <button
              onClick={() => setStep("exercises")}
              disabled={!name.trim()}
              className="text-sm font-bold text-accent-600 disabled:opacity-30"
            >
              Next
            </button>
          ) : (
            <button
              onClick={save}
              disabled={selected.size === 0}
              className="text-sm font-bold text-accent-600 disabled:opacity-30"
            >
              Save
            </button>
          )}
        </div>

        {step === "name" ? (
          <div className="p-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Template Name</label>
            <input
              type="text"
              placeholder="e.g. Push Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-500"
            />
            {exercises.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">{exercises.length} exercises selected</p>
                <div className="flex flex-wrap gap-2">
                  {exercises.map((e) => (
                    <span key={e.id} className="text-xs bg-accent-50 text-accent-700 px-2 py-1 rounded-lg">
                      {e.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b border-gray-100 shrink-0">
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent-400"
              />
            </div>
            <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-gray-100 shrink-0">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${!selectedCategory ? "bg-accent-500 text-white" : "bg-gray-100"}`}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedCategory(c.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${selectedCategory === c.value ? "bg-accent-500 text-white" : "bg-gray-100"}`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map((e) => (
                <button
                  key={e.id}
                  onClick={() => toggleExercise(e)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 ${selected.has(e.id) ? "bg-accent-50" : ""}`}
                >
                  <span>{categoryIcon(e.category)}</span>
                  <span className="text-sm flex-1">{e.name}</span>
                  <span className="text-lg">{selected.has(e.id) ? "✅" : "⭕"}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
