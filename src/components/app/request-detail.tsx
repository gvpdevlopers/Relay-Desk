import { useState } from "react";
import {
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/copy";
import {
  statusTone,
  urgencyCopy,
} from "@/lib/labels";
import { useDesk } from "@/lib/store";
import {
  formatClock,
  formatDuration,
  hoursSinceFirstRaise,
  urgency,
} from "@/lib/time";
import {
  CHANNEL_LABEL,
  STATUSES,
  STATUS_LABEL,
  TERMINAL_STATUSES,
  TYPE_LABEL,
  type Status,
  type SupportRequest,
} from "@/lib/types";

export function RequestDetail({
  request,
  now,
  onClose,
}: {
  request: SupportRequest | null;
  now: number;
  onClose: () => void;
}) {
  const role = useDesk((s) => s.role);
  const setStatus = useDesk((s) => s.setStatus);
  const addNote = useDesk((s) => s.addNote);
  const refreshOrder = useDesk(
    (s) => s.refreshOrder,
  );

  const [amount, setAmount] =
    useState("");
  const [checkNote, setCheckNote] =
    useState("");
  const [confirmRefund, setConfirmRefund] =
    useState(false);
  const [pick, setPick] =
    useState<Status | "">("");

  if (!request) return null;

  const u = urgency(request, now);
  const closed =
    TERMINAL_STATUSES.includes(
      request.status,
    );

  /*
   * For live SMMQuality requests, smmQualityOrder
   * is the authoritative order-status snapshot.
   *
   * Older/demo requests may not have this field,
   * so we fall back to the legacy OrderSnapshot.
   */
  const liveOrder =
    request.smmQualityOrder ?? null;

  const charge =
    liveOrder?.charge ??
    request.order.charge;

  const panelStatus =
    liveOrder?.status ??
    request.order.orderStatus;

  const startCount =
    liveOrder?.startCount ??
    request.order.startCount;

  const remains =
    liveOrder?.remains ??
    request.order.remains;

  /*
   * These fields are not returned by the
   * documented SMMQuality status API.
   *
   * For older/demo requests we can still display
   * their existing stored values.
   */
  const service =
    liveOrder
      ? "Unavailable from status API"
      : request.order.service;

  const user =
    liveOrder
      ? "Unavailable from status API"
      : request.order.user;

  const link =
    liveOrder
      ? null
      : request.order.link;

  const current =
    liveOrder
      ? null
      : request.order.current;

  const quantity =
    liveOrder
      ? null
      : request.order.quantity;

  const mode =
    liveOrder
      ? null
      : request.order.mode;

  const createdAt =
    liveOrder
      ? null
      : request.order.createdAt;

  const currency =
    liveOrder?.currency ??
    null;

  const parsed = Number(amount);

  const refundValue =
    Number.isFinite(parsed) &&
    parsed > 0
      ? parsed
      : charge;

  const elapsed =
    hoursSinceFirstRaise(
      request,
      now,
    );

  function mark(
    status: Status,
    money?: number,
  ) {
    setStatus(
      request!.id,
      status,
      checkNote,
      money,
    );

    setCheckNote("");
    setConfirmRefund(false);

    toast.success(
      STATUS_LABEL[status],
    );

    if (
      TERMINAL_STATUSES.includes(status)
    ) {
      onClose();
    }
  }

  return (
    <Sheet
      open={Boolean(request)}
      onOpenChange={(v) => {
        if (!v) {
          setConfirmRefund(false);
          setCheckNote("");
          setPick("");
          onClose();
        }
      }}
    >
      <SheetContent>
        <div className="flex h-full flex-col">
          <header className="border-b border-border px-5 py-5 pr-12">
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-muted">
                #{request.orderId}
              </p>

              <button
                type="button"
                className="rounded p-1 text-muted hover:bg-surface-2 hover:text-fg"
                onClick={() =>
                  void copyText(
                    "Order ID",
                    request.orderId,
                  )
                }
                title="Copy order ID"
              >
                <Copy className="size-3.5" />
              </button>
            </div>

            <h2 className="mt-1 text-lg font-medium tracking-tight text-fg text-balance">
              {TYPE_LABEL[request.type]}
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                tone={statusTone(
                  request.status,
                )}
              >
                {STATUS_LABEL[
                  request.status
                ]}
              </Badge>

              <Badge
                tone={
                  u === "refund" ||
                  u === "overdue"
                    ? "danger"
                    : "neutral"
                }
              >
                {urgencyCopy(u)}
              </Badge>

              <Badge>
                {CHANNEL_LABEL[
                  request.channel
                ]}
              </Badge>
            </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {u === "refund" ? (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                3 days since first raise
                {request.firstRaisedAt
                  ? ` (${formatClock(
                      request.firstRaisedAt,
                      now,
                    )}).`
                  : "."}{" "}
                Suggest a refund of $
                {charge.toFixed(2)}.
              </div>
            ) : null}

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">
                Order
              </h3>

              <p className="mt-2 text-sm font-medium text-fg">
                {service}
              </p>

              <p className="mt-1 text-sm text-muted">
                {user}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {link ? (
                  <>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-fg hover:bg-surface-2"
                    >
                      Open link
                      <ExternalLink className="size-3.5" />
                    </a>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        void copyText(
                          "Link",
                          link,
                        )
                      }
                    >
                      <Copy />
                      Copy link
                    </Button>
                  </>
                ) : (
                  <div className="inline-flex h-11 items-center rounded-md border border-border px-3 text-sm text-muted">
                    Link unavailable from
                    SMMQuality status API
                  </div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    void refreshOrder(
                      request.id,
                    );

                    toast.success(
                      "Snapshot refreshed",
                    );
                  }}
                >
                  <RefreshCw />
                  Refresh
                </Button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Item
                  label="Charge"
                  value={
                    currency
                      ? `${currency} ${charge.toFixed(
                          4,
                        )}`
                      : `$${charge.toFixed(2)}`
                  }
                />

                <Item
                  label="Panel status"
                  value={
                    panelStatus || "—"
                  }
                />

                <Item
                  label="Start"
                  value={
                    startCount != null
                      ? String(
                          startCount,
                        )
                      : "—"
                  }
                />

                <Item
                  label="Current"
                  value={
                    current != null
                      ? String(current)
                      : "Unavailable"
                  }
                />

                <Item
                  label="Quantity"
                  value={
                    quantity != null
                      ? String(quantity)
                      : "Unavailable"
                  }
                />

                <Item
                  label="Remains"
                  value={
                    remains != null
                      ? String(remains)
                      : "—"
                  }
                />

                <Item
                  label="Mode"
                  value={
                    mode ?? "Unavailable"
                  }
                />

                <Item
                  label="Created"
                  value={
                    createdAt || "Unavailable"
                  }
                />

                {liveOrder ? (
                  <Item
                    label="Currency"
                    value={
                      liveOrder.currency ||
                      "—"
                    }
                  />
                ) : null}

                {request.refundAmount != null ? (
                  <Item
                    label="Refund logged"
                    value={`$${request.refundAmount.toFixed(
                      2,
                    )}`}
                  />
                ) : null}
              </dl>

              {liveOrder ? (
                <p className="mt-3 text-xs text-muted">
                  Live values above come from the
                  SMMQuality order status API.
                  Service, link, quantity, current,
                  mode, user, and created date are
                  not provided by that API.
                </p>
              ) : null}
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">
                Notes
              </h3>

              {request.notes ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-pretty text-fg">
                  {request.notes}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  No notes yet.
                </p>
              )}
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">
                Due
              </h3>

              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm">
                <Item
                  label="Due"
                  value={
                    u === "closed"
                      ? STATUS_LABEL[
                          request.status
                        ]
                      : request.nextCheckAt
                        ? `${formatClock(
                            request.nextCheckAt,
                            now,
                          )} · ${
                            new Date(
                              request.nextCheckAt,
                            ).getTime() > now
                              ? `in ${formatDuration(
                                  new Date(
                                    request.nextCheckAt,
                                  ).getTime() -
                                    now,
                                )}`
                              : `overdue ${formatDuration(
                                  now -
                                    new Date(
                                      request.nextCheckAt,
                                    ).getTime(),
                                )}`
                          }`
                        : "Awaiting raise"
                  }
                />

                <Item
                  label="Logged"
                  value={formatClock(
                    request.createdAt,
                    now,
                  )}
                />

                <Item
                  label="First raised"
                  value={
                    request.firstRaisedAt
                      ? `${formatClock(
                          request.firstRaisedAt,
                          now,
                        )} · ${formatDuration(
                          elapsed * 3600000,
                        )} elapsed`
                      : "Not raised yet"
                  }
                />

                <Item
                  label="Next 24h check"
                  value={
                    request.nextCheckAt
                      ? `${formatClock(
                          request.nextCheckAt,
                          now,
                        )} · ${
                          new Date(
                            request.nextCheckAt,
                          ).getTime() > now
                            ? `in ${formatDuration(
                                new Date(
                                  request.nextCheckAt,
                                ).getTime() -
                                  now,
                              )}`
                            : `overdue ${formatDuration(
                                now -
                                  new Date(
                                    request.nextCheckAt,
                                  ).getTime(),
                              )}`
                        }`
                      : "—"
                  }
                />

                <Item
                  label="Refund window"
                  value={
                    request.firstRaisedAt
                      ? elapsed >= 72
                        ? "Reached (72h)"
                        : `${formatDuration(
                            (72 - elapsed) *
                              3600000,
                          )} remaining`
                      : "Starts after first raise"
                  }
                />
              </dl>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">
                History
              </h3>

              <ol className="mt-3 space-y-3">
                {[
                  ...request.history,
                ]
                  .reverse()
                  .map((h, i) => (
                    <li
                      key={`${h.at}-${i}`}
                      className="text-sm"
                    >
                      <p className="text-fg">
                        {h.action}
                      </p>

                      <p className="text-xs text-muted">
                        {h.by === "senior"
                          ? "Senior"
                          : "Team"}{" "}
                        ·{" "}
                        {formatClock(
                          h.at,
                          now,
                        )}
                        {h.note
                          ? ` · ${h.note}`
                          : ""}
                      </p>
                    </li>
                  ))}
              </ol>
            </section>
          </div>

          <footer className="space-y-3 border-t border-border p-4">
            <p className="text-xs text-subtle">
              Acting as{" "}
              {role === "senior"
                ? "Senior"
                : "Team"}
              . Track the order: completed,
              rejected, made partial, refunded,
              or processed manually.
            </p>

            <Textarea
              placeholder="Optional note for this status change"
              value={checkNote}
              onChange={(e) =>
                setCheckNote(
                  e.target.value,
                )
              }
              className="min-h-16"
            />

            {!closed ? (
              <div className="grid grid-cols-2 gap-2">
                {request.status ===
                  "pending" ||
                request.status ===
                  "pending_again" ? (
                  <Button
                    onClick={() =>
                      mark(
                        request.status ===
                          "pending_again"
                          ? "raised_again"
                          : "in_progress",
                      )
                    }
                  >
                    {request.status ===
                    "pending_again"
                      ? "Raise again"
                      : "In progress"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      mark(
                        "pending_again",
                      )
                    }
                  >
                    Pending again
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() =>
                    mark("completed")
                  }
                >
                  Completed
                </Button>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  mark(
                    "processed_manually",
                  )
                }
              >
                Processed manually
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  mark("rejected")
                }
              >
                Rejected
              </Button>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="amt">
                  Refund amount
                </Label>

                <Input
                  id="amt"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={charge.toFixed(
                    2,
                  )}
                  value={amount}
                  onChange={(e) => {
                    setAmount(
                      e.target.value,
                    );
                    setConfirmRefund(
                      false,
                    );
                  }}
                />
              </div>

              <Button
                className="mt-5"
                variant="outline"
                onClick={() =>
                  mark(
                    "made_partial",
                    refundValue,
                  )
                }
              >
                Made partial
              </Button>

              <Button
                className="mt-5"
                variant="danger"
                onClick={() => {
                  if (!confirmRefund) {
                    setConfirmRefund(
                      true,
                    );
                    return;
                  }

                  mark(
                    "refunded",
                    refundValue,
                  );
                }}
              >
                {confirmRefund
                  ? "Confirm refund"
                  : "Refunded"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Select
                value={
                  pick || request.status
                }
                onValueChange={(v) =>
                  setPick(
                    v as Status,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                    >
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="secondary"
                disabled={
                  !pick ||
                  pick === request.status
                }
                onClick={() => {
                  const money =
                    pick === "refunded" ||
                    pick ===
                      "made_partial"
                      ? refundValue
                      : undefined;

                  mark(
                    pick as Status,
                    money,
                  );

                  setPick("");
                }}
              >
                Set status
              </Button>
            </div>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs text-subtle">
        {label}
      </dt>

      <dd className="mt-0.5 break-all font-mono text-[13px] tabular-nums text-fg">
        {value}
      </dd>
    </div>
  );
}