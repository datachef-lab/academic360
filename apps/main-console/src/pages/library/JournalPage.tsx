import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Filter, Loader2, Newspaper, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import {
  createJournal,
  deleteJournal,
  downloadJournalExcel,
  getJournalById,
  getJournalLinkedBooks,
  getJournalList,
  getJournalMeta,
  updateJournal,
  type JournalDetail,
  type JournalLinkedBook,
  type JournalListRow,
  type JournalMetaPayload,
  type JournalListQueryParams,
  type JournalUpsertBody,
} from "@/services/journal.service";

const NONE = "__none__";

type LibraryJournalSocketUpdate = {
  id: string;
  type: "library_journal_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  journalId: number;
  journalTitle: string;
  message: string;
  updatedAt: string;
};

type FormState = {
  title: string;
  type: string;
  subjectGroupId: string;
  entryModeId: string;
  publisherId: string;
  languageId: string;
  bindingId: string;
  periodId: string;
  issnNumber: string;
  sizeInCM: string;
};

const emptyForm = (): FormState => ({
  title: "",
  type: NONE,
  subjectGroupId: NONE,
  entryModeId: NONE,
  publisherId: NONE,
  languageId: NONE,
  bindingId: NONE,
  periodId: NONE,
  issnNumber: "",
  sizeInCM: "",
});

const detailToForm = (d: JournalDetail): FormState => ({
  title: d.title,
  type: d.type != null ? String(d.type) : NONE,
  subjectGroupId: d.subjectGroupId != null ? String(d.subjectGroupId) : NONE,
  entryModeId: d.entryModeId != null ? String(d.entryModeId) : NONE,
  publisherId: d.publisherId != null ? String(d.publisherId) : NONE,
  languageId: d.languageId != null ? String(d.languageId) : NONE,
  bindingId: d.bindingId != null ? String(d.bindingId) : NONE,
  periodId: d.periodId != null ? String(d.periodId) : NONE,
  issnNumber: d.issnNumber ?? "",
  sizeInCM: d.sizeInCM ?? "",
});

const formToBody = (f: FormState): JournalUpsertBody => ({
  title: f.title.trim(),
  type: f.type === NONE ? null : Number(f.type),
  subjectGroupId: f.subjectGroupId === NONE ? null : Number(f.subjectGroupId),
  entryModeId: f.entryModeId === NONE ? null : Number(f.entryModeId),
  publisherId: f.publisherId === NONE ? null : Number(f.publisherId),
  languageId: f.languageId === NONE ? null : Number(f.languageId),
  bindingId: f.bindingId === NONE ? null : Number(f.bindingId),
  periodId: f.periodId === NONE ? null : Number(f.periodId),
  issnNumber: f.issnNumber.trim() || null,
  sizeInCM: f.sizeInCM.trim() || null,
});

type AppliedJournalFilters = Pick<
  JournalListQueryParams,
  "subjectGroupId" | "entryModeId" | "languageId" | "bindingId" | "periodId" | "publisherId"
>;

type FilterDraft = {
  subjectGroupId: string;
  entryModeId: string;
  languageId: string;
  bindingId: string;
  periodId: string;
  publisherId: string;
};

const emptyFilterDraft = (): FilterDraft => ({
  subjectGroupId: NONE,
  entryModeId: NONE,
  languageId: NONE,
  bindingId: NONE,
  periodId: NONE,
  publisherId: NONE,
});

const appliedToDraft = (a: AppliedJournalFilters): FilterDraft => ({
  subjectGroupId: a.subjectGroupId != null ? String(a.subjectGroupId) : NONE,
  entryModeId: a.entryModeId != null ? String(a.entryModeId) : NONE,
  languageId: a.languageId != null ? String(a.languageId) : NONE,
  bindingId: a.bindingId != null ? String(a.bindingId) : NONE,
  periodId: a.periodId != null ? String(a.periodId) : NONE,
  publisherId: a.publisherId != null ? String(a.publisherId) : NONE,
});

const draftToApplied = (d: FilterDraft): AppliedJournalFilters => ({
  subjectGroupId: d.subjectGroupId === NONE ? undefined : Number(d.subjectGroupId),
  entryModeId: d.entryModeId === NONE ? undefined : Number(d.entryModeId),
  languageId: d.languageId === NONE ? undefined : Number(d.languageId),
  bindingId: d.bindingId === NONE ? undefined : Number(d.bindingId),
  periodId: d.periodId === NONE ? undefined : Number(d.periodId),
  publisherId: d.publisherId === NONE ? undefined : Number(d.publisherId),
});

const countActiveFilters = (a: AppliedJournalFilters) =>
  [a.subjectGroupId, a.entryModeId, a.languageId, a.bindingId, a.periodId, a.publisherId].filter(
    (v) => v != null,
  ).length;

const journalBadgeToneClasses = {
  language: "border-teal-500/55 bg-teal-100 text-teal-950 hover:bg-teal-100/90",
  subject: "border-violet-500/55 bg-violet-100 text-violet-950 hover:bg-violet-100/90",
  entry: "border-sky-500/55 bg-sky-100 text-sky-950 hover:bg-sky-100/90",
  binding: "border-amber-500/55 bg-amber-100 text-amber-950 hover:bg-amber-100/90",
  period: "border-rose-500/55 bg-rose-100 text-rose-950 hover:bg-rose-100/90",
} as const;

type JournalBadgeTone = keyof typeof journalBadgeToneClasses;

function MasterBadge({ text, tone }: { text: string | null; tone: JournalBadgeTone }) {
  if (!text?.trim()) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <Badge
      variant="outline"
      className={`whitespace-normal border text-left text-xs font-normal leading-snug shadow-sm ${journalBadgeToneClasses[tone]}`}
    >
      {text}
    </Badge>
  );
}

function JournalTitlePublisherLanguage({ row }: { row: JournalListRow }) {
  return (
    <>
      <div className="whitespace-normal break-words font-semibold text-slate-900">{row.title}</div>
      {row.publisherName?.trim() ? (
        <div className="mt-1.5 whitespace-normal break-words text-xs text-slate-600">
          <span className="font-medium text-slate-500"></span>
          {row.publisherName}
        </div>
      ) : (
        <div className="mt-1.5 text-xs text-slate-400">—</div>
      )}
      <div className="mt-1.5">
        {row.languageName?.trim() ? (
          <Badge
            variant="outline"
            className={`whitespace-normal break-words text-left text-xs font-normal shadow-sm ${journalBadgeToneClasses.language}`}
          >
            {row.languageName}
          </Badge>
        ) : (
          <span className="text-xs text-slate-400">Language: —</span>
        )}
      </div>
    </>
  );
}

function JournalRowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: JournalListRow;
  onEdit: (id: number) => void;
  onDelete: (row: JournalListRow) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(row.id)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700"
        onClick={() => onDelete(row)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function JournalPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<JournalListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<JournalMetaPayload | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [appliedFilters, setAppliedFilters] = useState<AppliedJournalFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(emptyFilterDraft());
  const [deleteTarget, setDeleteTarget] = useState<JournalListRow | null>(null);
  const [linkedBooks, setLinkedBooks] = useState<JournalLinkedBook[]>([]);
  const [linkedBooksLoading, setLinkedBooksLoading] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activeFilterCount = countActiveFilters(appliedFilters);

  const filterComboSubjectGroups = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.subjectGroups ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.subjectGroups],
  );
  const filterComboEntryModes = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.entryModes ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.entryModes],
  );
  const filterComboLanguages = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.languages ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.languages],
  );
  const filterComboBindings = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.bindings ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.bindings],
  );
  const filterComboPeriods = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.periods ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.periods],
  );

  const filterComboPublishers = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.publishers ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.publishers],
  );

  const formComboJournalTypes = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(meta?.journalTypes ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.journalTypes],
  );
  const formComboSubjectGroups = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(meta?.subjectGroups ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.subjectGroups],
  );
  const formComboPublishers = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(meta?.publishers ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.publishers],
  );
  const formComboEntryModes = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(meta?.entryModes ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.entryModes],
  );
  const formComboLanguages = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(meta?.languages ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.languages],
  );
  const formComboBindings = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(meta?.bindings ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.bindings],
  );
  const formComboPeriods = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(meta?.periods ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.periods],
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJournalList({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(appliedFilters.subjectGroupId != null
          ? { subjectGroupId: appliedFilters.subjectGroupId }
          : {}),
        ...(appliedFilters.entryModeId != null ? { entryModeId: appliedFilters.entryModeId } : {}),
        ...(appliedFilters.languageId != null ? { languageId: appliedFilters.languageId } : {}),
        ...(appliedFilters.bindingId != null ? { bindingId: appliedFilters.bindingId } : {}),
        ...(appliedFilters.periodId != null ? { periodId: appliedFilters.periodId } : {}),
        ...(appliedFilters.publisherId != null ? { publisherId: appliedFilters.publisherId } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load journals");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, appliedFilters]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_journal");

    const handleLibraryJournalUpdate = (data: LibraryJournalSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_journal_update", handleLibraryJournalUpdate);

    return () => {
      socket.off("library_journal_update", handleLibraryJournalUpdate);
      socket.emit("unsubscribe_library_journal");
    };
  }, [socket, isConnected, fetchRows]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getJournalMeta();
        setMeta(res.payload);
      } catch (e) {
        console.error(e);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const id = deleteTarget?.id;
    if (id == null) return;
    let cancelled = false;
    setLinkedBooksLoading(true);
    setLinkedBooks([]);
    void getJournalLinkedBooks(id)
      .then((res) => {
        if (!cancelled) setLinkedBooks(res.payload.books);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) {
          toast.error("Could not load linked books");
          setLinkedBooks([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLinkedBooksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deleteTarget?.id]);

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setLinkedBooks([]);
    setLinkedBooksLoading(false);
    setDeleteInProgress(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await getJournalById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load journal");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      if (editingId == null) {
        await createJournal(body);
        toast.success("Journal created");
      } else {
        await updateJournal(editingId, body);
        toast.success("Journal updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save journal");
    } finally {
      setSaving(false);
    }
  };

  const openFilterDialog = () => {
    setFilterDraft(appliedToDraft(appliedFilters));
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setAppliedFilters(draftToApplied(filterDraft));
    setPage(1);
    setFilterOpen(false);
  };

  const clearAllFiltersAndApply = () => {
    setFilterDraft(emptyFilterDraft());
    setAppliedFilters({});
    setPage(1);
    setFilterOpen(false);
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadJournalExcel({
        ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
        ...(appliedFilters.subjectGroupId != null
          ? { subjectGroupId: appliedFilters.subjectGroupId }
          : {}),
        ...(appliedFilters.entryModeId != null ? { entryModeId: appliedFilters.entryModeId } : {}),
        ...(appliedFilters.languageId != null ? { languageId: appliedFilters.languageId } : {}),
        ...(appliedFilters.bindingId != null ? { bindingId: appliedFilters.bindingId } : {}),
        ...(appliedFilters.periodId != null ? { periodId: appliedFilters.periodId } : {}),
        ...(appliedFilters.publisherId != null ? { publisherId: appliedFilters.publisherId } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `library-journals-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to download Excel");
    }
  };

  const openDeleteDialog = (row: JournalListRow) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteJournal(deleteTarget.id);
      toast.success("Journal deleted");
      closeDeleteDialog();
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed (it may still be referenced by books)");
    } finally {
      setDeleteInProgress(false);
    }
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Newspaper className="mr-2 h-6 w-6 rounded-md border border-slate-400 p-1" />
                Journal
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Manage library journals: title, ISSN, publisher, and related masters.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDownloadExcel()}
              >
                <Download className="mr-1 h-4 w-4" />
                Download
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={openFilterDialog}>
                <Filter className="mr-1 h-4 w-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <Badge className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add Journal
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <div className="mb-3 border-b bg-background px-2 py-3 sm:px-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search title, ISSN, publisher, subject…"
                value={searchInput}
                onChange={(e) => {
                  setPage(1);
                  setSearchInput(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="relative min-w-0 px-2 sm:px-4" style={{ minHeight: "400px" }}>
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                No journals found.
              </div>
            ) : (
              <>
                {/* Narrow viewports: stacked cards (no horizontal table squeeze) */}
                <div className="max-h-[70vh] space-y-3 overflow-y-auto pb-2 lg:hidden">
                  {rows.map((row, i) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-slate-200 bg-card p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          #{(page - 1) * limit + i + 1}
                        </span>
                        <JournalRowActions
                          row={row}
                          onEdit={(id) => void openEdit(id)}
                          onDelete={openDeleteDialog}
                        />
                      </div>
                      <JournalTitlePublisherLanguage row={row} />
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-slate-500">Type</span>
                          <p className="mt-0.5 whitespace-normal break-words text-slate-800">
                            {row.journalTypeName ?? "—"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">ISSN</span>
                          <p className="mt-0.5 whitespace-normal break-words text-slate-800">
                            {row.issnNumber ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="min-w-0">
                          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            Subject
                          </p>
                          <MasterBadge text={row.subjectGroupName} tone="subject" />
                        </div>
                        <div className="min-w-0">
                          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            Entry
                          </p>
                          <MasterBadge text={row.entryModeName} tone="entry" />
                        </div>
                        <div className="min-w-0">
                          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            Binding
                          </p>
                          <MasterBadge text={row.bindingName} tone="binding" />
                        </div>
                        <div className="min-w-0">
                          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            Period
                          </p>
                          <MasterBadge text={row.periodName} tone="period" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Large viewports: full table with horizontal scroll + sticky actions */}
                <div className="hidden max-h-[560px] min-w-0 overflow-x-auto overflow-y-auto rounded-md border lg:block">
                  <Table className="min-w-[960px] w-full text-[13px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 whitespace-nowrap bg-slate-100 px-2">
                          #
                        </TableHead>
                        <TableHead className="min-w-[200px] max-w-[320px] bg-slate-100 px-2">
                          {"Title, publisher & language"}
                        </TableHead>
                        <TableHead className="min-w-[96px] bg-slate-100 px-2">Type</TableHead>
                        <TableHead className="min-w-[112px] bg-slate-100 px-2">
                          Subject group
                        </TableHead>
                        <TableHead className="min-w-[104px] bg-slate-100 px-2">
                          Entry mode
                        </TableHead>
                        <TableHead className="min-w-[96px] bg-slate-100 px-2">Binding</TableHead>
                        <TableHead className="min-w-[96px] bg-slate-100 px-2">Period</TableHead>
                        <TableHead className="min-w-[88px] bg-slate-100 px-2">ISSN</TableHead>
                        <TableHead className="sticky right-0 z-20 min-w-[100px] whitespace-nowrap bg-slate-100 px-3 text-right shadow-[-6px_0_10px_-4px_rgba(15,23,42,0.12)]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={row.id}>
                          <TableCell className="align-top whitespace-nowrap px-2">
                            {(page - 1) * limit + i + 1}
                          </TableCell>
                          <TableCell className="max-w-[320px] align-top px-2">
                            <JournalTitlePublisherLanguage row={row} />
                          </TableCell>
                          <TableCell className="align-top px-2 text-xs">
                            <span className="whitespace-normal break-words text-slate-700">
                              {row.journalTypeName ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="align-top px-2">
                            <MasterBadge text={row.subjectGroupName} tone="subject" />
                          </TableCell>
                          <TableCell className="align-top px-2">
                            <MasterBadge text={row.entryModeName} tone="entry" />
                          </TableCell>
                          <TableCell className="align-top px-2">
                            <MasterBadge text={row.bindingName} tone="binding" />
                          </TableCell>
                          <TableCell className="align-top px-2">
                            <MasterBadge text={row.periodName} tone="period" />
                          </TableCell>
                          <TableCell className="align-top px-2 text-xs whitespace-normal break-words text-slate-700">
                            {row.issnNumber ?? "—"}
                          </TableCell>
                          <TableCell className="sticky right-0 z-10 min-w-[100px] bg-background px-2 text-right align-top shadow-[-6px_0_10px_-4px_rgba(15,23,42,0.08)]">
                            <JournalRowActions
                              row={row}
                              onEdit={(id) => void openEdit(id)}
                              onDelete={openDeleteDialog}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-sm text-slate-600 sm:px-4">
            <span>
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="flex h-[min(88vh,820px)] w-[min(96vw,960px)] max-w-[960px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[960px]">
          <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
            <DialogTitle>Filter journals</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Search within each list. Export Excel uses the same filters as the table.
            </p>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Subject group</Label>
                <Combobox
                  className="h-10"
                  placeholder="Subject group"
                  value={filterDraft.subjectGroupId}
                  dataArr={filterComboSubjectGroups}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, subjectGroupId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Entry mode</Label>
                <Combobox
                  className="h-10"
                  placeholder="Entry mode"
                  value={filterDraft.entryModeId}
                  dataArr={filterComboEntryModes}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, entryModeId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Language</Label>
                <Combobox
                  className="h-10"
                  placeholder="Language"
                  value={filterDraft.languageId}
                  dataArr={filterComboLanguages}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, languageId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Binding</Label>
                <Combobox
                  className="h-10"
                  placeholder="Binding"
                  value={filterDraft.bindingId}
                  dataArr={filterComboBindings}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, bindingId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Period / frequency</Label>
                <Combobox
                  className="h-10"
                  placeholder="Period"
                  value={filterDraft.periodId}
                  dataArr={filterComboPeriods}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, periodId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Publisher</Label>
                <Combobox
                  className="h-10"
                  placeholder="Publisher"
                  value={filterDraft.publisherId}
                  dataArr={filterComboPublishers}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, publisherId: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="sm:mr-auto"
              onClick={clearAllFiltersAndApply}
            >
              Clear all
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setFilterOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId == null ? "Add Journal" : "Edit Journal"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Journal title"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Journal type</Label>
                <Combobox
                  className="h-10"
                  placeholder="Journal type"
                  value={form.type}
                  dataArr={formComboJournalTypes}
                  onChange={(v) => setForm((f) => ({ ...f, type: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Subject group</Label>
                <Combobox
                  className="h-10"
                  placeholder="Subject group"
                  value={form.subjectGroupId}
                  dataArr={formComboSubjectGroups}
                  onChange={(v) => setForm((f) => ({ ...f, subjectGroupId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Publisher</Label>
                <Combobox
                  className="h-10"
                  placeholder="Publisher"
                  value={form.publisherId}
                  dataArr={formComboPublishers}
                  onChange={(v) => setForm((f) => ({ ...f, publisherId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Entry mode</Label>
                <Combobox
                  className="h-10"
                  placeholder="Entry mode"
                  value={form.entryModeId}
                  dataArr={formComboEntryModes}
                  onChange={(v) => setForm((f) => ({ ...f, entryModeId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Language</Label>
                <Combobox
                  className="h-10"
                  placeholder="Language"
                  value={form.languageId}
                  dataArr={formComboLanguages}
                  onChange={(v) => setForm((f) => ({ ...f, languageId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Binding</Label>
                <Combobox
                  className="h-10"
                  placeholder="Binding"
                  value={form.bindingId}
                  dataArr={formComboBindings}
                  onChange={(v) => setForm((f) => ({ ...f, bindingId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Period / frequency</Label>
                <Combobox
                  className="h-10"
                  placeholder="Period / frequency"
                  value={form.periodId}
                  dataArr={formComboPeriods}
                  onChange={(v) => setForm((f) => ({ ...f, periodId: v }))}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>ISSN</Label>
                <Input
                  value={form.issnNumber}
                  onChange={(e) => setForm((f) => ({ ...f, issnNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Size (cm)</Label>
                <Input
                  value={form.sizeInCM}
                  onChange={(e) => setForm((f) => ({ ...f, sizeInCM: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journal?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>
                  You are about to delete{" "}
                  <span className="font-medium text-foreground">
                    &quot;{deleteTarget?.title}&quot;
                  </span>
                  . This cannot be undone.
                </p>
                <div>
                  <p className="font-medium text-foreground">Linked library books</p>
                  {linkedBooksLoading ? (
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </div>
                  ) : linkedBooks.length === 0 ? (
                    <p className="mt-1">No books reference this journal.</p>
                  ) : (
                    <>
                      <p className="mt-1">
                        {linkedBooks.length} book{linkedBooks.length !== 1 ? "s" : ""}{" "}
                        {linkedBooks.length !== 1 ? "are" : "is"} linked to this journal from the
                        book record. Delete may fail until those references are cleared.
                      </p>
                      <ul className="mt-2 max-h-44 list-inside list-disc overflow-y-auto rounded-md border bg-muted/30 py-2 pl-3 pr-2 text-foreground">
                        {linkedBooks.map((b) => (
                          <li key={b.id} className="py-0.5 break-words text-sm">
                            <span className="font-mono text-xs text-muted-foreground">#{b.id}</span>{" "}
                            {b.title}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgress}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteInProgress}
              onClick={() => void confirmDelete()}
            >
              {deleteInProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete journal
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
