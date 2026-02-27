import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { SessionSummary } from "../types";
import { formatDuration, formatVolume } from "../types";

export default function History() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => { api.sessions.list().then(setSessions); }, []);

  const grouped = sessions.reduce<Record<string, SessionSummary[]>>((acc, s) => {
    const d = new Date(s.date);
    const key = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const thisMonthCount = sessions.filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalVolume = sessions.reduce((sum, s) => sum + (s.total_volume || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🕐</p>
          <p className="text-sm">Completed workouts will appear here.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="🏋️" value={sessions.length.toString()} label="Total Workouts" />
            <StatCard icon="📅" value={thisMonthCount.toString()} label="This Month" />
            <StatCard icon="⚖️" value={formatVolume(totalVolume)} label="Total Volume" />
          </div>

          {/* Sessions grouped by month */}
          {Object.entries(grouped).map(([month, items]) => (
            <section key={month}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{month}</h2>
              <div className="grid gap-2">
                {items.map((s) => (
                  <Link
                    key={s.id}
                    to={`/history/${s.id}`}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{s.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                        <span>⏱ {formatDuration(s.duration)}</span>
                        <span>🏋️ {s.exercise_count} ex.</span>
                        <span>📊 {s.total_sets} sets</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      {(s.total_volume || 0) > 0 && (
                        <p className="text-xs text-accent-600 font-semibold mt-0.5">
                          {formatVolume(s.total_volume)} vol
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
      <p className="text-xl sm:text-2xl mb-0.5">{icon}</p>
      <p className="text-base sm:text-xl font-bold truncate">{value}</p>
      <p className="text-[11px] sm:text-xs text-gray-500 truncate">{label}</p>
    </div>
  );
}
