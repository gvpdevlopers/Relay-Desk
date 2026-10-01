import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Download, Plus, RotateCcw, Search, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NewRequestDialog } from "@/components/app/new-request-dialog";
import { RequestDetail } from "@/components/app/request-detail";
import { RequestTable } from "@/components/app/request-table";
import { ThemeToggle } from "@/components/app/theme-toggle";
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
import { downloadCsv, requestsToCsv } from "@/lib/csv";
import { urgency, useNow } from "@/lib/now";
import { serviceHealth, useDesk } from "@/lib/store";
import {
  REQUEST_TYPES,
  STATUSES,
  STATUS_LABEL,
  TYPE_LABEL,

  type RequestType,
  type Status,
  type SupportRequest,
  type Urgency,
} from "@/lib/types";


export const Route = createFileRoute("/")({
  ssr: false,
  component: ProtectedHome,
});

const QUEUE_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Need action" },
  { id: "checks", label: "24h checks" },
  { id: "refund", label: "Refund window" },
  { id: "closed", label: "Closed" },
];

function ProtectedHome() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-fg">
        <p className="text-sm text-muted">Loading workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Home />;
}
function Home() {
  const requests = useDesk((s) => s.requests);
  const role = useDesk((s) => s.role);
  const setRole = useDesk((s) => s.setRole);
  const resetDemo = useDesk((s) => s.resetDemo);
  const undo = useDesk((s) => s.undo);
  const canUndo = useDesk((s) => Boolean(s.undoStack));
  const now = useNow();
  const [filter, setFilter] = useState("action");
  const [typeFilter, setTypeFilter] = useState<RequestType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const health = useMemo(() => serviceHealth(requests, now), [requests, now]);
  const stats = useMemo(() => countStats(requests, now), [requests, now]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return requests
      .filter((r) => matchesFilter(r, filter, now))
      .filter((r) => (typeFilter === "all" ? true : r.type === typeFilter))
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))

      .filter((r) => (serviceFilter ? r.order.service === serviceFilter : true))
      .filter((r) => {
        if (!query) return true;
        return (
          r.orderId.includes(query) ||
          r.order.user.toLowerCase().includes(query) ||
          r.order.service.toLowerCase().includes(query) ||
          r.order.link.toLowerCase().includes(query) ||
          r.notes.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => rank(a, now) - rank(b, now));
  }, [requests, filter, typeFilter, statusFilter, serviceFilter, q, now]);


  const active = requests.find((r) => r.id === activeId) ?? null;
  const exportRows = list.filter((r) => selected.size === 0 || selected.has(r.id));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape") {
        setOpenNew(false);
        setActiveId(null);
        return;
      }
      if (typing) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setOpenNew(true);
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (undo()) toast.message("Undid last change");
      } else if (e.key === "u" || e.key === "U") {
        if (undo()) toast.message("Undid last change");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
              Post-processing
            </p>
            <h1 className="text-lg font-medium tracking-tight">Relay Desk</h1>
          </div>
          <ThemeToggle />
          <UserButton />
          {/* <div className="flex rounded-full border border-border p-0.5">
            {(["team", "senior"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`h-9 rounded-full px-3 text-xs font-medium ${
                  role === r ? "bg-accent text-accent-fg" : "text-muted"
                }`}
              >
                {r === "team" ? "Team" : "Senior"}
              </button>
            ))}
          </div> */}
          {/* <Button
            size="sm"
            variant="ghost"
            disabled={!canUndo}
            onClick={() => {
              if (undo()) toast.message("Undid last change");
            }}
            title="Undo last change (U)"
          >
            <Undo2 />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={resetDemo} title="Reset sample data">
            <RotateCcw />
            <span className="hidden sm:inline">Reset demo</span>
          </Button> */}
          <Button onClick={() => setOpenNew(true)}>
            <Plus />
            New request
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Waiting on senior"
            value={stats.waiting}
            onClick={() => {
              setStatusFilter("all");
              setFilter("action");
            }}

          />
          <Stat
            label="24h check due"
            value={stats.checks}
            accent={stats.checks > 0}
            onClick={() => {
              setStatusFilter("all");
              setFilter("checks");
            }}

          />
          <Stat
            label="Suggest refund"
            value={stats.refund}
            warn={stats.refund > 0}
            onClick={() => {
              setStatusFilter("all");
              setFilter("refund");
            }}

          />
          <Stat
            label="Open"
            value={stats.open}
            onClick={() => {
              setStatusFilter("all");
              setFilter("all");
            }}
          />

        </section>

        {health.length > 0 ? (
          <section className="rounded-xl border border-warn/30 bg-warn/10 p-4">
            <p className="text-sm font-medium text-warn">Consider disabling a service</p>
            <ul className="mt-2 space-y-1 text-sm text-fg">
              {health.map((h) => (
                <li key={h.service}>
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={() => {
                      setServiceFilter(h.service);
                      setFilter("all");
                    }}
                  >
                    <span className="font-medium">{h.count} issues</span>
                    <span className="text-muted"> in 7 days · </span>
                    {h.service}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {serviceFilter ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <span className="text-muted">Service</span>
            <span className="min-w-0 truncate text-fg">{serviceFilter}</span>
            <Button size="sm" variant="ghost" onClick={() => setServiceFilter(null)}>
              Clear
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Type of request</Label>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as RequestType | "all")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {REQUEST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                const next = v as Status | "all";
                setStatusFilter(next);
                if (next !== "all") setFilter("all");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Queue</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUEUE_FILTERS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              ref={searchRef}
              className="pl-9"
              placeholder="Search ID, user, service, link, notes  (/)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              downloadCsv(`relay-desk-${filter}.csv`, requestsToCsv(exportRows));
              toast.success(
                `Exported ${exportRows.length} row${exportRows.length === 1 ? "" : "s"}`,
              );
            }}
          >
            <Download />
            {selected.size > 0 ? `Export ${selected.size}` : "Export CSV"}
          </Button>
        </div>

        <RequestTable
          rows={list}
          now={now}
          selected={selected}
          onToggle={(id) => {
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onToggleAll={(ids, on) => {
            setSelected((prev) => {
              const next = new Set(prev);
              for (const id of ids) {
                if (on) next.add(id);
                else next.delete(id);
              }
              return next;
            });
          }}
          onOpen={setActiveId}
        />

        <p className="text-xs text-subtle">
          Shortcuts: N new request · / search · U undo · Esc close · click a row to open
        </p>
      </main>

      <NewRequestDialog
        open={openNew}
        onOpenChange={setOpenNew}
        onCreated={(id) => setActiveId(id)}
      />
      <RequestDetail request={active} now={now} onClose={() => setActiveId(null)} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
  onClick,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-surface p-4 text-left hover:border-accent/40"
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-2 font-mono text-2xl tabular-nums ${
          warn ? "text-danger" : accent ? "text-warn" : "text-fg"
        }`}
      >
        {value}
      </p>
    </button>
  );
}

function matchesFilter(r: SupportRequest, filter: string, now: number) {
  const u = urgency(r, now);
  if (filter === "all") return true;
  if (filter === "closed") return u === "closed";
  if (filter === "checks") return u === "overdue" || u === "due_soon";
  if (filter === "refund") return u === "refund";
  if (filter === "action") return u !== "closed" && u !== "on_track";
  return true;
}

function rank(r: SupportRequest, now: number) {
  const order: Record<Urgency, number> = {
    refund: 0,
    overdue: 1,
    due_soon: 2,
    waiting_senior: 3,
    on_track: 4,
    closed: 5,
  };
  return order[urgency(r, now)] * 1e15 - new Date(r.createdAt).getTime();
}

function countStats(requests: SupportRequest[], now: number) {
  let waiting = 0;
  let checks = 0;
  let refund = 0;
  let open = 0;
  for (const r of requests) {
    const u = urgency(r, now);
    if (u !== "closed") open += 1;
    if (u === "waiting_senior") waiting += 1;
    if (u === "overdue" || u === "due_soon") checks += 1;
    if (u === "refund") refund += 1;
  }
  return { waiting, checks, refund, open };
}
