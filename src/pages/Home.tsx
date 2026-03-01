import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { SessionSummary, WorkoutTemplate } from "../types";
import { formatDuration } from "../types";

export default function Home() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();

  useEffect(() => {
    api.sessions.list().then(setSessions);
    api.templates.list().then(setTemplates);
  }, []);

  async function startWorkout() {
    const session = await api.sessions.create(
      workoutName || "Workout",
      selectedTemplateId
    );
    setShowPrompt(false);
    setWorkoutName("");
    setSelectedTemplateId(undefined);
    navigate(`/workout/${session.id}`);
  }

  return (
    <div className="space-y-8">
      {/* Start Workout Card */}
      <button
        onClick={() => setShowPrompt(true)}
        className="w-full bg-gradient-to-r from-accent-500 to-accent-400 text-gray-900 rounded-2xl p-6 text-left hover:from-accent-600 hover:to-accent-500 transition shadow-lg shadow-accent-500/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Start Workout</h2>
            <p className="text-gray-800/70 text-sm mt-1">Empty workout</p>
          </div>
          <span className="text-3xl">＋</span>
        </div>
      </button>

      {/* Name Prompt Modal */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-50 rounded-2xl p-6 w-full max-w-sm space-y-4 border border-surface-300">
            <h3 className="text-lg font-bold">Name Your Workout</h3>
            <input
              type="text"
              placeholder="e.g. Push Day"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startWorkout()}
              autoFocus
              className="w-full bg-surface-200 border border-surface-400 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPrompt(false); setWorkoutName(""); setSelectedTemplateId(undefined); }}
                className="flex-1 py-2.5 rounded-xl border border-surface-400 text-sm font-medium text-gray-300 hover:bg-surface-200"
              >
                Cancel
              </button>
              <button
                onClick={startWorkout}
                className="flex-1 py-2.5 rounded-xl bg-accent-500 text-gray-900 text-sm font-bold hover:bg-accent-400"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start from Templates */}
      {templates.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Quick Start</h2>
          <div className="grid gap-3">
            {templates.slice(0, 3).map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplateId(t.id); setWorkoutName(t.name); setShowPrompt(true); }}
                className="flex items-center justify-between p-4 bg-surface-50 rounded-xl border border-surface-300 hover:border-accent-500/40 hover:bg-surface-100 transition text-left"
              >
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.exercises.length} exercises</p>
                </div>
                <span className="text-accent-400 text-xl">▶</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent Workouts */}
      <section>
        <h2 className="text-lg font-bold mb-3">Recent Workouts</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">🏋️</p>
            <p className="text-sm">No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.slice(0, 8).map((s) => (
              <Link
                key={s.id}
                to={`/history/${s.id}`}
                className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-surface-50 rounded-xl border border-surface-300 hover:border-surface-400 hover:bg-surface-100 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                    <span>⏱ {formatDuration(s.duration)}</span>
                    <span>🏋️ {s.exercise_count} exercises</span>
                    <span>📊 {s.total_sets} sets</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
