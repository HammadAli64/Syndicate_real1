"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { STORAGE_SIMPLE_AUTH } from "@/lib/portal-api";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

type LoginResponse = {
  token?: string;
  detail?: string;
  error?: string;
  user?: { id: number; email: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/syndicate-auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;
      if (!response.ok || !data.token) {
        throw new Error(data.error || data.detail || "Login failed.");
      }
      window.localStorage.setItem(STORAGE_SIMPLE_AUTH, data.token);
      document.cookie = `simple_auth_session=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-xl border border-[rgba(255,215,0,0.35)] bg-black/70 p-7 shadow-[0_0_35px_rgba(255,215,0,0.15)]">
        <h1 className="text-lg font-black uppercase tracking-[0.18em] text-[color:var(--gold)]">Login</h1>
        <p className="mt-1 text-xs text-white/55">Simple email/password login.</p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none focus:border-[rgba(255,215,0,0.5)]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none focus:border-[rgba(255,215,0,0.5)]"
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md border border-[rgba(255,215,0,0.4)] bg-[rgba(255,215,0,0.12)] py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--gold)] disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/signup" className="text-xs text-white/70 underline-offset-4 hover:text-[color:var(--gold)] hover:underline">
            Need account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
