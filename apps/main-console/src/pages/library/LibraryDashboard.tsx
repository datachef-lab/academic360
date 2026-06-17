import React, { useEffect, useRef } from "react";
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
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getLibraryDashboardStats } from "@/services/library-dashboard.service";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/hooks/use-auth";

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

const LibraryDashboard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["library-dashboard-stats"],
    queryFn: async () => (await getLibraryDashboardStats()).payload!,
    staleTime: 60_000,
  });

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-md">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Library Dashboard</h1>
              <p className="text-sm text-gray-600">
                Live operational metrics across your library collection.
              </p>
            </div>
          </div>
        </motion.div>

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
    </div>
  );
};

export default LibraryDashboard;
