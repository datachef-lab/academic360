import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  Gauge,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { VisualCard } from "@/features/fees-dashboard/components/VisualCard";
import { CompactPanel } from "@/features/fees-dashboard/components/CompactPanel";
import { ChartCard, type ChartConfig } from "@/features/fees-dashboard/components/ChartCard";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "@/features/fees-dashboard/components/FeesTable";
import { DashboardEmptyState } from "@/features/fees-dashboard/components/DashboardEmptyState";
import { LiveUpdatesBadge } from "@/features/fees-dashboard/components/LiveUpdatesBadge";
import { GradientStatCard } from "@/features/notifications/components/gradient-stat-card";
import { buildYTickLabels, maxFromKeys } from "@/features/fees-dashboard/utils/chart-utils";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentAcademicYear } from "@/store/slices/academicYearSlice";
import { formatCompactIN } from "@/features/notifications/utils/format";
import {
  getNotificationDashboard,
  formatNotificationTime,
  type NotificationDashboard,
} from "@/features/notifications/api/notifications-api";
import { VariantBadge } from "@/features/notifications/components/badges";
import {
  RecipientCell,
  ReasonCell,
  FieldsDialogButton,
} from "@/features/notifications/components/notification-row-parts";
import {
  DEFAULT_DASH_FILTERS,
  RANGES,
  countActiveDashFilters,
  DashboardFiltersDialog,
  type DashboardUiFilters,
} from "@/features/notifications/components/dashboard-filters-dialog";

// Fees-module palette: violet primary, red failures, restrained accents.
const SENT_COLOR = "#7c3aed";
const FAILED_COLOR = "#dc2626";
const PENDING_COLOR = "#d97706";

const trendConfig = {
  sent: { label: "Sent", color: SENT_COLOR },
  failed: { label: "Failed", color: FAILED_COLOR },
} satisfies ChartConfig;

const channelConfig = {
  sent: { label: "Sent", color: SENT_COLOR },
  pending: { label: "Pending", color: PENDING_COLOR },
  failed: { label: "Failed", color: FAILED_COLOR },
} satisfies ChartConfig;

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "templates", label: "Templates" },
  { value: "failures", label: "Failures" },
] as const;

const REFRESH_FALLBACK_MS = 60_000;

function KpiStrip({ totals }: { totals: NotificationDashboard["totals"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <GradientStatCard
        label="Total"
        value={formatCompactIN(totals.total)}
        hint="all channels"
        icon={Bell}
        gradient="from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]"
      />
      <GradientStatCard
        label="Sent"
        value={formatCompactIN(totals.sent)}
        hint="delivered to provider"
        icon={CheckCircle2}
        gradient="from-[#047857] via-[#059669] to-[#10b981]"
      />
      <GradientStatCard
        label="Pending"
        value={formatCompactIN(totals.pending)}
        hint="waiting in queue"
        icon={Clock}
        gradient="from-[#b45309] via-[#d97706] to-[#f59e0b]"
      />
      <GradientStatCard
        label="Failed"
        value={formatCompactIN(totals.failed)}
        hint="delivery errors"
        icon={XCircle}
        gradient="from-[#b91c1c] via-[#dc2626] to-[#ef4444]"
      />
      <GradientStatCard
        label="Success rate"
        value={`${totals.successRate}%`}
        hint="sent ÷ total"
        icon={Gauge}
        gradient="from-[#0e7490] via-[#0891b2] to-[#06b6d4]"
        progress={totals.successRate}
      />
      <GradientStatCard
        label="Today"
        value={formatCompactIN(totals.today)}
        hint="since midnight"
        icon={CalendarDays}
        gradient="from-[#1d4ed8] via-[#2563eb] to-[#3b82f6]"
      />
    </div>
  );
}

// OTHER intentionally excluded — no traffic and it clutters the summary.
const ALL_VARIANTS = ["EMAIL", "WHATSAPP", "SMS", "WEB"] as const;

/** Every channel gets a row even with zero traffic. */
function padVariants(rows: NotificationDashboard["byVariant"]) {
  const byKey = new Map(rows.map((r) => [r.variant, r]));
  return ALL_VARIANTS.map(
    (v) => byKey.get(v) ?? { variant: v, total: 0, sent: 0, failed: 0, pending: 0 },
  );
}

function TrendTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as
    | {
        date?: string;
        variant?: string;
        label?: string;
        sent?: number;
        failed?: number;
        pending?: number;
      }
    | undefined;
  if (!row) return null;
  const title = row.date ?? row.variant ?? row.label ?? "";
  return (
    <div className="grid min-w-[9rem] gap-1.5 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-[#1a1a1a]">{title}</p>
      {(
        [
          ["Sent", row.sent ?? 0, SENT_COLOR],
          ["Failed", row.failed ?? 0, FAILED_COLOR],
          ["Pending", row.pending ?? 0, PENDING_COLOR],
        ] as const
      ).map(([label, val, color]) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#444]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
          <span className="font-mono font-medium tabular-nums text-[#1a1a1a]">
            {val.toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsHomePage() {
  const { user } = useAuth();
  const currentAcademicYear = useAppSelector(selectCurrentAcademicYear);

  const [data, setData] = useState<NotificationDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DashboardUiFilters>(DEFAULT_DASH_FILTERS);

  // Scope to the globally-selected academic year (redux slice); when the user
  // switches the year in the app header, the dashboard follows. The Filters
  // dialog can still widen/override until the global year changes again.
  useEffect(() => {
    if (!currentAcademicYear?.id) return;
    setFilters((f) => ({ ...f, academicYearIds: [String(currentAcademicYear.id)] }));
  }, [currentAcademicYear?.id]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const activeFilterCount = countActiveDashFilters(filters);

  // Latest-request-wins guard. On mount the first fetch fires with the default
  // (unfiltered) filters, then the academic-year sync updates `filters` and
  // fires a second, narrower fetch. The narrow one is smaller/faster and can
  // land before the big unfiltered one — without this guard the late, stale
  // response clobbers the correct filtered data (the bug where the dashboard
  // showed all years despite the filter being set to the current year).
  const reqIdRef = useRef(0);

  const fetchData = useCallback(
    async (silent: boolean) => {
      const reqId = ++reqIdRef.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const days = RANGES.find((r) => r.label === filters.range)?.days;
        const res = await getNotificationDashboard({
          academicYearIds: filters.academicYearIds.map(Number),
          variants: filters.variants,
          statuses: filters.statuses,
          userTypes: filters.userTypes,
          streamIds: filters.streamIds.map(Number),
          affiliationIds: filters.affiliationIds.map(Number),
          regulationTypeIds: filters.regulationTypeIds.map(Number),
          programCourseIds: filters.programCourseIds.map(Number),
          classIds: filters.classIds.map(Number),
          shiftIds: filters.shiftIds.map(Number),
          days,
        });
        if (reqId !== reqIdRef.current) return; // a newer fetch superseded this one
        setData(res);
      } catch {
        if (reqId === reqIdRef.current && !silent)
          setError("Failed to load notification dashboard.");
      } finally {
        if (reqId === reqIdRef.current && !silent) setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  // Live updates: socket room + silent refresh; worker-side status flips are
  // covered by the periodic fallback refresh.
  const { socket, isConnected, emit } = useSocket({
    userId: user?.id ? String(user.id) : undefined,
  });
  const fetchRef = useRef(fetchData);
  fetchRef.current = fetchData;

  useEffect(() => {
    if (!socket || !isConnected) return;
    emit("subscribe_notifications_dashboard");
    const onUpdate = () => void fetchRef.current(true);
    socket.on("notifications_dashboard_updated", onUpdate);
    return () => {
      socket.off("notifications_dashboard_updated", onUpdate);
      emit("unsubscribe_notifications_dashboard");
    };
  }, [socket, isConnected, emit]);

  useEffect(() => {
    const t = setInterval(() => void fetchRef.current(true), REFRESH_FALLBACK_MS);
    return () => clearInterval(t);
  }, []);

  const triggerTotal = data ? data.byTrigger.automated + data.byTrigger.eventTriggered : 0;

  const paddedVariants = useMemo(() => padVariants(data?.byVariant ?? []), [data]);
  const channelYMax = Math.max(maxFromKeys(paddedVariants, ["total"]), 1);

  return (
    <div className="min-h-full bg-[#eaeaea]">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Fees-style header */}
        <header className="border-b border-[#d1d1d1] bg-gradient-to-r from-[#f5f3ff] via-[#faf5ff] to-white">
          <div className="flex flex-col gap-3 px-4 py-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-[#1a1a1a]">
                <Bell className="h-5 w-5 text-[#7c3aed]" /> Notifications dashboard
              </h1>
            </div>
            <Button
              size="sm"
              className="relative h-8 shrink-0 rounded-md bg-[#7c3aed] pr-3 text-xs text-white hover:bg-[#6d28d9]"
              onClick={() => setFiltersOpen(true)}
            >
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-5 justify-center rounded-full border-0 bg-white px-1.5 text-[10px] font-bold text-[#7c3aed]"
                >
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </div>

          <div className="overflow-x-auto border-t border-[#e5e5e5] bg-white/80 px-2">
            <TabsList className="inline-flex h-11 w-max min-w-full justify-start gap-0.5 rounded-none bg-transparent p-0">
              {DASHBOARD_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-[3px] border-transparent px-4 text-sm font-medium text-[#666] shadow-none data-[state=active]:border-[#7c3aed] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#7c3aed] data-[state=active]:shadow-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </header>

        <DashboardFiltersDialog
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          onApply={setFilters}
        />

        <div className="space-y-4 p-3 lg:p-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading && !data ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-white/70" />
              ))}
            </div>
          ) : data ? (
            <>
              {/* ------------------------------ OVERVIEW ------------------------------ */}
              <TabsContent value="overview" className="mt-0 space-y-4 focus-visible:outline-none">
                <KpiStrip totals={data.totals} />

                <VisualCard title="Notifications over time · daily · hover for details">
                  {data.trend.length === 0 ? (
                    <DashboardEmptyState message="No notifications in this window." />
                  ) : (
                    <ChartContainer config={trendConfig} className="h-[240px] w-full">
                      <AreaChart
                        data={data.trend}
                        margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#666" }}
                          tickLine={false}
                          axisLine={{ stroke: "#d4d4d4" }}
                          minTickGap={40}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "#666" }}
                          tickLine={false}
                          axisLine={false}
                          width={44}
                        />
                        <ChartTooltip content={<TrendTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="sent"
                          stroke="var(--color-sent)"
                          fill="var(--color-sent)"
                          fillOpacity={0.18}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="failed"
                          stroke="var(--color-failed)"
                          fill="var(--color-failed)"
                          fillOpacity={0.12}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </VisualCard>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <ChartCard
                    title="By channel"
                    description="sent / pending / failed"
                    config={channelConfig}
                    xAxisTitle="Channel"
                    yAxisTitle="Notifications"
                    xTickLabels={paddedVariants.map((v) => v.variant)}
                    yTickLabels={buildYTickLabels(channelYMax)}
                  >
                    {paddedVariants.every((v) => v.total === 0) ? (
                      <DashboardEmptyState message="No data." />
                    ) : (
                      <BarChart
                        data={paddedVariants}
                        margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis hide dataKey="variant" />
                        <YAxis hide domain={[0, channelYMax * 1.08]} allowDecimals={false} />
                        <ChartTooltip content={<TrendTooltip />} />
                        <Bar dataKey="sent" stackId="s" fill="var(--color-sent)" maxBarSize={48} />
                        <Bar
                          dataKey="pending"
                          stackId="s"
                          fill="var(--color-pending)"
                          maxBarSize={48}
                        />
                        <Bar
                          dataKey="failed"
                          stackId="s"
                          fill="var(--color-failed)"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    )}
                  </ChartCard>

                  <CompactPanel title="Delivery summary" noPadding>
                    <FeesTable fixed={false} dense>
                      <FeesTableHeader>
                        <FeesTableHead>Channel</FeesTableHead>
                        <FeesTableHead className="text-right">Sent</FeesTableHead>
                        <FeesTableHead className="text-right">Pending</FeesTableHead>
                        <FeesTableHead className="text-right">Failed</FeesTableHead>
                        <FeesTableHead className="text-right">Total</FeesTableHead>
                        <FeesTableHead className="text-right">Success</FeesTableHead>
                      </FeesTableHeader>
                      <FeesTableBody>
                        {paddedVariants.map((v) => {
                          const rate = v.total > 0 ? Math.round((v.sent / v.total) * 100) : 0;
                          return (
                            <FeesTableRow key={v.variant}>
                              <FeesTableCell className="font-medium">
                                <VariantBadge variant={v.variant} />
                              </FeesTableCell>
                              <FeesTableCell className="text-right tabular-nums">
                                <span title={v.sent.toLocaleString("en-IN")}>
                                  {formatCompactIN(v.sent)}
                                </span>
                              </FeesTableCell>
                              <FeesTableCell className="text-right tabular-nums">
                                <span title={v.pending.toLocaleString("en-IN")}>
                                  {formatCompactIN(v.pending)}
                                </span>
                              </FeesTableCell>
                              <FeesTableCell className="text-right tabular-nums text-[#dc2626]">
                                <span title={v.failed.toLocaleString("en-IN")}>
                                  {formatCompactIN(v.failed)}
                                </span>
                              </FeesTableCell>
                              <FeesTableCell className="text-right font-semibold tabular-nums">
                                <span title={v.total.toLocaleString("en-IN")}>
                                  {formatCompactIN(v.total)}
                                </span>
                              </FeesTableCell>
                              <FeesTableCell className="text-right tabular-nums">
                                {v.total > 0 ? `${rate}%` : "—"}
                              </FeesTableCell>
                            </FeesTableRow>
                          );
                        })}
                      </FeesTableBody>
                    </FeesTable>
                    <p className="border-t border-[#b8b8b8] px-3 py-2 text-xs text-[#555]">
                      Trigger source · Automated{" "}
                      <span className="font-semibold text-[#1a1a1a]">
                        {data.byTrigger.automated.toLocaleString("en-IN")}
                      </span>{" "}
                      (
                      {triggerTotal
                        ? Math.round((data.byTrigger.automated / triggerTotal) * 100)
                        : 0}
                      %) · Event-triggered{" "}
                      <span className="font-semibold text-[#1a1a1a]">
                        {data.byTrigger.eventTriggered.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </CompactPanel>
                </div>
              </TabsContent>

              {/* ----------------------------- TEMPLATES ------------------------------ */}
              <TabsContent value="templates" className="mt-0 space-y-4 focus-visible:outline-none">
                <CompactPanel
                  title="Top templates by volume"
                  headerRight={
                    <Link
                      to="/dashboard/tools/notifications/masters"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9]"
                    >
                      Manage masters <ArrowRight className="h-3 w-3" />
                    </Link>
                  }
                  noPadding
                >
                  {data.topMasters.length === 0 ? (
                    <DashboardEmptyState message="No data." />
                  ) : (
                    <FeesTable>
                      <FeesTableHeader>
                        <FeesTableHead>Master</FeesTableHead>
                        <FeesTableHead>Channel</FeesTableHead>
                        <FeesTableHead className="text-right">Total</FeesTableHead>
                        <FeesTableHead className="text-right">Sent</FeesTableHead>
                        <FeesTableHead className="text-right">Failed</FeesTableHead>
                        <FeesTableHead>Success</FeesTableHead>
                      </FeesTableHeader>
                      <FeesTableBody>
                        {data.topMasters.map((m) => {
                          const rate = m.total > 0 ? Math.round((m.sent / m.total) * 100) : 0;
                          return (
                            <FeesTableRow key={`${m.masterId}`}>
                              <FeesTableCell className="font-medium">
                                <span className="block max-w-[240px] truncate" title={m.masterName}>
                                  {m.masterName}
                                  {m.template && (
                                    <span className="ml-1.5 font-mono text-[11px] text-[#999]">
                                      {m.template}
                                    </span>
                                  )}
                                </span>
                              </FeesTableCell>
                              <FeesTableCell>
                                {m.variant ? <VariantBadge variant={m.variant} /> : "—"}
                              </FeesTableCell>
                              <FeesTableCell className="text-right font-semibold tabular-nums">
                                {m.total.toLocaleString("en-IN")}
                              </FeesTableCell>
                              <FeesTableCell className="text-right tabular-nums">
                                {m.sent.toLocaleString("en-IN")}
                              </FeesTableCell>
                              <FeesTableCell className="text-right tabular-nums text-[#dc2626]">
                                {m.failed.toLocaleString("en-IN")}
                              </FeesTableCell>
                              <FeesTableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-16 overflow-hidden rounded bg-[#eee]">
                                    <div
                                      className="h-full rounded bg-[#7c3aed]"
                                      style={{ width: `${rate}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] tabular-nums text-[#555]">
                                    {rate}%
                                  </span>
                                </div>
                              </FeesTableCell>
                            </FeesTableRow>
                          );
                        })}
                      </FeesTableBody>
                    </FeesTable>
                  )}
                </CompactPanel>
              </TabsContent>

              {/* ----------------------------- FAILURES ------------------------------- */}
              <TabsContent value="failures" className="mt-0 space-y-4 focus-visible:outline-none">
                <CompactPanel
                  title="Recent failures"
                  headerRight={
                    <Link
                      to="/dashboard/tools/notifications/automated"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9]"
                    >
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  }
                  noPadding
                >
                  {data.recentFailures.length === 0 ? (
                    <DashboardEmptyState message="No failures — all clear." />
                  ) : (
                    <FeesTable fixed={false}>
                      <FeesTableHeader>
                        <FeesTableHead>Master · Date</FeesTableHead>
                        <FeesTableHead>Channel</FeesTableHead>
                        <FeesTableHead>Recipient</FeesTableHead>
                        <FeesTableHead>Fields</FeesTableHead>
                        <FeesTableHead>Reason</FeesTableHead>
                      </FeesTableHeader>
                      <FeesTableBody>
                        {data.recentFailures.map((n) => (
                          <FeesTableRow key={n.id}>
                            <FeesTableCell>
                              <div className="max-w-[180px] truncate font-medium text-[#1a1a1a]">
                                {n.masterName ?? "—"}
                              </div>
                              <div className="whitespace-nowrap text-[11px] text-[#888]">
                                {formatNotificationTime(n.createdAt)}
                              </div>
                            </FeesTableCell>
                            <FeesTableCell>
                              <VariantBadge variant={n.variant} />
                            </FeesTableCell>
                            <FeesTableCell>
                              <RecipientCell
                                name={n.userName}
                                email={n.userEmail}
                                phone={n.userPhone}
                                whatsapp={n.userWhatsapp}
                                studentUid={n.studentUid}
                              />
                            </FeesTableCell>
                            <FeesTableCell>
                              <FieldsDialogButton
                                notificationId={n.id}
                                masterName={n.masterName}
                                variant={n.variant}
                              />
                            </FeesTableCell>
                            <FeesTableCell>
                              <ReasonCell reason={n.failedReason} />
                            </FeesTableCell>
                          </FeesTableRow>
                        ))}
                      </FeesTableBody>
                    </FeesTable>
                  )}
                </CompactPanel>
              </TabsContent>
            </>
          ) : null}
        </div>
      </Tabs>
      <LiveUpdatesBadge connected={isConnected} loading={loading} />
    </div>
  );
}
