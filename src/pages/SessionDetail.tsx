import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { ExerciseSet, WorkoutEntry, WorkoutSession } from "../types";
import { categoryIcon, categoryLabel, formatDuration } from "../types";
import { IconClipboard, IconCheck, IconCheckCircle, IconCircle, IconHeart, IconTrash, IconPlus } from "../components/Icons";
import ExercisePickerModal from "../components/ExercisePickerModal";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  useEffect(() => {
    if (id) api.sessions.get(Number(id)).then(setSession);
  }, [id]);

  if (!session) return <div className="text-center py-16 text-gray-500">Loading...</div>;

  const strengthEntries = session.entries.filter((e) => e.exercise_category !== "cardio");
  const cardioEntries = session.entries.filter((e) => e.exercise_category === "cardio");

  const totalVolume = strengthEntries.reduce((sum, e) =>
    sum + e.sets.filter((s) => s.is_completed).reduce((s2, s) => s2 + s.weight * s.reps, 0), 0);

  const totalSets = session.entries.reduce((sum, e) =>
    sum + e.sets.filter((s) => s.is_completed).length, 0);

  const totalCardioDuration = cardioEntries.reduce((sum, e) =>
    sum + e.sets.filter((s) => s.is_completed).reduce((s2, s) => s2 + (s.duration_minutes ?? 0), 0), 0);

  const maxHR = Math.max(0, ...session.entries.map((e) => e.max_heart_rate ?? 0));

  async function handleDelete() {
    if (!id) return;
    await api.sessions.delete(Number(id));
    navigate("/history");
  }

  async function refresh() {
    if (!id) return;
    const s = await api.sessions.get(Number(id));
    setSession(s);
  }

  async function updateSet(setId: number, data: Partial<ExerciseSet>) {
    await api.sets.update(setId, data);
    await refresh();
  }

  async function deleteSet(setId: number) {
    await api.sets.delete(setId);
    await refresh();
  }

  async function addSet(entryId: number) {
    await api.sets.add(entryId);
    await refresh();
  }

  async function removeEntry(entryId: number) {
    await api.entries.delete(entryId);
    await refresh();
  }

  async function updateName(name: string) {
    if (!id) return;
    await api.sessions.update(Number(id), { name });
    await refresh();
  }

  async function addExercises(exerciseIds: number[]) {
    if (!id) return;
    await api.entries.add(Number(id), exerciseIds);
    setShowAddExercise(false);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <input
            type="text"
            defaultValue={session.name}
            onBlur={(e) => updateName(e.target.value)}
            className="text-2xl font-bold bg-surface-50 border border-surface-300 rounded-xl px-3 py-1 text-gray-100 focus:ring-2 focus:ring-accent-500 min-w-0 flex-1"
          />
        ) : (
          <h1 className="text-2xl font-bold truncate">{session.name}</h1>
        )}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(!editing)}
            className={`text-sm font-medium ${editing ? "text-accent-400 hover:text-accent-300" : "text-gray-400 hover:text-gray-300"}`}
          >
            {editing ? "Done" : "Edit"}
          </button>
          {!editing && session.entries.length > 0 && (
            <button
              onClick={async () => {
                const ids = session.entries.map((e) => e.exercise_id);
                await api.templates.create(session.name, ids);
                setSavedTemplate(true);
                setTimeout(() => setSavedTemplate(false), 2000);
              }}
              className="text-sm text-accent-400 hover:text-accent-300 font-medium inline-flex items-center gap-1"
            >
              {savedTemplate ? <><IconCheck size={14} /> Saved!</> : <><IconClipboard size={14} /> Template</>}
            </button>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="text-sm text-red-400 hover:text-red-300 font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {!editing && (
        <div className="bg-surface-50 rounded-xl border border-surface-300 divide-y divide-surface-300">
          <Row label="Date" value={new Date(session.date).toLocaleDateString(undefined, {
            weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          })} />
          <Row label="Duration" value={formatDuration(session.duration)} />
          <Row label="Exercises" value={session.entries.length.toString()} />
          <Row label="Total Sets" value={totalSets.toString()} />
          {totalVolume > 0 && <Row label="Total Volume" value={`${totalVolume.toFixed(1)} lbs`} />}
          {totalCardioDuration > 0 && <Row label="Cardio Time" value={`${totalCardioDuration} min`} />}
          {maxHR > 0 && <Row label="Max Heart Rate" value={`${maxHR} bpm`} icon={<IconHeart size={14} className="text-red-400 inline" />} />}
        </div>
      )}

      {session.entries.map((entry) => {
        const isCardio = entry.exercise_category === "cardio";
        const entryVolume = isCardio ? 0 : entry.sets.filter((s) => s.is_completed)
          .reduce((sum, s) => sum + s.weight * s.reps, 0);
        const entryDuration = isCardio ? entry.sets.filter((s) => s.is_completed)
          .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) : 0;

        return (
          <section key={entry.id} className="bg-surface-50 rounded-xl border border-surface-300 overflow-hidden">
            <div className="px-3 sm:px-4 py-3 border-b border-surface-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{categoryIcon(entry.exercise_category)}</span>
                <span className="font-semibold text-sm truncate">{entry.exercise_name}</span>
                <span className="text-xs text-gray-500 bg-surface-200 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                  {categoryLabel(entry.exercise_category)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!editing && entry.max_heart_rate ? (
                  <span className="text-xs text-red-400 font-medium inline-flex items-center gap-1">
                    <IconHeart size={12} /> {entry.max_heart_rate} bpm
                  </span>
                ) : null}
                {editing && (
                  <button onClick={() => removeEntry(entry.id)} className="text-gray-500 hover:text-red-400 text-lg">×</button>
                )}
              </div>
            </div>

            {editing ? (
              <EditableEntryBody
                entry={entry}
                isCardio={isCardio}
                onUpdateSet={updateSet}
                onDeleteSet={deleteSet}
                onAddSet={() => addSet(entry.id)}
              />
            ) : (
              <ReadOnlyEntryBody entry={entry} isCardio={isCardio} />
            )}

            {!editing && entryVolume > 0 && (
              <div className="px-4 py-2 border-t border-surface-300 flex justify-between text-xs">
                <span className="text-gray-500">Volume</span>
                <span className="font-semibold text-accent-400">{entryVolume.toFixed(1)} lbs</span>
              </div>
            )}
            {!editing && entryDuration > 0 && (
              <div className="px-4 py-2 border-t border-surface-300 flex justify-between text-xs">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold text-accent-400">{entryDuration} min</span>
              </div>
            )}
          </section>
        );
      })}

      {editing && (
        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full py-3 rounded-xl bg-accent-500/15 text-accent-400 font-semibold text-sm hover:bg-accent-500/25 transition border border-accent-500/30 inline-flex items-center justify-center gap-1.5"
        >
          <IconPlus size={16} /> Add Exercise
        </button>
      )}

      {showAddExercise && (
        <ExercisePickerModal onAdd={addExercises} onClose={() => setShowAddExercise(false)} />
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-50 rounded-2xl p-6 w-full max-w-xs space-y-4 text-center border border-surface-300">
            <h3 className="text-lg font-bold">Delete Workout?</h3>
            <p className="text-sm text-gray-400">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-xl border border-surface-400 text-sm font-medium text-gray-300 hover:bg-surface-200">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnlyEntryBody({ entry, isCardio }: { entry: WorkoutEntry; isCardio: boolean }) {
  return (
    <div className="divide-y divide-surface-300">
      {entry.sets.map((s) => (
        <div key={s.id} className={`px-3 sm:px-4 py-2 grid grid-cols-[2rem_1fr_1fr_2rem] sm:grid-cols-4 gap-1 text-sm ${s.is_completed ? "bg-accent-500/10" : ""}`}>
          <span className="text-gray-500">{s.set_number}</span>
          {isCardio ? (
            <>
              <span className="text-center font-medium">
                {(s.intensity ?? 0) > 0 ? `${s.intensity} ${s.intensity_unit ?? ""}`.trim() : "—"}
              </span>
              <span className="text-center">{(s.duration_minutes ?? 0) > 0 ? `${s.duration_minutes} min` : "—"}</span>
            </>
          ) : (
            <>
              <span className="text-center font-medium">{s.weight > 0 ? `${s.weight} ${s.unit}` : "—"}</span>
              <span className="text-center">{s.reps} reps</span>
            </>
          )}
          <span className={`text-right ${s.is_completed ? "text-accent-400" : "text-gray-600"}`}>
            {s.is_completed ? <IconCheckCircle size={18} /> : <IconCircle size={18} />}
          </span>
        </div>
      ))}
    </div>
  );
}

function EditableEntryBody({ entry, isCardio, onUpdateSet, onDeleteSet, onAddSet }: {
  entry: WorkoutEntry;
  isCardio: boolean;
  onUpdateSet: (setId: number, data: Partial<ExerciseSet>) => void;
  onDeleteSet: (setId: number) => void;
  onAddSet: () => void;
}) {
  return (
    <>
      {isCardio ? (
        <>
          <div className="px-3 sm:px-4 py-2 grid grid-cols-[1.5rem_1fr_4.5rem_3.5rem] sm:grid-cols-[2rem_1fr_5rem_3.5rem] gap-1.5 sm:gap-2 text-xs font-semibold text-gray-500 uppercase">
            <span>#</span>
            <span className="text-center">Intensity</span>
            <span className="text-center">Duration</span>
            <span></span>
          </div>
          {entry.sets.map((s) => (
            <EditableCardioSetRow key={s.id} set={s} onUpdate={(data) => onUpdateSet(s.id, data)} onDelete={() => onDeleteSet(s.id)} />
          ))}
        </>
      ) : (
        <>
          <div className="px-3 sm:px-4 py-2 grid grid-cols-[1.5rem_1fr_3.5rem_3.5rem] sm:grid-cols-[2rem_1fr_4.5rem_3.5rem] gap-1.5 sm:gap-2 text-xs font-semibold text-gray-500 uppercase">
            <span>#</span>
            <span className="text-center">Weight</span>
            <span className="text-center">Reps</span>
            <span></span>
          </div>
          {entry.sets.map((s) => (
            <EditableSetRow key={s.id} set={s} onUpdate={(data) => onUpdateSet(s.id, data)} onDelete={() => onDeleteSet(s.id)} />
          ))}
        </>
      )}
      <button onClick={onAddSet} className="w-full py-2.5 text-sm font-medium text-accent-400 hover:bg-accent-500/10 transition inline-flex items-center justify-center gap-1">
        <IconPlus size={14} /> Add Set
      </button>
    </>
  );
}

function EditableSetRow({ set, onUpdate, onDelete }: {
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
          className={`${set.is_completed ? "text-accent-400" : "text-gray-600 hover:text-gray-400"}`}
        >
          {set.is_completed ? <IconCheckCircle size={20} /> : <IconCircle size={20} />}
        </button>
        <button onClick={onDelete} className="text-gray-600 active:text-red-400 hover:text-red-400 transition">
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
}

function EditableCardioSetRow({ set, onUpdate, onDelete }: {
  set: ExerciseSet;
  onUpdate: (data: Partial<ExerciseSet>) => void;
  onDelete: () => void;
}) {
  const [intensityVal, setIntensityVal] = useState((set.intensity ?? 0).toString());
  const [iUnit, setIUnit] = useState(set.intensity_unit ?? "");
  const [dur, setDur] = useState((set.duration_minutes ?? 0).toString());

  return (
    <div className={`px-3 sm:px-4 py-2 grid grid-cols-[1.5rem_1fr_4.5rem_3.5rem] sm:grid-cols-[2rem_1fr_5rem_3.5rem] gap-1.5 sm:gap-2 items-center border-t border-surface-300 ${set.is_completed ? "bg-accent-500/10" : ""}`}>
      <span className="text-sm font-medium text-gray-500">{set.set_number}</span>

      <div className="flex items-center gap-1">
        <input
          type="number"
          value={intensityVal}
          placeholder="0"
          onChange={(e) => setIntensityVal(e.target.value)}
          onBlur={() => onUpdate({ intensity: parseFloat(intensityVal) || 0 })}
          className="w-16 bg-surface-200 border border-surface-400 rounded-lg px-1.5 py-1.5 text-sm text-center text-gray-100 focus:ring-1 focus:ring-accent-400"
        />
        <input
          type="text"
          value={iUnit}
          placeholder="unit"
          onChange={(e) => setIUnit(e.target.value)}
          onBlur={() => onUpdate({ intensity_unit: iUnit.trim() })}
          className="w-full bg-surface-200 border border-surface-400 rounded-lg px-1.5 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:ring-1 focus:ring-accent-400"
        />
      </div>

      <div className="flex items-center gap-1">
        <input
          type="number"
          value={dur}
          onChange={(e) => setDur(e.target.value)}
          onBlur={() => onUpdate({ duration_minutes: parseFloat(dur) || 0 })}
          className="w-full bg-surface-200 border border-surface-400 rounded-lg px-1.5 py-1.5 text-sm text-center text-gray-100 focus:ring-1 focus:ring-accent-400"
        />
        <span className="text-[11px] text-gray-400 shrink-0">min</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate({ is_completed: !set.is_completed })}
          className={`${set.is_completed ? "text-accent-400" : "text-gray-600 hover:text-gray-400"}`}
        >
          {set.is_completed ? <IconCheckCircle size={20} /> : <IconCircle size={20} />}
        </button>
        <button onClick={onDelete} className="text-gray-600 active:text-red-400 hover:text-red-400 transition">
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-right break-words min-w-0 inline-flex items-center gap-1">{icon}{value}</span>
    </div>
  );
}
