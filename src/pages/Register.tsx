import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconDumbbell } from "../components/Icons";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirm && confirm.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!inviteCode.trim()) { setError("Invite code is required"); return; }
    if (!allRulesPass) { setError("Password does not meet requirements"); return; }
    if (!passwordsMatch) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    try {
      await register(email, password, inviteCode.trim());
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-accent-400 flex justify-center"><IconDumbbell size={48} /></span>
          <h1 className="text-2xl font-bold text-gray-100 mt-3">GymTracker</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-50 rounded-2xl border border-surface-300 p-6 space-y-4">
          {error && (
            <div className="bg-red-500/15 text-red-400 text-sm rounded-lg px-4 py-2.5 border border-red-500/30">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-400 mb-1">Invite Code</label>
            <input
              id="inviteCode"
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full bg-surface-200 border border-surface-400 rounded-xl px-4 py-2.5 text-sm tracking-widest font-mono text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="Enter your invite code"
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-200 border border-surface-400 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-200 border border-surface-400 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="Create a password"
            />
            {password.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {PASSWORD_RULES.map((r) => (
                  <li key={r.label} className={`text-xs flex items-center gap-1.5 ${r.test(password) ? "text-accent-400" : "text-gray-500"}`}>
                    <span>{r.test(password) ? "✓" : "○"}</span> {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-surface-200 border border-surface-400 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="Confirm your password"
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !allRulesPass || !passwordsMatch}
            className="w-full bg-accent-500 hover:bg-accent-400 text-gray-900 font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent-400 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
