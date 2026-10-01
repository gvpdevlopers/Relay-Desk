import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lookupOrder } from "./mock-orders";
import { addHours } from "./time";
import { TERMINAL_STATUSES, STATUS_ACTION } from "./types";
import type {
  Channel,
  HistoryEntry,
  OrderSnapshot,
  SmmQualityOrderSnapshot,
  RequestType,
  Role,
  Status,
  SupportRequest,
} from "./types";

const STORAGE_KEY = "relay-desk-v2";

function id() {
  return crypto.randomUUID();
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function entry(
  action: string,
  by: Role,
  at: string,
  note?: string,
): HistoryEntry {
  return { at, action, by, note };
}

function seed(): SupportRequest[] {
  const t0 = hoursAgo(0.4);
  const t20 = hoursAgo(20);
  const t26 = hoursAgo(26);
  const t40 = hoursAgo(40);
  const t50 = hoursAgo(50);
  const t74 = hoursAgo(74);
  const t76 = hoursAgo(76);
  const t10 = hoursAgo(10);
  const t8 = hoursAgo(8);
  const t6 = hoursAgo(6);

  const o = (oid: string) => lookupOrder(oid);

  return [
    {
      id: id(),
      orderId: "1313972",
      type: "refill",
      channel: "whatsapp",
      notes: "Customer says drop started overnight.",
      status: "pending",
      createdAt: t0,
      firstRaisedAt: null,
      lastRaisedAt: null,
      nextCheckAt: null,
      lastCheckedAt: null,
      order: o("1313972"),
      history: [entry("Logged request", "team", t0)],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1315161",
      type: "speedup",
      channel: "whatsapp",
      notes: "Slow start, customer waiting on likes.",
      status: "in_progress",
      createdAt: t20,
      firstRaisedAt: t20,
      lastRaisedAt: t20,
      nextCheckAt: addHours(t20, 24),
      lastCheckedAt: null,
      order: o("1315161"),
      history: [
        entry("Logged request", "team", t20),
        entry("Marked in progress", "senior", t20),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1313494",
      type: "speedup",
      channel: "whatsapp",
      notes: "TikTok followers stalled.",
      status: "in_progress",
      createdAt: t26,
      firstRaisedAt: t26,
      lastRaisedAt: t26,
      nextCheckAt: addHours(t26, 24),
      lastCheckedAt: null,
      order: o("1313494"),
      history: [
        entry("Logged request", "team", t26),
        entry("Marked in progress", "senior", t26),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1313612",
      type: "speedup",
      channel: "website",
      notes: "Likes not moving after first raise.",
      status: "raised_again",
      createdAt: t50,
      firstRaisedAt: t50,
      lastRaisedAt: t10,
      nextCheckAt: addHours(t10, 24),
      lastCheckedAt: t10,
      order: o("1313612"),
      history: [
        entry("Logged request", "team", t50),
        entry("Marked in progress", "senior", t50),
        entry(
          "Checked — still not done",
          "team",
          hoursAgo(26),
          "Pending again",
        ),
        entry("Raised again", "senior", t10),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1313984",
      type: "refill",
      channel: "whatsapp",
      notes: "Drop after completion.",
      status: "pending_again",
      createdAt: t40,
      firstRaisedAt: t40,
      lastRaisedAt: t40,
      nextCheckAt: null,
      lastCheckedAt: t8,
      order: o("1313984"),
      history: [
        entry("Logged request", "team", t40),
        entry("Marked in progress", "senior", t40),
        entry(
          "Checked — still not done",
          "team",
          t8,
          "Pending again",
        ),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1308553",
      type: "marked_completed_without_done",
      channel: "website",
      notes:
        "Panel marked completed. Customer says count did not move.",
      status: "raised_again",
      createdAt: t76,
      firstRaisedAt: t76,
      lastRaisedAt: t74,
      nextCheckAt: addHours(t74, 24),
      lastCheckedAt: t74,
      order: o("1308553"),
      history: [
        entry("Logged request", "team", t76),
        entry("Marked in progress", "senior", t76),
        entry("Checked — still not done", "team", t74),
        entry("Raised again", "senior", t74),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1314102",
      type: "cancellation",
      channel: "website",
      notes: "Wrong link submitted.",
      status: "refunded",
      createdAt: t6,
      firstRaisedAt: t6,
      lastRaisedAt: t6,
      nextCheckAt: null,
      lastCheckedAt: t6,
      order: o("1314102"),
      history: [
        entry("Logged request", "team", t6),
        entry("Refunded in full", "senior", t6),
      ],
      refundAmount: 5.5,
    },
    {
      id: id(),
      orderId: "1314220",
      type: "refill",
      channel: "whatsapp",
      notes: "Partial drop on HQ followers.",
      status: "pending",
      createdAt: hoursAgo(1.2),
      firstRaisedAt: null,
      lastRaisedAt: null,
      nextCheckAt: null,
      lastCheckedAt: null,
      order: o("1314220"),
      history: [
        entry("Logged request", "team", hoursAgo(1.2)),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1315002",
      type: "speedup",
      channel: "whatsapp",
      notes: "Count caught up after 24h check.",
      status: "completed",
      createdAt: hoursAgo(30),
      firstRaisedAt: hoursAgo(28),
      lastRaisedAt: hoursAgo(28),
      nextCheckAt: null,
      lastCheckedAt: hoursAgo(4),
      order: o("1315002"),
      history: [
        entry("Logged request", "team", hoursAgo(30)),
        entry("Marked in progress", "senior", hoursAgo(28)),
        entry("Marked completed", "team", hoursAgo(4)),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1315001",
      type: "cancellation",
      channel: "website",
      notes:
        "Customer asked to cancel after start. Provider refused.",
      status: "rejected",
      createdAt: hoursAgo(12),
      firstRaisedAt: hoursAgo(11),
      lastRaisedAt: hoursAgo(11),
      nextCheckAt: null,
      lastCheckedAt: hoursAgo(3),
      order: o("1315001"),
      history: [
        entry("Logged request", "team", hoursAgo(12)),
        entry("Marked in progress", "senior", hoursAgo(11)),
        entry(
          "Rejected",
          "senior",
          hoursAgo(3),
          "Already started",
        ),
      ],
      refundAmount: null,
    },
    {
      id: id(),
      orderId: "1315004",
      type: "refill",
      channel: "whatsapp",
      notes: "Partial refill only.",
      status: "made_partial",
      createdAt: hoursAgo(80),
      firstRaisedAt: hoursAgo(78),
      lastRaisedAt: hoursAgo(50),
      nextCheckAt: null,
      lastCheckedAt: hoursAgo(5),
      order: o("1315004"),
      history: [
        entry("Logged request", "team", hoursAgo(80)),
        entry("Marked in progress", "senior", hoursAgo(78)),
        entry(
          "Made partial",
          "senior",
          hoursAgo(5),
          "$2.00",
        ),
      ],
      refundAmount: 2,
    },
    {
      id: id(),
      orderId: "1315003",
      type: "marked_completed_without_done",
      channel: "website",
      notes: "Fixed on panel by hand.",
      status: "processed_manually",
      createdAt: hoursAgo(18),
      firstRaisedAt: hoursAgo(16),
      lastRaisedAt: hoursAgo(16),
      nextCheckAt: null,
      lastCheckedAt: hoursAgo(2),
      order: o("1315003"),
      history: [
        entry("Logged request", "team", hoursAgo(18)),
        entry("Marked in progress", "senior", hoursAgo(16)),
        entry(
          "Processed manually",
          "senior",
          hoursAgo(2),
        ),
      ],
      refundAmount: null,
    },
  ];
}

interface CreateInput {
  orderId: string;
  type: RequestType;
  channel: Channel;
  notes: string;
  smmQualityOrder: SmmQualityOrderSnapshot;
}

interface DeskState {
  role: Role;
  requests: SupportRequest[];
  undoStack: SupportRequest[] | null;
  setRole: (role: Role) => void;
  createRequest: (input: CreateInput) => string;
  setStatus: (
    id: string,
    status: Status,
    note?: string,
    amount?: number,
  ) => void;
  addNote: (id: string, note: string) => void;
  refreshOrder: (id: string) => Promise<void>;
  undo: () => boolean;
  resetDemo: () => void;
}

function applyStatus(
  r: SupportRequest,
  status: Status,
  role: Role,
  now: string,
  note?: string,
  amount?: number,
): SupportRequest {
  const terminal = TERMINAL_STATUSES.includes(status);
  const startsTimer =
    status === "in_progress" || status === "raised_again";
  const money =
    status === "refunded" || status === "made_partial";

  const extra =
    note?.trim() ||
    (money && amount != null
      ? `$${amount.toFixed(2)}`
      : undefined);

  return {
    ...r,
    status,
    firstRaisedAt: startsTimer
      ? (r.firstRaisedAt ?? now)
      : r.firstRaisedAt,
    lastRaisedAt: startsTimer
      ? now
      : r.lastRaisedAt,
    nextCheckAt: startsTimer
      ? addHours(now, 24)
      : terminal ||
          status === "pending" ||
          status === "pending_again"
        ? null
        : r.nextCheckAt,
    lastCheckedAt:
      terminal || status === "pending_again"
        ? now
        : r.lastCheckedAt,
    refundAmount: money
      ? (amount ?? r.refundAmount)
      : r.refundAmount,
    history: [
      ...r.history,
      entry(
        STATUS_ACTION[status],
        role,
        now,
        extra,
      ),
    ],
  };
}

function patch(
  list: SupportRequest[],
  id: string,
  mut: (
    r: SupportRequest,
    now: string,
  ) => SupportRequest,
) {
  const now = new Date().toISOString();

  return list.map((r) =>
    r.id === id ? mut(r, now) : r,
  );
}

function snapshot(list: SupportRequest[]) {
  return structuredClone(list);
}

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      role: "team",
      requests: seed(),
      undoStack: null,

      setRole: (role) => set({ role }),

      createRequest: (input) => {
        const now = new Date().toISOString();

        const rec: SupportRequest = {
          id: id(),
          orderId: input.orderId.trim(),
          type: input.type,
          channel: input.channel,
          notes: input.notes.trim(),
          status: "pending",
          createdAt: now,
          firstRaisedAt: null,
          lastRaisedAt: null,
          nextCheckAt: null,
          lastCheckedAt: null,

          order: {
            orderId: input.smmQualityOrder.orderId,
            user: "",
            charge: input.smmQualityOrder.charge ?? 0,
            link: "",
            startCount:
              input.smmQualityOrder.startCount ?? 0,
            current: null,
            quantity: 0,
            finalQuantity: null,
            service: "",
            orderStatus:
              input.smmQualityOrder.status ?? "",
            remains:
              input.smmQualityOrder.remains ?? 0,
            createdAt: "",
            mode: "",
          },

          smmQualityOrder: input.smmQualityOrder,

          history: [
            entry(
              "Logged request",
              get().role,
              now,
            ),
          ],
          refundAmount: null,
        };

        set({
          undoStack: snapshot(get().requests),
          requests: [
            rec,
            ...get().requests,
          ],
        });

        return rec.id;
      },

      setStatus: (
        rid,
        status,
        note,
        amount,
      ) =>
        set({
          undoStack: snapshot(
            get().requests,
          ),
          requests: patch(
            get().requests,
            rid,
            (r, now) =>
              applyStatus(
                r,
                status,
                get().role,
                now,
                note,
                amount,
              ),
          ),
        }),

      addNote: (rid, note) => {
        const text = note.trim();

        if (!text) return;

        set({
          undoStack: snapshot(
            get().requests,
          ),
          requests: patch(
            get().requests,
            rid,
            (r, now) => ({
              ...r,
              notes: r.notes
                ? `${r.notes}\n${text}`
                : text,
              history: [
                ...r.history,
                entry(
                  "Note added",
                  get().role,
                  now,
                  text,
                ),
              ],
            }),
          ),
        });
      },

      refreshOrder: async (rid) => {
        const current =
          get().requests.find(
            (r) => r.id === rid,
          );

        if (!current) return;

        try {
          const response = await fetch(
            "/api/smmquality/order",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                orderId: current.orderId,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.error ??
                "Unable to refresh order.",
            );
          }

          const liveOrder =
            data.order as SmmQualityOrderSnapshot;

          set({
            undoStack: snapshot(
              get().requests,
            ),
            requests: patch(
              get().requests,
              rid,
              (r, now) => ({
                ...r,

                order: {
                  ...r.order,
                  orderId:
                    liveOrder.orderId,
                  charge:
                    liveOrder.charge ??
                    r.order.charge,
                  startCount:
                    liveOrder.startCount ??
                    r.order.startCount,
                  orderStatus:
                    liveOrder.status ??
                    r.order.orderStatus,
                  remains:
                    liveOrder.remains ??
                    r.order.remains,
                },

                smmQualityOrder:
                  liveOrder,

                history: [
                  ...r.history,
                  entry(
                    "Refreshed SMMQuality order status",
                    get().role,
                    now,
                  ),
                ],
              }),
            ),
          });
        } catch (error) {
          console.error(
            "[SMMQuality] Refresh order failed:",
            error,
          );

          const message =
            error instanceof Error
              ? error.message
              : "Unable to refresh order.";

          const now =
            new Date().toISOString();

          set({
            undoStack: snapshot(
              get().requests,
            ),
            requests: patch(
              get().requests,
              rid,
              (r) => ({
                ...r,
                history: [
                  ...r.history,
                  entry(
                    "SMMQuality order refresh failed",
                    get().role,
                    now,
                    message,
                  ),
                ],
              }),
            ),
          });
        }
      },

      undo: () => {
        const prev =
          get().undoStack;

        if (!prev) return false;

        set({
          requests: prev,
          undoStack: null,
        });

        return true;
      },

      resetDemo: () =>
        set({
          requests: seed(),
          role: "team",
          undoStack: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        role: s.role,
        requests: s.requests,
      }),
    },
  ),
);

export function openDuplicates(
  requests: SupportRequest[],
  orderId: string,
  exceptId?: string,
) {
  const id = orderId.trim();

  return requests.filter(
    (r) =>
      r.orderId === id &&
      r.id !== exceptId &&
      !TERMINAL_STATUSES.includes(
        r.status,
      ),
  );
}

export function serviceHealth(
  requests: SupportRequest[],
  now = Date.now(),
) {
  const week =
    7 * 24 * 60 * 60 * 1000;

  const counts = new Map<
    string,
    {
      n: number;
      types: Set<string>;
    }
  >();

  for (const r of requests) {
    if (
      now -
        new Date(
          r.createdAt,
        ).getTime() >
      week
    ) {
      continue;
    }

    if (r.type === "speedup") continue;

    const key = r.order.service;

    const cur =
      counts.get(key) ?? {
        n: 0,
        types: new Set<string>(),
      };

    cur.n += 1;
    cur.types.add(r.type);
    counts.set(key, cur);
  }

  return [...counts.entries()]
    .filter(([, v]) => v.n >= 3)
    .map(
      ([service, v]) => ({
        service,
        count: v.n,
        types: [...v.types],
      }),
    )
    .sort(
      (a, b) =>
        b.count - a.count,
    );
}