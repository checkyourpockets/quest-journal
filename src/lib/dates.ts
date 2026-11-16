const DAY = 86400000;

export function kstNow(): Date {
  return new Date(Date.now() + 9 * 3600 * 1000);
}

export function kstToday(): string {
  return kstNow().toISOString().slice(0, 10);
}

/** Monday is 1 and Sunday is 7. */
export function isoWeekday(iso: string): number {
  const day = new Date(iso.slice(0, 10) + "T00:00:00Z").getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(iso: string, days: number): string {
  const t = new Date(iso + "T00:00:00Z").getTime() + days * DAY;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysTo(target: string, today = kstToday()): number {
  return Math.round((new Date(target + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) / DAY);
}

export function pShort(iso: string): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function wd(iso: string): string {
  return new Date(iso.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export function dayLabel(iso: string): string {
  return pShort(iso) + " (" + wd(iso) + ")";
}

export function longDate(iso: string): string {
  return new Date(iso.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function mLong(ym: string): string {
  const m = ym.slice(0, 7);
  return new Date(m + "-01T00:00:00Z").toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function pLong(p: { p: string; end?: string | null }): string {
  return pShort(p.p) + " '" + p.p.slice(2, 4) + " → " + (p.end ? pShort(p.end) : "now");
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  return dt.toISOString().slice(0, 7);
}

export function won(n: number): string {
  return (n < 0 ? "−₩" : "₩") + Math.abs(Math.round(n)).toLocaleString("en-US");
}

export function usd(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−$" : "$") + abs;
}

export function kstStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }) + " KST";
}

export function wonK(n: number): string {
  return "₩" + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + "M" : Math.round(n / 1000) + "k");
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
