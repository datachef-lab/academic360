import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { getColorFromName } from "@/utils/avatar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import { searchLibraryUsers } from "@/services/library-entry-exit.service";
import {
  BookCirculationPreviewPayload,
  getBookCirculationMeta,
  getBookCirculationPreview,
  upsertBookCirculationRows,
} from "@/services/book-circulation.service";

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

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB");
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

const userTypeClassMap: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 border-violet-200",
  STUDENT: "bg-blue-100 text-blue-700 border-blue-200",
  FACULTY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  STAFF: "bg-amber-100 text-amber-700 border-amber-200",
  PARENTS: "bg-pink-100 text-pink-700 border-pink-200",
};

type DetailColumn = { label: string; value: string; mono?: boolean };

function DetailTable({ columns }: { columns: DetailColumn[] }) {
  if (columns.length === 0) return null;
  return (
    <div className="overflow-hidden overflow-x-auto rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-100 hover:bg-slate-100">
            {columns.map((col) => (
              <TableHead
                key={col.label}
                className="whitespace-nowrap text-center text-xs font-semibold text-slate-600"
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-white">
            {columns.map((col) => (
              <TableCell
                key={col.label}
                className={`min-w-[100px] px-4 py-3 text-center text-sm font-semibold text-slate-900 ${col.mono ? "font-mono" : ""}`}
                title={col.value}
              >
                <span className="inline-block max-w-[220px] break-words">{col.value}</span>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default function BookCirculationPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [candidateSearchLoading, setCandidateSearchLoading] = useState(false);
  const [noCandidateFound, setNoCandidateFound] = useState(false);
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [reissuingRowIds, setReissuingRowIds] = useState<Set<number>>(new Set());
  const [confirmReturnRowId, setConfirmReturnRowId] = useState<number | null>(null);
  const lastLocalSaveAtRef = useRef<number>(0);
  const loadedUserIdRef = useRef<number | null>(null);

  const getStudentAvatarUrl = (uid: string) =>
    `${import.meta.env.VITE_STUDENT_IMAGE_BASE_URL ?? "https://besc.academic360.app/id-card-generate/api/images?crop=true&uid="}${uid}`;
  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");

  const previewUser = previewData?.user;
  const isSearchCompact = searchTriggered;
  const previewBatchProgram =
    previewUser?.programCourseShortName?.trim() || previewUser?.programCourse || "-";

  const loadUserByUserId = useCallback(
    async (targetUserId: number, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      try {
        if (!silent) setPreviewLoading(true);
        setNoCandidateFound(false);
        const response = await getBookCirculationPreview(targetUserId);
        setPreviewData(response.payload);
        setReissuingRowIds(new Set());
        loadedUserIdRef.current = targetUserId;
        setEditableRows(
          response.payload.rows.map((item) => ({
            ...item,
            bookOptionKey: String(item.copyDetailsId),
            isNew: false,
          })),
        );
        setHasUnsavedChanges(false);
      } catch (error) {
        toast.error("Failed to load user details");
        console.error(error);
        if (!silent) {
          setPreviewData(null);
          setEditableRows([]);
          setHasUnsavedChanges(false);
          loadedUserIdRef.current = null;
        }
      } finally {
        if (!silent) setPreviewLoading(false);
      }
    },
    [],
  );

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
      if (loadedUserIdRef.current != null) {
        void loadUserByUserId(loadedUserIdRef.current, { silent: true });
      }
    };
    socket.on("library_book_circulation_update", handleUpdate);

    return () => {
      socket.off("library_book_circulation_update", handleUpdate);
      socket.emit("unsubscribe_library_book_circulation");
    };
  }, [socket, isConnected, loadUserByUserId, user?.id, savingRows]);

  const handleCandidateSearch = async () => {
    const term = candidateSearchTerm.trim();
    if (!term) {
      toast.error("Please enter a search term");
      return;
    }

    try {
      setCandidateSearchLoading(true);
      setSearchTriggered(true);
      setNoCandidateFound(false);
      const usersRes = await searchLibraryUsers(term, 1, 5);
      if (usersRes.payload.rows.length === 0) {
        setPreviewData(null);
        setEditableRows([]);
        setHasUnsavedChanges(false);
        loadedUserIdRef.current = null;
        setNoCandidateFound(true);
        return;
      }

      const match = usersRes.payload.rows[0];
      if (!match) return;
      await loadUserByUserId(match.userId);
    } catch (error) {
      toast.error("Failed to search user");
      console.error(error);
    } finally {
      setCandidateSearchLoading(false);
    }
  };

  const getDefaultReturnDate = () => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return due;
  };

  const markUnsavedChanges = () => setHasUnsavedChanges(true);

  const addDraftRow = () => {
    markUnsavedChanges();
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
      await loadUserByUserId(previewData.user.userId, { silent: true });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save circulation rows.");
    } finally {
      setSavingRows(false);
    }
  };

  const updateRow = (id: number, patch: Partial<EditablePreviewRow>) => {
    markUnsavedChanges();
    setEditableRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const fineHandler = (id: number) => {
    markUnsavedChanges();
    setEditableRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const fineWaiver = row.fineWaiver + 1;
        return {
          ...row,
          fineWaiver,
          netFine: Math.max(0, row.fine - fineWaiver),
        };
      }),
    );
  };

  const toggleReturn = (id: number) => {
    markUnsavedChanges();
    setEditableRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              actualReturnTimestamp: row.actualReturnTimestamp ? null : new Date().toISOString(),
            }
          : row,
      ),
    );
  };

  const getPreviewAvatarUrl = () => {
    if (!previewUser) return undefined;
    if (previewUser.userType === "STUDENT" && previewUser.uid) {
      return getStudentAvatarUrl(previewUser.uid);
    }
    return previewUser.image || undefined;
  };

  const issuedCount = editableRows.filter((r) => !r.actualReturnTimestamp).length;
  const returnedCount = editableRows.filter((r) => r.actualReturnTimestamp).length;

  const renderUserDetails = () => {
    if (!previewUser || !previewData) return null;

    const isStaff = previewUser.userType === "STAFF";
    const isInactive = previewUser.isActive === false;

    const academicColumns: DetailColumn[] = isStaff
      ? [
          { label: "UID", value: previewUser.uid ?? "—", mono: true },
          { label: "Shift", value: previewUser.shift ?? "—" },
          { label: "Attendance Code", value: previewUser.attendanceCode ?? "—", mono: true },
          { label: "RFID No.", value: previewUser.rfid ?? "N/A", mono: true },
        ]
      : [
          { label: "UID", value: previewUser.uid ?? "—", mono: true },
          { label: "Program Course", value: previewBatchProgram },
          { label: "Shift", value: previewUser.shift ?? "—" },
          { label: "Semester", value: toSentenceCase(previewUser.classOrSemester) },
          { label: "RFID No.", value: previewUser.rfid ?? "N/A", mono: true },
          { label: "Section", value: previewUser.section ?? "—" },
          { label: "Class Roll No.", value: previewUser.classRollNumber ?? "—" },
          // { label: "Registration", value: previewUser.registrationNumber ?? "—" },
        ];

    // const contactColumns: DetailColumn[] = [
    //   { label: "Email", value: previewUser.email ?? "—" },
    //   { label: "Phone", value: previewUser.phone ?? "—", mono: true },
    //   { label: "WhatsApp", value: previewUser.whatsapp ?? "—", mono: true },
    // ];

    const totalFine = editableRows.reduce((sum, r) => sum + (r.netFine ?? 0), 0);

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0 border-2 border-purple-300 shadow-md">
              <AvatarImage
                src={getPreviewAvatarUrl()}
                alt={previewUser.name}
                className="object-cover"
              />
              <AvatarFallback
                className={`text-lg font-bold text-white ${getColorFromName(previewUser.name)}`}
              >
                {getInitials(previewUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    isInactive
                      ? "border-red-200 bg-red-100 text-red-800"
                      : "border-emerald-200 bg-emerald-100 text-emerald-800"
                  }
                >
                  {isInactive ? "Inactive" : "Active"}
                </Badge>
                <Badge
                  className={
                    userTypeClassMap[previewUser.userType] ??
                    "border-slate-200 bg-slate-100 text-slate-700"
                  }
                >
                  {toSentenceCase(previewUser.userType || "USER")}
                </Badge>
              </div>
              <h3 className="truncate text-xl font-bold uppercase tracking-wide text-slate-900 sm:text-2xl">
                {previewUser.name}
              </h3>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              onClick={addDraftRow}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
            <Button
              className="bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              disabled={
                !hasUnsavedChanges || savingRows || hasInvalidRows || editableRows.length === 0
              }
              onClick={() => void saveRows()}
            >
              {savingRows ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-blue-800">{editableRows.length}</p>
            <p className="text-[11px] font-medium text-blue-600">Total Books</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-amber-800">{issuedCount}</p>
            <p className="text-[11px] font-medium text-amber-600">Issued</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-emerald-800">{returnedCount}</p>
            <p className="text-[11px] font-medium text-emerald-600">Returned</p>
          </div>
          <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-violet-800">{formatInr(totalFine)}</p>
            <p className="text-[11px] font-medium text-violet-600">Total Fine</p>
          </div>
        </div>

        <DetailTable columns={academicColumns} />

        {/* Contact details (Email, Phone, WhatsApp) — hidden for now
        <div className="overflow-hidden overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 hover:bg-slate-100">
                {contactColumns.map((col) => (
                  <TableHead
                    key={col.label}
                    className="whitespace-nowrap text-center text-xs font-semibold text-slate-600"
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      {col.label === "Email" ? <Mail className="h-3 w-3" /> : null}
                      {col.label}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-white">
                {contactColumns.map((col) => (
                  <TableCell
                    key={col.label}
                    className={`px-4 py-3 text-center text-sm font-semibold text-slate-900 ${col.mono ? "font-mono" : ""}`}
                  >
                    <span
                      className={`inline-block max-w-xs ${col.label === "Email" ? "break-all" : ""}`}
                      title={col.value}
                    >
                      {col.value}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        */}

        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Issued Books</span>
              <Badge variant="secondary" className="text-xs">
                {editableRows.length}
              </Badge>
            </div>
            <span className="text-xs text-slate-500">Scroll horizontally on smaller screens</span>
          </div>

          {editableRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">No books issued yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Click &quot;Add Book&quot; to issue a book to this user.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1280px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-10 text-center text-xs font-semibold">#</TableHead>
                    <TableHead className="min-w-[220px] text-xs font-semibold">Book</TableHead>
                    <TableHead className="min-w-[90px] text-xs font-semibold">Access No.</TableHead>
                    <TableHead className="min-w-[120px] text-xs font-semibold">Author</TableHead>
                    <TableHead className="min-w-[150px] text-xs font-semibold">
                      Borrowing Type
                    </TableHead>
                    <TableHead className="min-w-[100px] text-xs font-semibold">Issued On</TableHead>
                    <TableHead className="min-w-[168px] text-xs font-semibold">
                      Return Due
                    </TableHead>
                    <TableHead className="min-w-[100px] text-xs font-semibold">
                      Returned On
                    </TableHead>
                    <TableHead className="min-w-[70px] text-center text-xs font-semibold">
                      Fine
                    </TableHead>
                    <TableHead className="min-w-[80px] text-center text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="min-w-[240px] text-center text-xs font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableRows.map((item, index) => {
                    const isReturned = !!item.actualReturnTimestamp;
                    const statusLabel = isReturned ? "Returned" : item.isNew ? "New" : "Issued";

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center text-sm font-medium text-slate-600">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <Combobox
                            className="h-9 min-w-[200px] px-3 text-sm"
                            placeholder="Select book..."
                            value={item.bookOptionKey}
                            showOptionsHint={false}
                            dataArr={bookOptions.map((option) => ({
                              value: String(option.copyDetailsId),
                              label: `${option.title || "-"} (${option.accessNumber || "-"})`,
                              imageUrl: option.frontCover ?? undefined,
                            }))}
                            contentClassName="w-[min(480px,calc(100vw-2rem))]"
                            onChange={(value) => {
                              const picked = bookOptions.find(
                                (opt) => String(opt.copyDetailsId) === value,
                              );
                              if (!picked) return;
                              updateRow(item.id, {
                                bookOptionKey: value,
                                copyDetailsId: picked.copyDetailsId,
                                title: picked.title,
                                accessNumber: picked.accessNumber,
                                author: picked.author,
                                publication: picked.publication,
                                frontCover: picked.frontCover,
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-700">
                          {item.accessNumber || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          <span className="line-clamp-2" title={item.author ?? undefined}>
                            {item.author || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <Select
                            value={item.borrowingType ?? ""}
                            onValueChange={(value) =>
                              updateRow(item.id, {
                                borrowingType: value,
                                borrowingTypeId:
                                  borrowingTypeOptions.find((opt) => opt.name === value)?.id ??
                                  null,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-full min-w-[150px] bg-white px-3">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {borrowingTypeOptions.map((option) => (
                                <SelectItem key={option.id} value={option.name}>
                                  {prettyLabel(option.name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-slate-700">
                          {formatDate(item.issuedTimestamp)}
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <DatePicker
                            value={
                              item.returnTimestamp ? new Date(item.returnTimestamp) : undefined
                            }
                            disabled={!item.isNew && !reissuingRowIds.has(item.id)}
                            onSelect={(date) =>
                              updateRow(item.id, {
                                returnTimestamp: date ? date.toISOString() : item.returnTimestamp,
                              })
                            }
                            className="w-full min-w-[10.5rem]"
                            displayFormat="dd/MM/yyyy"
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-slate-700">
                          {item.actualReturnTimestamp
                            ? formatDate(item.actualReturnTimestamp)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium text-slate-800">
                          {formatInr(item.netFine)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              isReturned
                                ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                                : item.isNew
                                  ? "border-blue-200 bg-blue-100 text-blue-800"
                                  : "border-amber-200 bg-amber-100 text-amber-800"
                            }
                          >
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className={
                                    isReturned
                                      ? "h-8 bg-emerald-600 px-2.5 text-white hover:bg-emerald-700"
                                      : "h-8 bg-violet-600 px-2.5 text-white hover:bg-violet-700"
                                  }
                                  disabled={!item.isNew && isReturned}
                                  onClick={() => {
                                    if (isReturned) {
                                      toggleReturn(item.id);
                                    } else {
                                      setConfirmReturnRowId(item.id);
                                    }
                                  }}
                                >
                                  {isReturned ? (
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                  ) : (
                                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  {isReturned ? "Returned" : "Return"}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isReturned ? "Marked as returned" : "Mark as returned"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-blue-200 bg-blue-50 px-2.5 text-blue-700 hover:bg-blue-100"
                                  disabled={
                                    item.isNew || isReturned || reissuingRowIds.has(item.id)
                                  }
                                  onClick={() =>
                                    setReissuingRowIds((prev) => new Set(prev).add(item.id))
                                  }
                                >
                                  <CalendarClock className="mr-1 h-3.5 w-3.5" />
                                  Re-issue
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Extend due date</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fineHandler(item.id)}
                                  className="h-8 border-amber-200 bg-amber-50 px-2.5 text-amber-700 hover:bg-amber-100"
                                  disabled={!item.isNew && isReturned}
                                >
                                  <IndianRupee className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Fine / waiver</TooltipContent>
                            </Tooltip>
                            {item.isNew ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    onClick={() => {
                                      markUnsavedChanges();
                                      setEditableRows((prev) =>
                                        prev.filter((row) => row.id !== item.id),
                                      );
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove row</TooltipContent>
                              </Tooltip>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCandidateResult = () => {
    if (!searchTriggered) return null;

    if (candidateSearchLoading || previewLoading) {
      return (
        <Card className="mt-10 border shadow-md">
          <CardContent className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Searching user...
          </CardContent>
        </Card>
      );
    }

    if (noCandidateFound) {
      return (
        <Card className="mt-10 border-0 border-l-8 border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
          <CardContent className="pb-8 pt-8">
            <p className="text-lg font-bold text-amber-900">No User Found</p>
            <p className="mt-2 text-amber-800">
              No user matches your search. Verify the identifier and try again.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!previewData) return null;

    return (
      <motion.div
        className="mt-0"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50 pb-4">
            <CardTitle className="text-lg text-slate-800">Book Circulation Details</CardTitle>
            <CardDescription>User profile and issued books for the selected member</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">{renderUserDetails()}</CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen py-4 sm:py-8 [&_button:disabled]:pointer-events-auto [&_button:disabled]:cursor-not-allowed [&_input:disabled]:cursor-not-allowed [&_[data-disabled]]:cursor-not-allowed">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <Card className="mb-4 border-none sm:mb-6">
            <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <BookOpenCheck className="mr-2 h-6 w-6 rounded-md border border-slate-400 p-1" />
                Book Circulation
              </CardTitle>
              <p className="text-[14px] text-muted-foreground sm:text-sm">
                Search a user and manage their issued books, returns, and fines.
              </p>
            </CardHeader>
          </Card>

          <Card
            className={
              isSearchCompact ? "mb-0 border-none bg-transparent shadow-none" : "mb-4 sm:mb-6"
            }
          >
            <AnimatePresence initial={false}>
              {!isSearchCompact && (
                <motion.div
                  key="search-header"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <CardHeader className=" p-4 sm:p-6 ">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                      Search User
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm sm:text-base">
                      Student: UID, RFID, Registration, or Roll Number — Staff: UID, Code, or
                      Attendance Code
                    </CardDescription>
                  </CardHeader>
                </motion.div>
              )}
            </AnimatePresence>
            <CardContent className="p-4 sm:p-6 ">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                <motion.div
                  className="w-full sm:min-w-0 sm:basis-80"
                  initial={false}
                  animate={{ flexGrow: isSearchCompact ? 0 : 1 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <AnimatePresence initial={false}>
                    {!isSearchCompact && (
                      <motion.div
                        key="search-label"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <Label
                          htmlFor="candidate-search"
                          className="mb-1 block text-sm sm:text-base"
                        >
                          Identifier
                        </Label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="candidate-search"
                      type="text"
                      value={candidateSearchTerm}
                      onChange={(e) => setCandidateSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleCandidateSearch();
                      }}
                      placeholder="Search by UID, RFID, Registration, Roll, or Staff Code..."
                      disabled={candidateSearchLoading}
                      className="pl-10"
                    />
                  </div>
                </motion.div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => void handleCandidateSearch()}
                    disabled={candidateSearchLoading || !candidateSearchTerm.trim()}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                  >
                    {candidateSearchLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {renderCandidateResult()}

          <AlertDialog
            open={confirmReturnRowId !== null}
            onOpenChange={(open) => {
              if (!open) setConfirmReturnRowId(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark book as returned?</AlertDialogTitle>
                <AlertDialogDescription>
                  {(() => {
                    const row = editableRows.find((r) => r.id === confirmReturnRowId);
                    const bookLabel = row?.title
                      ? `"${row.title}"${row.accessNumber ? ` (${row.accessNumber})` : ""}`
                      : "this book";
                    return `You are about to mark ${bookLabel} as returned. Remember to click "Save Changes" to persist it.`;
                  })()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    if (confirmReturnRowId !== null) toggleReturn(confirmReturnRowId);
                    setConfirmReturnRowId(null);
                  }}
                >
                  Confirm Return
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
