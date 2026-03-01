import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { Exercise, ExerciseSet, WorkoutEntry, WorkoutSession } from "../types";
import { categoryIcon, categoryLabel, CATEGORIES, formatDuration } from "../types";

export default function ActiveWorkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(false);
  const startRef = useRef(Date.now());

  const fetchSession = useCallback(async () => {
    if (!id) return;
    const s = await api.sessions.get(Number(id));
    setSession(s);
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function addExercises(exerciseIds: number[]) {
    if (!id) return;
    const updated = await api.entries.add(Number(id), exerciseIds);
    setSession(updated);
    setShowAddExercise(false);
  }

  async function removeEntry(entryId: number) {
    const updated = await api.entries.delete(entryId);
    setSession(updated);
  }

  async function addSet(entryId: number) {
    const updated = await api.sets.add(entryId);
    setSession(updated);
  }

  async function updateSet(setId: number, data: Partial<ExerciseSet>) {
    const updated = await api.sets.update(setId, data);
    setSession(updated);
  }

  async function deleteSet(setId: number) {
    const updated = await api.sets.delete(setId);
    setSession(updated);
  }

  async function updateEntryHeartRate(entryId: number, hr: number | null) {
    const updated = await api.entries.update(entryId, { max_heart_rate: hr });
    setSession(updated);
  }

  async function finishWorkout() {
    if (!id) return;
    await api.sessions.update(Number(id), { duration: elapsed, is_completed: true });
    navigate(`/history/${id}`);
  }

  async function discardWorkout() {
    if (!id) return;
    await api.sessions.delete(Number(id));
    navigate("/");
  }

  if (!session) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0c0c0c] max-w-[100vw] overflow-x-clip">
      {/* Header */}
      <header className="bg-surface border-b border-surface-300 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => setShowDiscard(true)} className="text-red-400 text-sm font-medium">Discard</button>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-accent-400">{formatDuration(elapsed)}</p>
          </div>
          <button onClick={() => setShowFinish(true)} className="text-accent-400 text-sm font-bold">Finish</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4" style={{ paddingBottom: "max(6rem, calc(4rem + env(safe-area-inset-bottom)))" }}>
        {/* Workout Name */}
        <input
          type="text"
          value={session.name}
          onChange={(e) => {
            setSession({ ...session, name: e.target.value });
            api.sessions.update(Number(id), { name: e.target.value });
          }}
          className="w-full text-lg font-semibold bg-surface-50 border border-surface-300 rounded-xl px-4 py-3 text-gray-100 focus:ring-2 focus:ring-accent-500"
        />

        {/* Exercise Entries */}
        {session.entries.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-2">🏋️</p>
            <p className="text-sm">Add exercises to start logging sets</p>
          </div>
        )}

        {session.entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onRemove={() => removeEntry(entry.id)}
            onAddSet={() => addSet(entry.id)}
            onUpdateSet={updateSet}
            onDeleteSet={deleteSet}
            onUpdateHeartRate={(hr) => updateEntryHeartRate(entry.id, hr)}
          />
        ))}

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full py-3 rounded-xl bg-accent-500/15 text-accent-400 font-semibold text-sm hover:bg-accent-500/25 transition border border-accent-500/30"
        >
          ＋ Add Exercise
        </button>

        {/* Save as Template */}
        {session.entries.length > 0 && (
          <button
            onClick={async () => {
              const ids = session.entries.map((e) => e.exercise_id);
              await api.templates.create(session.name, ids);
              setSavedTemplate(true);
              setTimeout(() => setSavedTemplate(false), 2000);
            }}
            className="w-full py-3 rounded-xl text-gray-500 font-medium text-sm hover:bg-surface-100 transition border border-surface-300"
          >
            {savedTemplate ? "✅ Template Saved!" : "📋 Save as Template"}
          </button>
        )}
      </div>

      {showAddExercise && (
        <ExercisePickerModal onAdd={addExercises} onClose={() => setShowAddExercise(false)} />
      )}

      {showDiscard && (
        <ConfirmModal
          title="Discard Workout?"
          message="This workout will not be saved."
          confirmLabel="Discard"
          confirmClass="bg-red-500 hover:bg-red-600"
          onConfirm={discardWorkout}
          onCancel={() => setShowDiscard(false)}
        />
      )}

      {showFinish && (
        <ConfirmModal
          title="Finish Workout?"
          message={`Save this workout with ${session.entries.length} exercises?`}
          confirmLabel="Finish"
          confirmClass="bg-accent-500 hover:bg-accent-400 text-gray-900"
          onConfirm={finishWorkout}
          onCancel={() => setShowFinish(false)}
        />
      )}
    </div>
  );
}

function EntryCard({
  entry, onRemove, onAddSet, onUpdateSet, onDeleteSet, onUpdateHeartRate,
}: {
  entry: WorkoutEntry;
  onRemove: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: number, data: Partial<ExerciseSet>) => void;
  onDeleteSet: (setId: number) => void;
  onUpdateHeartRate: (hr: number | null) => void;
}) {
  const [hrValue, setHrValue] = useState(entry.max_heart_rate?.toString() ?? "");

  return (
    <div className="bg-surface-50 rounded-xl border border-surface-300 overflow-hidden">
      <div className="px-3 sm:px-4 py-3 flex items-center justify-between border-b border-surface-300 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{categoryIcon(entry.exercise_category)}</span>
          <span className="font-semibold text-sm truncate">{entry.exercise_name}</span>
          <span className="text-xs text-gray-500 bg-surface-200 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
            {categoryLabel(entry.exercise_category)}
          </span>
        </div>
        <button onClick={onRemove} className="text-gray-500 hover:text-red-400 text-lg shrink-0">×</button>
      </div>

      <div className="px-4 py-2 border-b border-surface-300 flex items-center gap-2">
        <span className="text-red-400 text-sm">❤️</span>
        <input
          type="number"
          placeholder="Max HR (optional)"
          value={hrValue}
          onChange={(e) => setHrValue(e.target.value)}
          onBlur={() => onUpdateHeartRate(hrValue ? parseInt(hrValue, 10) : null)}
          className="text-sm border-0 bg-transparent focus:ring-0 w-36 p-0 text-gray-100 placeholder:text-gray-600"
        />
        {hrValue && <span className="text-xs text-gray-500">bpm</span>}
      </div>

      <div className="px-3 sm:px-4 py-2 grid grid-cols-[1.5rem_1fr_3.5rem_3.5rem] sm:grid-cols-[2rem_1fr_4.5rem_3.5rem] gap-1.5 sm:gap-2 text-xs font-semibold text-gray-500 uppercase">
        <span>#</span>
        <span className="text-center">Weight</span>
        <span className="text-center">Reps</span>
        <span></span>
      </div>

      {entry.sets.map((s) => (
        <SetRow key={s.id} set={s} onUpdate={(data) => onUpdateSet(s.id, data)} onDelete={() => onDeleteSet(s.id)} />
      ))}

      <button onClick={onAddSet} className="w-full py-2.5 text-sm font-medium text-accent-400 hover:bg-accent-500/10 transition">
        ＋ Add Set
      </button>
    </div>
  );
}

function SetRow({ set, onUpdate, onDelete }: {
  set: ExerciseSet;
  onUpdate: (data: Partial<ExerciseSet>) => void;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());

  return (
    <div className={`px-3 sm:px-4 py-2 grid grid-cols-[1.5rem_1fr_3.5rem_3.5rem] sm:grid-cols-[2rem_1fr_4.5rem_3.5rem] gap-1.5 sm:gap-2 items-center border-t border-surface-300 ${set.is_completed ? "bg-accent-500/10" : ""}`}>
      <span className="text-sm font-medium text-gray-500">{set.set_number}</span>

      <div className="flex items-center gap-1">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => onUpdate({ weight: parseFloat(weight) || 0 })}
          className="w-full bg-surface-200 border border-surface-400 rounded-lg px-1.5 py-1.5 text-sm text-center text-gray-100 focus:ring-1 focus:ring-accent-400"
        />
        <button
          onClick={() => onUpdate({ unit: set.unit === "lbs" ? "kg" : "lbs" })}
          className="text-[11px] font-semibold text-gray-400 bg-surface-300 rounded px-1 py-1 hover:bg-surface-400 shrink-0"
        >
          {set.unit}
        </button>
      </div>

      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => onUpdate({ reps: parseInt(reps, 10) || 0 })}
        className="bg-surface-200 border border-surface-400 rounded-lg px-1.5 py-1.5 text-sm text-center text-gray-100 focus:ring-1 focus:ring-accent-400"
      />

      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate({ is_completed: !set.is_completed })}
          className={`text-lg ${set.is_completed ? "text-accent-400" : "text-gray-600 hover:text-gray-400"}`}
        >
          {set.is_completed ? "✅" : "⭕"}
        </button>
        <button onClick={onDelete} className="text-gray-600 active:text-red-400 hover:text-red-400 text-xs transition">
          🗑
        </button>
      </div>
    </div>
  );
}

function ExercisePickerModal({ onAdd, onClose }: { onAdd: (ids: number[]) => void; onClose: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => { api.exercises.list().then(setExercises); }, []);

  const filtered = exercises.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => toggle(e.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-100 border-b border-surface-300/50 ${selected.has(e.id) ? "bg-accent-500/10" : ""}`}
            >
              <span>{categoryIcon(e.category)}</span>
              <span className="text-sm flex-1">{e.name}</span>
              <span className="text-lg">{selected.has(e.id) ? "✅" : "⭕"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string; confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-50 rounded-2xl p-6 w-full max-w-xs space-y-4 text-center border border-surface-300">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-gray-400">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-surface-400 text-sm font-medium text-gray-300 hover:bg-surface-200">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
