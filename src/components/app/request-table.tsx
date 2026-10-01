import { Badge } from "@/components/ui/badge";
import { copyText } from "@/lib/copy";
import { statusTone, urgencyCopy } from "@/lib/labels";
import { formatClock, urgency } from "@/lib/time";
import { STATUS_LABEL, TYPE_LABEL, type SupportRequest } from "@/lib/types";

export function RequestTable({
  rows,
  now,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  rows: SupportRequest[];
  now: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[], on: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const allIds = rows.map((r) => r.id);
  const allOn = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someOn = allIds.some((id) => selected.has(id));

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center">
        <p className="text-fg">Nothing in this view</p>
        <p className="mt-1 text-sm text-muted">Log a request or switch filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="bg-surface-2 text-xs font-medium uppercase tracking-wider text-subtle">
          <tr>
            <th className="w-12 px-3 py-3">
              <input
                type="checkbox"
                className="size-4 accent-accent"
                checked={allOn}
                ref={(el) => {
                  if (el) el.indeterminate = someOn && !allOn;
                }}
                onChange={(e) => onToggleAll(allIds, e.target.checked)}
                aria-label="Select all"
              />
            </th>
            <th className="px-3 py-3">User</th>
            <th className="px-3 py-3">Order ID</th>
            <th className="px-3 py-3">Service</th>
            <th className="px-3 py-3">Type of request</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Updated on</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const u = urgency(r, now);
            const audit = lastAudit(r);
            return (
              <tr
                key={r.id}
                className="cursor-pointer border-t border-border hover:bg-surface-2/60"
                onClick={() => onOpen(r.id)}
              >
                <td
                  className="px-3 py-3 align-middle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-accent"
                    checked={selected.has(r.id)}
                    onChange={() => onToggle(r.id)}
                    aria-label={`Select ${r.orderId}`}
                  />
                </td>
                <td className="max-w-[180px] truncate px-3 py-3 text-fg">{r.order.user}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="font-mono tabular-nums text-fg hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyText("Order ID", r.orderId);
                    }}
                    title="Copy order ID"
                  >
                    {r.orderId}
                  </button>
                </td>
                <td className="max-w-[260px] truncate px-3 py-3 text-muted" title={r.order.service}>
                  {r.order.service}
                </td>
                <td className="px-3 py-3 text-fg">{TYPE_LABEL[r.type]}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={statusTone(r.status)}>{STATUS_LABEL[r.status]}</Badge>
                    <Badge
                      tone={
                        u === "refund" || u === "overdue"
                          ? "danger"
                          : u === "due_soon" || u === "waiting_senior"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {urgencyCopy(u)}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p className="text-fg">{audit.label}</p>
                  <p className="font-mono text-xs tabular-nums text-muted">
                    {formatClock(audit.at, now)}
                    {audit.by ? ` · ${audit.by === "senior" ? "Senior" : "Team"}` : ""}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function lastAudit(r: SupportRequest) {
  const last = r.history[r.history.length - 1];
  if (!last) return { at: r.createdAt, label: "Logged", by: null as "team" | "senior" | null };
  return { at: last.at, label: last.action, by: last.by };
}
