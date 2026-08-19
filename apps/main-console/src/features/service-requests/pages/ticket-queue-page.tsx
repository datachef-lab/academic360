import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getQueue,
  getServiceTypes,
  type Ticket,
  type TicketStatus,
  type ServiceType,
} from "../services/service-requests.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

const STATUS_COLORS: Record<TicketStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  ROUTED: "bg-indigo-100 text-indigo-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  PENDING_SLOT_BOOKING: "bg-orange-100 text-orange-700",
  SLOT_BOOKED: "bg-teal-100 text-teal-700",
  CHECKED_IN: "bg-cyan-100 text-cyan-700",
  FULFILLED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const CLERK_VISIBLE_STATUSES: TicketStatus[] = [
  "ROUTED",
  "UNDER_REVIEW",
  "APPROVED",
  "PENDING_SLOT_BOOKING",
  "SLOT_BOOKED",
  "CHECKED_IN",
  "FULFILLED",
  "CLOSED",
  "REJECTED",
];

export default function TicketQueuePage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (statusFilter !== "ALL") params.status = statusFilter;
      const data = await getQueue(params);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load ticket queue");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getServiceTypes()
      .then(setServiceTypes)
      .catch(() => {});
  }, []);

  const serviceTypeName = (id?: number) =>
    serviceTypes.find((st) => st.id === id)?.name ?? `#${id ?? "?"}`;

  const filtered = search.trim()
    ? tickets.filter(
        (t) =>
          t.referenceId.toLowerCase().includes(search.toLowerCase()) ||
          (t.contactEmail ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : tickets;

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const slaBreach = (t: Ticket) =>
    t.slaDueAt && !["CLOSED", "FULFILLED", "REJECTED", "CANCELLED"].includes(t.status)
      ? isPast(parseISO(t.slaDueAt))
      : false;

  return (
    <div className="p-4 flex flex-col gap-4 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Service Request Queue</h1>
          <p className="text-sm text-muted-foreground">
            {total} tickets · Showing {LIMIT} per page
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by reference ID or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-72"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as TicketStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {CLERK_VISIBLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-200 overflow-x-auto">
        <div className="min-w-[860px]">
          {/* Header row */}
          <div className="flex bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
            <div className="w-[14%] px-3 py-2">Reference</div>
            <div className="w-[20%] px-3 py-2">Service Type</div>
            <div className="w-[12%] px-3 py-2">Requestor</div>
            <div className="w-[16%] px-3 py-2">Contact</div>
            <div className="w-[12%] px-3 py-2">Status</div>
            <div className="w-[14%] px-3 py-2">SLA Due</div>
            <div className="w-[12%] px-3 py-2 text-center">Actions</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No tickets found.
            </div>
          ) : (
            filtered.map((ticket) => {
              const breach = slaBreach(ticket);
              return (
                <div
                  key={ticket.id}
                  className={`flex border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm ${breach ? "bg-red-50" : ""}`}
                >
                  <div className="w-[14%] px-3 py-3 font-mono font-medium text-violet-700">
                    {ticket.referenceId}
                  </div>
                  <div className="w-[20%] px-3 py-3 text-slate-800 truncate">
                    {serviceTypeName(ticket.serviceTypeId)}
                  </div>
                  <div className="w-[12%] px-3 py-3 text-slate-600">
                    {ticket.requestorType === "ALUMNI" ? "Alumni" : "Student"}
                  </div>
                  <div className="w-[16%] px-3 py-3 text-slate-600 truncate">
                    {ticket.contactEmail ?? ticket.contactPhone ?? "—"}
                  </div>
                  <div className="w-[12%] px-3 py-3">
                    <Badge
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 ${STATUS_COLORS[ticket.status]}`}
                    >
                      {ticket.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="w-[14%] px-3 py-3 text-slate-600">
                    {ticket.slaDueAt ? (
                      <span
                        className={`flex items-center gap-1 ${breach ? "text-red-600 font-semibold" : ""}`}
                      >
                        {breach ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3 text-slate-400" />
                        )}
                        {format(parseISO(ticket.slaDueAt), "dd MMM HH:mm")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className="w-[12%] px-3 py-3 flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/dashboard/service-requests/tickets/${ticket.id}`)
                      }
                      className="border-violet-200 text-violet-700 hover:bg-violet-50 h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
          <span>
            {filtered.length === 0
              ? "No results"
              : `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
