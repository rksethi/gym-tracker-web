import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { SessionSummary } from "../types";
import { formatDuration, formatVolume } from "../types";
import { IconDumbbell, IconCalendar, IconScale, IconHistory, IconTimer, IconBarChart } from "../components/Icons";

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
        <div className="text-center py-16 text-gray-500">
          <div className="flex justify-center mb-2"><IconHistory size={40} /></div>
          <p className="text-sm">Completed workouts will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={<IconDumbbell size={24} />} value={sessions.length.toString()} label="Total Workouts" />
            <StatCard icon={<IconCalendar size={24} />} value={thisMonthCount.toString()} label="This Month" />
            <StatCard icon={<IconScale size={24} />} value={formatVolume(totalVolume)} label="Total Volume" />
          </div>

          {Object.entries(grouped).map(([month, items]) => (
            <section key={month}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{month}</h2>
              <div className="grid gap-2">
                {items.map((s) => (
                  <Link
                    key={s.id}
                    to={`/history/${s.id}`}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-surface-50 rounded-xl border border-surface-300 hover:border-surface-400 hover:bg-surface-100 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{s.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                        <span className="inline-flex items-center gap-1"><IconTimer size={12} /> {formatDuration(s.duration)}</span>
                        <span className="inline-flex items-center gap-1"><IconDumbbell size={12} /> {s.exercise_count} ex.</span>
                        <span className="inline-flex items-center gap-1"><IconBarChart size={12} /> {s.total_sets} sets</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">
                        {new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      {(s.total_volume || 0) > 0 && (
                        <p className="text-xs text-accent-400 font-semibold mt-0.5">
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

function StatCard({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="bg-surface-50 rounded-xl border border-surface-300 p-3 sm:p-4 text-center">
      <div className="flex justify-center text-accent-400 mb-0.5">{icon}</div>
      <p className="text-base sm:text-xl font-bold truncate">{value}</p>
      <p className="text-[11px] sm:text-xs text-gray-500 truncate">{label}</p>
    </div>
  );
}
