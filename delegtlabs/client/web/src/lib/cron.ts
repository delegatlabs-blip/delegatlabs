/** Next run helper for every-N-hours cron patterns (minute + hour fields). */
export function nextCronRun(cron: string, from: Date = new Date()): Date {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 2) return new Date(from.getTime() + 6 * 60 * 60 * 1000);

  const minute = Number(parts[0]);
  const hourExpr = parts[1];

  if (hourExpr.startsWith("*/")) {
    const step = Number(hourExpr.slice(2)) || 6;
    const candidate = new Date(from);
    candidate.setSeconds(0, 0);
    candidate.setMinutes(Number.isFinite(minute) ? minute : 0);

    for (let i = 0; i < 48; i += 1) {
      if (candidate > from && candidate.getHours() % step === 0) {
        return candidate;
      }
      candidate.setHours(candidate.getHours() + 1);
    }
  }

  return new Date(from.getTime() + 6 * 60 * 60 * 1000);
}

export function formatCountdown(target: Date, now: Date = new Date()): string {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function capabilityLabel(cap: string): string {
  return cap
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
