import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  BookOpenCheck,
  Download,
  Eye,
  Filter,
  IndianRupee,
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
  downloadBookCirculationExcel,
  getBookCirculationMeta,
  getBookCirculationList,
  getBookCirculationPreview,
  upsertBookCirculationRows,
} from "@/services/book-circulation.service";

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
type EditablePreviewRow = BookCirculationPreviewPayload["rows"][number] & {
  bookOptionKey: string;
  isNew: boolean;
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
    second: "2-digit",
    hour12: true,
  });
  return formatted.replace(/\b(am|pm)\b/g, (v) => v.toUpperCase());
};

const formatInr = (value: number | null | undefined) => {
  const safe = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
};

const toSentenceCase = (value: string | null) => {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function BookCirculationPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const todayIso = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<BookCirculationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    userType: "all",
    issueDate: todayIso,
    status: "all",
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>(filters);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<BookCirculationPreviewPayload | null>(null);
  const [editableRows, setEditableRows] = useState<EditablePreviewRow[]>([]);
  const [bookOptions, setBookOptions] = useState<
    Array<{
      copyDetailsId: number;
      accessNumber: string | null;
      title: string | null;
      author: string | null;
      publication: string | null;
      frontCover: string | null;
    }>
  >([]);
  const [borrowingTypeOptions, setBorrowingTypeOptions] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [savingRows, setSavingRows] = useState(false);
  const lastLocalSaveAtRef = useRef<number>(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const userTypeOptions = useMemo(() => userTypeEnum.enumValues, []);
  const getStudentAvatarUrl = (uid: string) =>
    `${import.meta.env.VITE_STUDENT_IMAGE_BASE_URL ?? "https://besc.academic360.app/id-card-generate/api/images?crop=true&uid="}${uid}`;
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
  const previewAffiliation =
    previewUser?.affiliationShortName?.trim() || previewUser?.affiliation || "-";
  const previewRegulation =
    previewUser?.regulationTypeShortName?.trim() || previewUser?.regulationType || "-";

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
      });
      setRows(response.payload.rows);
      setTotal(response.payload.total);
    } catch (error) {
      toast.error("Failed to fetch book circulation records");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters]);

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

  const addDraftRow = () => {
    setEditableRows((prev) => [
      ...prev,
      {
        id: Date.now() * -1,
        copyDetailsId: 0,
        borrowingTypeId: null,
        accessNumber: null,
        title: null,
        author: null,
        publication: null,
        frontCover: null,
        borrowingType: null,
        status: "ISSUED",
        bookOptionKey: "",
        issuedTimestamp: new Date().toISOString(),
        returnTimestamp: getDefaultReturnDate().toISOString(),
        actualReturnTimestamp: null,
        fine: 0,
        fineWaiver: 0,
        netFine: 0,
        latestReissueReturnTimestamp: null,
        isNew: true,
      },
    ]);
  };

  const hasInvalidRows = editableRows.some(
    (row) => !row.copyDetailsId || !row.borrowingTypeId || !row.returnTimestamp,
  );

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
    const defaults: Filters = { userType: "all", issueDate: todayIso, status: "all" };
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

  const saveRows = async () => {
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
      }));

    try {
      setSavingRows(true);
      lastLocalSaveAtRef.current = Date.now();
      await upsertBookCirculationRows(previewData.user.userId, payloadRows);
      toast.success("Book circulation saved successfully.");
      setDetailsOpen(false);
      setPreviewData(null);
      setEditableRows([]);
      void fetchRows();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save circulation rows.");
    } finally {
      setSavingRows(false);
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <BookOpenCheck className="mr-2 h-6 w-6 border rounded-md p-1 border-slate-400" />
            Book Circulation
          </CardTitle>
          <p className="text-[14px] sm:text-sm text-muted-foreground">
            Track issued and returned books with due dates and fines.
          </p>
        </CardHeader>

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
              <Table
                className="border rounded-md w-full text-[14px]"
                style={{ tableLayout: "fixed" }}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-100 w-[4%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      #
                    </TableHead>
                    <TableHead className="bg-slate-100 w-[26%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      User
                    </TableHead>
                    <TableHead className="bg-slate-100 w-[12%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      User Type
                    </TableHead>
                    <TableHead className="bg-slate-100 w-[24%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      Recent Books Summary
                    </TableHead>
                    <TableHead className="bg-slate-100 w-[9%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      No. of Days Late
                    </TableHead>
                    <TableHead className="bg-slate-100 w-[9%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      Fine
                    </TableHead>
                    <TableHead className="bg-slate-100 w-[13%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      Last Updated
                    </TableHead>
                    <TableHead className="bg-slate-100 w-[7%] px-1 sm:px-3 text-[14px] sm:text-xs">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-[14px]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <div className="inline-flex items-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading circulation data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-slate-500">
                        No circulation records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={row.userId} className={getRowHighlightClass(row)}>
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
                        <TableCell className="px-1 sm:px-3 py-2">{row.fine.toFixed(2)}</TableCell>
                        <TableCell className="px-1 sm:px-3 py-2 text-[13px]">
                          {formatDateTime(row.lastUpdatedAt)}
                        </TableCell>
                        <TableCell className="px-1 sm:px-3 py-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => void openDetails(row.userId)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
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
        <DialogContent className="w-[94vw] max-w-none h-[94vh] max-h-none flex flex-col text-[14px]">
          <DialogHeader className="pr-4">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-sm">Manage Book Circulation</DialogTitle>
              {previewUser && (
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      (previewUser.userType && userTypeClassMap[previewUser.userType]) ||
                      "bg-slate-100 text-slate-700"
                    } border border-slate-300`}
                  >
                    {toSentenceCase(previewUser.userType || "USER")}
                  </Badge>
                  <Badge
                    className={
                      previewUser.isActive === false
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-green-100 text-green-700 border border-green-300"
                    }
                  >
                    {previewUser.isActive === false ? "Inactive" : "Active"}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>
          {previewLoading || !previewUser || !previewData ? (
            <div className="flex h-56 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading details...
            </div>
          ) : (
            <div className="space-y-4 flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="rounded-md bg-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-[12%_29%_33%_26%]">
                  <div className="border border-slate-200 bg-blue-50">
                    <div
                      className="h-full w-full rounded-sm bg-cover bg-center"
                      style={{
                        backgroundImage: `url("${
                          previewUser.userType === "STUDENT" && previewUser.uid
                            ? getStudentAvatarUrl(previewUser.uid)
                            : previewUser.image || ""
                        }")`,
                        backgroundSize: "cover",
                        objectFit: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                    >
                      {!(
                        (previewUser.userType === "STUDENT" && previewUser.uid) ||
                        previewUser.image
                      ) && (
                        <div
                          className={`flex h-full w-full items-center justify-center text-4xl font-semibold text-white ${getColorFromName(previewUser.name)}`}
                        >
                          {getInitials(previewUser.name)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border border-slate-200 bg-emerald-50">
                    <p className="mb-2 border-b border-slate-200 p-2 pb-1 text-[14px] font-semibold uppercase tracking-wide text-slate-500">
                      User Info
                    </p>
                    <div className="space-y-1 p-2 text-[14px]">
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">Name:</span>
                        {previewUser.name || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">UID:</span>
                        {previewUser.uid || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">RFID:</span>
                        {previewUser.rfid || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">
                          Roll Number:
                        </span>
                        {previewUser.rollNumber || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">
                          Registration:
                        </span>
                        {previewUser.registrationNumber || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="border border-slate-200 bg-amber-50 p-2">
                    <p className="mb-2 border-b border-slate-200 pb-1 text-[14px] font-semibold uppercase tracking-wide text-slate-500">
                      {previewUser.userType === "STAFF" ? "Staff Details" : "Batch Details"}
                    </p>
                    <div className="space-y-1 text-[14px]">
                      {previewUser.userType === "STAFF" ? (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Shift:
                            </span>
                            {previewUser.shift || "-"}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Attendance Code:
                            </span>
                            {previewUser.attendanceCode || "-"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Program Course:
                            </span>
                            {previewBatchProgram}{" "}
                            <span className="text-slate-500">
                              ({previewAffiliation}, {previewRegulation})
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Class/Semester:
                            </span>
                            {toSentenceCase(previewUser.classOrSemester)}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Shift:
                            </span>
                            {previewUser.shift || "-"}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Section:
                            </span>
                            {previewUser.section || "-"}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Class Roll No.:
                            </span>
                            {previewUser.classRollNumber || "-"}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="border border-slate-200 bg-violet-50 p-2">
                    <p className="mb-2 border-b border-slate-200 pb-1 text-[14px] font-semibold uppercase tracking-wide text-slate-500">
                      Contact Details
                    </p>
                    <div className="space-y-1 text-[14px]">
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">Email:</span>
                        {previewUser.email || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">Phone:</span>
                        {previewUser.phone || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">WhatsApp:</span>
                        {previewUser.whatsapp || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="default"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  size="sm"
                  onClick={addDraftRow}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-md border">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="sticky top-0 z-30 w-10 bg-slate-100">#</TableHead>
                      <TableHead className="sticky top-0 z-30 w-[24%] bg-slate-100">Book</TableHead>
                      <TableHead className="sticky top-0 z-30 w-[9%] bg-slate-100">
                        Access No.
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 w-[12%] bg-slate-100">
                        Author
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 w-[13%] bg-slate-100">
                        Borrowing Type
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 w-[11%] bg-slate-100">
                        Issued At
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 w-[10%] bg-slate-100">
                        Return Date
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 w-[10%] bg-slate-100">
                        Returned On
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 w-[5%] bg-slate-100">Fine</TableHead>
                      <TableHead className="sticky top-0 z-30 w-[12%] bg-slate-100">
                        <span className="inline-flex items-center gap-1">
                          <Settings2 className="h-3.5 w-3.5" />
                          Actions
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center text-xs text-slate-500 border-b border-slate-200"
                        >
                          No circulation records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      editableRows.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`[&>td]:border-b [&>td]:border-slate-200 last:[&>td]:border-b last:[&>td]:border-slate-300 ${item.actualReturnTimestamp ? "bg-green-100" : ""}`}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Combobox
                              className="h-8 w-full text-xs"
                              placeholder={item.title || "Select book"}
                              value={item.bookOptionKey}
                              showOptionsHint={false}
                              dataArr={bookOptions.map((option) => ({
                                value: String(option.copyDetailsId),
                                label: `${option.title || "-"} (${option.accessNumber || "-"})`,
                                imageUrl: option.frontCover ?? undefined,
                              }))}
                              contentClassName="w-[460px] max-w-[calc(100vw-2rem)]"
                              onChange={(value) => {
                                const picked = bookOptions.find(
                                  (option) => String(option.copyDetailsId) === value,
                                );
                                if (!picked) return;
                                setEditableRows((prev) =>
                                  prev.map((row) =>
                                    row.id === item.id
                                      ? {
                                          ...row,
                                          bookOptionKey: value,
                                          copyDetailsId: picked.copyDetailsId,
                                          title: picked.title,
                                          accessNumber: picked.accessNumber,
                                          author: picked.author,
                                          publication: picked.publication,
                                          frontCover: picked.frontCover,
                                        }
                                      : row,
                                  ),
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium text-slate-700">
                              {item.accessNumber || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-700">
                                {item.author || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Combobox
                              className="h-9 w-full bg-white text-sm font-medium text-slate-800"
                              placeholder="Borrowing Type"
                              value={item.borrowingType || ""}
                              showOptionsHint={false}
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
                                            borrowingTypeOptions.find((opt) => opt.name === value)
                                              ?.id ?? null,
                                        }
                                      : row,
                                  ),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{formatDateTime(item.issuedTimestamp)}</span>
                          </TableCell>
                          <TableCell>
                            <DatePicker
                              value={
                                item.returnTimestamp ? new Date(item.returnTimestamp) : undefined
                              }
                              disabled={!item.isNew && !!item.actualReturnTimestamp}
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
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">
                              {item.actualReturnTimestamp
                                ? formatDateTime(item.actualReturnTimestamp)
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell>{formatInr(item.netFine)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Button
                                size="sm"
                                className="h-8 bg-violet-600 px-2 text-xs text-white hover:bg-violet-700"
                                variant="default"
                                disabled={!item.isNew && !!item.actualReturnTimestamp}
                                onClick={() => {
                                  setEditableRows((prev) =>
                                    prev.map((row) =>
                                      row.id === item.id
                                        ? {
                                            ...row,
                                            actualReturnTimestamp: row.actualReturnTimestamp
                                              ? null
                                              : new Date().toISOString(),
                                          }
                                        : row,
                                    ),
                                  );
                                }}
                              >
                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                Return
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-amber-300 bg-amber-50 px-2 text-xs text-amber-700 hover:bg-amber-100"
                                type="button"
                                disabled={!item.isNew && !!item.actualReturnTimestamp}
                              >
                                <IndianRupee className="mr-1 h-3.5 w-3.5" />
                                Fine
                              </Button>
                              {item.isNew ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() =>
                                    setEditableRows((prev) =>
                                      prev.filter((row) => row.id !== item.id),
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="sticky bottom-0 z-20 mt-auto flex items-center justify-end gap-2 border-t bg-white pt-2">
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
                  disabled={savingRows || hasInvalidRows || editableRows.length === 0}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
