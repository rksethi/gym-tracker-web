import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { WorkoutSession } from "../types";
import { categoryIcon, categoryLabel, formatDuration } from "../types";
import { IconClipboard, IconCheck, IconCheckCircle, IconCircle, IconHeart } from "../components/Icons";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(false);

  useEffect(() => {
    if (id) api.sessions.get(Number(id)).then(setSession);
  }, [id]);

  if (!session) return <div className="text-center py-16 text-gray-500">Loading...</div>;

  const totalVolume = session.entries.reduce((sum, e) =>
    sum + e.sets.filter((s) => s.is_completed).reduce((s2, s) => s2 + s.weight * s.reps, 0), 0);

  const totalSets = session.entries.reduce((sum, e) =>
    sum + e.sets.filter((s) => s.is_completed).length, 0);

  const maxHR = Math.max(0, ...session.entries.map((e) => e.max_heart_rate ?? 0));

  async function handleDelete() {
    if (!id) return;
    await api.sessions.delete(Number(id));
    navigate("/history");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold truncate">{session.name}</h1>
        <div className="flex gap-2 shrink-0">
          {session.entries.length > 0 && (
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

      <div className="bg-surface-50 rounded-xl border border-surface-300 divide-y divide-surface-300">
        <Row label="Date" value={new Date(session.date).toLocaleDateString(undefined, {
          weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        })} />
        <Row label="Duration" value={formatDuration(session.duration)} />
        <Row label="Exercises" value={session.entries.length.toString()} />
        <Row label="Total Sets" value={totalSets.toString()} />
        <Row label="Total Volume" value={`${totalVolume.toFixed(1)} lbs`} />
        {maxHR > 0 && <Row label="Max Heart Rate" value={`${maxHR} bpm`} icon={<IconHeart size={14} className="text-red-400 inline" />} />}
      </div>

      {session.entries.map((entry) => {
        const entryVolume = entry.sets.filter((s) => s.is_completed)
          .reduce((sum, s) => sum + s.weight * s.reps, 0);

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
              {entry.max_heart_rate && (
                <span className="text-xs text-red-400 font-medium shrink-0 inline-flex items-center gap-1">
                  <IconHeart size={12} /> {entry.max_heart_rate} bpm
                </span>
              )}
            </div>

            <div className="divide-y divide-surface-300">
              {entry.sets.map((s) => (
                <div key={s.id} className={`px-3 sm:px-4 py-2 grid grid-cols-[2rem_1fr_1fr_2rem] sm:grid-cols-4 gap-1 text-sm ${s.is_completed ? "bg-accent-500/10" : ""}`}>
                  <span className="text-gray-500">{s.set_number}</span>
                  {entry.exercise_category === "cardio" ? (
                    <>
                      <span className="text-center font-medium capitalize">{s.intensity ?? "—"}</span>
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

            {entryVolume > 0 && (
              <div className="px-4 py-2 border-t border-surface-300 flex justify-between text-xs">
                <span className="text-gray-500">Volume</span>
                <span className="font-semibold text-accent-400">{entryVolume.toFixed(1)} lbs</span>
              </div>
            )}
          </section>
        );
      })}

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

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-right break-words min-w-0 inline-flex items-center gap-1">{icon}{value}</span>
    </div>
  );
}
