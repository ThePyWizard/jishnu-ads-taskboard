import type { Platform } from "./types";

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "meta", label: "Meta" },
  { id: "google", label: "Google Ads" },
  { id: "apple", label: "Apple Search Ads" },
  { id: "tiktok", label: "TikTok" },
  { id: "other", label: "Other" },
];

export const KINDS = [
  "Budget",
  "Bid / target CPI",
  "Launched",
  "Paused",
  "Resumed",
  "New creative",
  "Creative removed",
  "Targeting / geo",
  "Audience",
  "Optimization event",
  "Structure",
  "Other",
];

export const platformLabel = (id: string) => PLATFORMS.find((p) => p.id === id)?.label ?? "Other";

/** Pulls the first number out of strings like "$50/day" or "2,400". */
export function parseNumber(s: string | null | undefined): number | null {
  const m = String(s ?? "").replace(/,/g, "").match(/-?\d*\.?\d+/);
  return m ? parseFloat(m[0]) : null;
}

/** Percentage change between two values, or null when either isn't numeric. */
export function percentChange(before: string | null, after: string | null): number | null {
  const b = parseNumber(before);
  const a = parseNumber(after);
  if (b === null || a === null || b === 0 || a === b) return null;
  return Math.round(((a - b) / Math.abs(b)) * 100);
}
