/** Local calendar day as `YYYY-MM-DD` (not UTC). */
export function toYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYyyyMmDd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return Number.isFinite(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === m! - 1 && dt.getDate() === d!
    ? dt
    : null;
}

export function missionLocalDay(targetIso: string): string {
  const d = new Date(targetIso);
  if (!Number.isFinite(d.getTime())) return "";
  return toYyyyMmDd(d);
}

export function noteLocalDay(createdAtMs: number): string {
  return toYyyyMmDd(new Date(createdAtMs));
}

const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export type CalendarCell = {
  y: number;
  m: number; // 0-11
  d: number;
  inCurrentMonth: boolean;
};

export function buildMonthGrid(viewYear: number, viewMonth: number): CalendarCell[] {
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const nDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevLast = new Date(viewYear, viewMonth, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDow; i++) {
    const day = prevLast - firstDow + i + 1;
    const pm = viewMonth === 0 ? 11 : viewMonth - 1;
    const py = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ y: py, m: pm, d: day, inCurrentMonth: false });
  }
  for (let d = 1; d <= nDays; d++) {
    cells.push({ y: viewYear, m: viewMonth, d, inCurrentMonth: true });
  }
  let n = 1;
  const nm = viewMonth === 11 ? 0 : viewMonth + 1;
  const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ y: ny, m: nm, d: n, inCurrentMonth: false });
    n++;
  }
  return cells;
}

export { WEEK };

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;
