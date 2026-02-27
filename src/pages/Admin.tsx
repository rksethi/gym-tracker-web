import { useState, useEffect, useCallback } from "react";

interface InviteCode {
  id: number;
  code: string;
  created_by_email: string;
  created_at: string;
  expires_at: string;
  used_by_email: string | null;
  used_at: string | null;
}

interface AccessLog {
  id: number;
  user_id: number | null;
  email: string;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: "Login", color: "bg-blue-100 text-blue-700" },
  register: { label: "Register", color: "bg-green-100 text-green-700" },
  logout: { label: "Logout", color: "bg-gray-100 text-gray-600" },
};

function formatDate(iso: string) {
  const d = new Date(iso + "Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function codeStatus(code: InviteCode): { label: string; color: string } {
  if (code.used_by_email) return { label: `Used by ${code.used_by_email}`, color: "text-gray-400" };
  if (new Date(code.expires_at + "Z") < new Date()) return { label: "Expired", color: "text-red-500" };
  return { label: "Active", color: "text-green-600" };
}

async function apiRequest<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function Admin() {
  const [tab, setTab] = useState<"codes" | "logs">("codes");

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Admin Panel</h1>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("codes")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            tab === "codes" ? "bg-white shadow-sm text-accent-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Invite Codes
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            tab === "logs" ? "bg-white shadow-sm text-accent-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Access Logs
        </button>
      </div>
      {tab === "codes" ? <InviteCodesTab /> : <AccessLogsTab />}
    </div>
  );
}

function InviteCodesTab() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadCodes = useCallback(async () => {
    try {
      setCodes(await apiRequest<InviteCode[]>("/api/admin/invite-codes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCodes(); }, [loadCodes]);

  async function createCode() {
    setCreating(true);
    try {
      await apiRequest("/api/admin/invite-codes", { method: "POST" });
      await loadCodes();
    } finally {
      setCreating(false);
    }
  }

  async function deleteCode(id: number) {
    await apiRequest(`/api/admin/invite-codes/${id}`, { method: "DELETE" });
    await loadCodes();
  }

  async function copyCode(code: string, id: number) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Generate codes to share with friends. Each code is single-use and expires after 7 days.
        </p>
        <button
          onClick={createCode}
          disabled={creating}
          className="bg-accent-600 hover:bg-accent-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50 shrink-0 ml-4"
        >
          {creating ? "Creating..." : "Generate Code"}
        </button>
      </div>

      {codes.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm">
          No invite codes yet. Generate one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => {
            const status = codeStatus(c);
            const isActive = !c.used_by_email && new Date(c.expires_at + "Z") >= new Date();
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <code className="text-lg font-mono font-bold tracking-widest text-gray-800">{c.code}</code>
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Created {formatDate(c.created_at)} · Expires {formatDate(c.expires_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isActive && (
                    <button
                      onClick={() => copyCode(c.code, c.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                    >
                      {copiedId === c.id ? "Copied!" : "Copy"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteCode(c.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccessLogsTab() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    apiRequest<{ logs: AccessLog[]; total: number }>(`/api/admin/access-logs?limit=${limit}&offset=${offset}`)
      .then(({ logs, total }) => { setLogs(logs); setTotal(total); })
      .finally(() => setLoading(false));
  }, [offset]);

  if (loading && logs.length === 0) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Showing {Math.min(offset + 1, total)}–{Math.min(offset + limit, total)} of {total} events
      </p>

      {logs.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm">
          No access logs yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">When</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Action</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 hidden sm:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const a = ACTION_LABELS[log.action] || { label: log.action, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={log.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-2.5 text-gray-800 font-medium">{log.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.color}`}>{a.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs hidden sm:table-cell">{log.ip_address}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition disabled:opacity-30"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
