export const REQUEST_TYPES = [
  "refill",
  "speedup",
  "cancellation",
  "marked_completed_without_done",
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

export const CHANNELS = ["whatsapp", "website"] as const;

export type Channel = (typeof CHANNELS)[number];

export const STATUSES = [
  "pending",
  "in_progress",
  "pending_again",
  "raised_again",
  "completed",
  "rejected",
  "made_partial",
  "refunded",
  "processed_manually",
] as const;

export type Status = (typeof STATUSES)[number];

export type Role = "team" | "senior";

export const TERMINAL_STATUSES: Status[] = [
  "completed",
  "rejected",
  "made_partial",
  "refunded",
  "processed_manually",
];

export const OPEN_STATUSES: Status[] = [
  "pending",
  "in_progress",
  "pending_again",
  "raised_again",
];

export interface SmmQualityOrderSnapshot {
  orderId: string;
  charge: number | null;
  startCount: number | null;
  status: string | null;
  remains: number | null;
  currency: string | null;
}

export interface OrderSnapshot {
  orderId: string;
  user: string;
  charge: number;
  link: string;
  startCount: number;
  current: number | null;
  quantity: number;
  finalQuantity: number | null;
  service: string;
  orderStatus: string;
  remains: number;
  createdAt: string;
  mode: string;
}

export interface HistoryEntry {
  at: string;
  action: string;
  by: Role;
  note?: string;
}

export interface SupportRequest {
  id: string;
  orderId: string;
  type: RequestType;
  channel: Channel;
  notes: string;
  status: Status;
  createdAt: string;
  firstRaisedAt: string | null;
  lastRaisedAt: string | null;
  nextCheckAt: string | null;
  lastCheckedAt: string | null;
  order: OrderSnapshot;
  smmQualityOrder?: SmmQualityOrderSnapshot | null;
  //order: SmmQualityOrderSnapshot;
  history: HistoryEntry[];
  refundAmount: number | null;
}

export type Urgency =
  | "closed"
  | "refund"
  | "overdue"
  | "due_soon"
  | "waiting_senior"
  | "on_track";

export const TYPE_LABEL: Record<RequestType, string> = {
  refill: "Refill",
  speedup: "Speedup",
  cancellation: "Cancellation",
  marked_completed_without_done: "Marked completed, not done",
};

export const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In progress",
  pending_again: "Pending again",
  raised_again: "Raised again",
  completed: "Completed",
  rejected: "Rejected",
  made_partial: "Made partial",
  refunded: "Refunded",
  processed_manually: "Processed manually",
};

export const STATUS_ACTION: Record<Status, string> = {
  pending: "Set to Pending",
  in_progress: "Marked in progress",
  pending_again: "Marked pending again",
  raised_again: "Raised again",
  completed: "Marked completed",
  rejected: "Rejected",
  made_partial: "Made partial",
  refunded: "Refunded",
  processed_manually: "Processed manually",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  website: "Website ticket",
};