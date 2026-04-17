/** Navbar / shell profile (shared with affiliate + OTP login seeding). */
export const PROFILE_DISPLAY_NAME_KEY = "dashboarded:profileDisplayName";
export const PROFILE_AVATAR_STORAGE_KEY = "dashboarded:profileAvatar";

/**
 * Human-friendly label from an email address: local-part only, no domain
 * (`user@gmail.com` → `User`). Splits on `.` / `_` / `-` and title-cases segments.
 */
export function displayNameFromEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  const local = (at === -1 ? trimmed : trimmed.slice(0, at)).trim();
  if (!local) return "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (!parts.length) return "";
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
