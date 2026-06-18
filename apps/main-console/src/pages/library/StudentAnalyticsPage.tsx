import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import {
  getStudentLibraryAnalytics,
  recomputeStudentLibraryAnalytics,
} from "@/services/library-student-analytics.service";
import type { StudentLibraryAnalyticsRow } from "@/services/library-student-analytics.service";
import { Combobox } from "@/components/ui/combobox";
import { getStudentPickerOptions } from "@/services/user";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
export default function StudentAnalyticsPage() {
  const [rows, setRows] = useState<StudentLibraryAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ userId: "", academicYear: "" });
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  const [recompUserId, setRecompUserId] = useState("");
  const [recompYear, setRecompYear] = useState("2025-26");
  const [recomputing, setRecomputing] = useState(false);

  const [studentOptions, setStudentOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getStudentPickerOptions({ limit: 1000 });
        const list = res.payload ?? [];
        setStudentOptions(
          list.map((s) => ({
            value: String(s.userId),
            label: `${s.name} (UID: ${s.uid})`,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentLibraryAnalytics({
        page,
        limit,
        userId: filters.userId ? Number(filters.userId) : undefined,
        academicYear: filters.academicYear.trim() || undefined,
      });
      setRows(res.payload?.rows ?? []);
      setTotal(res.payload?.total ?? 0);
    } catch {
      toast.error("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const onRecompute = async () => {
    if (!recompUserId || !recompYear.trim()) {
      toast.error("User ID and academic year are required.");
      return;
    }
    setRecomputing(true);
    try {
      await recomputeStudentLibraryAnalytics(Number(recompUserId), recompYear.trim());
      toast.success("Recomputed.");
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Recompute failed.";
      toast.error(msg);
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 p-2 sm:p-4">
      <LibraryPageHeader
        icon={BarChart3}
        title="Student Library Analytics"
        subtitle="Per-student usage summary: issues, returns, overdue, fines paid, visits, average grade."
      />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-lg border bg-indigo-50/40 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-700">
              Recompute for user
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label>Student</Label>
                <Combobox
                  placeholder="Select student"
                  value={recompUserId}
                  dataArr={studentOptions}
                  onChange={(v) => setRecompUserId(v)}
                />
              </div>
              <div className="flex-1">
                <Label>Academic year</Label>
                <Input
                  value={recompYear}
                  onChange={(e) => setRecompYear(e.target.value)}
                  placeholder="2025-26"
                />
              </div>
              <Button onClick={onRecompute} disabled={recomputing} className="gap-1">
                {recomputing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Recompute
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <Label>Filter by student</Label>
              <Combobox
                placeholder="Any student"
                value={filters.userId}
                dataArr={[{ value: "", label: "Any student" }, ...studentOptions]}
                onChange={(v) => setFilters({ ...filters, userId: v })}
              />
            </div>
            <div>
              <Label>Filter academic year</Label>
              <Input
                value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
              />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {loading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No analytics rows.</div>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 shadow-sm">
                  <p className="font-medium">
                    User #{r.userId} · {r.academicYear}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                    <span>Issues: {r.totalIssues}</span>
                    <span>Returns: {r.totalReturns}</span>
                    <span>Overdue: {r.totalOverdue}</span>
                    <span>Fines paid: ₹{r.totalFinesPaid}</span>
                    <span>Visits: {r.libraryVisits}</span>
                    <span>Grade: {r.averageGrade != null ? r.averageGrade.toFixed(2) : "—"}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader className={STICKY_THEAD_CLASS}>
                <TableRow>
                  <TableHead className={STICKY_TH_LEFT}>User ID</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Academic year</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Issues</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Returns</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Overdue</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Fines paid</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Visits</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Avg grade</TableHead>
                  <TableHead className={STICKY_TH_RIGHT}>Computed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center text-gray-500">
                      No analytics rows.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.userId}</TableCell>
                      <TableCell>{r.academicYear}</TableCell>
                      <TableCell>{r.totalIssues}</TableCell>
                      <TableCell>{r.totalReturns}</TableCell>
                      <TableCell>{r.totalOverdue}</TableCell>
                      <TableCell>₹{r.totalFinesPaid}</TableCell>
                      <TableCell>{r.libraryVisits}</TableCell>
                      <TableCell>
                        {r.averageGrade != null ? r.averageGrade.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(r.computedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > limit ? (
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
              <span>
                Page {page} of {Math.max(1, Math.ceil(total / limit))} · {total} total
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
