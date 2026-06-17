import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  createJournalIssue,
  createJournalSubscription,
  deleteJournalIssue,
  deleteJournalSubscription,
  getJournalIssuesForSubscription,
  getJournalSubscriptions,
  updateJournalSubscription,
} from "@/services/library-journal-subscriptions.service";
import type {
  LibraryJournalIssueRow,
  LibraryJournalSubscriptionRow,
  LibraryJournalSubscriptionUpsertBody,
} from "@/services/library-journal-subscriptions.service";
import { getJournalList } from "@/services/journal.service";
import { getLibraryVendors } from "@/services/library-vendors.service";
import { Combobox } from "@/components/ui/combobox";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

type SubForm = {
  journalId: string;
  vendorId: string;
  startDate: string;
  endDate: string;
  frequency: string;
  costPerYear: string;
  isActive: boolean;
  notes: string;
};

const emptySubForm = (): SubForm => ({
  journalId: "",
  vendorId: "",
  startDate: "",
  endDate: "",
  frequency: "",
  costPerYear: "0",
  isActive: true,
  notes: "",
});

const subRowToForm = (r: LibraryJournalSubscriptionRow): SubForm => ({
  journalId: String(r.journalId ?? ""),
  vendorId: r.vendorId != null ? String(r.vendorId) : "",
  startDate: r.startDate ?? "",
  endDate: r.endDate ?? "",
  frequency: r.frequency ?? "",
  costPerYear: String(r.costPerYear ?? 0),
  isActive: r.isActive ?? true,
  notes: r.notes ?? "",
});

const subFormToBody = (f: SubForm): LibraryJournalSubscriptionUpsertBody => ({
  journalId: Number(f.journalId),
  vendorId: f.vendorId ? Number(f.vendorId) : null,
  startDate: f.startDate || null,
  endDate: f.endDate || null,
  frequency: f.frequency.trim() || null,
  costPerYear: Number(f.costPerYear || "0"),
  isActive: f.isActive,
  notes: f.notes.trim() || null,
});

type IssueForm = {
  issueNumber: string;
  expectedDate: string;
  receivedDate: string;
  condition: string;
  remarks: string;
};

const emptyIssueForm = (): IssueForm => ({
  issueNumber: "",
  expectedDate: "",
  receivedDate: "",
  condition: "",
  remarks: "",
});

const monthKey = (d: string | null) => {
  if (!d) return "Unscheduled";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "Unscheduled";
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "long" });
};

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function JournalSubscriptionsPage() {
  const [rows, setRows] = useState<LibraryJournalSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const [issues, setIssues] = useState<LibraryJournalIssueRow[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [subForm, setSubForm] = useState<SubForm>(emptySubForm());
  const [savingSub, setSavingSub] = useState(false);
  const [confirmSub, setConfirmSub] = useState<LibraryJournalSubscriptionRow | null>(null);

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<IssueForm>(emptyIssueForm());
  const [savingIssue, setSavingIssue] = useState(false);

  const [journalOptions, setJournalOptions] = useState<{ value: string; label: string }[]>([]);
  const [vendorOptions, setVendorOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        const [journalsRes, vendorsRes] = await Promise.all([
          getJournalList({ page: 1, limit: 500 }),
          getLibraryVendors({ page: 1, limit: 500 }),
        ]);
        setJournalOptions(
          (journalsRes.payload?.rows ?? []).map((j) => ({
            value: String(j.id),
            label: j.title,
          })),
        );
        setVendorOptions(
          (vendorsRes.payload?.rows ?? []).map((v) => ({
            value: String(v.id),
            label: v.name,
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
      const res = await getJournalSubscriptions({
        page,
        limit,
        search: debounced.trim() || undefined,
      });
      setRows(res.payload?.rows ?? []);
      setTotal(res.payload?.total ?? 0);
    } catch {
      toast.error("Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const fetchIssues = useCallback(async (subId: number) => {
    setIssuesLoading(true);
    try {
      const res = await getJournalIssuesForSubscription(subId);
      setIssues(res.payload ?? []);
    } catch {
      toast.error("Failed to load issues.");
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void fetchIssues(selectedId);
    else setIssues([]);
  }, [selectedId, fetchIssues]);

  const totalAnnualSpend = useMemo(() => {
    return rows.filter((r) => r.isActive).reduce((s, r) => s + Number(r.costPerYear ?? 0), 0);
  }, [rows]);

  const issuesByMonth = useMemo(() => {
    const map = new Map<string, LibraryJournalIssueRow[]>();
    for (const it of issues) {
      const key = monthKey(it.expectedDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [issues]);

  const onCreateSub = () => {
    setEditingId(null);
    setSubForm(emptySubForm());
    setSubDialogOpen(true);
  };

  const onEditSub = (r: LibraryJournalSubscriptionRow) => {
    setEditingId(r.id);
    setSubForm(subRowToForm(r));
    setSubDialogOpen(true);
  };

  const onSubmitSub = async () => {
    if (!subForm.journalId) {
      toast.error("Journal ID is required.");
      return;
    }
    setSavingSub(true);
    try {
      if (editingId) {
        await updateJournalSubscription(editingId, subFormToBody(subForm));
        toast.success("Subscription updated.");
      } else {
        await createJournalSubscription(subFormToBody(subForm));
        toast.success("Subscription created.");
      }
      setSubDialogOpen(false);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Save failed.";
      toast.error(msg);
    } finally {
      setSavingSub(false);
    }
  };

  const onDeleteSub = async () => {
    if (!confirmSub) return;
    try {
      await deleteJournalSubscription(confirmSub.id);
      toast.success("Subscription deleted.");
      if (selectedId === confirmSub.id) setSelectedId(null);
      setConfirmSub(null);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Delete failed.";
      toast.error(msg);
    }
  };

  const onAddIssue = () => {
    setIssueForm(emptyIssueForm());
    setIssueDialogOpen(true);
  };

  const onSubmitIssue = async () => {
    if (!selectedId) return;
    setSavingIssue(true);
    try {
      await createJournalIssue(selectedId, {
        issueNumber: issueForm.issueNumber.trim() || null,
        expectedDate: issueForm.expectedDate || null,
        receivedDate: issueForm.receivedDate || null,
        condition: issueForm.condition.trim() || null,
        remarks: issueForm.remarks.trim() || null,
      });
      toast.success("Issue logged.");
      setIssueDialogOpen(false);
      void fetchIssues(selectedId);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to log issue.";
      toast.error(msg);
    } finally {
      setSavingIssue(false);
    }
  };

  const onRemoveIssue = async (id: number) => {
    try {
      await deleteJournalIssue(id);
      if (selectedId) void fetchIssues(selectedId);
    } catch {
      toast.error("Failed to remove issue.");
    }
  };

  return (
    <div className="min-w-0 space-y-4 p-2 sm:p-4">
      <LibraryPageHeader
        icon={Newspaper}
        title="Journal Subscriptions"
        subtitle="Subscriptions and per-issue receipt tracking for periodicals."
        actions={
          <Button onClick={onCreateSub} className="gap-1">
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="flex flex-col items-start justify-between gap-2 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <Wallet className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Annual subscription spend (visible page)
              </p>
              <p className="text-xl font-bold text-gray-900">{formatINR(totalAnnualSpend)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {rows.filter((r) => r.isActive).length} active / {rows.length} loaded
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search journal title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No subscriptions yet.</div>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full rounded-lg border p-3 text-left transition hover:bg-indigo-50 ${
                      selectedId === r.id ? "border-indigo-400 bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {r.journalTitle ?? `Journal #${r.journalId}`}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {r.vendorName ?? "—"} · {r.frequency ?? "Unknown frequency"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-indigo-700">
                          {formatINR(Number(r.costPerYear ?? 0))}
                        </p>
                        <p className="text-[10px] text-gray-500">/year</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSub(r);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmSub(r);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {total > limit ? (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {page} / {Math.max(1, Math.ceil(total / limit))}
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

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base">
                {selected
                  ? `Issues — ${selected.journalTitle ?? `#${selected.journalId}`}`
                  : "Select a subscription"}
              </CardTitle>
            </div>
            {selected ? (
              <Button onClick={onAddIssue} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Log issue
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Pick a subscription to view its issues calendar.
              </div>
            ) : issuesLoading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : issues.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No issues logged yet.</div>
            ) : (
              <div className="space-y-3">
                {issuesByMonth.map(([month, list]) => (
                  <div key={month}>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      {month}
                    </p>
                    <div className="space-y-1">
                      {list.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-start justify-between gap-2 rounded-md border p-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {it.issueNumber ?? `Issue #${it.id}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Expected: {it.expectedDate ?? "—"}
                              {it.receivedDate
                                ? ` · Received: ${it.receivedDate}`
                                : " · Not yet received"}
                            </p>
                            {it.remarks ? (
                              <p className="text-xs text-gray-500">{it.remarks}</p>
                            ) : null}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-600"
                            onClick={() => onRemoveIssue(it.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit subscription" : "New subscription"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Journal *</Label>
                <Combobox
                  placeholder="Select journal"
                  value={subForm.journalId}
                  dataArr={journalOptions}
                  onChange={(v) => setSubForm({ ...subForm, journalId: v })}
                />
              </div>
              <div>
                <Label>Vendor</Label>
                <Combobox
                  placeholder="Select vendor"
                  value={subForm.vendorId}
                  dataArr={vendorOptions}
                  onChange={(v) => setSubForm({ ...subForm, vendorId: v })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={subForm.startDate}
                  onChange={(e) => setSubForm({ ...subForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End date</Label>
                <Input
                  type="date"
                  value={subForm.endDate}
                  onChange={(e) => setSubForm({ ...subForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Frequency</Label>
                <Input
                  placeholder="Monthly, Quarterly..."
                  value={subForm.frequency}
                  onChange={(e) => setSubForm({ ...subForm, frequency: e.target.value })}
                />
              </div>
              <div>
                <Label>Cost / year (INR)</Label>
                <Input
                  value={subForm.costPerYear}
                  onChange={(e) => setSubForm({ ...subForm, costPerYear: e.target.value })}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="sub-active"
                type="checkbox"
                checked={subForm.isActive}
                onChange={(e) => setSubForm({ ...subForm, isActive: e.target.checked })}
              />
              <Label htmlFor="sub-active">Active</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={subForm.notes}
                onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)} disabled={savingSub}>
              Cancel
            </Button>
            <Button onClick={onSubmitSub} disabled={savingSub}>
              {savingSub ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log issue</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Issue number</Label>
              <Input
                value={issueForm.issueNumber}
                onChange={(e) => setIssueForm({ ...issueForm, issueNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Expected date</Label>
                <Input
                  type="date"
                  value={issueForm.expectedDate}
                  onChange={(e) => setIssueForm({ ...issueForm, expectedDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Received date</Label>
                <Input
                  type="date"
                  value={issueForm.receivedDate}
                  onChange={(e) => setIssueForm({ ...issueForm, receivedDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Condition</Label>
              <Input
                value={issueForm.condition}
                onChange={(e) => setIssueForm({ ...issueForm, condition: e.target.value })}
              />
            </div>
            <div>
              <Label>Remarks</Label>
              <Input
                value={issueForm.remarks}
                onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIssueDialogOpen(false)}
              disabled={savingIssue}
            >
              Cancel
            </Button>
            <Button onClick={onSubmitIssue} disabled={savingIssue}>
              {savingIssue ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmSub} onOpenChange={(v) => !v && setConfirmSub(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the subscription and detach all its logged issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={onDeleteSub} className="ml-2">
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
