"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dashboarded:intel-snippets";

type IntelSnippet = {
  id: string;
  title: string;
  body: string;
  savedAt: number;
};

function loadIntel(): IntelSnippet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IntelSnippet[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIntel(items: IntelSnippet[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function BlackBoxIntelPanel() {
  const [items, setItems] = useState<IntelSnippet[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    setItems(loadIntel());
    setHydrated(true);
  }, []);

  const persistIntel = useCallback((next: IntelSnippet[]) => {
    setItems(next);
    saveIntel(next);
  }, []);

  const addSnippet = useCallback(() => {
    const t = title.trim();
    const b = body.trim();
    if (!t && !b) return;
    const next: IntelSnippet = {
      id: `intel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: t || "Untitled signal",
      body: b || "-",
      savedAt: Date.now()
    };
    persistIntel([next, ...items]);
    setTitle("");
    setBody("");
  }, [body, items, persistIntel, title]);

  const removeSnippet = useCallback(
    (id: string) => {
      persistIntel(items.filter((x) => x.id !== id));
    },
    [items, persistIntel]
  );

  return (
    <div className="rounded-md border border-white/10 bg-black/35 p-3 shadow-[inset_0_0_0_1px_rgba(196,126,255,0.08)]">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/78">Black box - intel</div>
        <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-emerald-300/75">Capture channel</div>
      </div>

      <div className="mt-2 rounded border border-white/10 bg-black/40 p-2">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Capture signal</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="mt-2 w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[12px] text-white/90 placeholder:text-white/25 outline-none focus:border-fuchsia-500/40"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Intel body..."
          rows={3}
          className="mt-2 w-full resize-none rounded border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[12px] text-white/85 placeholder:text-white/25 outline-none focus:border-fuchsia-500/40"
        />
        <button
          type="button"
          onClick={addSnippet}
          className="mt-2 w-full rounded border border-emerald-500/35 bg-emerald-500/10 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/90 hover:border-emerald-400/55"
        >
          Save to black box
        </button>
      </div>

      <div className="mt-2 space-y-2">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Saved intel ({items.length})</div>
        {hydrated && items.length === 0 ? (
          <div className="rounded border border-fuchsia-500/30 bg-fuchsia-500/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fuchsia-200/75">
            No intel captured yet.
          </div>
        ) : null}
        <div className="max-h-[205px] space-y-2 overflow-y-auto pr-1">
          {items.map((it) => (
            <div key={it.id} className="rounded border border-white/10 bg-black/35 p-2.5 font-mono shadow-[inset_0_0_0_1px_rgba(196,126,255,0.08)]">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[12px] font-bold text-fuchsia-200/90">{it.title}</div>
                <button
                  type="button"
                  onClick={() => removeSnippet(it.id)}
                  className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-white/35 hover:text-red-300/90"
                >
                  Purge
                </button>
              </div>
              <div className="mt-1.5 whitespace-pre-wrap text-[11px] leading-relaxed text-white/65">{it.body}</div>
              <div className="mt-2 text-[9px] text-white/30">{new Date(it.savedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
