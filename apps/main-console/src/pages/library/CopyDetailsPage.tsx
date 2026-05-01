import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookCopy, Download, Filter, Loader2, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import {
  createCopyDetails,
  downloadCopyDetailsExcel,
  getCopyDetailsById,
  getCopyDetailsList,
  getCopyDetailsMeta,
  updateCopyDetails,
  type CopyDetailsDetail,
  type CopyDetailsListRow,
  type CopyDetailsMetaPayload,
  type CopyDetailsUpsertBody,
} from "@/services/copy-details.service";

type LibraryCopyDetailsSocketUpdate = {
  id: string;
  type: "library_copy_details_update";
  action: "CREATED" | "UPDATED";
  actorName: string;
  copyDetailsId: number;
  bookTitle: string;
  message: string;
  updatedAt: string;
};

const NONE = "__none__";

const comboWithNone = (
  items: { value: string; label: string }[],
  noneLabel: string,
): { value: string; label: string }[] => [{ value: NONE, label: noneLabel }, ...items];

const copyBadgeToneClasses = {
  status: "border-emerald-500/55 bg-emerald-100 text-emerald-950 hover:bg-emerald-100/90",
  entry: "border-sky-500/55 bg-sky-100 text-sky-950 hover:bg-sky-100/90",
  binding: "border-amber-500/55 bg-amber-100 text-amber-950 hover:bg-amber-100/90",
  price: "border-red-500/55 bg-red-100 text-red-950 hover:bg-red-100/90 tabular-nums",
} as const;

type CopyBadgeTone = keyof typeof copyBadgeToneClasses;

function MasterBadge({ text, tone }: { text: string | null; tone: CopyBadgeTone }) {
  if (!text?.trim()) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <Badge
      variant="outline"
      className={`whitespace-normal border text-left text-xs font-normal leading-snug shadow-sm ${copyBadgeToneClasses[tone]}`}
    >
      {text}
    </Badge>
  );
}

function AccessionIsbnCell({ row }: { row: CopyDetailsListRow }) {
  return (
    <div className="space-y-1 text-xs">
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Accession
        </span>
        <p className="font-mono text-slate-800">{row.accessNumber ?? "—"}</p>
      </div>
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          ISBN
        </span>
        <p className="break-all text-slate-700">{row.isbn ?? "—"}</p>
      </div>
    </div>
  );
}

type AppliedCopyFilters = {
  statusId?: number;
  entryModeId?: number;
  rackId?: number;
  shelfId?: number;
  bindingTypeId?: number;
  enclosureId?: number;
  bookId?: number;
};

type FilterDraft = {
  statusId: string;
  entryModeId: string;
  rackId: string;
  shelfId: string;
  bindingTypeId: string;
  enclosureId: string;
  bookId: string;
};

const emptyFilterDraft = (): FilterDraft => ({
  statusId: NONE,
  entryModeId: NONE,
  rackId: NONE,
  shelfId: NONE,
  bindingTypeId: NONE,
  enclosureId: NONE,
  bookId: NONE,
});

const appliedToDraft = (a: AppliedCopyFilters): FilterDraft => ({
  statusId: a.statusId != null ? String(a.statusId) : NONE,
  entryModeId: a.entryModeId != null ? String(a.entryModeId) : NONE,
  rackId: a.rackId != null ? String(a.rackId) : NONE,
  shelfId: a.shelfId != null ? String(a.shelfId) : NONE,
  bindingTypeId: a.bindingTypeId != null ? String(a.bindingTypeId) : NONE,
  enclosureId: a.enclosureId != null ? String(a.enclosureId) : NONE,
  bookId: a.bookId != null ? String(a.bookId) : NONE,
});

const draftToApplied = (d: FilterDraft): AppliedCopyFilters => ({
  statusId: d.statusId === NONE ? undefined : Number(d.statusId),
  entryModeId: d.entryModeId === NONE ? undefined : Number(d.entryModeId),
  rackId: d.rackId === NONE ? undefined : Number(d.rackId),
  shelfId: d.shelfId === NONE ? undefined : Number(d.shelfId),
  bindingTypeId: d.bindingTypeId === NONE ? undefined : Number(d.bindingTypeId),
  enclosureId: d.enclosureId === NONE ? undefined : Number(d.enclosureId),
  bookId: d.bookId === NONE ? undefined : Number(d.bookId),
});

const countActiveFilters = (a: AppliedCopyFilters) =>
  [a.statusId, a.entryModeId, a.rackId, a.shelfId, a.bindingTypeId, a.enclosureId, a.bookId].filter(
    (v) => v != null,
  ).length;

type FormState = {
  bookId: string;
  accessNumber: string;
  oldAccessNumber: string;
  isbn: string;
  publishedYear: string;
  statusId: string;
  entryModeId: string;
  rackId: string;
  shelfId: string;
  enclosureId: string;
  bindingTypeId: string;
  priceInINR: string;
  type: string;
  issueType: string;
  voucherNumber: string;
  numberOfEnclosures: string;
  numberOfPages: string;
  remarks: string;
};

const emptyForm = (): FormState => ({
  bookId: NONE,
  accessNumber: "",
  oldAccessNumber: "",
  isbn: "",
  publishedYear: "",
  statusId: NONE,
  entryModeId: NONE,
  rackId: NONE,
  shelfId: NONE,
  enclosureId: NONE,
  bindingTypeId: NONE,
  priceInINR: "",
  type: "",
  issueType: "",
  voucherNumber: "",
  numberOfEnclosures: "",
  numberOfPages: "",
  remarks: "",
});

const detailToForm = (d: CopyDetailsDetail): FormState => ({
  bookId: String(d.bookId),
  accessNumber: d.accessNumber ?? "",
  oldAccessNumber: d.oldAccessNumber ?? "",
  isbn: d.isbn ?? "",
  publishedYear: d.publishedYear ?? "",
  statusId: d.statusId != null ? String(d.statusId) : NONE,
  entryModeId: d.enntryModeId != null ? String(d.enntryModeId) : NONE,
  rackId: d.rackId != null ? String(d.rackId) : NONE,
  shelfId: d.shelfId != null ? String(d.shelfId) : NONE,
  enclosureId: d.enclosureId != null ? String(d.enclosureId) : NONE,
  bindingTypeId: d.bindingTypeId != null ? String(d.bindingTypeId) : NONE,
  priceInINR: d.priceInINR ?? "",
  type: d.type ?? "",
  issueType: d.issueType ?? "",
  voucherNumber: d.voucherNumber ?? "",
  numberOfEnclosures: d.numberOfEnclosures != null ? String(d.numberOfEnclosures) : "",
  numberOfPages: d.numberOfPages != null ? String(d.numberOfPages) : "",
  remarks: d.remarks ?? "",
});

const parseOptionalCount = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/** Formats stored INR text with grouping (e.g. 1234567 → 12,34,567). Unparseable values are shown as-is. */
function formatPriceInrDisplay(raw: string | null | undefined): string | null {
  const t = raw?.trim() ?? "";
  if (!t) return null;
  const normalized = t.replace(/,/g, "").replace(/\s/g, "");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return t;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function PriceInrBadge({ raw }: { raw: string | null | undefined }) {
  const formatted = formatPriceInrDisplay(raw);
  if (!formatted) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return <MasterBadge text={`₹\u00A0${formatted}`} tone="price" />;
}

const formToBody = (f: FormState): CopyDetailsUpsertBody => ({
  bookId: Number(f.bookId),
  accessNumber: f.accessNumber.trim() || null,
  oldAccessNumber: f.oldAccessNumber.trim() || null,
  isbn: f.isbn.trim() || null,
  publishedYear: f.publishedYear.trim() || null,
  statusId: f.statusId === NONE ? null : Number(f.statusId),
  enntryModeId: f.entryModeId === NONE ? null : Number(f.entryModeId),
  rackId: f.rackId === NONE ? null : Number(f.rackId),
  shelfId: f.shelfId === NONE ? null : Number(f.shelfId),
  enclosureId: f.enclosureId === NONE ? null : Number(f.enclosureId),
  bindingTypeId: f.bindingTypeId === NONE ? null : Number(f.bindingTypeId),
  priceInINR: f.priceInINR.trim() || null,
  type: f.type.trim() || null,
  issueType: f.issueType.trim() || null,
  voucherNumber: f.voucherNumber.trim() || null,
  numberOfEnclosures: parseOptionalCount(f.numberOfEnclosures),
  numberOfPages: parseOptionalCount(f.numberOfPages),
  remarks: f.remarks.trim() || null,
});

function CopyRowActions({
  row,
  onEdit,
}: {
  row: CopyDetailsListRow;
  onEdit: (id: number) => void;
}) {
  return (
    <div className="inline-flex shrink-0 justify-end">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(row.id)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CopyDetailsPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<CopyDetailsListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<CopyDetailsMetaPayload | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedCopyFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(emptyFilterDraft());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activeFilterCount = countActiveFilters(appliedFilters);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getCopyDetailsMeta();
        setMeta(res.payload);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filterComboStatuses = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.statuses ?? []).map((o) => ({
        value: String(o.id),
        label: o.name ?? `#${o.id}`,
      })),
    ],
    [meta?.statuses],
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
  const filterComboRacks = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.racks ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.racks],
  );
  const filterComboShelves = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.shelves ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.shelves],
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
  const filterComboEnclosures = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.enclosures ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.enclosures],
  );
  const filterComboBooks = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.books ?? []).map((o) => ({ value: String(o.id), label: o.title })),
    ],
    [meta?.books],
  );

  const formComboBooks = useMemo(
    () =>
      (meta?.books ?? []).map((o) => ({
        value: String(o.id),
        label: o.title,
      })),
    [meta?.books],
  );
  const formComboStatuses = useMemo(
    () =>
      comboWithNone(
        (meta?.statuses ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.statuses],
  );
  const formComboEntryModesForm = useMemo(
    () =>
      comboWithNone(
        (meta?.entryModes ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.entryModes],
  );
  const formComboRacksForm = useMemo(
    () =>
      comboWithNone(
        (meta?.racks ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.racks],
  );
  const formComboShelvesForm = useMemo(
    () =>
      comboWithNone(
        (meta?.shelves ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.shelves],
  );
  const formComboEnclosuresForm = useMemo(
    () =>
      comboWithNone(
        (meta?.enclosures ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.enclosures],
  );
  const formComboBindingsForm = useMemo(
    () =>
      comboWithNone(
        (meta?.bindings ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.bindings],
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCopyDetailsList({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(appliedFilters.statusId != null ? { statusId: appliedFilters.statusId } : {}),
        ...(appliedFilters.entryModeId != null ? { entryModeId: appliedFilters.entryModeId } : {}),
        ...(appliedFilters.rackId != null ? { rackId: appliedFilters.rackId } : {}),
        ...(appliedFilters.shelfId != null ? { shelfId: appliedFilters.shelfId } : {}),
        ...(appliedFilters.bindingTypeId != null
          ? { bindingTypeId: appliedFilters.bindingTypeId }
          : {}),
        ...(appliedFilters.enclosureId != null ? { enclosureId: appliedFilters.enclosureId } : {}),
        ...(appliedFilters.bookId != null ? { bookId: appliedFilters.bookId } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load copy details");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, appliedFilters]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_copy_details");

    const handleLibraryCopyDetailsUpdate = (data: LibraryCopyDetailsSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_copy_details_update", handleLibraryCopyDetailsUpdate);

    return () => {
      socket.off("library_copy_details_update", handleLibraryCopyDetailsUpdate);
      socket.emit("unsubscribe_library_copy_details");
    };
  }, [socket, isConnected, fetchRows]);

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadCopyDetailsExcel({
        ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
        ...(appliedFilters.statusId != null ? { statusId: appliedFilters.statusId } : {}),
        ...(appliedFilters.entryModeId != null ? { entryModeId: appliedFilters.entryModeId } : {}),
        ...(appliedFilters.rackId != null ? { rackId: appliedFilters.rackId } : {}),
        ...(appliedFilters.shelfId != null ? { shelfId: appliedFilters.shelfId } : {}),
        ...(appliedFilters.bindingTypeId != null
          ? { bindingTypeId: appliedFilters.bindingTypeId }
          : {}),
        ...(appliedFilters.enclosureId != null ? { enclosureId: appliedFilters.enclosureId } : {}),
        ...(appliedFilters.bookId != null ? { bookId: appliedFilters.bookId } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `library-copy-details-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to download Excel");
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

  const clearAllFilters = () => {
    setFilterDraft(emptyFilterDraft());
    setAppliedFilters({});
    setPage(1);
    setFilterOpen(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await getCopyDetailsById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load copy");
    }
  };

  const handleSave = async () => {
    if (form.bookId === NONE) {
      toast.error("Book is required");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      if (editingId == null) {
        await createCopyDetails(body);
        toast.success("Copy details created");
      } else {
        await updateCopyDetails(editingId, body);
        toast.success("Copy details updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <BookCopy className="mr-2 h-6 w-6 rounded-md border border-slate-400 p-1" />
                Copy details
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Physical copies linked to books: accession, location, status, and pricing.
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
                Add copy
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
                placeholder="Search book, accession, ISBN, publisher…"
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
                No copy details found.
              </div>
            ) : (
              <>
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
                        <CopyRowActions row={row} onEdit={(id) => void openEdit(id)} />
                      </div>
                      <p className="font-semibold uppercase leading-snug text-slate-900 underline decoration-slate-700 underline-offset-2">
                        {row.bookTitle}
                      </p>
                      {row.publisherName ? (
                        <p className="mt-1 text-xs text-muted-foreground">{row.publisherName}</p>
                      ) : null}
                      <p className="mt-1.5">
                        <PriceInrBadge raw={row.priceInINR} />
                      </p>
                      <div className="mt-3 border-t pt-3">
                        <AccessionIsbnCell row={row} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-slate-500">Status</span>
                          <p className="mt-0.5">
                            <MasterBadge text={row.statusName} tone="status" />
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Entry mode</span>
                          <p className="mt-0.5">
                            <MasterBadge text={row.entryModeName} tone="entry" />
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Rack</span>
                          <p className="mt-0.5 text-slate-800">{row.rackName ?? "—"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Shelf</span>
                          <p className="mt-0.5 text-slate-800">{row.shelfName ?? "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-slate-500">Enclosure</span>
                          <p className="mt-0.5 text-muted-foreground">{row.enclosureName ?? "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-slate-500">Binding</span>
                          <p className="mt-0.5">
                            <MasterBadge text={row.bindingName} tone="binding" />
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 lg:block">
                  <div className="max-h-[min(70vh,640px)] overflow-auto rounded-md border bg-background">
                    <Table
                      className="border-separate border-spacing-0"
                      containerClassName="overflow-visible min-w-[900px]"
                    >
                      <TableHeader className="sticky top-0 z-20 border-b-2 border-slate-500 bg-muted/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-muted/80 dark:border-slate-400">
                        <TableRow className="border-b-0 hover:bg-transparent">
                          <TableHead className="sticky left-0 z-30 h-auto w-10 whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400 sm:bg-muted/95">
                            #
                          </TableHead>
                          <TableHead className="h-auto min-w-[200px] whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Book & publisher
                          </TableHead>
                          <TableHead className="h-auto min-w-[140px] whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Accession / ISBN
                          </TableHead>
                          <TableHead className="h-auto whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Status
                          </TableHead>
                          <TableHead className="h-auto min-w-[100px] whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Entry mode
                          </TableHead>
                          <TableHead className="h-auto min-w-[120px] whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Rack
                          </TableHead>
                          <TableHead className="h-auto min-w-[120px] whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Shelf
                          </TableHead>
                          <TableHead className="h-auto min-w-[120px] whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Enclosure
                          </TableHead>
                          <TableHead className="h-auto whitespace-nowrap border-r border-solid border-slate-300 bg-muted/95 px-3 py-2.5 text-xs font-semibold text-slate-800 backdrop-blur dark:border-slate-400">
                            Binding
                          </TableHead>
                          <TableHead className="sticky right-0 z-30 h-auto min-w-[72px] border-solid border-l-slate-300 border-r border-r-slate-300 bg-muted/95 px-3 py-2.5 text-right text-xs font-semibold text-slate-800 backdrop-blur shadow-[-8px_0_12px_-6px_rgba(15,23,42,0.12)]    dark:border-l-slate-400 dark:border-r-slate-300 dark:last:!border-r-slate-300">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id} className="">
                            <TableCell className="border-b border-slate-200 sticky left-0 z-10 whitespace-nowrap bg-background px-2 text-muted-foreground shadow-[6px_0_10px_-4px_rgba(15,23,42,0.06)]">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="border-b border-slate-200 max-w-[280px] align-top px-2">
                              <p className="font-semibold uppercase leading-snug text-slate-900 underline decoration-slate-700 underline-offset-2">
                                {row.bookTitle}
                              </p>
                              {row.publisherName ? (
                                <p className=" mt-1 text-xs text-muted-foreground">
                                  {row.publisherName}
                                </p>
                              ) : null}
                              <p className="mt-1.5">
                                <PriceInrBadge raw={row.priceInINR} />
                              </p>
                            </TableCell>
                            <TableCell className="border-b border-slate-200 align-top px-2">
                              <AccessionIsbnCell row={row} />
                            </TableCell>
                            <TableCell className="border-b border-slate-200 align-top px-2">
                              <MasterBadge text={row.statusName} tone="status" />
                            </TableCell>
                            <TableCell className=" border-b border-slate-200 align-top px-2">
                              <MasterBadge text={row.entryModeName} tone="entry" />
                            </TableCell>
                            <TableCell className="border-b border-slate-200 align-top px-2 text-xs text-slate-700">
                              {row.rackName ?? "—"}
                            </TableCell>
                            <TableCell className="border-b border-slate-200 align-top px-2 text-xs text-slate-700">
                              {row.shelfName ?? "—"}
                            </TableCell>
                            <TableCell className="border-b border-slate-200 align-top px-2 text-xs text-muted-foreground">
                              {row.enclosureName ?? "—"}
                            </TableCell>
                            <TableCell className="border-b border-slate-200 align-top px-2">
                              <MasterBadge text={row.bindingName} tone="binding" />
                            </TableCell>
                            <TableCell className="border-b border-slate-200 sticky right-0 z-10 bg-background px-2 text-right align-top shadow-[-8px_0_12px_-6px_rgba(15,23,42,0.08)]">
                              <CopyRowActions row={row} onEdit={(id) => void openEdit(id)} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
        <DialogContent className="max-h-[min(88vh,760px)] w-[min(96vw,720px)] max-w-[720px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter copies</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Book</Label>
              <Combobox
                className="h-10"
                placeholder="Book"
                value={filterDraft.bookId}
                dataArr={filterComboBooks}
                onChange={(v) => setFilterDraft((d) => ({ ...d, bookId: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Combobox
                className="h-10"
                placeholder="Status"
                value={filterDraft.statusId}
                dataArr={filterComboStatuses}
                onChange={(v) => setFilterDraft((d) => ({ ...d, statusId: v }))}
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
              <Label className="text-xs font-medium">Rack</Label>
              <Combobox
                className="h-10"
                placeholder="Rack"
                value={filterDraft.rackId}
                dataArr={filterComboRacks}
                onChange={(v) => setFilterDraft((d) => ({ ...d, rackId: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Shelf</Label>
              <Combobox
                className="h-10"
                placeholder="Shelf"
                value={filterDraft.shelfId}
                dataArr={filterComboShelves}
                onChange={(v) => setFilterDraft((d) => ({ ...d, shelfId: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Binding</Label>
              <Combobox
                className="h-10"
                placeholder="Binding"
                value={filterDraft.bindingTypeId}
                dataArr={filterComboBindings}
                onChange={(v) => setFilterDraft((d) => ({ ...d, bindingTypeId: v }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Enclosure</Label>
              <Combobox
                className="h-10"
                placeholder="Enclosure"
                value={filterDraft.enclosureId}
                dataArr={filterComboEnclosures}
                onChange={(v) => setFilterDraft((d) => ({ ...d, enclosureId: v }))}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" className="sm:mr-auto" onClick={clearAllFilters}>
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
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId == null ? "Add copy" : "Edit copy"}</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[min(70vh,560px)] gap-3 overflow-y-auto py-2 pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Book *</Label>
              <Combobox
                className="h-10"
                placeholder="Select book"
                value={form.bookId}
                dataArr={[{ value: NONE, label: "— Select book —" }, ...formComboBooks]}
                onChange={(v) => setForm((f) => ({ ...f, bookId: v }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Accession</Label>
                <Input
                  value={form.accessNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accessNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Old accession</Label>
                <Input
                  value={form.oldAccessNumber}
                  onChange={(e) => setForm((f) => ({ ...f, oldAccessNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ISBN</Label>
                <Input
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Published year</Label>
                <Input
                  value={form.publishedYear}
                  onChange={(e) => setForm((f) => ({ ...f, publishedYear: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Combobox
                  className="h-10"
                  placeholder="Status"
                  value={form.statusId}
                  dataArr={formComboStatuses}
                  onChange={(v) => setForm((f) => ({ ...f, statusId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Entry mode</Label>
                <Combobox
                  className="h-10"
                  placeholder="Entry mode"
                  value={form.entryModeId}
                  dataArr={formComboEntryModesForm}
                  onChange={(v) => setForm((f) => ({ ...f, entryModeId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rack</Label>
                <Combobox
                  className="h-10"
                  placeholder="Rack"
                  value={form.rackId}
                  dataArr={formComboRacksForm}
                  onChange={(v) => setForm((f) => ({ ...f, rackId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Shelf</Label>
                <Combobox
                  className="h-10"
                  placeholder="Shelf"
                  value={form.shelfId}
                  dataArr={formComboShelvesForm}
                  onChange={(v) => setForm((f) => ({ ...f, shelfId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Enclosure</Label>
                <Combobox
                  className="h-10"
                  placeholder="Enclosure"
                  value={form.enclosureId}
                  dataArr={formComboEnclosuresForm}
                  onChange={(v) => setForm((f) => ({ ...f, enclosureId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Binding</Label>
                <Combobox
                  className="h-10"
                  placeholder="Binding"
                  value={form.bindingTypeId}
                  dataArr={formComboBindingsForm}
                  onChange={(v) => setForm((f) => ({ ...f, bindingTypeId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">₹</Label>
                <Input
                  value={form.priceInINR}
                  onChange={(e) => setForm((f) => ({ ...f, priceInINR: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issue type</Label>
                <Input
                  value={form.issueType}
                  onChange={(e) => setForm((f) => ({ ...f, issueType: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Voucher #</Label>
                <Input
                  value={form.voucherNumber}
                  onChange={(e) => setForm((f) => ({ ...f, voucherNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs"># Enclosures</Label>
                <Input
                  value={form.numberOfEnclosures}
                  onChange={(e) => setForm((f) => ({ ...f, numberOfEnclosures: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs"># Pages</Label>
                <Input
                  value={form.numberOfPages}
                  onChange={(e) => setForm((f) => ({ ...f, numberOfPages: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              />
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
    </div>
  );
}
