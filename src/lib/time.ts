import type { SupportRequest, Urgency } from "./types";
import { TERMINAL_STATUSES } from "./types";

export const HOUR = 60 * 60 * 1000;
export const CHECK_WINDOW = 24 * HOUR;
export const REFUND_WINDOW = 72 * HOUR;
export const DUE_SOON = 2 * HOUR;

export function addHours(iso: string, hours: number) {
  return new Date(new Date(iso).getTime() + hours * HOUR).toISOString();
}

export function formatClock(iso: string | null, now = Date.now()) {
  if (!iso) return "—";
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: sameYear ? undefined : "numeric",
  });
}

export function formatDuration(ms: number) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / HOUR);
  const m = Math.floor((abs % HOUR) / 60000);
  if (h >= 48) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh ? `${d}d ${rh}h` : `${d}d`;
  }
  if (h > 0) return m ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return "now";
}

export function urgency(req: SupportRequest, now = Date.now()): Urgency {
  if (TERMINAL_STATUSES.includes(req.status)) return "closed";
  if (req.firstRaisedAt) {
    const elapsed = now - new Date(req.firstRaisedAt).getTime();
    if (elapsed >= REFUND_WINDOW) return "refund";
  }
  if (
    req.nextCheckAt &&
    (req.status === "in_progress" || req.status === "raised_again")
  ) {
    const due = new Date(req.nextCheckAt).getTime();
    if (now >= due) return "overdue";
    if (due - now <= DUE_SOON) return "due_soon";
  }
  if (req.status === "pending" || req.status === "pending_again") {
    return "waiting_senior";
  }
  return "on_track";
}

export function refundSuggested(req: SupportRequest, now = Date.now()) {
  return urgency(req, now) === "refund";
}

export function hoursSinceFirstRaise(req: SupportRequest, now = Date.now()) {
  if (!req.firstRaisedAt) return 0;
  return (now - new Date(req.firstRaisedAt).getTime()) / HOUR;
}
