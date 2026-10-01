import { CHANNEL_LABEL, STATUS_LABEL, TYPE_LABEL, type SupportRequest } from "./types";
import { formatClock } from "./time";

function cell(v: string | number | null | undefined) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function requestsToCsv(rows: SupportRequest[]) {
  const header = [
    "Order ID",
    "Type",
    "Status",
    "Channel",
    "User",
    "Service",
    "Charge",
    "Link",
    "Logged",
    "First raised",
    "Next check",
    "Notes",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        cell(r.orderId),
        cell(TYPE_LABEL[r.type]),
        cell(STATUS_LABEL[r.status]),
        cell(CHANNEL_LABEL[r.channel]),
        cell(r.order.user),
        cell(r.order.service),
        cell(r.order.charge.toFixed(2)),
        cell(r.order.link),
        cell(formatClock(r.createdAt)),
        cell(r.firstRaisedAt ? formatClock(r.firstRaisedAt) : ""),
        cell(r.nextCheckAt ? formatClock(r.nextCheckAt) : ""),
        cell(r.notes),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
