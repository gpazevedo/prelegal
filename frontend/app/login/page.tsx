"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, ApiError } from "@/lib/api";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (mode === "signup" && err.status === 409) {
          setError("An account with this email already exists. Please sign in.");
        } else if (mode === "signin" && err.status === 401) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ backgroundColor: "var(--color-dark-navy)" }}>
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-dark-navy)" }}
          >
            Prelegal
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-gray-text)" }}>
            Legal documents, drafted by AI
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-200">
            <button
              onClick={() => { setMode("signin"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "border-b-2 -mb-px text-[#032147]"
                  : "text-[#888888] hover:text-[#032147]"
              }`}
              style={
                mode === "signin"
                  ? { borderColor: "var(--color-blue-primary)", color: "var(--color-dark-navy)" }
                  : undefined
              }
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "border-b-2 -mb-px"
                  : "hover:text-[#032147]"
              }`}
              style={
                mode === "signup"
                  ? { borderColor: "var(--color-blue-primary)", color: "var(--color-dark-navy)" }
                  : { color: "var(--color-gray-text)" }
              }
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-dark-navy)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7] focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-dark-navy)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#209dd7] focus:border-transparent"
                placeholder="••••••••"
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs" style={{ color: "var(--color-gray-text)" }}>
                  Minimum 6 characters
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "var(--color-purple-secondary)" }}
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--color-gray-text)" }}>
          Documents generated are drafts only and subject to legal review.
        </p>
      </div>
    </div>
  );
}
