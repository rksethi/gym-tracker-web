import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE = "/api";

export default function Settings() {
  const { user, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`${BASE}/privacy/export`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gymtracker-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE" || !user?.email) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`${BASE}/auth/delete-account`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      logout();
      window.location.href = "/";
    } catch (e: any) {
      setDeleteError(e.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Privacy and account</p>
      </div>

      <section className="bg-surface-50 rounded-2xl border border-surface-300 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-200">Privacy & data</h2>
        <p className="text-gray-400 text-sm">
          Under GDPR, PIPEDA, and CCPA you have the right to access and export your data, and to request erasure.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-gray-900 font-medium text-sm disabled:opacity-50"
          >
            {exporting ? "Preparing…" : "Export my data"}
          </button>
          <Link to="/privacy" className="px-4 py-2 rounded-xl border border-surface-400 text-gray-300 hover:bg-surface-200 text-sm">
            Privacy notice
          </Link>
        </div>
      </section>

      <section className="bg-surface-50 rounded-2xl border border-surface-300 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-200">Delete account</h2>
        <p className="text-gray-400 text-sm">
          Permanently delete your account and all workout data. This cannot be undone.
        </p>
        <div className="space-y-2">
          <label htmlFor="deleteConfirm" className="block text-sm text-gray-400">
            Type <strong className="text-red-400">DELETE</strong> to confirm
          </label>
          <input
            id="deleteConfirm"
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            className="w-full max-w-xs bg-surface-200 border border-surface-400 rounded-xl px-4 py-2 text-sm text-gray-100"
          />
          {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </section>
    </div>
  );
}
