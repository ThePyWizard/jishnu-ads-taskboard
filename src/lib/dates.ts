/** All day boundaries use one timezone so both cofounders see the same "today". */
export const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Kolkata";

/** YYYY-MM-DD for an instant, in the given timezone. */
export function dayKey(at: Date | number | string, tz = TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(at),
  );
}

export const todayKey = (tz = TZ) => dayKey(Date.now(), tz);

/** Shifts a YYYY-MM-DD key by whole days. */
export function addDays(key: string, days: number): string {
  const d = new Date(key + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayMon0(key: string): number {
  return (new Date(key + "T12:00:00Z").getUTCDay() + 6) % 7;
}

export function fmtDay(key: string, today: string): string {
  if (key === today) return "Today";
  if (key === addDays(today, -1)) return "Yesterday";
  return new Date(key + "T12:00:00Z").toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function fmtTime(at: string, tz = TZ): string {
  return new Date(at).toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
}

function tzOffsetMs(utcMs: number, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Converts a wall-clock "YYYY-MM-DD HH:MM:SS" in `tz` to a UTC timestamp (ms). */
export function zonedToUtcMs(local: string, tz = TZ): number {
  const m = local.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return Date.parse(local);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return guess - tzOffsetMs(guess, tz);
}

