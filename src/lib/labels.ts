import type { Status, Urgency } from "./types";

export function statusTone(status: Status) {
  switch (status) {
    case "completed":
    case "processed_manually":
      return "ok" as const;
    case "refunded":
    case "made_partial":
    case "rejected":
      return "warn" as const;
    case "pending_again":
    case "raised_again":
      return "danger" as const;
    case "in_progress":
      return "accent" as const;
    default:
      return "neutral" as const;
  }
}

export function urgencyCopy(u: Urgency) {
  switch (u) {
    case "refund":
      return "Suggest refund (3 days)";
    case "overdue":
      return "Check overdue";
    case "due_soon":
      return "Check due soon";
    case "waiting_senior":
      return "Waiting on senior";
    case "closed":
      return "Closed";
    default:
      return "On track";
  }
}
