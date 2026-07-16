/**
 * Five operational reports rendered as nested tabs inside the Library Reports
 * page. Each tab has its own filter row (branch + date range where applicable)
 * and a table. The branch dropdown defaults to the active library branch from
 * the right-sidebar selector so reports inherit branch scope automatically.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";
import {
  getFinesCollectedReport,
  getFinesOutstandingReport,
  getHighDemandReport,
  getOverdueReport,
  getStockSummaryReport,
  type FinesCollectedPayload,
  type FinesOutstandingPayload,
  type HighDemandRow,
  type OverdueRow,
  type ReportFilters,
  type StockSummaryRow,
} from "@/services/library-reports.service";
import { getLibraryBranches } from "@/services/library-branches.service";
import { useActiveLibraryBranchId } from "@/features/library/use-library-branch";

type OpTab = "OVERDUE" | "FINES_OUT" | "FINES_IN" | "STOCK" | "DEMAND";

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function FiltersRow({
  filters,
  setFilters,
  branchOptions,
  showDateRange,
  onRun,
  loading,
}: {
  filters: ReportFilters;
  setFilters: (next: ReportFilters) => void;
  branchOptions: { value: string; label: string }[];
  showDateRange: boolean;
  onRun: () => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-end">
      <div className="space-y-1">
        <Label className="text-xs">Branch</Label>
        <Combobox
          placeholder="All branches"
          value={filters.branchId != null ? String(filters.branchId) : ""}
          dataArr={[{ value: "", label: "All branches" }, ...branchOptions]}
          onChange={(v) =>
            setFilters({
              ...filters,
              branchId: v === "" ? null : Number(v),
            })
          }
        />
      </div>
      {showDateRange ? (
        <>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
            />
          </div>
        </>
      ) : (
        <>
          <span />
          <span />
        </>
      )}
      <div>
        <Button onClick={onRun} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Run
        </Button>
      </div>
    </div>
  );
}

export function OperationalReportsPanel() {
  const [tab, setTab] = useState<OpTab>("OVERDUE");
  const [activeBranchId] = useActiveLibraryBranchId();
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);

  const baseFilters = useMemo<ReportFilters>(
    () => ({ branchId: activeBranchId ?? null }),
    [activeBranchId],
  );

  const [overdueFilters, setOverdueFilters] = useState<ReportFilters>(baseFilters);
  const [outFilters, setOutFilters] = useState<ReportFilters>(baseFilters);
  const [inFilters, setInFilters] = useState<ReportFilters>(baseFilters);
  const [stockFilters, setStockFilters] = useState<ReportFilters>(baseFilters);
  const [demandFilters, setDemandFilters] = useState<ReportFilters>(baseFilters);

  const [overdue, setOverdue] = useState<OverdueRow[]>([]);
  const [outPayload, setOutPayload] = useState<FinesOutstandingPayload | null>(null);
  const [inPayload, setInPayload] = useState<FinesCollectedPayload | null>(null);
  const [stock, setStock] = useState<StockSummaryRow[]>([]);
  const [demand, setDemand] = useState<HighDemandRow[]>([]);

  const [loading, setLoading] = useState(false);

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

  // When the right-sidebar branch changes, re-pin every report's branch filter.
  useEffect(() => {
    setOverdueFilters((f) => ({ ...f, branchId: activeBranchId ?? null }));
    setOutFilters((f) => ({ ...f, branchId: activeBranchId ?? null }));
    setInFilters((f) => ({ ...f, branchId: activeBranchId ?? null }));
    setStockFilters((f) => ({ ...f, branchId: activeBranchId ?? null }));
    setDemandFilters((f) => ({ ...f, branchId: activeBranchId ?? null }));
  }, [activeBranchId]);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "OVERDUE") {
        const r = await getOverdueReport(overdueFilters);
        setOverdue(r.payload ?? []);
      } else if (tab === "FINES_OUT") {
        const r = await getFinesOutstandingReport(outFilters);
        setOutPayload(r.payload ?? null);
      } else if (tab === "FINES_IN") {
        const r = await getFinesCollectedReport(inFilters);
        setInPayload(r.payload ?? null);
      } else if (tab === "STOCK") {
        const r = await getStockSummaryReport(stockFilters);
        setStock(r.payload ?? []);
      } else {
        const r = await getHighDemandReport(demandFilters, 25);
        setDemand(r.payload ?? []);
      }
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Report failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [tab, overdueFilters, outFilters, inFilters, stockFilters, demandFilters]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as OpTab)}>
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="OVERDUE">Overdue list</TabsTrigger>
        <TabsTrigger value="FINES_OUT">Fines outstanding</TabsTrigger>
        <TabsTrigger value="FINES_IN">Fines collected</TabsTrigger>
        <TabsTrigger value="STOCK">Stock summary</TabsTrigger>
        <TabsTrigger value="DEMAND">High-demand titles</TabsTrigger>
      </TabsList>

      <TabsContent value="OVERDUE" className="mt-4 space-y-3">
        <FiltersRow
          filters={overdueFilters}
          setFilters={setOverdueFilters}
          branchOptions={branchOptions}
          showDateRange={false}
          onRun={run}
          loading={loading}
        />
        <p className="text-xs text-muted-foreground">
          Books currently issued past their due date. {overdue.length} row(s).
        </p>
        <div className="hidden lg:block">
          <div className="max-h-[60vh] overflow-auto rounded-md border bg-background">
            <Table
              className="border-separate border-spacing-0"
              containerClassName="overflow-visible min-w-[1000px]"
            >
              <TableHeader className={STICKY_THEAD_CLASS}>
                <TableRow>
                  <TableHead className={cn(STICKY_TH_LEFT, "min-w-[60px]")}>#</TableHead>
                  <TableHead className={cn(STICKY_TH_BASE, "min-w-[180px]")}>User</TableHead>
                  <TableHead className={cn(STICKY_TH_BASE, "min-w-[240px]")}>Title</TableHead>
                  <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>Accession</TableHead>
                  <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>Branch</TableHead>
                  <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>Due at</TableHead>
                  <TableHead className={cn(STICKY_TH_RIGHT, "min-w-[100px]")}>Days late</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((r, i) => (
                  <TableRow key={r.circulationId}>
                    <TableCell className="border-b px-2 text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="border-b px-2">
                      {r.userName ?? `User #${r.userId}`}
                    </TableCell>
                    <TableCell className="border-b px-2 font-medium">{r.bookTitle}</TableCell>
                    <TableCell className="border-b px-2 text-xs">{r.accessNumber ?? "—"}</TableCell>
                    <TableCell className="border-b px-2 text-xs">{r.branchName ?? "—"}</TableCell>
                    <TableCell className="border-b px-2 text-xs">
                      {new Date(r.dueAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="border-b px-2 text-right font-semibold text-rose-700">
                      {r.daysLate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="FINES_OUT" className="mt-4 space-y-3">
        <FiltersRow
          filters={outFilters}
          setFilters={setOutFilters}
          branchOptions={branchOptions}
          showDateRange={false}
          onRun={run}
          loading={loading}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(outPayload?.buckets ?? []).map((b) => (
            <div key={b.bucket} className="rounded-md border bg-background p-3 shadow-sm">
              <p className="text-xs text-muted-foreground">{b.bucket} days</p>
              <p className="text-xl font-semibold">{inrFmt.format(b.totalOutstanding)}</p>
              <p className="text-xs text-muted-foreground">{b.circulationCount} circulation(s)</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Top debtors:</p>
        <div className="overflow-auto rounded-md border bg-background">
          <Table
            className="border-separate border-spacing-0"
            containerClassName="overflow-visible min-w-[600px]"
          >
            <TableHeader className={STICKY_THEAD_CLASS}>
              <TableRow>
                <TableHead className={cn(STICKY_TH_LEFT, "min-w-[60px]")}>#</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[200px]")}>User</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>Outstanding</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>Circulations</TableHead>
                <TableHead className={cn(STICKY_TH_RIGHT, "min-w-[140px]")}>Oldest fine</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(outPayload?.topDebtors ?? []).map((d, i) => (
                <TableRow key={d.userId}>
                  <TableCell className="border-b px-2 text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="border-b px-2">
                    {d.userName ?? `User #${d.userId}`}
                  </TableCell>
                  <TableCell className="border-b px-2 font-semibold text-rose-700">
                    {inrFmt.format(d.outstanding)}
                  </TableCell>
                  <TableCell className="border-b px-2 text-xs">{d.circulationCount}</TableCell>
                  <TableCell className="border-b px-2 text-right text-xs">
                    {d.oldestFineDate ? new Date(d.oldestFineDate).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="FINES_IN" className="mt-4 space-y-3">
        <FiltersRow
          filters={inFilters}
          setFilters={setInFilters}
          branchOptions={branchOptions}
          showDateRange={true}
          onRun={run}
          loading={loading}
        />
        {inPayload ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Total collected</p>
              <p className="text-2xl font-bold">{inrFmt.format(inPayload.total)}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Payments</p>
              <p className="text-2xl font-bold">{inPayload.count}</p>
            </div>
          </div>
        ) : null}
        <div className="overflow-auto rounded-md border bg-background">
          <Table
            className="border-separate border-spacing-0"
            containerClassName="overflow-visible min-w-[600px]"
          >
            <TableHeader className={STICKY_THEAD_CLASS}>
              <TableRow>
                <TableHead className={cn(STICKY_TH_LEFT, "min-w-[80px]")}>Payment</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>User</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>Amount</TableHead>
                <TableHead className={cn(STICKY_TH_RIGHT, "min-w-[160px]")}>Paid at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(inPayload?.rows ?? []).map((r) => (
                <TableRow key={r.paymentId}>
                  <TableCell className="border-b px-2 text-xs">#{r.paymentId}</TableCell>
                  <TableCell className="border-b px-2 text-xs">{r.userId ?? "—"}</TableCell>
                  <TableCell className="border-b px-2 font-medium">
                    {inrFmt.format(r.amount)}
                  </TableCell>
                  <TableCell className="border-b px-2 text-right text-xs">
                    {r.paidAt ? new Date(r.paidAt).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="STOCK" className="mt-4 space-y-3">
        <FiltersRow
          filters={stockFilters}
          setFilters={setStockFilters}
          branchOptions={branchOptions}
          showDateRange={false}
          onRun={run}
          loading={loading}
        />
        <div className="overflow-auto rounded-md border bg-background">
          <Table
            className="border-separate border-spacing-0"
            containerClassName="overflow-visible min-w-[600px]"
          >
            <TableHeader className={STICKY_THEAD_CLASS}>
              <TableRow>
                <TableHead className={cn(STICKY_TH_LEFT, "min-w-[200px]")}>Branch</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[200px]")}>Status</TableHead>
                <TableHead className={cn(STICKY_TH_RIGHT, "min-w-[120px]")}>Copies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((r, i) => (
                <TableRow key={`${r.branchId ?? "x"}-${r.statusId ?? "x"}-${i}`}>
                  <TableCell className="border-b px-2">{r.branchName}</TableCell>
                  <TableCell className="border-b px-2">{r.statusName}</TableCell>
                  <TableCell className="border-b px-2 text-right font-semibold">
                    {r.copyCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="DEMAND" className="mt-4 space-y-3">
        <FiltersRow
          filters={demandFilters}
          setFilters={setDemandFilters}
          branchOptions={branchOptions}
          showDateRange={true}
          onRun={run}
          loading={loading}
        />
        <p className="text-xs text-muted-foreground">
          Top 25 titles by issues in the window. Demand-vs-supply ratio (issues/copies) helps
          prioritise procurement.
        </p>
        <div className="overflow-auto rounded-md border bg-background">
          <Table
            className="border-separate border-spacing-0"
            containerClassName="overflow-visible min-w-[700px]"
          >
            <TableHeader className={STICKY_THEAD_CLASS}>
              <TableRow>
                <TableHead className={cn(STICKY_TH_LEFT, "min-w-[60px]")}>#</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[260px]")}>Title</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>ISBN</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[100px]")}>Issues</TableHead>
                <TableHead className={cn(STICKY_TH_BASE, "min-w-[100px]")}>Copies</TableHead>
                <TableHead className={cn(STICKY_TH_RIGHT, "min-w-[100px]")}>Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demand.map((r, i) => (
                <TableRow key={r.bookId}>
                  <TableCell className="border-b px-2 text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="border-b px-2 font-medium">{r.title}</TableCell>
                  <TableCell className="border-b px-2 text-xs">{r.isbn ?? "—"}</TableCell>
                  <TableCell className="border-b px-2 text-right">{r.issueCount}</TableCell>
                  <TableCell className="border-b px-2 text-right">{r.copiesOwned}</TableCell>
                  <TableCell className="border-b px-2 text-right font-semibold">
                    {r.copiesOwned > 0 ? (r.issueCount / r.copiesOwned).toFixed(1) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
