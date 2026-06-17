import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Book,
  Download,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import {
  createBook,
  deleteBook,
  downloadBooksExcel,
  getBookAuthors,
  getBookById,
  getBookList,
  getBooksMeta,
  saveBookAuthors,
  updateBook,
  type BookDetail,
  type BookListRow,
  type BookMetaPayload,
  type BookListQueryParams,
  type BookUpsertBody,
} from "@/services/books.service";
import { getLibraryAuthorTypes } from "@/services/library-author-types.service";
import { getLibraryAuthors } from "@/services/library-authors.service";

type LibraryBookSocketUpdate = {
  id: string;
  type: "library_book_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  bookId: number;
  bookTitle: string;
  message: string;
  updatedAt: string;
};

const NONE = "__none__";

const comboWithNone = (
  items: { value: string; label: string }[],
  noneLabel: string,
): { value: string; label: string }[] => [{ value: NONE, label: noneLabel }, ...items];

type AppliedBookFilters = Pick<
  BookListQueryParams,
  | "publisherId"
  | "languageId"
  | "subjectGroupId"
  | "seriesId"
  | "libraryDocumentTypeId"
  | "journalId"
  | "enclosureId"
>;

type FilterDraft = {
  publisherId: string;
  languageId: string;
  subjectGroupId: string;
  seriesId: string;
  libraryDocumentTypeId: string;
  journalId: string;
  enclosureId: string;
};

const emptyFilterDraft = (): FilterDraft => ({
  publisherId: NONE,
  languageId: NONE,
  subjectGroupId: NONE,
  seriesId: NONE,
  libraryDocumentTypeId: NONE,
  journalId: NONE,
  enclosureId: NONE,
});

const appliedToDraft = (a: AppliedBookFilters): FilterDraft => ({
  publisherId: a.publisherId != null ? String(a.publisherId) : NONE,
  languageId: a.languageId != null ? String(a.languageId) : NONE,
  subjectGroupId: a.subjectGroupId != null ? String(a.subjectGroupId) : NONE,
  seriesId: a.seriesId != null ? String(a.seriesId) : NONE,
  libraryDocumentTypeId: a.libraryDocumentTypeId != null ? String(a.libraryDocumentTypeId) : NONE,
  journalId: a.journalId != null ? String(a.journalId) : NONE,
  enclosureId: a.enclosureId != null ? String(a.enclosureId) : NONE,
});

const draftToApplied = (d: FilterDraft): AppliedBookFilters => ({
  publisherId: d.publisherId === NONE ? undefined : Number(d.publisherId),
  languageId: d.languageId === NONE ? undefined : Number(d.languageId),
  subjectGroupId: d.subjectGroupId === NONE ? undefined : Number(d.subjectGroupId),
  seriesId: d.seriesId === NONE ? undefined : Number(d.seriesId),
  libraryDocumentTypeId:
    d.libraryDocumentTypeId === NONE ? undefined : Number(d.libraryDocumentTypeId),
  journalId: d.journalId === NONE ? undefined : Number(d.journalId),
  enclosureId: d.enclosureId === NONE ? undefined : Number(d.enclosureId),
});

const countActiveFilters = (a: AppliedBookFilters) =>
  [
    a.publisherId,
    a.languageId,
    a.subjectGroupId,
    a.seriesId,
    a.libraryDocumentTypeId,
    a.journalId,
    a.enclosureId,
  ].filter((v) => v != null).length;

const badgeTone = {
  lang: "border-teal-500/55 bg-teal-100 text-teal-950",
  doc: "border-sky-500/55 bg-sky-100 text-sky-950",
  jr: "border-violet-500/55 bg-violet-100 text-violet-950",
  sg: "border-fuchsia-500/55 bg-fuchsia-100 text-fuchsia-950",
  per: "border-amber-500/55 bg-amber-100 text-amber-950",
} as const;

function MiniBadge({ text, tone }: { text: string | null; tone: keyof typeof badgeTone }) {
  if (!text?.trim()) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge
      variant="outline"
      className={`whitespace-normal text-left text-xs font-normal leading-snug shadow-sm ${badgeTone[tone]}`}
    >
      {text}
    </Badge>
  );
}

function docTypeLabel(name: string | null, libraryArticleName: string | null) {
  const type = name?.trim();
  const article = libraryArticleName?.trim();
  if (type && article) return `${type} (${article})`;
  return type || article || "—";
}

type FormState = {
  title: string;
  subTitle: string;
  alternateTitle: string;
  libraryDocumentTypeId: string;
  subjectGroupId: string;
  languageId: string;
  isbn: string;
  issueDate: string;
  edition: string;
  editionYear: string;
  bookVolume: string;
  bookPart: string;
  seriesId: string;
  publisherId: string;
  publishedYear: string;
  keywords: string;
  remarks: string;
  callNumber: string;
  journalId: string;
  issueNumber: string;
  isUniqueAccess: boolean;
  enclosureId: string;
  notes: string;
  frequency: string;
  referenceNumber: string;
  frontCover: string;
  backCover: string;
  frontCoverPreview: string;
  backCoverPreview: string;
  frontCoverFile: File | null;
  backCoverFile: File | null;
  branchId: string;
  cdlEnabled: boolean;
  cdlConcurrentLimit: string;
  cdlLoanHours: string;
};

const emptyForm = (): FormState => ({
  title: "",
  subTitle: "",
  alternateTitle: "",
  libraryDocumentTypeId: NONE,
  subjectGroupId: NONE,
  languageId: NONE,
  isbn: "",
  issueDate: "",
  edition: "",
  editionYear: "",
  bookVolume: "",
  bookPart: "",
  seriesId: NONE,
  publisherId: NONE,
  publishedYear: "",
  keywords: "",
  remarks: "",
  callNumber: "",
  journalId: NONE,
  issueNumber: "",
  isUniqueAccess: false,
  enclosureId: NONE,
  notes: "",
  frequency: NONE,
  referenceNumber: "",
  frontCover: "",
  backCover: "",
  frontCoverPreview: "",
  backCoverPreview: "",
  frontCoverFile: null,
  backCoverFile: null,
  branchId: "",
  cdlEnabled: false,
  cdlConcurrentLimit: "1",
  cdlLoanHours: "24",
});

const detailToForm = (d: BookDetail): FormState => ({
  title: d.title,
  subTitle: d.subTitle ?? "",
  alternateTitle: d.alternateTitle ?? "",
  libraryDocumentTypeId: d.libraryDocumentTypeId != null ? String(d.libraryDocumentTypeId) : NONE,
  subjectGroupId: d.subjectGroupId != null ? String(d.subjectGroupId) : NONE,
  languageId: d.languageId != null ? String(d.languageId) : NONE,
  isbn: d.isbn ?? "",
  issueDate: d.issueDate ?? "",
  edition: d.edition ?? "",
  editionYear: d.editionYear ?? "",
  bookVolume: d.bookVolume ?? "",
  bookPart: d.bookPart ?? "",
  seriesId: d.seriesId != null ? String(d.seriesId) : NONE,
  publisherId: d.publisherId != null ? String(d.publisherId) : NONE,
  publishedYear: d.publishedYear ?? "",
  keywords: d.keywords ?? "",
  remarks: d.remarks ?? "",
  callNumber: d.callNumber ?? "",
  journalId: d.journalId != null ? String(d.journalId) : NONE,
  issueNumber: d.issueNumber ?? "",
  isUniqueAccess: d.isUniqueAccess,
  enclosureId: d.enclosureId != null ? String(d.enclosureId) : NONE,
  notes: d.notes ?? "",
  frequency: d.frequency != null ? String(d.frequency) : NONE,
  referenceNumber: d.referenceNumber ?? "",
  frontCover: d.frontCover ?? "",
  backCover: d.backCover ?? "",
  frontCoverPreview: d.frontCover ?? "",
  backCoverPreview: d.backCover ?? "",
  frontCoverFile: null,
  backCoverFile: null,
  branchId: d.branchId != null ? String(d.branchId) : "",
  cdlEnabled: d.cdlEnabled ?? false,
  cdlConcurrentLimit: d.cdlConcurrentLimit != null ? String(d.cdlConcurrentLimit) : "1",
  cdlLoanHours: d.cdlLoanHours != null ? String(d.cdlLoanHours) : "24",
});

const formToBody = (f: FormState): BookUpsertBody => ({
  title: f.title.trim(),
  libraryDocumentTypeId: f.libraryDocumentTypeId === NONE ? null : Number(f.libraryDocumentTypeId),
  subTitle: f.subTitle.trim() || null,
  alternateTitle: f.alternateTitle.trim() || null,
  subjectGroupId: f.subjectGroupId === NONE ? null : Number(f.subjectGroupId),
  languageId: f.languageId === NONE ? null : Number(f.languageId),
  isbn: f.isbn.trim() || null,
  issueDate: f.issueDate.trim() || null,
  edition: f.edition.trim() || null,
  editionYear: f.editionYear.trim() || null,
  bookVolume: f.bookVolume.trim() || null,
  bookPart: f.bookPart.trim() || null,
  seriesId: f.seriesId === NONE ? null : Number(f.seriesId),
  publisherId: f.publisherId === NONE ? null : Number(f.publisherId),
  publishedYear: f.publishedYear.trim() || null,
  keywords: f.keywords.trim() || null,
  remarks: f.remarks.trim() || null,
  callNumber: f.callNumber.trim() || null,
  journalId: f.journalId === NONE ? null : Number(f.journalId),
  issueNumber: f.issueNumber.trim() || null,
  isUniqueAccess: f.isUniqueAccess,
  enclosureId: f.enclosureId === NONE ? null : Number(f.enclosureId),
  notes: f.notes.trim() || null,
  frequency: f.frequency === NONE ? null : Number(f.frequency),
  referenceNumber: f.referenceNumber.trim() || null,
  frontCover: f.frontCover.trim() || null,
  backCover: f.backCover.trim() || null,
  frontCoverFile: f.frontCoverFile,
  backCoverFile: f.backCoverFile,
  branchId: f.branchId.trim() ? Number(f.branchId) : null,
  cdlEnabled: f.cdlEnabled,
  cdlConcurrentLimit: f.cdlConcurrentLimit ? Number(f.cdlConcurrentLimit) : 1,
  cdlLoanHours: f.cdlLoanHours ? Number(f.cdlLoanHours) : 24,
});

function BookRowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: BookListRow;
  onEdit: (id: number) => void;
  onDelete: (row: BookListRow) => void;
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

export default function BooksPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<BookListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<BookMetaPayload | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedBookFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(emptyFilterDraft());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<BookListRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const frontCoverInputRef = useRef<HTMLInputElement | null>(null);
  const backCoverInputRef = useRef<HTMLInputElement | null>(null);
  const [authorTypeOptions, setAuthorTypeOptions] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [authorOptions, setAuthorOptions] = useState<{ value: string; label: string }[]>([]);
  const [formAuthors, setFormAuthors] = useState<
    Array<{ authorId: string; authorTypeId: string; remarks: string }>
  >([]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activeFilterCount = countActiveFilters(appliedFilters);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getBooksMeta();
        setMeta(res.payload);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [typesRes, authorsRes] = await Promise.all([
          getLibraryAuthorTypes({ page: 1, limit: 200 }),
          getLibraryAuthors({ page: 1, limit: 1000 }),
        ]);
        setAuthorTypeOptions(
          typesRes.payload.rows.map((r) => ({
            value: String(r.id),
            label: r.name,
          })),
        );
        setAuthorOptions(
          authorsRes.payload.rows.map((r) => ({
            value: String(r.id),
            label: r.shortName ? `${r.name} (${r.shortName})` : r.name,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filterComboDocTypes = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.libraryDocumentTypes ?? []).map((o) => ({
        value: String(o.id),
        label: docTypeLabel(o.name, o.libraryArticleName),
      })),
    ],
    [meta?.libraryDocumentTypes],
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
  const filterComboSubjectGroups = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.subjectGroups ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.subjectGroups],
  );
  const filterComboSeries = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.series ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.series],
  );
  const filterComboJournals = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.journals ?? []).map((o) => ({ value: String(o.id), label: o.title })),
    ],
    [meta?.journals],
  );
  const filterComboEnclosures = useMemo(
    () => [
      { value: NONE, label: "Any" },
      ...(meta?.enclosures ?? []).map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [meta?.enclosures],
  );

  const formComboDocTypes = useMemo(
    () =>
      comboWithNone(
        (meta?.libraryDocumentTypes ?? []).map((o) => ({
          value: String(o.id),
          label: docTypeLabel(o.name, o.libraryArticleName),
        })),
        "— None —",
      ),
    [meta?.libraryDocumentTypes],
  );
  const formComboPublishers = useMemo(
    () =>
      comboWithNone(
        (meta?.publishers ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.publishers],
  );
  const formComboLanguages = useMemo(
    () =>
      comboWithNone(
        (meta?.languages ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.languages],
  );
  const formComboSubjectGroups = useMemo(
    () =>
      comboWithNone(
        (meta?.subjectGroups ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.subjectGroups],
  );
  const formComboSeries = useMemo(
    () =>
      comboWithNone(
        (meta?.series ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.series],
  );
  const formComboJournals = useMemo(
    () =>
      comboWithNone(
        (meta?.journals ?? []).map((o) => ({ value: String(o.id), label: o.title })),
        "— None —",
      ),
    [meta?.journals],
  );
  const formComboEnclosures = useMemo(
    () =>
      comboWithNone(
        (meta?.enclosures ?? []).map((o) => ({ value: String(o.id), label: o.name })),
        "— None —",
      ),
    [meta?.enclosures],
  );
  const formComboPeriods = useMemo(
    () =>
      comboWithNone(
        (meta?.periods ?? []).map((o) => ({
          value: String(o.id),
          label: o.name ?? `#${o.id}`,
        })),
        "— None —",
      ),
    [meta?.periods],
  );

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBookList({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(appliedFilters.publisherId != null ? { publisherId: appliedFilters.publisherId } : {}),
        ...(appliedFilters.languageId != null ? { languageId: appliedFilters.languageId } : {}),
        ...(appliedFilters.subjectGroupId != null
          ? { subjectGroupId: appliedFilters.subjectGroupId }
          : {}),
        ...(appliedFilters.seriesId != null ? { seriesId: appliedFilters.seriesId } : {}),
        ...(appliedFilters.libraryDocumentTypeId != null
          ? { libraryDocumentTypeId: appliedFilters.libraryDocumentTypeId }
          : {}),
        ...(appliedFilters.journalId != null ? { journalId: appliedFilters.journalId } : {}),
        ...(appliedFilters.enclosureId != null ? { enclosureId: appliedFilters.enclosureId } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, appliedFilters]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_books");

    const handleLibraryBookUpdate = (data: LibraryBookSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_book_update", handleLibraryBookUpdate);

    return () => {
      socket.off("library_book_update", handleLibraryBookUpdate);
      socket.emit("unsubscribe_library_books");
    };
  }, [socket, isConnected, fetchRows]);

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadBooksExcel({
        ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
        ...(appliedFilters.publisherId != null ? { publisherId: appliedFilters.publisherId } : {}),
        ...(appliedFilters.languageId != null ? { languageId: appliedFilters.languageId } : {}),
        ...(appliedFilters.subjectGroupId != null
          ? { subjectGroupId: appliedFilters.subjectGroupId }
          : {}),
        ...(appliedFilters.seriesId != null ? { seriesId: appliedFilters.seriesId } : {}),
        ...(appliedFilters.libraryDocumentTypeId != null
          ? { libraryDocumentTypeId: appliedFilters.libraryDocumentTypeId }
          : {}),
        ...(appliedFilters.journalId != null ? { journalId: appliedFilters.journalId } : {}),
        ...(appliedFilters.enclosureId != null ? { enclosureId: appliedFilters.enclosureId } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `library-books-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to download Excel");
    }
  };

  const openDeleteDialog = (row: BookListRow) => {
    setDeleteTarget(row);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteBook(deleteTarget.id);
      toast.success("Book deleted");
      closeDeleteDialog();
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error(
        "Delete failed. If this book has copy details, remove or reassign those copies first.",
      );
    } finally {
      setDeleteInProgress(false);
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
    setFormAuthors([]);
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const [bookRes, authorsRes] = await Promise.all([
        getBookById(id),
        getBookAuthors(id).catch(() => null),
      ]);
      setEditingId(id);
      setForm(detailToForm(bookRes.payload));
      setFormAuthors(
        (authorsRes?.payload ?? []).map((a) => ({
          authorId: String(a.authorId),
          authorTypeId: String(a.authorTypeId),
          remarks: a.remarks ?? "",
        })),
      );
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load book");
    }
  };

  const addAuthorRow = () =>
    setFormAuthors((rows) => [...rows, { authorId: "", authorTypeId: "", remarks: "" }]);

  const removeAuthorRow = (index: number) =>
    setFormAuthors((rows) => rows.filter((_, i) => i !== index));

  const updateAuthorRow = (
    index: number,
    patch: Partial<{ authorId: string; authorTypeId: string; remarks: string }>,
  ) => setFormAuthors((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const validAuthors = formAuthors.filter((a) => a.authorId && a.authorTypeId);
    if (formAuthors.length > validAuthors.length) {
      toast.error("Every author row needs an author and a type, or remove it");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      let bookId = editingId;
      if (editingId == null) {
        const res = await createBook(body);
        bookId = res.payload.id;
        toast.success("Book created");
      } else {
        await updateBook(editingId, body);
        toast.success("Book updated");
      }
      if (bookId != null) {
        await saveBookAuthors(
          bookId,
          validAuthors.map((a) => ({
            authorId: Number(a.authorId),
            authorTypeId: Number(a.authorTypeId),
            remarks: a.remarks.trim() || null,
          })),
        );
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save book");
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
                <Book className="mr-2 h-8 w-8 rounded-md border p-1" />
                Books
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Catalogue titles: bibliographic data, classification, and links to journals.
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
                Add book
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
                placeholder="Search title, ISBN, author, publisher, journal…"
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
                No books found.
              </div>
            ) : (
              <>
                <div className="max-h-[70vh] space-y-3 overflow-y-auto pb-2 xl:hidden">
                  {rows.map((row, i) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-slate-200 bg-card p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          #{(page - 1) * limit + i + 1}
                        </span>
                        <BookRowActions
                          row={row}
                          onEdit={(id) => void openEdit(id)}
                          onDelete={openDeleteDialog}
                        />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 h-10 w-8 shrink-0 overflow-hidden rounded border bg-muted/30">
                          {row.frontCover?.trim() ? (
                            <img
                              src={row.frontCover}
                              alt={`${row.title} cover`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Book className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug text-slate-900 underline underline-offset-2">
                            {row.title}
                            {row.publishedYear?.trim() ? ` (${row.publishedYear.trim()})` : ""}
                          </p>
                          {row.subTitle?.trim() ? (
                            <p className="mt-1 text-xs text-muted-foreground">{row.subTitle}</p>
                          ) : null}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{row.publisherName ?? "—"}</span>
                            <MiniBadge text={row.languageName} tone="lang" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-slate-500">ISBN</span>
                          <p className="mt-0.5 font-mono text-slate-800">{row.isbn ?? "—"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Subject group</span>
                          <p className="mt-0.5">
                            <MiniBadge text={row.subjectGroupName} tone="sg" />
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-slate-500">Period / frequency</span>
                          <p className="mt-0.5">
                            <MiniBadge text={row.periodName} tone="per" />
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-slate-500">Document type</span>
                          <p className="mt-0.5">
                            <MiniBadge
                              text={docTypeLabel(row.documentTypeName, row.libraryArticleName)}
                              tone="doc"
                            />
                          </p>
                        </div>
                        {row.journalTitle?.trim() ? (
                          <div className="col-span-2">
                            <span className="font-medium text-slate-500">Journal</span>
                            <p className="mt-0.5">
                              <MiniBadge text={row.journalTitle} tone="jr" />
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 xl:block">
                  <div className="max-h-[min(70vh,640px)] overflow-y-auto overflow-x-auto rounded-md border bg-background">
                    <Table containerClassName="min-w-[880px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 px-2">#</TableHead>
                          <TableHead className="min-w-[210px]">Title</TableHead>
                          <TableHead className="min-w-[100px]">ISBN</TableHead>
                          <TableHead className="min-w-[120px]">Subject group</TableHead>
                          <TableHead className="min-w-[120px]">Period / frequency</TableHead>
                          <TableHead className="min-w-[130px]">Doc type</TableHead>
                          <TableHead className="min-w-[130px]">Journal</TableHead>
                          <TableHead className="min-w-[72px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id}>
                            <TableCell className="px-2 text-muted-foreground">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="max-w-[320px] align-top">
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 h-12 w-9 shrink-0 overflow-hidden rounded border bg-muted/30">
                                  {row.frontCover?.trim() ? (
                                    <img
                                      src={row.frontCover}
                                      alt={`${row.title} cover`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                      <Book className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 underline underline-offset-2">
                                    {row.title}
                                    {row.publishedYear?.trim()
                                      ? ` (${row.publishedYear.trim()})`
                                      : ""}
                                  </p>
                                  {row.subTitle?.trim() ? (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {row.subTitle}
                                    </p>
                                  ) : null}
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>{row.publisherName ?? "—"}</span>
                                    <MiniBadge text={row.languageName} tone="lang" />
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top font-mono text-xs text-slate-800">
                              {row.isbn ?? "—"}
                            </TableCell>
                            <TableCell className="align-top">
                              <MiniBadge text={row.subjectGroupName} tone="sg" />
                            </TableCell>
                            <TableCell className="align-top">
                              <MiniBadge text={row.periodName} tone="per" />
                            </TableCell>
                            <TableCell className="align-top">
                              <MiniBadge
                                text={docTypeLabel(row.documentTypeName, row.libraryArticleName)}
                                tone="doc"
                              />
                            </TableCell>
                            <TableCell className="align-top">
                              <MiniBadge text={row.journalTitle} tone="jr" />
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <BookRowActions
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
            <DialogTitle>Filter books</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Narrow the list by masters. Search and Download Excel use the field above the table.
            </p>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Document type</Label>
                <Combobox
                  className="h-10"
                  placeholder="Document type"
                  value={filterDraft.libraryDocumentTypeId}
                  dataArr={filterComboDocTypes}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, libraryDocumentTypeId: v }))}
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
                <Label className="text-xs font-medium">Series</Label>
                <Combobox
                  className="h-10"
                  placeholder="Series"
                  value={filterDraft.seriesId}
                  dataArr={filterComboSeries}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, seriesId: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Journal</Label>
                <Combobox
                  className="h-10"
                  placeholder="Journal"
                  value={filterDraft.journalId}
                  dataArr={filterComboJournals}
                  onChange={(v) => setFilterDraft((d) => ({ ...d, journalId: v }))}
                />
              </div>
              <div className="space-y-1.5">
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
          </div>
          <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-between">
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
        <DialogContent className="flex h-[min(92vh,900px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              {editingId == null ? (
                <Plus className="h-4 w-4 text-emerald-600" />
              ) : (
                <Pencil className="h-4 w-4 text-sky-600" />
              )}
              <span>{editingId == null ? "Add book" : "Edit book"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-6 py-4">
            <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
              <div className="order-1 flex h-full flex-col space-y-2 lg:order-none">
                <Label className="text-xs font-medium">Front cover (optional)</Label>
                <button
                  type="button"
                  className="flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-md border bg-muted/20"
                  onClick={() => frontCoverInputRef.current?.click()}
                >
                  {form.frontCoverPreview ? (
                    <img
                      src={form.frontCoverPreview}
                      alt="Front cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Choose front cover</span>
                  )}
                </button>
                <input
                  ref={frontCoverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    const preview = file ? URL.createObjectURL(file) : form.frontCover;
                    setForm((f) => ({
                      ...f,
                      frontCoverFile: file,
                      frontCoverPreview: preview,
                    }));
                  }}
                />
              </div>

              <div className="order-3 grid min-h-0 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:order-none">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Book title"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={form.subTitle}
                    onChange={(e) => setForm((f) => ({ ...f, subTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Alternate title / author line</Label>
                  <Input
                    value={form.alternateTitle}
                    onChange={(e) => setForm((f) => ({ ...f, alternateTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Document type</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Document type"
                    value={form.libraryDocumentTypeId}
                    dataArr={formComboDocTypes}
                    onChange={(v) => setForm((f) => ({ ...f, libraryDocumentTypeId: v }))}
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
                  <Label className="text-xs font-medium">Series</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Series"
                    value={form.seriesId}
                    dataArr={formComboSeries}
                    onChange={(v) => setForm((f) => ({ ...f, seriesId: v }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Journal (periodical link)</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Journal"
                    value={form.journalId}
                    dataArr={formComboJournals}
                    onChange={(v) => setForm((f) => ({ ...f, journalId: v }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Enclosure</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Enclosure"
                    value={form.enclosureId}
                    dataArr={formComboEnclosures}
                    onChange={(v) => setForm((f) => ({ ...f, enclosureId: v }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Frequency / period</Label>
                  <Combobox
                    className="h-10"
                    placeholder="Period"
                    value={form.frequency}
                    dataArr={formComboPeriods}
                    onChange={(v) => setForm((f) => ({ ...f, frequency: v }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>ISBN</Label>
                  <Input
                    value={form.isbn}
                    onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Issue date</Label>
                  <Input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Edition</Label>
                  <Input
                    value={form.edition}
                    onChange={(e) => setForm((f) => ({ ...f, edition: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Edition year</Label>
                  <Input
                    value={form.editionYear}
                    onChange={(e) => setForm((f) => ({ ...f, editionYear: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Volume</Label>
                  <Input
                    value={form.bookVolume}
                    onChange={(e) => setForm((f) => ({ ...f, bookVolume: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Part</Label>
                  <Input
                    value={form.bookPart}
                    onChange={(e) => setForm((f) => ({ ...f, bookPart: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Published year</Label>
                  <Input
                    value={form.publishedYear}
                    onChange={(e) => setForm((f) => ({ ...f, publishedYear: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Issue number</Label>
                  <Input
                    value={form.issueNumber}
                    onChange={(e) => setForm((f) => ({ ...f, issueNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Call number</Label>
                  <Input
                    value={form.callNumber}
                    onChange={(e) => setForm((f) => ({ ...f, callNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reference number</Label>
                  <Input
                    value={form.referenceNumber}
                    onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Keywords</Label>
                  <Input
                    value={form.keywords}
                    onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Remarks</Label>
                  <Input
                    value={form.remarks}
                    onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox
                    id="unique-access"
                    checked={form.isUniqueAccess}
                    onCheckedChange={(c) => setForm((f) => ({ ...f, isUniqueAccess: c === true }))}
                  />
                  <Label htmlFor="unique-access" className="text-sm font-normal">
                    Unique access copy
                  </Label>
                </div>
              </div>

              <div className="order-2 flex h-full flex-col space-y-2 lg:order-none">
                <Label className="text-xs font-medium">Back cover (optional)</Label>
                <button
                  type="button"
                  className="flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-md border bg-muted/20"
                  onClick={() => backCoverInputRef.current?.click()}
                >
                  {form.backCoverPreview ? (
                    <img
                      src={form.backCoverPreview}
                      alt="Back cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Choose back cover</span>
                  )}
                </button>
                <input
                  ref={backCoverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    const preview = file ? URL.createObjectURL(file) : form.backCover;
                    setForm((f) => ({
                      ...f,
                      backCoverFile: file,
                      backCoverPreview: preview,
                    }));
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg border bg-muted/10 p-3 sm:p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Authors</h3>
                  <p className="text-xs text-muted-foreground">
                    Add authors, editors, translators, and other contributors for this book.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addAuthorRow}
                  disabled={authorOptions.length === 0}
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Add author
                </Button>
              </div>

              {formAuthors.length === 0 ? (
                <p className="rounded-md border border-dashed bg-background p-4 text-center text-xs text-muted-foreground">
                  No authors added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {formAuthors.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 gap-2 rounded-md border bg-background p-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">Author *</Label>
                        <Combobox
                          dataArr={authorOptions}
                          value={row.authorId}
                          onChange={(v) => updateAuthorRow(i, { authorId: v })}
                          placeholder="Select author"
                          showOptionsHint={false}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Role *</Label>
                        <Combobox
                          dataArr={authorTypeOptions}
                          value={row.authorTypeId}
                          onChange={(v) => updateAuthorRow(i, { authorTypeId: v })}
                          placeholder="Select role"
                          showOptionsHint={false}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Remarks</Label>
                        <Input
                          value={row.remarks}
                          onChange={(e) => updateAuthorRow(i, { remarks: e.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-600 hover:text-red-700 sm:self-end"
                        onClick={() => removeAuthorRow(i)}
                        aria-label="Remove author row"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Branch & Controlled Digital Lending (CDL)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scope the title to a library branch and configure CDL access if a soft-copy is
                    uploaded.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Branch ID</Label>
                  <Input
                    value={form.branchId}
                    inputMode="numeric"
                    placeholder="e.g. 1"
                    onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="cdl-enabled"
                    type="checkbox"
                    checked={form.cdlEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, cdlEnabled: e.target.checked }))}
                  />
                  <Label htmlFor="cdl-enabled">Enable CDL</Label>
                </div>
                <div>
                  <Label>Concurrent limit</Label>
                  <Input
                    value={form.cdlConcurrentLimit}
                    inputMode="numeric"
                    disabled={!form.cdlEnabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cdlConcurrentLimit: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Loan hours</Label>
                  <Input
                    value={form.cdlLoanHours}
                    inputMode="numeric"
                    disabled={!form.cdlEnabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cdlLoanHours: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
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
            <AlertDialogTitle>Delete book?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>
                  You are about to delete{" "}
                  <span className="font-medium text-foreground">
                    &quot;{deleteTarget?.title}&quot;
                  </span>
                  . This cannot be undone.
                </p>
                <p>
                  Deletion is blocked while any copy detail still references this book. If delete
                  fails, remove or reassign those copies first.
                </p>
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
              Delete book
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
