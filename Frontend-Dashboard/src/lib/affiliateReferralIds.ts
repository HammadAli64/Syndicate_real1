/** JSON `{ complete, single, exclusive }` from Django after OTP — used by Affiliate portal fetches. */
export const AFFILIATE_REFERRAL_IDS_STORAGE_KEY = "syndicate:affiliate_referral_ids_v1";

export type StoredAffiliateReferralIds = {
  complete: string;
  single: string;
  exclusive: string;
};

export function readStoredAffiliateReferralIds(): StoredAffiliateReferralIds | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AFFILIATE_REFERRAL_IDS_STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<StoredAffiliateReferralIds>;
    const complete = typeof j.complete === "string" ? j.complete.trim() : "";
    if (!complete) return null;
    return {
      complete,
      single: typeof j.single === "string" && j.single.trim() ? j.single.trim() : complete,
      exclusive: typeof j.exclusive === "string" && j.exclusive.trim() ? j.exclusive.trim() : complete,
    };
  } catch {
    return null;
  }
}
