"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSyndicateApiBase } from "@/lib/syndicateApiBase";
import { parseApiJson } from "@/lib/parseApiJson";
import { createSyndicateSession } from "@/lib/syndicateAuth";

const API_BASE = getSyndicateApiBase();

export function SyndicateLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail || !safeEmail.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail, password })
      });
      const j = await parseApiJson<{ token?: string; detail?: string; user?: { id?: number; email?: string } }>(r);
      if (!r.ok || !j.token) {
        throw new Error(j.detail || "Login failed");
      }
      const uid = j.user?.id;
      if (typeof uid !== "number") {
        throw new Error("Invalid login response");
      }
      const emailForName = j.user?.email?.trim().toLowerCase() || safeEmail;
      createSyndicateSession({ name: emailForName, email: emailForName }, j.token, uid);
      router.replace(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="w-full min-w-0 overflow-x-hidden break-words rounded-2xl border border-[rgba(255,215,0,0.34)] bg-black/50 p-5 sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--gold)]/80">Syndicate Access</p>
      <h1 className="mt-2 text-[clamp(1.35rem,5vw,1.75rem)] font-black tracking-tight text-white">Login</h1>
      <p className="mt-2 text-[15px] leading-snug text-white/65 sm:text-sm">Sign in to unlock Syndicate mode missions and tracking.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoComplete="email"
          className="min-h-[48px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-[16px] text-white outline-none focus:border-[rgba(255,215,0,0.55)] sm:min-h-0 sm:text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          className="min-h-[48px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-[16px] text-white outline-none focus:border-[rgba(255,215,0,0.55)] sm:min-h-0 sm:text-sm"
        />
        {error ? <div className="rounded-lg border border-red-400/45 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div> : null}
        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] w-full touch-manipulation rounded-lg border border-[rgba(255,215,0,0.6)] bg-[rgba(255,215,0,0.18)] px-4 py-3 text-[16px] font-bold text-[color:var(--gold)] hover:bg-[rgba(255,215,0,0.26)] disabled:opacity-60 sm:min-h-0 sm:py-2.5 sm:text-sm"
        >
          {busy ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/70">
        New here?{" "}
        <Link href={`/syndicate/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-[color:var(--gold)] hover:underline">
          Create account
        </Link>
      </p>
    </main>
  );
}
