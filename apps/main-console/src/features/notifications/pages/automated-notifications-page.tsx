import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listNotifications,
  listNotificationMasters,
  downloadNotificationsExcel,
  formatNotificationTime,
  type NotificationListResult,
  type NotificationMasterRow,
} from "@/features/notifications/api/notifications-api";
import { VariantBadge, StatusBadge } from "@/features/notifications/components/badges";
import {
  RecipientCell,
  ReasonCell,
  FieldsDialogButton,
} from "@/features/notifications/components/notification-row-parts";
import { LiveUpdatesBadge } from "@/features/fees-dashboard/components/LiveUpdatesBadge";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/hooks/use-auth";

const REFRESH_FALLBACK_MS = 60_000;

const STATUSES = ["SENT", "PENDING", "FAILED"];
const VARIANTS = ["EMAIL", "WHATSAPP", "SMS", "WEB", "OTHER"];
const PAGE_SIZES = [20, 50, 100];
const ALL = "__all__";

type Filters = { status: string; variant: string; masterId: string };
const EMPTY_FILTERS: Filters = { status: ALL, variant: ALL, masterId: ALL };

export default function AutomatedNotificationsPage() {
  const [data, setData] = useState<NotificationListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [masters, setMasters] = useState<NotificationMasterRow[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    listNotificationMasters()
      .then(setMasters)
      .catch(() => undefined);
  }, []);

  const fetchList = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await listNotifications({
          page,
          limit: pageSize,
          status: filters.status !== ALL ? filters.status : undefined,
          variant: filters.variant !== ALL ? filters.variant : undefined,
          masterId: filters.masterId !== ALL ? Number(filters.masterId) : undefined,
          search: search || undefined,
        });
        setData(res);
        setError(null);
      } catch {
        if (!silent) setError("Failed to load notifications.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, pageSize, filters, search],
  );

  useEffect(() => {
    void fetchList(false);
  }, [fetchList]);

  // Live updates: socket room + silent refresh; worker-side status flips are
  // covered by the periodic fallback refresh (same mechanism as the dashboard).
  const { user } = useAuth();
  const { socket, isConnected, emit } = useSocket({
    userId: user?.id ? String(user.id) : undefined,
  });
  const fetchRef = useRef(fetchList);
  fetchRef.current = fetchList;

  useEffect(() => {
    if (!socket || !isConnected) return;
    emit("subscribe_automated_notifications");
    const onUpdate = () => void fetchRef.current(true);
    socket.on("automated_notifications_updated", onUpdate);
    return () => {
      socket.off("automated_notifications_updated", onUpdate);
      emit("unsubscribe_automated_notifications");
    };
  }, [socket, isConnected, emit]);

  useEffect(() => {
    const t = setInterval(() => void fetchRef.current(true), REFRESH_FALLBACK_MS);
    return () => clearInterval(t);
  }, []);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== ALL).length,
    [filters],
  );
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
    setIsFilterOpen(false);
  };
  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadNotificationsExcel({
        status: filters.status !== ALL ? filters.status : undefined,
        variant: filters.variant !== ALL ? filters.variant : undefined,
        masterId: filters.masterId !== ALL ? Number(filters.masterId) : undefined,
        search: search || undefined,
      });
    } catch {
      toast.error("Could not download the Excel export.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start gap-4 rounded-md border bg-background p-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Zap className="h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
                <span className="truncate">Automated Notifications</span>
                <LiveUpdatesBadge connected={isConnected} loading={loading} />
              </CardTitle>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Notifications triggered by the system — OTPs, receipts, registrations and more.
              </div>
            </div>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setSearch(searchInput.trim());
                }}
                className="relative"
              >
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search recipient..."
                  className="w-52 pl-8"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchInput("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              <Dialog
                open={isFilterOpen}
                onOpenChange={(open) => {
                  setIsFilterOpen(open);
                  if (open) setDraft(filters);
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2 bg-violet-600 px-1.5 text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter notifications</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Status</label>
                      <Select
                        value={draft.status}
                        onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All statuses</SelectItem>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Channel</label>
                      <Select
                        value={draft.variant}
                        onValueChange={(v) => setDraft((d) => ({ ...d, variant: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All channels</SelectItem>
                          {VARIANTS.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Master / template</label>
                      <Select
                        value={draft.masterId}
                        onValueChange={(v) => setDraft((d) => ({ ...d, masterId: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All masters</SelectItem>
                          {masters.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name} ({m.variant})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={clearFilters}>
                      Clear all
                    </Button>
                    <Button onClick={applyFilters}>Apply filters</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="flex-shrink-0"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Master · Date</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Fields</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent at</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-gray-200/70" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.rows.length > 0 ? (
                    data.rows.map((n) => (
                      <tr key={n.id} className="border-b last:border-0 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="max-w-[220px] truncate font-medium text-gray-900">
                            {n.masterName ?? "—"}
                            {n.masterTemplate && (
                              <span className="ml-1.5 font-mono text-[11px] text-gray-400">
                                {n.masterTemplate}
                              </span>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-[11px] text-gray-500">
                            {formatNotificationTime(n.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <VariantBadge variant={n.variant} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                          {n.type}
                        </td>
                        <td className="max-w-[280px] px-4 py-3">
                          <RecipientCell
                            name={n.userName}
                            email={n.userEmail}
                            phone={n.userPhone}
                            whatsapp={n.userWhatsapp}
                            studentUid={n.studentUid}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <FieldsDialogButton
                            notificationId={n.id}
                            masterName={n.masterName}
                            variant={n.variant}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={n.status} failedReason={n.failedReason} />
                            {n.status === "FAILED" && <ReasonCell reason={n.failedReason} />}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                          {formatNotificationTime(n.sentAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                        No notifications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer (DataTablePagination look) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {data ? `${data.total.toLocaleString("en-IN")} notifications` : ""}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Rows per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {PAGE_SIZES.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xs font-medium">
                  Page {data?.page ?? page} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage(totalPages)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
