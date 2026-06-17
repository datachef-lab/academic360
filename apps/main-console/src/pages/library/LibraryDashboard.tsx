import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Clock,
  Wallet,
  TrendingUp,
  BookText,
  LineChart as LineChartIcon,
  Filter,
  UserCheck,
  Boxes,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getLibraryDashboardStats,
  type LibraryDashboardFilters,
} from "@/services/library-dashboard.service";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { getLibraryBranches } from "@/services/library-branches.service";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { LayoutDashboard } from "lucide-react";
import { ZoneOccupancyPanel } from "./ZoneOccupancyPanel";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
  accent: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, hint, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{value}</p>
        {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      </div>
      <div className={`rounded-xl p-2 ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </motion.div>
);

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const LIBRARY_DASHBOARD_ROOMS = [
  {
    subscribe: "subscribe_library_books",
    unsubscribe: "unsubscribe_library_books",
    event: "library_book_update",
  },
  {
    subscribe: "subscribe_library_copy_details",
    unsubscribe: "unsubscribe_library_copy_details",
    event: "library_copy_details_update",
  },
  {
    subscribe: "subscribe_library_book_circulation",
    unsubscribe: "unsubscribe_library_book_circulation",
    event: "library_book_circulation_update",
  },
  {
    subscribe: "subscribe_library_entry_exit",
    unsubscribe: "unsubscribe_library_entry_exit",
    event: "library_entry_exit_update",
  },
] as const;

type DraftFilters = {
  branchId: string;
  dateFrom: string;
  dateTo: string;
};

const emptyDraftFilters = (): DraftFilters => ({
  branchId: "",
  dateFrom: "",
  dateTo: "",
});

const draftToApplied = (d: DraftFilters): LibraryDashboardFilters => ({
  branchId: d.branchId ? Number(d.branchId) : null,
  dateFrom: d.dateFrom || null,
  dateTo: d.dateTo || null,
});

const countActive = (f: LibraryDashboardFilters): number =>
  (f.branchId ? 1 : 0) + (f.dateFrom ? 1 : 0) + (f.dateTo ? 1 : 0);

const STATUS_COLORS = [
  "#6366f1",
  "#a855f7",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const LibraryDashboard: React.FC = () => {
  const [filters, setFilters] = useState<LibraryDashboardFilters>({});
  const [filterDraft, setFilterDraft] = useState<DraftFilters>(emptyDraftFilters());
  const [filterOpen, setFilterOpen] = useState(false);
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["library-dashboard-stats", filters],
    queryFn: async () => (await getLibraryDashboardStats(filters)).payload!,
    staleTime: 60_000,
  });

  useEffect(() => {
    void (async () => {
      try {
        const res = await getLibraryBranches({ page: 1, limit: 200 });
        setBranchOptions(
          (res.payload?.rows ?? []).map((b) => ({
            value: String(b.id),
            label: b.code ? `${b.name} (${b.code})` : b.name,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const activeFilterCount = useMemo(() => countActive(filters), [filters]);

  const openFilters = () => {
    setFilterDraft({
      branchId: filters.branchId != null ? String(filters.branchId) : "",
      dateFrom: filters.dateFrom ?? "",
      dateTo: filters.dateTo ?? "",
    });
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters(draftToApplied(filterDraft));
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilterDraft(emptyDraftFilters());
    setFilters({});
    setFilterOpen(false);
  };

  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const scheduleRefetch = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(() => {
        void refetch();
      }, 500);
    };

    LIBRARY_DASHBOARD_ROOMS.forEach(({ subscribe, event }) => {
      socket.emit(subscribe);
      socket.on(event, scheduleRefetch);
    });

    return () => {
      if (refetchTimer.current) {
        clearTimeout(refetchTimer.current);
        refetchTimer.current = null;
      }
      LIBRARY_DASHBOARD_ROOMS.forEach(({ unsubscribe, event }) => {
        socket.off(event, scheduleRefetch);
        socket.emit(unsubscribe);
      });
    };
  }, [socket, isConnected, refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-2 sm:p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <LibraryPageHeader
          icon={LayoutDashboard}
          title="Library Dashboard"
          subtitle="Live operational metrics across your library collection."
          actions={
            <Button variant="outline" size="sm" onClick={openFilters}>
              <Filter className="mr-1 h-4 w-4" />
              Filters
              {activeFilterCount > 0 ? (
                <Badge className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          }
        />

        {isError ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            Failed to load library statistics.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Total titles"
            value={isLoading ? "…" : String(data?.totalBooks ?? 0)}
            icon={BookText}
            accent="bg-indigo-500"
          />
          <StatCard
            label="Total copies"
            value={isLoading ? "…" : String(data?.totalCopies ?? 0)}
            icon={BookOpen}
            accent="bg-purple-500"
          />
          <StatCard
            label="Active issues"
            value={isLoading ? "…" : String(data?.activeIssues ?? 0)}
            icon={Users}
            accent="bg-emerald-500"
          />
          <StatCard
            label="Overdue"
            value={isLoading ? "…" : String(data?.overdueCount ?? 0)}
            icon={Clock}
            accent="bg-amber-500"
          />
          <StatCard
            label="Fines this month"
            value={isLoading ? "…" : formatINR(data?.finesCollectedThisMonth ?? 0)}
            icon={Wallet}
            accent="bg-rose-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2"
          >
            <div className="mb-4 flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-800">Daily issues (last 14 days)</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyIssuesLast14 ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
          >
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-semibold text-gray-800">Top 5 books (30 days)</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topBooks ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    stroke="#6b7280"
                    fontSize={11}
                    width={120}
                  />
                  <Tooltip />
                  <Bar dataKey="issueCount" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
          >
            <div className="mb-4 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-800">Copies by status</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={data?.copiesByStatus ?? []}
                    dataKey="count"
                    nameKey="statusName"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {(data?.copiesByStatus ?? []).map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {(data?.copiesByStatus ?? []).map((s, i) => (
                <li
                  key={s.statusId ?? `n-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }}
                    />
                    {s.statusName}
                  </span>
                  <span className="text-gray-500">{s.count}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2"
          >
            <div className="mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-cyan-600" />
              <h2 className="text-sm font-semibold text-gray-800">
                Library footfall (entries by day)
              </h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.entryExitByDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cffafe" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <ZoneOccupancyPanel />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
        >
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Top 5 patrons</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Patron</th>
                  <th className="py-2 pr-4">User ID</th>
                  <th className="py-2">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.topPatrons ?? []).map((p) => (
                  <tr key={p.userId} className="text-gray-700">
                    <td className="py-2 pr-4">{p.userName ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-500">{p.userId}</td>
                    <td className="py-2 font-medium text-indigo-700">{p.issueCount}</td>
                  </tr>
                ))}
                {!isLoading && (data?.topPatrons ?? []).length === 0 ? (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={3}>
                      No circulation activity in the period.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter dashboard</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Branch</Label>
              <Combobox
                placeholder="All branches"
                value={filterDraft.branchId}
                dataArr={[{ value: "", label: "All branches" }, ...branchOptions]}
                onChange={(v) => setFilterDraft({ ...filterDraft, branchId: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>From date</Label>
                <Input
                  type="date"
                  value={filterDraft.dateFrom}
                  onChange={(e) => setFilterDraft({ ...filterDraft, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label>To date</Label>
                <Input
                  type="date"
                  value={filterDraft.dateTo}
                  onChange={(e) => setFilterDraft({ ...filterDraft, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearFilters}>
              Clear all
            </Button>
            <Button onClick={applyFilters}>Apply filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibraryDashboard;
