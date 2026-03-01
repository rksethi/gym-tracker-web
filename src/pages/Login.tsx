import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🏋️</span>
          <h1 className="text-2xl font-bold text-gray-100 mt-3">GymTracker</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-50 rounded-2xl border border-surface-300 p-6 space-y-4">
          {error && (
            <div className="bg-red-500/15 text-red-400 text-sm rounded-lg px-4 py-2.5 border border-red-500/30">
              {error}
            </div>
          )}

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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-200 border border-surface-400 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent-500 hover:bg-accent-400 text-gray-900 font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent-400 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
