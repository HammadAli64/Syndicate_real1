"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAffiliateFunnel,
  getAffiliateStats,
  getAffiliateVisitors,
  getRecentReferrals
} from "@/lib/affiliateApi";
import type { AffiliateStats, AffiliateVisitor } from "@/lib/affiliateTypes";

type ProgramKind = "complete" | "single" | "exclusive";
type ToastTone = "good" | "warn" | "bad" | "info";

function formatWhen(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatAgo(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const diff = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

type ReferralIds = {
  complete: string;
  single: string;
  exclusive: string;
};

type AffiliatePortalProps = {
  displayName?: string;
  referralIds?: ReferralIds;
  onLogout?: () => void;
  /** When true, fits inside the main dashboard shell (sidebar layout) instead of a standalone full viewport page. */
  embedded?: boolean;
};

export default function AffiliatePortal({ displayName, referralIds, onLogout, embedded = false }: AffiliatePortalProps) {
  const toastTimerRef = useRef<number | null>(null);
  const [affiliateId, setAffiliateId] = useState(() => referralIds?.complete?.trim() || "subhan-x91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [visitors, setVisitors] = useState<AffiliateVisitor[]>([]);
  const [funnel, setFunnel] = useState<Array<{ stage: string; value: number }>>([]);
  const [funnelHover, setFunnelHover] = useState<{ stage: string; value: number } | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<Array<{ visitor_id: string; status: "joined" | "purchased"; at: string | null }>>([]);
  const [programKind, setProgramKind] = useState<ProgramKind>("complete");
  const [generatedLinks, setGeneratedLinks] = useState<Record<ProgramKind, string>>({
    complete: "",
    single: "",
    exclusive: "",
  });
  const [showProgramOptions, setShowProgramOptions] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);
  const overallStats = useMemo(() => {
    if (!stats) return null;
    return (
      stats.overall ?? {
        click_count: stats.click_count ?? 0,
        lead_count: stats.lead_count ?? 0,
        sale_count: stats.sale_count ?? 0,
        conversion_rate: stats.click_count
          ? Math.round(
              ((((stats.lead_count ?? 0) / stats.click_count) + ((stats.sale_count ?? 0) / stats.click_count)) / 2) * 100
            )
          : 0,
        point_total: stats.point_total ?? 0,
        earnings_total: stats.earnings_total ?? "0.00",
        last_click_at: stats.last_click_at ?? null,
        last_lead_at: stats.last_lead_at ?? null,
        last_sale_at: stats.last_sale_at ?? null,
        lead_emails: stats.lead_emails ?? [],
      }
    );
  }, [stats]);

  const conversionRate = useMemo(() => {
    if (!overallStats) return 0;
    return Math.min(100, Math.max(0, Math.round(overallStats.conversion_rate ?? 0)));
  }, [overallStats]);

  const dashboardSignal = useMemo(() => {
    const clicks = overallStats?.click_count ?? 0;
    const leads = overallStats?.lead_count ?? 0;
    const sales = overallStats?.sale_count ?? 0;
    const earnings = Number(overallStats?.earnings_total ?? "0") || 0;

    if (earnings >= 200) return { label: "High Momentum", tone: "good" as const };
    if (earnings > 0) return { label: "Revenue Live", tone: "good" as const };
    if (clicks > 0 && leads > 0 && sales === 0) return { label: "Effort Mode", tone: "warn" as const };
    return { label: "Cold Start", tone: "bad" as const };
  }, [overallStats]);
  const earningsValue = Number(overallStats?.earnings_total ?? "0") || 0;
  const earningsCardToneClass =
    earningsValue <= 0
      ? "border-[rgba(255,59,59,0.65)] shadow-[0_0_18px_rgba(255,59,59,0.28)]"
      : earningsValue < 100
        ? "border-[rgba(255,215,0,0.7)] shadow-[0_0_18px_rgba(255,215,0,0.3)]"
        : "border-[rgba(0,255,122,0.72)] shadow-[0_0_26px_rgba(0,255,122,0.4)]";

  const [conversionRing, setConversionRing] = useState(0);
  useEffect(() => {
    const c = referralIds?.complete?.trim();
    if (c) setAffiliateId(c);
  }, [referralIds?.complete, referralIds?.single, referralIds?.exclusive]);

  useEffect(() => {
    // Smoothly animate ring to new value.
    setConversionRing(0);
    const t = window.setTimeout(() => setConversionRing(conversionRate), 120);
    return () => window.clearTimeout(t);
  }, [conversionRate]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    showToast(`Welcome ${displayName ?? "Affiliate"}.`, "info");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

  const linkTemplateMap = useMemo<Record<ProgramKind, string>>(() => {
    const base =
      process.env.NEXT_PUBLIC_REFERRAL_BASE_URL?.trim() ||
      (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3000");
    const completeId = encodeURIComponent((referralIds?.complete ?? affiliateId).trim() || "affiliate");
    const singleId = encodeURIComponent((referralIds?.single ?? affiliateId).trim() || "affiliate");
    const exclusiveId = encodeURIComponent((referralIds?.exclusive ?? affiliateId).trim() || "affiliate");
    return {
      complete: `${base}/affiliate/${completeId}?offer=complete-programs&tier=standard`,
      single: `${base}/affiliate/${singleId}?offer=single-program&program=program-01`,
      exclusive: `${base}/affiliate/${exclusiveId}?offer=exclusive&creator=gussy-bahi&drop=01`,
    };
  }, [affiliateId, referralIds]);
  const activeReferralLink = generatedLinks[programKind];

  function showToast(message: string, tone: ToastTone = "info") {
    setToast({ id: Date.now(), message, tone });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => {
    if (!referralIds) return;
    const next = referralIds[programKind];
    if (next) setAffiliateId(next);
  }, [programKind, referralIds]);

  function selectProgramAndGenerate(kind: ProgramKind) {
    const isExisting = Boolean(generatedLinks[kind]);
    setProgramKind(kind);
    setCopiedLink(null);
    setGeneratedLinks((prev) => {
      if (prev[kind]) return prev;
      return { ...prev, [kind]: linkTemplateMap[kind] };
    });
    showToast(
      isExisting ? `${kind.toUpperCase()} referral already generated.` : `${kind.toUpperCase()} referral generated.`,
      isExisting ? "warn" : "good",
    );
    setShowProgramOptions(false);
  }

  async function copyLink(link: string) {
    if (!link) {
      showToast("No referral link to copy yet.", "warn");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      showToast("Referral copied.", "good");
      window.setTimeout(() => setCopiedLink(null), 900);
    } catch {
      setCopiedLink(null);
      showToast("Could not copy referral link.", "bad");
    }
  }

  async function shareLink(link: string) {
    if (!link) {
      showToast("No referral link to share yet.", "warn");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: "Referral link", text: "Join via my referral link", url: link });
        showToast("Referral shared.", "good");
      } else {
        await copyLink(link);
      }
    } catch {
      showToast("Share cancelled or failed.", "warn");
    }
  }

  const refreshData = useCallback(async (silent = false) => {
    if (!affiliateId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [statsResult, visitorsResult, funnelResult, recentResult] = await Promise.all([
        getAffiliateStats(affiliateId.trim()),
        getAffiliateVisitors(affiliateId.trim(), 25),
        getAffiliateFunnel(affiliateId.trim()),
        getRecentReferrals(affiliateId.trim(), 8),
      ]);
      setStats(statsResult);
      setVisitors(visitorsResult.visitors);
      setFunnel(funnelResult.stages);
      setRecentReferrals(recentResult.items);
      if (!silent) showToast("Data loaded.", "good");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not fetch affiliate data.";
      if (/affiliate_id not found/i.test(message)) {
        setError("This referral ID is not on this server (new database or stale login). Log in again to refresh.");
        if (!silent) showToast("Affiliate session out of date — logging out.", "warn");
        window.setTimeout(() => onLogout?.(), 400);
        return;
      }
      if (message.toLowerCase().includes("failed to fetch")) {
        setError(
          "Failed to fetch. Run the unified Django backend (same service as Syndicate API), set NEXT_PUBLIC_SYNDICATE_API_URL, and ensure CORS allows this origin if you use a LAN IP."
        );
        if (!silent) showToast("Could not load data from backend.", "bad");
      } else {
        setError(message);
        if (!silent) showToast(message, "bad");
      }
    } finally {
      setLoading(false);
    }
  }, [affiliateId, onLogout]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Poll for latest backend stats so UI stays live without page reload.
      void refreshData(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  function handleLogout() {
    showToast("Logging out...", "warn");
    window.setTimeout(() => onLogout?.(), 320);
  }

  return (
    <div
      className={
        embedded
          ? "affiliate-portal-embed w-full bg-transparent p-0 text-white"
          : "font-thryon min-h-screen w-full bg-[#090909] p-3 text-white md:p-5"
      }
    >
      <main
        className={
          embedded
            ? "cut-frame cyber-frame glass-dark premium-gold-border gold-stroke mx-auto flex h-auto min-h-[min(58vh,560px)] max-h-[min(82vh,920px)] w-full max-w-none flex-col overflow-hidden p-4 sm:p-5"
            : "cut-frame cyber-frame glass-dark premium-gold-border gold-stroke mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-[1800px] flex-col overflow-hidden p-4 sm:h-[calc(100vh-2.5rem)] sm:p-5"
        }
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black uppercase tracking-[0.08em] text-[#f7d774] sm:text-2xl">Affiliate Dashboard</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Affiliate ID: {affiliateId}</div>
            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={loading}
              className="cut-frame-sm hud-hover-glow btn-gold px-4 py-2 text-xs font-black uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Loading..." : "Sync Core"}
            </button>
            {onLogout ? (
              <button
                type="button"
                onClick={handleLogout}
                className="cut-frame-sm hud-hover-glow border border-[rgba(255,59,59,0.55)] bg-[linear-gradient(180deg,rgba(255,70,70,0.16),rgba(110,10,10,0.24))] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#ffd8d8]"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto pr-1 no-scrollbar">
          {error ? (
            <div className="mb-4 cut-frame-sm badge-danger px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}

          <div className="cut-frame-sm border border-[rgba(255,215,0,0.34)] bg-black/45 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-black uppercase tracking-[0.2em] text-white/70">Programs</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Scope: Selected Program</div>
              </div>
              <div
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${
                  dashboardSignal.tone === "good" ? "badge-live" : dashboardSignal.tone === "warn" ? "badge-warn" : "badge-danger"
                }`}
              >
                <span
                  className={`inline-flex h-2.5 w-2.5 animate-pulse rounded-full ${
                    dashboardSignal.tone === "good"
                      ? "bg-[#00ff7a] shadow-[0_0_10px_rgba(0,255,122,0.85)]"
                      : dashboardSignal.tone === "warn"
                        ? "bg-[#ffd74d] shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                        : "bg-[#ff3b3b] shadow-[0_0_10px_rgba(255,59,59,0.85)]"
                  }`}
                />
                {dashboardSignal.label}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[1720px] cut-frame-sm border border-[rgba(255,215,0,0.25)] bg-black/30 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <div className="flex-1">
                  <div className="mb-1 h-[25px] text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Referral Link</div>
                  <input
                    value={activeReferralLink}
                    placeholder="Generate a referral link"
                    readOnly
                    className={`cut-frame-sm focus-ring-gold w-full border px-3 py-3 text-[14px] font-semibold text-white/90 outline-none placeholder:text-white/35 ${
                      copiedLink === activeReferralLink && activeReferralLink
                        ? "border-[rgba(0,255,122,0.75)] bg-[rgba(0,60,30,0.5)] shadow-[0_0_16px_rgba(0,255,122,0.35)]"
                        : "border-[rgba(255,215,0,0.38)] bg-black/70"
                    }`}
                  />
                </div>
                {activeReferralLink ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProgramOptions((prev) => !prev)}
                      className="cut-frame-sm hud-hover-glow btn-gold cta-shimmer cta-glow-gold px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
                    >
                      Get Referal
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLink(activeReferralLink)}
                      className="cut-frame-sm hud-hover-glow btn-gold bg-black/40 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => shareLink(activeReferralLink)}
                      className="cut-frame-sm hud-hover-glow btn-cyan bg-black/40 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]"
                    >
                      Share
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowProgramOptions((prev) => !prev)}
                    className="cut-frame-sm hud-hover-glow btn-gold cta-shimmer cta-glow-gold px-4 py-2 text-sm font-bold uppercase tracking-[0.14em]"
                  >
                    Get Referal
                  </button>
                )}
              </div>
            </div>

            {showProgramOptions ? (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-1">
                <button
                  type="button"
                  onClick={() => selectProgramAndGenerate("complete")}
                  className={`cut-frame-sm hud-hover-glow border px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] ${
                    programKind === "complete"
                      ? "hud-selected-glow border-[rgba(255,215,0,0.8)] bg-[rgba(255,215,0,0.08)] text-gold"
                      : "border-[rgba(255,215,0,0.35)] bg-black/40 text-white/80"
                  } cta-program cta-program-gold cta-shimmer cta-glow-gold`}
                >
                  Complete Programs Affiliate
                </button>
                <button
                  type="button"
                  onClick={() => selectProgramAndGenerate("single")}
                  className={`cut-frame-sm hud-hover-glow border px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] ${
                    programKind === "single"
                      ? "hud-selected-glow border-[rgba(0,191,255,0.6)] bg-[rgba(0,191,255,0.08)] text-[#bfefff]"
                      : "border-[rgba(255,215,0,0.35)] bg-black/40 text-white/80"
                  } cta-program cta-program-cyan cta-shimmer cta-glow-cyan`}
                >
                  Single Program
                </button>
                <button
                  type="button"
                  onClick={() => selectProgramAndGenerate("exclusive")}
                  className={`cut-frame-sm hud-hover-glow border px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] ${
                    programKind === "exclusive"
                      ? "hud-selected-glow border-[rgba(0,255,122,0.55)] bg-[rgba(0,255,122,0.07)] text-[#b4ffd8]"
                      : "border-[rgba(255,215,0,0.35)] bg-black/40 text-white/80"
                  } cta-program cta-program-green cta-shimmer cta-glow-green`}
                >
                  Exclusive Content of Gussy Bahi
                </button>
              </div>
            ) : null}
          </div>

          <div className="mb-2 mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Scope: Overall</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card title="Total Clicks" value={overallStats?.click_count ?? "-"} />
            <Card title="Total Leads" value={overallStats?.lead_count ?? "-"} />
            <Card title="Total Sales" value={overallStats?.sale_count ?? 0} />
            <ConversionRateCard value={conversionRing} />
            <Card title="Points" value={overallStats?.point_total ?? 0} />
            <Card title="Earnings" value={`$${overallStats?.earnings_total ?? "0.00"}`} toneClassName={earningsCardToneClass} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="cut-frame-sm border border-[rgba(255,215,0,0.34)] bg-black/45 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Latest Activity</h3>
              <div className="mt-3 space-y-2 text-sm">
                <InfoRow label="Last Click At" value={formatWhen(overallStats?.last_click_at ?? null)} />
                <InfoRow label="Last Lead At" value={formatWhen(overallStats?.last_lead_at ?? null)} />
              </div>
            </div>

            <div className="cut-frame-sm border border-[rgba(255,215,0,0.34)] bg-black/45 p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Lead Emails</h3>
              <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto no-scrollbar">
                {(overallStats?.lead_emails ?? []).length > 0 ? (
                  overallStats?.lead_emails.map((email) => (
                    <span key={email} className="rounded border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.08)] px-2 py-1 text-xs text-[#f8e3a9]">
                      {email}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/50">No leads captured yet.</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 cut-frame-sm border border-[rgba(255,215,0,0.34)] bg-black/45 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Systematic Revenue Flow</div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#86ffbf]">Auto Pipeline</div>
            </div>
            <div className="relative cut-frame-sm border border-[rgba(255,215,0,0.28)] bg-black/35 p-4">
              <div className="grid grid-cols-[84px_1fr] gap-x-3 gap-y-3">
                {(funnel.length
                  ? funnel
                  : [
                      { stage: "Clicks", value: 0 },
                      { stage: "Leads", value: 0 },
                      { stage: "Conversions", value: 0 },
                    ]).map((row) => {
                  const max = Math.max(...(funnel.map((s) => s.value) || [0]), 1);
                  const pct = Math.max(2, Math.round((row.value / max) * 100));
                  return (
                    <div key={row.stage} className="contents">
                      <div className="pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">{row.stage}</div>
                      <div className="relative">
                        <div className="h-10 rounded-md border border-[rgba(255,215,0,0.18)] bg-black/40" />
                        <div
                          className="absolute left-0 top-0 h-10 rounded-md bg-[rgba(255,215,0,0.85)] shadow-[0_0_18px_rgba(255,215,0,0.25)] transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                          onMouseEnter={() => setFunnelHover(row)}
                          onMouseLeave={() => setFunnelHover(null)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {funnelHover ? (
                <div className="pointer-events-none absolute right-4 top-8 w-[170px] cut-frame-sm border border-[rgba(255,215,0,0.35)] bg-black/70 p-3 text-white/90">
                  <div className="text-sm font-black uppercase tracking-[0.14em] text-white/85">{funnelHover.stage}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#f6dc97]">
                    value : {funnelHover.value.toLocaleString()}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 cut-frame-sm border border-[rgba(255,215,0,0.34)] bg-black/45 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Recent Referrals</div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#bfefff]">Live Feed</div>
            </div>
            <div className="space-y-3">
              {recentReferrals.length ? (
                recentReferrals.map((r) => (
                  <div
                    key={r.visitor_id}
                    className="cut-frame-sm hud-hover-glow flex items-center justify-between gap-3 border border-[rgba(255,215,0,0.22)] bg-black/40 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[rgba(0,191,255,0.35)] bg-black/55 text-sm font-black text-[#bfefff]">
                        {(r.visitor_id || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white/88">{r.visitor_id}</div>
                        <div className={`text-[11px] font-black uppercase tracking-[0.16em] ${r.status === "purchased" ? "text-[#86ffbf]" : "text-white/55"}`}>
                          {r.status}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">{formatAgo(r.at)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/55">No referral activity yet.</div>
              )}
            </div>
          </div>

          <div className="mt-5 cut-frame-sm border border-[rgba(255,215,0,0.34)] bg-black/45 p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Affiliate Visitors</h3>
            <div className="mt-3 overflow-auto no-scrollbar">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-white/60">
                  <tr className="border-b border-[rgba(255,215,0,0.2)]">
                    <th className="px-2 py-2">Visitor</th>
                    <th className="px-2 py-2">Clicked At</th>
                    <th className="px-2 py-2">Lead Email</th>
                    <th className="px-2 py-2">Lead At</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.length > 0 ? (
                    visitors.map((v) => (
                      <tr key={v.visitor_id} className="border-b border-white/10 text-white/85">
                        <td className="px-2 py-2 font-semibold">{v.visitor_id}</td>
                        <td className="px-2 py-2">{formatWhen(v.clicked_at)}</td>
                        <td className="px-2 py-2">{v.lead_email ?? "-"}</td>
                        <td className="px-2 py-2">{formatWhen(v.lead_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-2 py-5 text-center text-white/45">
                        No visitor activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      {toast ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[120]">
          <div
            className={`cut-frame-sm border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-[0_8px_26px_rgba(0,0,0,0.55)] ${
              toast.tone === "good"
                ? "border-[rgba(0,255,122,0.55)] bg-[rgba(0,45,22,0.88)] text-[#a8ffd1]"
                : toast.tone === "warn"
                  ? "border-[rgba(255,215,0,0.55)] bg-[rgba(65,45,0,0.88)] text-[#ffe7a3]"
                  : toast.tone === "bad"
                    ? "border-[rgba(255,59,59,0.55)] bg-[rgba(70,8,8,0.9)] text-[#ffd0d0]"
                    : "border-[rgba(0,191,255,0.55)] bg-[rgba(0,30,55,0.9)] text-[#bfefff]"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, value, toneClassName }: { title: string; value: number | string; toneClassName?: string }) {
  return (
    <div className={`cut-frame-sm hud-hover-glow border bg-black/45 p-4 ${toneClassName ?? "border-[rgba(255,215,0,0.34)]"}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/60">{title}</p>
      <p className="mt-2 text-3xl font-black text-[#f8d778]">{value}</p>
    </div>
  );
}

function ConversionRateCard({ value }: { value: number }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const ringOffset = circ - (v / 100) * circ;
  return (
    <div className="cut-frame-sm hud-hover-glow border border-[rgba(0,191,255,0.35)] bg-black/45 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/60">Conversion Rate</p>
      <div className="mt-2 grid place-items-center">
        <svg viewBox="0 0 120 120" className="h-36 w-36">
          <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="rgba(0,191,255,0.9)"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={ringOffset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 700ms ease" }}
          />
          <text x="60" y="66" textAnchor="middle" fill="rgba(255,215,0,0.95)" className="text-[22px] font-black">
            {v}%
          </text>
        </svg>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-[rgba(255,215,0,0.25)] bg-black/35 px-3 py-2">
      <span className="text-xs uppercase tracking-[0.14em] text-white/60">{label}</span>
      <span className="text-sm font-semibold text-white/85">{value}</span>
    </div>
  );
}

