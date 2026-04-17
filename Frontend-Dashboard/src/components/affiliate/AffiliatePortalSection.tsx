"use client";

import { useEffect, useState } from "react";
import { readStoredAffiliateReferralIds, type StoredAffiliateReferralIds } from "@/lib/affiliateReferralIds";
import AffiliatePortal from "./AffiliatePortal";

/** Default public affiliate id used for embedded stats/links when no login is required. */
const DEFAULT_REFERRAL_IDS = {
  complete: "subhan-x91",
  single: "subhan-x91",
  exclusive: "subhan-x91"
} as const;

const TOKEN_KEY = "affiliate_token";
const USER_KEY = "affiliate_user";

type AffiliatePortalSectionProps = {
  /** Same label as the main navbar profile (email local-part after OTP, or user-edited name). */
  shellProfileName?: string;
};

export function AffiliatePortalSection({ shellProfileName = "Affiliate" }: AffiliatePortalSectionProps) {
  const [referralIds, setReferralIds] = useState<StoredAffiliateReferralIds | null>(null);

  useEffect(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setReferralIds(readStoredAffiliateReferralIds());
  }, [shellProfileName]);

  const effectiveReferrals = referralIds ?? DEFAULT_REFERRAL_IDS;

  return (
    <section data-anim="in" className="mt-2 flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="syndicate-dystopia-enclosure syndicate-missions-shell cut-frame cyber-frame relative flex min-h-0 w-full flex-1 flex-col overflow-hidden border border-[rgba(255,215,0,0.52)] bg-[#060606]/88 px-0 py-4 sm:py-6 [box-shadow:0_0_0_1px_rgba(255,215,0,0.30),0_0_18px_rgba(255,215,0,0.26),0_0_52px_rgba(255,215,0,0.14)]">
        <div className="syndicate-missions-shell-wash pointer-events-none absolute inset-0 opacity-62 [background:radial-gradient(760px_220px_at_20%_0%,rgba(255,215,0,0.15),rgba(0,0,0,0)_65%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.015)_0px,rgba(255,255,255,0.015)_1px,transparent_8px,transparent_14px)]" />
        <div className="relative min-h-0 flex-1">
          <AffiliatePortal embedded displayName={shellProfileName} referralIds={effectiveReferrals} />
        </div>
      </div>
    </section>
  );
}
