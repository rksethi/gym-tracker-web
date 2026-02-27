import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { WorkoutSession } from "../types";
import { categoryIcon, categoryLabel, formatDuration } from "../types";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (id) api.sessions.get(Number(id)).then(setSession);
  }, [id]);

  if (!session) return <div className="text-center py-16 text-gray-400">Loading...</div>;

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{session.name}</h1>
        <button
          onClick={() => setShowDelete(true)}
          className="text-sm text-red-500 hover:text-red-600 font-medium"
        >
          Delete
        </button>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <Row label="Date" value={new Date(session.date).toLocaleDateString(undefined, {
          weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        })} />
        <Row label="Duration" value={formatDuration(session.duration)} />
        <Row label="Exercises" value={session.entries.length.toString()} />
        <Row label="Total Sets" value={totalSets.toString()} />
        <Row label="Total Volume" value={`${totalVolume.toFixed(1)} lbs`} />
        {maxHR > 0 && <Row label="Max Heart Rate" value={`❤️ ${maxHR} bpm`} />}
      </div>

      {/* Exercises */}
      {session.entries.map((entry) => {
        const entryVolume = entry.sets.filter((s) => s.is_completed)
          .reduce((sum, s) => sum + s.weight * s.reps, 0);

        return (
          <section key={entry.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{categoryIcon(entry.exercise_category)}</span>
                <span className="font-semibold text-sm truncate">{entry.exercise_name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                  {categoryLabel(entry.exercise_category)}
                </span>
              </div>
              {entry.max_heart_rate && (
                <span className="text-xs text-red-500 font-medium shrink-0">❤️ {entry.max_heart_rate} bpm</span>
              )}
            </div>

            <div className="divide-y divide-gray-50">
              {entry.sets.map((s) => (
                <div key={s.id} className={`px-3 sm:px-4 py-2 grid grid-cols-[2rem_1fr_1fr_2rem] sm:grid-cols-4 gap-1 text-sm ${s.is_completed ? "bg-green-50/50" : ""}`}>
                  <span className="text-gray-400">{s.set_number}</span>
                  <span className="text-center font-medium">
                    {s.weight > 0 ? `${s.weight} ${s.unit}` : "—"}
                  </span>
                  <span className="text-center">{s.reps} reps</span>
                  <span className="text-right">{s.is_completed ? "✅" : "⭕"}</span>
                </div>
              ))}
            </div>

            {entryVolume > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-400">Volume</span>
                <span className="font-semibold text-accent-600">{entryVolume.toFixed(1)} lbs</span>
              </div>
            )}
          </section>
        );
      })}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs space-y-4 text-center">
            <h3 className="text-lg font-bold">Delete Workout?</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-right break-words min-w-0">{value}</span>
    </div>
  );
}
