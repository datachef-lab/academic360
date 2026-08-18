import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { studentAvatarUrl } from "@/utils/studentAvatarUrl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpenCheck,
  CalendarClock,
  Download,
  Filter,
  // IndianRupee, // used by the hidden Pay Fine button
  Info,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { userTypeEnum } from "@repo/db/schemas/enums";
import { toast } from "sonner";
import { getColorFromName } from "@/utils/avatar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import {
  BookCirculationPreviewPayload,
  BookCirculationRow,
  BookCirculationStatus,
  BookOption,
  downloadBookCirculationExcel,
  getBookCirculationMeta,
  getBookCirculationList,
  getBookCirculationPolicy,
  getBookCirculationPreview,
  searchBookCirculationBookOptions,
  upsertBookCirculationRows,
} from "@/services/book-circulation.service";
import {
  // initiateLibraryFinePayment, // used by the hidden Pay Fine button
  // openPaytmCheckoutForFine, // used by the hidden Pay Fine button
  recordLibraryFineCashPayment,
  waiveLibraryFine,
} from "@/services/library-fine-payment.service";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { useActiveLibraryBranchId } from "@/features/library/use-library-branch";

type Filters = {
  userType: "all" | (typeof userTypeEnum.enumValues)[number];
  issueDate: string;
  status: "all" | BookCirculationStatus;
};

type FilterDraft = Filters;

type LibraryBookCirculationSocketUpdate = {
  id: string;
  type: "library_book_circulation_update";
  action: "UPSERTED";
  actorUserId: number | null;
  actorName: string;
  userId: number;
  message: string;
  updatedAt: string;
};

const LOCAL_SAVE_SOCKET_SUPPRESS_MS = 30_000;
type StagedRowPolicy = {
  loanDays: number;
  finePerDay: number;
  graceDays: number;
  renewalLimit: number;
  maxCopiesAtOnce: number;
};

type EditablePreviewRow = BookCirculationPreviewPayload["rows"][number] & {
  bookOptionKey: string;
  isNew: boolean;
  policy?: StagedRowPolicy | null;
};

const prettyLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  const formatted = parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return formatted.replace(/\b(am|pm)\b/g, (v) => v.toUpperCase());
};

const formatInr = (value: number | null | undefined) => {
  const safe = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
};

const formatDateOnly = (value: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const formatTimeOnly = (value: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
    .replace(/\b(am|pm)\b/g, (v) => v.toUpperCase());
};

const ROMAN_NUMERAL_RE = /^(?=[MDCLXVI])M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

const toSentenceCase = (value: string | null) => {
  if (!value) return "-";
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase();
      if (ROMAN_NUMERAL_RE.test(upper)) return upper;
      const lower = part.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

export default function BookCirculationPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });
  const [activeBranchId] = useActiveLibraryBranchId();

  const [rows, setRows] = useState<BookCirculationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    userType: "all",
    issueDate: "",
    status: "all",
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(filters);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<BookCirculationPreviewPayload | null>(null);
  const [editableRows, setEditableRows] = useState<EditablePreviewRow[]>([]);
  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [borrowingTypeOptions, setBorrowingTypeOptions] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [savingRows, setSavingRows] = useState(false);
  const [reissueRowId, setReissueRowId] = useState<number | null>(null);
  const [reissueDate, setReissueDate] = useState<Date | undefined>(undefined);
  const [stagedBookKey, setStagedBookKey] = useState<string>("");
  const [stagedBookLabel, setStagedBookLabel] = useState<string>("");
  // Full option captured at selection time. `pickerOptions` is cleared whenever
  // the search input empties (popover reopen), so Add must NOT re-look the key
  // up there — that made the Add button silently no-op for any copy outside
  // the 500-row meta seed list.
  const [stagedBookOption, setStagedBookOption] = useState<BookOption | null>(null);
  // Policy for the SELECTED copy, fetched at selection time so the copy-cap
  // check can block Add (with a visible reason) BEFORE staging, instead of
  // only warning after.
  const [stagedPolicyInfo, setStagedPolicyInfo] = useState<StagedRowPolicy | null>(null);
  const [stagedPolicyLoading, setStagedPolicyLoading] = useState(false);
  const stagedPolicyReqRef = useRef(0);
  // "Why can't this copy be issued" info dialog (on-loan selections).
  const [onLoanInfoOpen, setOnLoanInfoOpen] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<BookOption[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [addingStagedBook, setAddingStagedBook] = useState(false);
  const [activeDialogTab, setActiveDialogTab] = useState<"issue" | "history">("issue");
  const [forceIssuePrompt, setForceIssuePrompt] = useState<string | null>(null);
  const [cashRow, setCashRow] = useState<EditablePreviewRow | null>(null);
  const [cashRemarks, setCashRemarks] = useState("");
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [waiveRow, setWaiveRow] = useState<EditablePreviewRow | null>(null);
  const [waiveAmount, setWaiveAmount] = useState("");
  const [waiveRemarks, setWaiveRemarks] = useState("");
  const [waiveSubmitting, setWaiveSubmitting] = useState(false);
  const lastLocalSaveAtRef = useRef<number>(0);
  const pickerRequestIdRef = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const userTypeOptions = useMemo(() => userTypeEnum.enumValues, []);
  const pickerBookItems = useMemo(
    () =>
      pickerOptions.map((option) => ({
        value: String(option.copyDetailsId),
        label: `${option.accessNumber || "-"} — ${option.title || "-"}`,
        badge: option.onLoan
          ? { label: "ON LOAN", className: "border-red-200 bg-red-50 text-red-600" }
          : undefined,
      })),
    [pickerOptions],
  );

  const handlePickerSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      pickerRequestIdRef.current++;
      setPickerOptions([]);
      setPickerLoading(false);
      return;
    }
    const requestId = ++pickerRequestIdRef.current;
    setPickerLoading(true);
    try {
      const response = await searchBookCirculationBookOptions(trimmed, 50);
      if (requestId !== pickerRequestIdRef.current) return;
      setPickerOptions(response.payload ?? []);
    } catch (error) {
      if (requestId !== pickerRequestIdRef.current) return;
      console.error("Book options search failed", error);
      setPickerOptions([]);
    } finally {
      if (requestId === pickerRequestIdRef.current) setPickerLoading(false);
    }
  }, []);
  // Unified backend resolver (S3 → besc → hrclIRP → previous-uid chain) —
  // the old direct id-card-generate URL 404s now.
  const getStudentAvatarUrl = (uid: string) => studentAvatarUrl(uid) ?? "";
  const getEntryRowAvatarUrl = (row: BookCirculationRow) => {
    if (row.userType === "STUDENT" && row.studentUid) {
      return getStudentAvatarUrl(row.studentUid);
    }
    return row.image || undefined;
  };
  const getRowHighlightClass = (row: BookCirculationRow) => {
    if (row.recentBooks.overdue > 0) return "bg-red-50";
    if (row.fine > 0) return "bg-amber-50";
    return "";
  };
  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  const userTypeClassMap: Record<string, string> = {
    ADMIN: "bg-violet-100 text-violet-700",
    STUDENT: "bg-blue-100 text-blue-700",
    FACULTY: "bg-emerald-100 text-emerald-700",
    STAFF: "bg-amber-100 text-amber-700",
    PARENTS: "bg-pink-100 text-pink-700",
  };
  const previewUser = previewData?.user;
  const previewBatchProgram =
    previewUser?.programCourseShortName?.trim() || previewUser?.programCourse || "-";

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBookCirculationList({
        page,
        limit,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(filters.userType !== "all" ? { userType: filters.userType } : {}),
        ...(filters.status !== "all" ? { status: filters.status } : {}),
        ...(filters.issueDate ? { issueDate: filters.issueDate } : {}),
        ...(activeBranchId != null ? { branchId: activeBranchId } : {}),
      });
      setRows(response.payload.rows);
      setTotal(response.payload.total);
    } catch (error) {
      toast.error("Failed to fetch book circulation records");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters, activeBranchId]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await getBookCirculationMeta();
        setBookOptions(response.payload.bookOptions);
        setBorrowingTypeOptions(response.payload.borrowingTypeOptions);
      } catch (error) {
        console.error(error);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_book_circulation");
    const handleUpdate = (data: LibraryBookCirculationSocketUpdate) => {
      const currentUserId = Number(user?.id);
      if (
        !Number.isNaN(currentUserId) &&
        data.actorUserId != null &&
        Number(data.actorUserId) === currentUserId
      ) {
        return;
      }
      if (savingRows) return;
      if (Date.now() - lastLocalSaveAtRef.current < LOCAL_SAVE_SOCKET_SUPPRESS_MS) return;
      toast.info(data.message);
      void fetchRows();
    };
    socket.on("library_book_circulation_update", handleUpdate);

    return () => {
      socket.off("library_book_circulation_update", handleUpdate);
      socket.emit("unsubscribe_library_book_circulation");
    };
  }, [socket, isConnected, fetchRows, user?.id, savingRows]);

  const openDetails = useCallback(async (userId: number) => {
    try {
      setPreviewLoading(true);
      const response = await getBookCirculationPreview(userId);
      setPreviewData(response.payload);
      setEditableRows(
        response.payload.rows.map((item) => ({
          ...item,
          bookOptionKey: String(item.copyDetailsId),
          isNew: false,
        })),
      );
      setActiveDialogTab("issue");
      setStagedBookKey("");
      setStagedBookLabel("");
      setStagedBookOption(null);
      setStagedPolicyInfo(null);
      setPickerOptions([]);
      setPickerLoading(false);
      setDetailsOpen(true);
    } catch (error) {
      toast.error("Failed to load preview");
      console.error(error);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const getDefaultReturnDate = () => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return due;
  };

  const addStagedBook = async () => {
    if (!stagedBookKey || !previewData?.user?.userId) return;
    const picked =
      stagedBookOption ??
      pickerOptions.find((o) => String(o.copyDetailsId) === stagedBookKey) ??
      bookOptions.find((o) => String(o.copyDetailsId) === stagedBookKey);
    if (!picked) {
      toast.error("Pick a book from the search list first.");
      return;
    }
    if (picked.onLoan) {
      toast.error(
        `Copy ${picked.accessNumber || ""} is on loan to ${picked.borrowerName || "another patron"} — it must be returned before it can be issued again.`,
      );
      return;
    }
    if (stagedPolicyInfo && stagedPolicyInfo.maxCopiesAtOnce > 0) {
      const openCount = editableRows.filter((r) => !r.isNew && !r.actualReturnTimestamp).length;
      const staged = editableRows.filter((r) => r.isNew).length;
      if (openCount + staged + 1 > stagedPolicyInfo.maxCopiesAtOnce) {
        toast.error(
          `Copy cap reached — the patron holds ${openCount} open + ${staged} staged; policy allows ${stagedPolicyInfo.maxCopiesAtOnce} at once.`,
        );
        return;
      }
    }
    let returnDate = getDefaultReturnDate().toISOString();
    let stagedPolicy: StagedRowPolicy | null = null;
    try {
      setAddingStagedBook(true);
      const policy = await getBookCirculationPolicy(previewData.user.userId, picked.copyDetailsId);
      if (policy.payload?.dueDate) {
        returnDate = policy.payload.dueDate;
      }
      if (policy.payload) {
        stagedPolicy = {
          loanDays: policy.payload.loanDays,
          finePerDay: policy.payload.finePerDay,
          graceDays: policy.payload.graceDays,
          renewalLimit: policy.payload.renewalLimit,
          maxCopiesAtOnce: policy.payload.maxCopiesAtOnce,
        };
      }
    } catch (error) {
      console.error("policy lookup failed; falling back to default return date", error);
    } finally {
      setAddingStagedBook(false);
    }
    // Desk default: issues are HOME ISSUE unless staff changes it.
    const defaultBorrowing =
      borrowingTypeOptions.find((option) => option.name.trim().toUpperCase() === "HOME ISSUE") ??
      null;
    setEditableRows((prev) => [
      ...prev,
      {
        id: Date.now() * -1,
        copyDetailsId: picked.copyDetailsId,
        borrowingTypeId: defaultBorrowing?.id ?? null,
        accessNumber: picked.accessNumber,
        oldAccessNumber: picked.oldAccessNumber ?? null,
        itemCategoryName: picked.itemCategoryName ?? null,
        title: picked.title,
        author: picked.author,
        publication: picked.publication,
        frontCover: picked.frontCover,
        borrowingType: defaultBorrowing?.name ?? null,
        status: "ISSUED",
        bookOptionKey: stagedBookKey,
        issuedTimestamp: new Date().toISOString(),
        returnTimestamp: returnDate,
        actualReturnTimestamp: null,
        fine: 0,
        fineWaiver: 0,
        netFine: 0,
        finePaid: false,
        latestReissueReturnTimestamp: null,
        reissuesUsed: 0,
        renewalLimit: stagedPolicy?.renewalLimit ?? 0,
        loanDays: stagedPolicy?.loanDays ?? 7,
        finePerDay: stagedPolicy?.finePerDay ?? 0,
        maxCopiesAtOnce: stagedPolicy?.maxCopiesAtOnce ?? 0,
        isNew: true,
        policy: stagedPolicy,
      },
    ]);
    setStagedBookKey("");
    setStagedBookLabel("");
    setStagedBookOption(null);
    setStagedPolicyInfo(null);
  };

  const hasInvalidStagedRows = editableRows.some(
    (row) => row.isNew && (!row.copyDetailsId || !row.returnTimestamp),
  );
  const hasSavable = editableRows.length > 0;
  // Open loans the patron already holds + books being staged now — used to
  // warn when a save would exceed the policy's copies-at-once cap (the server
  // rejects it; staff can then confirm a forced issue).
  const openLoanCount = editableRows.filter((r) => !r.isNew && !r.actualReturnTimestamp).length;
  const stagedCount = editableRows.filter((r) => r.isNew).length;

  // Borrower stat tiles in the dialog rail (saved rows only, staged excluded).
  const borrowerStats = useMemo(() => {
    const saved = editableRows.filter((r) => !r.isNew);
    const now = Date.now();
    const open = saved.filter((r) => !r.actualReturnTimestamp);
    return {
      total: saved.length,
      issued: open.length,
      reissued: open.filter((r) => r.reissuesUsed > 0).length,
      returned: saved.length - open.length,
      overdue: open.filter((r) => {
        const due = new Date(r.returnTimestamp).getTime();
        return !Number.isNaN(due) && due < now;
      }).length,
    };
  }, [editableRows]);

  // Why the Add button is blocked for the CURRENT selection (null = addable).
  // On-loan copies are searchable by design but can never be staged; the copy
  // cap blocks before staging (policy fetched at selection time).
  const capExceeded =
    !!stagedPolicyInfo &&
    stagedPolicyInfo.maxCopiesAtOnce > 0 &&
    openLoanCount + stagedCount + 1 > stagedPolicyInfo.maxCopiesAtOnce;
  const addBlockedReason = !stagedBookOption
    ? null
    : stagedBookOption.onLoan
      ? `On loan to ${stagedBookOption.borrowerName || "another patron"}${
          stagedBookOption.borrowerDueDate
            ? ` (due ${formatDateOnly(stagedBookOption.borrowerDueDate)})`
            : ""
        } — must be returned before it can be issued again.`
      : capExceeded
        ? `Copy cap reached — patron holds ${openLoanCount} open + ${stagedCount} staged; policy allows ${stagedPolicyInfo!.maxCopiesAtOnce} at once.`
        : null;

  const formatDateChip = (isoDate: string) => {
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString("en-GB");
  };

  const activeFilterBadges = [
    ...(filters.userType !== "all"
      ? [{ key: "userType" as const, label: `User: ${prettyLabel(filters.userType)}` }]
      : []),
    ...(filters.status !== "all"
      ? [{ key: "status" as const, label: `State: ${prettyLabel(filters.status)}` }]
      : []),
    ...(filters.issueDate
      ? [{ key: "issueDate" as const, label: `Date: ${formatDateChip(filters.issueDate)}` }]
      : []),
  ];

  const dismissFilter = (key: "userType" | "status" | "issueDate") => {
    setFilters((prev) => ({
      ...prev,
      ...(key === "userType" ? { userType: "all" } : {}),
      ...(key === "status" ? { status: "all" } : {}),
      ...(key === "issueDate" ? { issueDate: "" } : {}),
    }));
    setPage(1);
  };

  const openFilterDialog = () => {
    setFilterDraft(filters);
    setFilterDialogOpen(true);
  };

  const applyFilters = () => {
    setFilters(filterDraft);
    setPage(1);
    setFilterDialogOpen(false);
  };

  const resetFilters = () => {
    const defaults: Filters = { userType: "all", issueDate: "", status: "all" };
    setFilterDraft(defaults);
    setFilters(defaults);
    setPage(1);
    setFilterDialogOpen(false);
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadBookCirculationExcel({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(filters.userType !== "all" ? { userType: filters.userType } : {}),
        ...(filters.status !== "all" ? { status: filters.status } : {}),
        ...(filters.issueDate ? { issueDate: filters.issueDate } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `book-circulation-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download excel");
    }
  };

  // Rejections the backend allows staff to override with a forced issue
  // (availability, copy cap, non-circulating policy, renewal limit). The
  // catalog-level "Not to be issued" block is deliberately not forceable.
  const isForceableRejection = (message: string) =>
    /forced issue|already issued|non-circulating|Copy limit reached|Renewal limit reached/i.test(
      message,
    );

  const saveRows = async (forceIssue = false) => {
    if (!previewData?.user?.userId) return;

    const payloadRows = editableRows
      .filter((row) => !!row.copyDetailsId)
      .map((row) => ({
        id: row.id > 0 ? row.id : null,
        copyDetailsId: row.copyDetailsId,
        borrowingTypeId: row.borrowingTypeId ?? null,
        issueTimestamp: row.issuedTimestamp,
        returnTimestamp: row.returnTimestamp,
        actualReturnTimestamp: row.actualReturnTimestamp,
        ...(forceIssue ? { isForcedIssue: true } : {}),
      }));

    try {
      setSavingRows(true);
      lastLocalSaveAtRef.current = Date.now();
      await upsertBookCirculationRows(previewData.user.userId, payloadRows);
      setForceIssuePrompt(null);
      toast.success("Book circulation saved successfully.");
      setDetailsOpen(false);
      setPreviewData(null);
      setEditableRows([]);
      void fetchRows();
    } catch (error) {
      console.error(error);
      const serverMessage = (error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      if (serverMessage && !forceIssue && isForceableRejection(serverMessage)) {
        setForceIssuePrompt(serverMessage);
      } else {
        toast.error(serverMessage ?? "Failed to save circulation rows.");
      }
    } finally {
      setSavingRows(false);
    }
  };

  const renderRowsTable = (
    rowsToShow: EditablePreviewRow[],
    emptyLabel: string,
    variant: "issue" | "history",
  ) => {
    const showReturnedOn = variant === "history";
    const colCount = 8 + (showReturnedOn ? 1 : 0);
    const headBase = cn(
      STICKY_TH_BASE,
      "sticky top-0 z-30 bg-slate-100 text-center border-r border-slate-300",
    );
    const headLeft = cn(
      STICKY_TH_LEFT,
      "sticky top-0 z-30 w-10 bg-slate-100 text-center border-r border-slate-300",
    );
    const headRight = cn(
      STICKY_TH_RIGHT,
      "sticky top-0 z-30 bg-slate-100 text-center border-l border-slate-300",
    );
    const cellBase = "border-r border-slate-300 px-2 py-2 text-center";
    return (
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-md border">
        {/* overflow-visible: the outer div above is the scroll container, so the
            sticky header must not be trapped inside the Table's own
            overflow-auto wrapper (sticky anchors to the nearest scrolling
            ancestor — with the default wrapper the header scrolls away). */}
        <Table className="w-full table-fixed" containerClassName="overflow-visible">
          <TableHeader className={STICKY_THEAD_CLASS}>
            <TableRow className="bg-slate-100">
              <TableHead className={headLeft}>#</TableHead>
              <TableHead className={cn(headBase, "w-[9%]")}>Access No.</TableHead>
              <TableHead className={cn(headBase, "w-[24%]")}>Book</TableHead>
              <TableHead className={cn(headBase, "w-[12%]")}>Publisher</TableHead>
              <TableHead className={cn(headBase, "w-[13%]")}>Borrowing Type</TableHead>
              <TableHead className={cn(headBase, "w-[11%]")}>Issued At</TableHead>
              <TableHead className={cn(headBase, "w-[10%]")}>Return Date</TableHead>
              {showReturnedOn ? (
                <TableHead className={cn(headBase, "w-[10%]")}>Returned On</TableHead>
              ) : null}
              {/* Icon-only actions: fixed px width so the two icons can never
                  wrap onto a second row at any dialog width. */}
              <TableHead className={cn(headRight, "w-24")}>
                <span className="inline-flex items-center justify-center gap-1">
                  <Settings2 className="h-3.5 w-3.5" />
                  Actions
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsToShow.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="text-center text-xs text-slate-500 border-b border-slate-200"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              rowsToShow.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={`[&>td]:border-b [&>td]:border-slate-200 last:[&>td]:border-b last:[&>td]:border-slate-300 ${item.actualReturnTimestamp ? "bg-green-100" : ""}`}
                >
                  {/* Serial counts down: newest row (top) shows the total. */}
                  <TableCell className={cellBase}>{rowsToShow.length - index}.</TableCell>
                  <TableCell className={cellBase}>
                    <Badge className="border border-indigo-300 bg-indigo-100 px-1.5 py-0 text-[10px] font-semibold text-indigo-800 hover:bg-indigo-100">
                      {item.accessNumber || "—"}
                    </Badge>
                    {item.oldAccessNumber ? (
                      <p className="mt-0.5 text-[10px] text-slate-400 line-through">
                        {item.oldAccessNumber}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-left")}>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {item.title || "—"}
                      </p>
                      {item.author ? (
                        <p className="truncate text-[11px] italic text-slate-500">
                          — {item.author}
                        </p>
                      ) : null}
                      {item.itemCategoryName ? (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          <Badge className="border border-amber-300 bg-amber-100 px-1.5 py-0 text-[10px] font-semibold text-amber-800 hover:bg-amber-100">
                            {item.itemCategoryName}
                          </Badge>
                        </div>
                      ) : null}
                      {item.isNew && item.policy ? (
                        <>
                          <p className="truncate text-[11px] text-blue-700">
                            Policy: {item.policy.loanDays}d loan · {item.policy.renewalLimit}{" "}
                            {item.policy.renewalLimit === 1 ? "renewal" : "renewals"} ·{" "}
                            {item.policy.finePerDay > 0
                              ? `₹${item.policy.finePerDay}/day${item.policy.graceDays > 0 ? ` after ${item.policy.graceDays}d grace` : ""}`
                              : "no fine set"}
                          </p>
                          {item.policy.maxCopiesAtOnce > 0 &&
                          openLoanCount + stagedCount > item.policy.maxCopiesAtOnce ? (
                            <p className="truncate text-[11px] font-medium text-amber-700">
                              Copy cap exceeded ({openLoanCount} open + {stagedCount} new &gt;{" "}
                              {item.policy.maxCopiesAtOnce}) — save will need a forced issue
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className={cn(cellBase, "text-left")}>
                    {item.publication ? (
                      <Badge className="whitespace-normal break-words border border-fuchsia-300 bg-fuchsia-100 px-1.5 py-0 text-left text-[10px] font-semibold text-fuchsia-800 hover:bg-fuchsia-100">
                        {item.publication}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cellBase}>
                    {item.actualReturnTimestamp ? (
                      // Returned rows are settled — borrowing type is read-only.
                      <span className="text-xs font-medium text-slate-700">
                        {item.borrowingType ? prettyLabel(item.borrowingType) : "—"}
                      </span>
                    ) : (
                      <Combobox
                        className="h-8 w-full bg-white text-xs font-medium text-slate-800"
                        placeholder="Borrowing Type"
                        value={item.borrowingType || ""}
                        showOptionsHint={false}
                        contentClassName="w-[280px] max-w-[calc(100vw-2rem)]"
                        dataArr={borrowingTypeOptions.map((option) => ({
                          value: option.name,
                          label: prettyLabel(option.name),
                        }))}
                        onChange={(value) =>
                          setEditableRows((prev) =>
                            prev.map((row) =>
                              row.id === item.id
                                ? {
                                    ...row,
                                    borrowingType: value,
                                    borrowingTypeId:
                                      borrowingTypeOptions.find((opt) => opt.name === value)?.id ??
                                      null,
                                  }
                                : row,
                            ),
                          )
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell className={cellBase}>
                    {/* Time is stored but not displayed. */}
                    <span className="text-xs">{formatDateOnly(item.issuedTimestamp)}</span>
                  </TableCell>
                  <TableCell className={cellBase}>
                    {item.isNew ? (
                      <DatePicker
                        value={item.returnTimestamp ? new Date(item.returnTimestamp) : undefined}
                        onSelect={(date) =>
                          setEditableRows((prev) =>
                            prev.map((row) =>
                              row.id === item.id
                                ? {
                                    ...row,
                                    returnTimestamp: date
                                      ? date.toISOString()
                                      : row.returnTimestamp,
                                  }
                                : row,
                            ),
                          )
                        }
                        className="h-8 text-xs"
                        displayFormat="dd/MM/yyyy"
                      />
                    ) : (
                      <span className="text-xs">{formatDateOnly(item.returnTimestamp)}</span>
                    )}
                  </TableCell>
                  {showReturnedOn ? (
                    <TableCell className={cellBase}>
                      {item.actualReturnTimestamp ? (
                        <>
                          <p className="text-xs">{formatDateOnly(item.actualReturnTimestamp)}</p>
                          <p className="text-[10px] text-slate-500">
                            {formatTimeOnly(item.actualReturnTimestamp)}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell className={cellBase}>
                    <div className="flex flex-nowrap items-center justify-center gap-1.5">
                      {variant === "history" && item.actualReturnTimestamp ? (
                        // Returned rows are done — no actions to offer.
                        <span className="text-xs text-slate-400">—</span>
                      ) : variant === "history" ? (
                        <>
                          {/* Icon-only actions keep the column narrow; the
                              tooltip carries the label + context. */}
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  className="h-7 w-7 bg-violet-600 text-white hover:bg-violet-700"
                                  variant="default"
                                  type="button"
                                  aria-label="Return"
                                  onClick={() => {
                                    setEditableRows((prev) =>
                                      prev.map((row) =>
                                        row.id === item.id
                                          ? {
                                              ...row,
                                              actualReturnTimestamp: new Date().toISOString(),
                                            }
                                          : row,
                                      ),
                                    );
                                  }}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Return</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              {/* span wrapper: disabled buttons swallow pointer
                                  events, the limit-reached reason must still show. */}
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    type="button"
                                    aria-label="Re-issue"
                                    disabled={item.reissuesUsed >= item.renewalLimit}
                                    onClick={() => {
                                      setReissueRowId(item.id);
                                      // Policy-driven default: the new due date is
                                      // loanDays from today (same as the RE-ISSUE
                                      // action semantics); staff can still override.
                                      const due = new Date();
                                      due.setDate(due.getDate() + Math.max(1, item.loanDays));
                                      setReissueDate(due);
                                    }}
                                  >
                                    <CalendarClock className="h-3.5 w-3.5" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {item.reissuesUsed >= item.renewalLimit
                                  ? `Renewal limit reached (${item.reissuesUsed}/${item.renewalLimit})`
                                  : `Re-issue · renewals used ${item.reissuesUsed}/${item.renewalLimit}`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {/* Fine actions hidden for now (2026-08-17, per Harsh) — restore by
                              uncommenting; the Cash/Waive dialogs + services below stay wired.
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-amber-300 bg-amber-50 px-2 text-xs text-amber-700 hover:bg-amber-100"
                            type="button"
                            disabled={
                              item.netFine <= 0 || item.finePaid || !previewData?.user?.userId
                            }
                            onClick={async () => {
                              if (!previewData?.user?.userId) return;
                              try {
                                const res = await initiateLibraryFinePayment(
                                  item.id,
                                  previewData.user.userId,
                                );
                                if (!res.payload) return;
                                if (res.payload.txnToken) {
                                  const opened = await openPaytmCheckoutForFine(
                                    res.payload.orderId,
                                    res.payload.txnToken,
                                  );
                                  if (opened) {
                                    toast.success(
                                      `Paytm checkout opened for ${formatInr(res.payload.amount)}.`,
                                    );
                                    return;
                                  }
                                }
                                await navigator.clipboard
                                  ?.writeText(res.payload.orderId)
                                  .catch(() => undefined);
                                toast.success(
                                  `Payment initiated: order ${res.payload.orderId} · ${formatInr(res.payload.amount)} (order id copied${res.payload.gatewayError ? `; online checkout unavailable: ${res.payload.gatewayError}` : ""}).`,
                                );
                              } catch (e) {
                                const msg =
                                  (e as { response?: { data?: { message?: string } } })?.response
                                    ?.data?.message ?? "Failed to initiate fine payment.";
                                toast.error(msg);
                              }
                            }}
                          >
                            <IndianRupee className="mr-1 h-3.5 w-3.5" />
                            Pay Fine
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-emerald-300 bg-emerald-50 px-2 text-xs text-emerald-700 hover:bg-emerald-100"
                            type="button"
                            disabled={item.netFine <= 0 || item.finePaid}
                            onClick={() => {
                              setCashRow(item);
                              setCashRemarks("");
                            }}
                          >
                            Cash
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 hover:bg-slate-100"
                            type="button"
                            disabled={item.fine <= 0 || item.finePaid}
                            onClick={() => {
                              setWaiveRow(item);
                              setWaiveAmount(String(item.netFine > 0 ? item.netFine : item.fine));
                              setWaiveRemarks("");
                            }}
                          >
                            Waive
                          </Button>
                          */}
                        </>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() =>
                            setEditableRows((prev) => prev.filter((row) => row.id !== item.id))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={BookOpenCheck}
        title="Book Circulation"
        subtitle="Track issued and returned books with due dates and fines."
      />
      <Card className="min-w-0 border-none">
        <CardContent className="px-0">
          <div className="mb-0 border-b bg-background p-2 sm:p-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="pl-9"
                  placeholder="Search by user/UID/access no./book title..."
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1"
                onClick={openFilterDialog}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1"
                onClick={() => void handleDownloadExcel()}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            {activeFilterBadges.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilterBadges.map((item) => (
                  <Badge
                    key={item.key}
                    variant="outline"
                    className="inline-flex items-center gap-1 rounded-md border-violet-300 bg-violet-50 px-2 py-1 text-xs text-violet-800"
                  >
                    {item.label}
                    <button
                      type="button"
                      className="rounded-sm px-1 text-violet-700 hover:bg-violet-100"
                      onClick={() => dismissFilter(item.key)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="h-full overflow-y-auto overflow-x-hidden">
              {/* overflow-visible: the div above is the scroll container — the
                  Table's default overflow-auto wrapper would trap the sticky
                  header so it scrolled away with the rows. */}
              <Table
                className="border rounded-md w-full text-[14px]"
                style={{ tableLayout: "fixed" }}
                containerClassName="overflow-visible"
              >
                <TableHeader className={STICKY_THEAD_CLASS}>
                  <TableRow>
                    <TableHead
                      className={cn(
                        STICKY_TH_LEFT,
                        "bg-slate-100 w-[4%] px-1 sm:px-3 text-[14px] sm:text-xs",
                      )}
                    >
                      #
                    </TableHead>
                    <TableHead
                      className={cn(
                        STICKY_TH_BASE,
                        "bg-slate-100 w-[26%] px-1 sm:px-3 text-[14px] sm:text-xs",
                      )}
                    >
                      User
                    </TableHead>
                    <TableHead
                      className={cn(
                        STICKY_TH_BASE,
                        "bg-slate-100 w-[12%] px-1 sm:px-3 text-[14px] sm:text-xs",
                      )}
                    >
                      User Type
                    </TableHead>
                    <TableHead
                      className={cn(
                        STICKY_TH_BASE,
                        "bg-slate-100 w-[24%] px-1 sm:px-3 text-[14px] sm:text-xs",
                      )}
                    >
                      Recent Books Summary
                    </TableHead>
                    <TableHead
                      className={cn(
                        STICKY_TH_BASE,
                        "bg-slate-100 w-[13%] px-1 sm:px-3 text-[14px] sm:text-xs",
                      )}
                    >
                      No. of Days Late
                    </TableHead>
                    <TableHead
                      className={cn(
                        STICKY_TH_RIGHT,
                        "bg-slate-100 w-[18%] px-1 sm:px-3 text-[14px] sm:text-xs",
                      )}
                    >
                      Last Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-[14px]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="inline-flex items-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading circulation data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                        No circulation records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow
                        key={row.userId}
                        className={cn(
                          getRowHighlightClass(row),
                          "cursor-pointer hover:bg-slate-50",
                        )}
                        onClick={() => void openDetails(row.userId)}
                      >
                        <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                        <TableCell className="align-top px-1 sm:px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0 max-w-full">
                            <Avatar className="h-7 w-7 sm:h-9 sm:w-9 rounded-md">
                              <AvatarImage
                                src={getEntryRowAvatarUrl(row)}
                                alt={row.userName || "User"}
                              />
                              <AvatarFallback
                                className={`text-white ${getColorFromName(row.userName)}`}
                              >
                                {(row.userName || "U")
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((part) => part.charAt(0).toUpperCase())
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 max-w-full">
                              <p className="truncate text-[14px] font-medium">
                                {row.userName || "-"}
                              </p>
                              <p className="truncate text-[14px] text-slate-500">
                                {row.studentUid || row.staffUid || row.attendanceCode || "-"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-1 sm:px-3 py-2">
                          <Badge
                            className={`${userTypeClassMap[row.userType || ""] || "bg-slate-100 text-slate-700"} border border-slate-300`}
                          >
                            {toSentenceCase(row.userType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 sm:px-3 py-2 text-[13px] sm:text-[14px] leading-5">
                          <div className="font-medium text-sky-700">
                            Issued: {row.recentBooks.issued}
                          </div>
                          <div className="font-medium text-red-700">
                            Overdue: {row.recentBooks.overdue}
                          </div>
                          <div className="font-medium text-green-700">
                            Returned: {row.recentBooks.returned}
                          </div>
                        </TableCell>
                        <TableCell className="px-1 sm:px-3 py-2">{row.daysLate}</TableCell>
                        <TableCell className="px-1 sm:px-3 py-2 text-[13px]">
                          {formatDateTime(row.lastUpdatedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                className="rounded border px-3 py-1 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filter book circulation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">User Type</Label>
              <Select
                value={filterDraft.userType}
                onValueChange={(value) =>
                  setFilterDraft((prev) => ({ ...prev, userType: value as Filters["userType"] }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {userTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {prettyLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                className="h-9"
                type="date"
                value={filterDraft.issueDate}
                onChange={(e) => setFilterDraft((prev) => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">State</Label>
              <Select
                value={filterDraft.status}
                onValueChange={(value) =>
                  setFilterDraft((prev) => ({ ...prev, status: value as FilterDraft["status"] }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="REISSUED">Reissued</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button type="button" onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {/* [&>button]:hidden hides the built-in top-right close X. */}
        <DialogContent className="w-[94vw] max-w-none h-[94vh] max-h-none flex flex-col text-[13px] [&>button]:hidden">
          {/* No visible dialog header — the rail + right section own the full
              height; the title stays for screen readers only. */}
          <DialogTitle className="sr-only">Manage Book Circulation</DialogTitle>
          {previewLoading || !previewUser || !previewData ? (
            <div className="flex h-56 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading details...
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
              {/* xl+: borrower rail on the left, tabs + table on the right;
                  below xl the rail collapses back into a top banner so the
                  table never runs out of width on smaller screens. */}
              <div className="flex flex-1 min-h-0 flex-col gap-3 xl:flex-row">
                <div className="flex flex-col overflow-hidden rounded-md border bg-slate-50 xl:w-64 xl:flex-shrink-0 xl:self-stretch">
                  {/* xl+: the borrower photo is a full-width cover on the rail. */}
                  <Avatar className="hidden h-36 w-full flex-shrink-0 rounded-none border-b xl:flex">
                    <AvatarImage
                      src={
                        previewUser.userType === "STUDENT" && previewUser.uid
                          ? getStudentAvatarUrl(previewUser.uid)
                          : previewUser.image || undefined
                      }
                      alt={previewUser.name}
                      className="h-full w-full rounded-none object-cover object-top"
                    />
                    <AvatarFallback
                      className={`rounded-none text-3xl font-semibold text-white ${getColorFromName(previewUser.name)}`}
                    >
                      {getInitials(previewUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* No rail scrolling — the compact cover keeps everything
                      visible at once. */}
                  <div className="flex min-h-0 flex-1 flex-wrap items-start gap-4 p-3 xl:flex-nowrap xl:flex-col xl:items-stretch">
                    {/* Below xl the photo stays a compact banner avatar. */}
                    <Avatar className="h-24 w-24 flex-shrink-0 rounded-md border xl:hidden">
                      <AvatarImage
                        src={
                          previewUser.userType === "STUDENT" && previewUser.uid
                            ? getStudentAvatarUrl(previewUser.uid)
                            : previewUser.image || undefined
                        }
                        alt={previewUser.name}
                        className="rounded-md object-cover"
                      />
                      <AvatarFallback
                        className={`rounded-md text-2xl font-semibold text-white ${getColorFromName(previewUser.name)}`}
                      >
                        {getInitials(previewUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-1 text-[13px] md:grid-cols-2 lg:grid-cols-3 xl:w-full xl:flex-none xl:grid-cols-1 xl:gap-y-2">
                      <div className="flex gap-1.5">
                        <span className="flex w-[80px] flex-shrink-0 justify-between text-slate-500">
                          Name<span>:</span>
                        </span>
                        <span className="min-w-0 font-medium">
                          {previewUser.name || "-"}
                          {/* Red asterisk marks an active account (badges removed). */}
                          {previewUser.isActive !== false ? (
                            <span className="ml-0.5 align-super text-red-600" title="Active">
                              *
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="flex w-[80px] flex-shrink-0 justify-between text-slate-500">
                          UID<span>:</span>
                        </span>
                        <span className="min-w-0 font-medium">{previewUser.uid || "-"}</span>
                      </div>
                      {/* Academic fields only make sense for students. */}
                      {previewUser.userType === "STUDENT" ? (
                        <>
                          <div className="flex gap-1.5">
                            <span className="flex w-[80px] flex-shrink-0 justify-between text-slate-500">
                              Course<span>:</span>
                            </span>
                            <span className="min-w-0 font-medium">{previewBatchProgram}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="flex w-[80px] flex-shrink-0 justify-between text-slate-500">
                              Semester<span>:</span>
                            </span>
                            <span className="min-w-0 font-medium">
                              {toSentenceCase(previewUser.classOrSemester)}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="flex w-[80px] flex-shrink-0 justify-between text-slate-500">
                              Section<span>:</span>
                            </span>
                            <span className="min-w-0 font-medium">
                              {previewUser.section || "-"}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* Circulation stats — label above count. Full row below
                        the banner (<xl); 2×2 in the rail column (xl+). */}
                    <div className="grid w-full auto-rows-fr grid-cols-4 gap-2 xl:grid-cols-2">
                      <div className="rounded-md border border-indigo-200 bg-indigo-50 p-2 flex flex-col justify-between">
                        <p className="text-[11px] font-medium text-indigo-600">Total books</p>
                        <p className="mt-0.5 text-lg font-semibold leading-tight text-indigo-700">
                          {borrowerStats.total}
                        </p>
                      </div>
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-2 flex flex-col justify-between">
                        <p className="text-[11px] font-medium text-blue-600">Issued</p>
                        <p className="mt-0.5 text-lg font-semibold leading-tight text-blue-700">
                          {borrowerStats.issued}
                        </p>
                      </div>
                      <div className="rounded-md border border-green-200 bg-green-50 p-2 flex flex-col justify-between">
                        <p className="text-[11px] font-medium text-green-600">Returned</p>
                        <p className="mt-0.5 text-lg font-semibold leading-tight text-green-700">
                          {borrowerStats.returned}
                        </p>
                      </div>
                      <div className="rounded-md border border-red-200 bg-red-50 p-2 flex flex-col justify-between">
                        <p className="text-[11px] font-medium text-red-600">Overdue</p>
                        <p className="mt-0.5 text-lg font-semibold leading-tight text-red-700">
                          {borrowerStats.overdue}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right section: tabs header, table content, footer — the
                    footer lives HERE so the borrower rail spans full height. */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <Tabs
                    value={activeDialogTab}
                    onValueChange={(value) => setActiveDialogTab(value as "issue" | "history")}
                    className="flex flex-1 min-h-0 min-w-0 flex-col"
                  >
                    <div className="flex items-end justify-between gap-3">
                      <TabsList>
                        <TabsTrigger value="issue">Issue</TabsTrigger>
                        <TabsTrigger value="history">Reissue / Return</TabsTrigger>
                      </TabsList>
                      {activeDialogTab === "issue" ? (
                        <div className="flex flex-1 items-center justify-end gap-2">
                          <div className="flex-1 min-w-0 max-w-2xl">
                            <Combobox
                              className="h-9 w-full text-sm"
                              placeholder="Search book by access no..."
                              value={stagedBookKey}
                              showOptionsHint={false}
                              dataArr={pickerBookItems}
                              contentClassName="w-[640px] max-w-[calc(100vw-2rem)]"
                              onSearch={(term) => void handlePickerSearch(term)}
                              isSearching={pickerLoading}
                              selectedLabel={stagedBookLabel}
                              selectedBadge={
                                stagedBookOption?.onLoan
                                  ? {
                                      label: "ON LOAN",
                                      className: "border-red-200 bg-red-50 text-red-600",
                                    }
                                  : null
                              }
                              onChange={(value) => {
                                setStagedBookKey(value);
                                const picked = pickerOptions.find(
                                  (o) => String(o.copyDetailsId) === value,
                                );
                                // Keep the full option — pickerOptions gets cleared
                                // when the search input empties, so Add relies on
                                // this captured copy instead.
                                setStagedBookOption(picked ?? null);
                                setStagedBookLabel(
                                  picked
                                    ? `${picked.accessNumber || "-"} — ${picked.title || "-"}`
                                    : "",
                                );
                                // Fetch the policy now so the copy-cap check can
                                // block Add (with reason) before staging.
                                setStagedPolicyInfo(null);
                                const reqId = ++stagedPolicyReqRef.current;
                                if (picked && !picked.onLoan && previewData?.user?.userId) {
                                  setStagedPolicyLoading(true);
                                  getBookCirculationPolicy(
                                    previewData.user.userId,
                                    picked.copyDetailsId,
                                  )
                                    .then((res) => {
                                      if (reqId !== stagedPolicyReqRef.current) return;
                                      setStagedPolicyInfo(
                                        res.payload
                                          ? {
                                              loanDays: res.payload.loanDays,
                                              finePerDay: res.payload.finePerDay,
                                              graceDays: res.payload.graceDays,
                                              renewalLimit: res.payload.renewalLimit,
                                              maxCopiesAtOnce: res.payload.maxCopiesAtOnce,
                                            }
                                          : null,
                                      );
                                    })
                                    .catch(() => {
                                      if (reqId !== stagedPolicyReqRef.current) return;
                                      setStagedPolicyInfo(null);
                                    })
                                    .finally(() => {
                                      if (reqId === stagedPolicyReqRef.current)
                                        setStagedPolicyLoading(false);
                                    });
                                } else {
                                  setStagedPolicyLoading(false);
                                }
                              }}
                            />
                          </div>
                          {stagedBookOption?.onLoan ? (
                            // Unavailable copy: Add is replaced by an info trigger
                            // explaining WHY it cannot be issued.
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                              onClick={() => setOnLoanInfoOpen(true)}
                            >
                              <Info className="mr-1 h-4 w-4" />
                              Not available
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              size="sm"
                              disabled={
                                !stagedBookKey ||
                                addingStagedBook ||
                                stagedPolicyLoading ||
                                !!addBlockedReason
                              }
                              title={addBlockedReason ?? undefined}
                              onClick={() => void addStagedBook()}
                            >
                              {addingStagedBook || stagedPolicyLoading ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="mr-1 h-4 w-4" />
                              )}
                              Add
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </div>
                    {/* Reason the Add button is blocked (cap reached etc.) — the
                    on-loan case gets the info dialog instead. */}
                    {activeDialogTab === "issue" &&
                    addBlockedReason &&
                    !stagedBookOption?.onLoan ? (
                      <p className="mt-1 text-right text-[11px] font-medium text-red-600">
                        {addBlockedReason}
                      </p>
                    ) : null}
                    <TabsContent
                      value="issue"
                      className="mt-2 flex flex-1 min-h-0 flex-col gap-2 data-[state=inactive]:hidden"
                      forceMount
                    >
                      {renderRowsTable(
                        editableRows.filter((row) => row.isNew),
                        "No books staged. Pick a book above and click Add.",
                        "issue",
                      )}
                    </TabsContent>
                    <TabsContent
                      value="history"
                      className="mt-2 flex flex-1 min-h-0 flex-col data-[state=inactive]:hidden"
                      forceMount
                    >
                      {renderRowsTable(
                        editableRows.filter((row) => !row.isNew),
                        "No issued or returned books.",
                        "history",
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="mt-2 flex items-center justify-end gap-2 bg-white pt-1">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailsOpen(false);
                        setPreviewData(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      disabled={savingRows || hasInvalidStagedRows || !hasSavable}
                      onClick={() => void saveRows()}
                    >
                      {savingRows ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-1 h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={reissueRowId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReissueRowId(null);
            setReissueDate(undefined);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Re-issue Book</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">Select a new return date for this book.</p>
            <DatePicker
              value={reissueDate}
              onSelect={(date) => setReissueDate(date ?? undefined)}
              className="w-full"
              displayFormat="dd/MM/yyyy"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReissueRowId(null);
                  setReissueDate(undefined);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={!reissueDate}
                onClick={() => {
                  if (!reissueDate || reissueRowId === null) return;
                  setEditableRows((prev) =>
                    prev.map((row) =>
                      row.id === reissueRowId
                        ? { ...row, returnTimestamp: reissueDate.toISOString() }
                        : row,
                    ),
                  );
                  setReissueRowId(null);
                  setReissueDate(undefined);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={forceIssuePrompt !== null}
        onOpenChange={(open) => {
          if (!open) setForceIssuePrompt(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Policy check failed</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-slate-700">{forceIssuePrompt}</p>
            <p className="text-sm text-muted-foreground">
              Save again as a <span className="font-semibold">forced issue</span>? This bypasses the
              availability, copy-limit and renewal-limit checks and is recorded on the circulation
              record.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setForceIssuePrompt(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={savingRows}
                onClick={() => void saveRows(true)}
              >
                {savingRows ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Force issue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Why-can't-this-be-issued info (on-loan selection in the issue picker) */}
      <Dialog open={onLoanInfoOpen} onOpenChange={setOnLoanInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copy not available for issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-800">{stagedBookOption?.title || "—"}</p>
            <div className="flex flex-wrap items-center gap-1">
              <Badge className="border border-violet-200 bg-violet-100 px-1.5 py-0 text-[10px] font-semibold text-violet-700 hover:bg-violet-100">
                {stagedBookOption?.accessNumber || "—"}
              </Badge>
              {stagedBookOption?.itemCategoryName ? (
                <Badge className="border border-emerald-200 bg-emerald-100 px-1.5 py-0 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100">
                  {stagedBookOption.itemCategoryName}
                </Badge>
              ) : null}
            </div>
            <p className="text-slate-600">
              This copy is currently <span className="font-semibold text-red-600">on loan</span>
              {stagedBookOption?.borrowerName ? (
                <>
                  {" "}
                  to <span className="font-semibold">{stagedBookOption.borrowerName}</span>
                </>
              ) : null}
              {stagedBookOption?.borrowerDueDate ? (
                <> — due back on {formatDateOnly(stagedBookOption.borrowerDueDate)}</>
              ) : null}
              . It must be returned before it can be issued to another patron.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setOnLoanInfoOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cashRow !== null}
        onOpenChange={(open) => {
          if (!open) setCashRow(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Collect fine in cash</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-slate-700">
              Record a cash payment of{" "}
              <span className="font-semibold">{formatInr(cashRow?.netFine ?? 0)}</span> for{" "}
              {cashRow?.title || "this book"} ({cashRow?.accessNumber || "—"}).
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cash-remarks">Remarks (optional)</Label>
              <Input
                id="cash-remarks"
                value={cashRemarks}
                onChange={(e) => setCashRemarks(e.target.value)}
                placeholder="e.g. receipt number"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCashRow(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={cashSubmitting || !cashRow}
                onClick={async () => {
                  if (!cashRow) return;
                  try {
                    setCashSubmitting(true);
                    const res = await recordLibraryFineCashPayment(cashRow.id, cashRemarks);
                    toast.success(
                      `Cash payment of ${formatInr(res.payload?.amount ?? cashRow.netFine)} recorded.`,
                    );
                    setCashRow(null);
                    if (previewData?.user?.userId) void openDetails(previewData.user.userId);
                  } catch (e) {
                    const msg =
                      (e as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message ?? "Failed to record cash payment.";
                    toast.error(msg);
                  } finally {
                    setCashSubmitting(false);
                  }
                }}
              >
                {cashSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Record payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={waiveRow !== null}
        onOpenChange={(open) => {
          if (!open) setWaiveRow(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Waive fine</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-slate-700">
              Fine of <span className="font-semibold">{formatInr(waiveRow?.fine ?? 0)}</span> on{" "}
              {waiveRow?.title || "this book"} ({waiveRow?.accessNumber || "—"}).
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="waive-amount">Waiver amount</Label>
              <Input
                id="waive-amount"
                type="number"
                min={0}
                max={waiveRow?.fine ?? undefined}
                value={waiveAmount}
                onChange={(e) => setWaiveAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="waive-remarks">Reason (optional)</Label>
              <Input
                id="waive-remarks"
                value={waiveRemarks}
                onChange={(e) => setWaiveRemarks(e.target.value)}
                placeholder="Why is this fine being waived?"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setWaiveRow(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-slate-700 text-white hover:bg-slate-800"
                disabled={waiveSubmitting || !waiveRow || !waiveAmount}
                onClick={async () => {
                  if (!waiveRow) return;
                  const amount = Number(waiveAmount);
                  if (Number.isNaN(amount) || amount < 0) {
                    toast.error("Enter a valid waiver amount.");
                    return;
                  }
                  try {
                    setWaiveSubmitting(true);
                    await waiveLibraryFine(waiveRow.id, amount, waiveRemarks);
                    toast.success(`Fine waiver of ${formatInr(amount)} recorded.`);
                    setWaiveRow(null);
                    if (previewData?.user?.userId) void openDetails(previewData.user.userId);
                  } catch (e) {
                    const msg =
                      (e as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message ?? "Failed to waive fine.";
                    toast.error(msg);
                  } finally {
                    setWaiveSubmitting(false);
                  }
                }}
              >
                {waiveSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Waive
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
