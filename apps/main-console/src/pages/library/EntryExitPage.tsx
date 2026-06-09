import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  List,
  Loader2,
  LogIn,
  LogOut,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { userTypeEnum } from "@repo/db/schemas/enums";
import { getColorFromName } from "@/utils/avatar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import {
  createLibraryEntryExit,
  downloadLibraryEntryExitExcel,
  getLibraryEntryExitPreview,
  getLibraryEntryExitList,
  LibraryCurrentStatus,
  LibraryEntryExitRow,
  LibraryEntryExitPreviewPayload,
  LibraryUserType,
  markLibraryEntryExitAsCheckedOut,
  searchLibraryUsers,
} from "@/services/library-entry-exit.service";

type Filters = {
  userType: "all" | LibraryUserType;
  currentStatus: "all" | LibraryCurrentStatus;
  date: string;
};

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

const statusClassMap: Record<LibraryCurrentStatus, string> = {
  CHECKED_IN: "bg-green-100 text-green-700",
  CHECKED_OUT: "bg-red-100 text-red-700",
};

const userTypeClassMap: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  STUDENT: "bg-blue-100 text-blue-700",
  FACULTY: "bg-emerald-100 text-emerald-700",
  STAFF: "bg-amber-100 text-amber-700",
  PARENTS: "bg-pink-100 text-pink-700",
};

const previewUserTypeBadgeClassMap: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 border-violet-200",
  STUDENT: "bg-blue-100 text-blue-800 border-blue-200",
  FACULTY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  STAFF: "bg-amber-100 text-amber-800 border-amber-200",
  PARENTS: "bg-pink-100 text-pink-800 border-pink-200",
};

const previewStatusBadgeMap: Record<LibraryCurrentStatus, string> = {
  CHECKED_IN: "bg-green-100 text-green-800 border-green-200",
  CHECKED_OUT: "bg-red-100 text-red-800 border-red-200",
};

const USER_TYPE_OPTIONS = userTypeEnum.enumValues;

const prettyLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

type LibraryEntryExitSocketUpdate = {
  id: string;
  type: "library_entry_exit_update";
  action: "CHECKED_IN" | "CHECKED_OUT";
  userId: number;
  userName: string;
  message: string;
  updatedAt: string;
};

type EntryExitUserCardProps = {
  preview: LibraryEntryExitPreviewPayload;
  todayEntry: LibraryEntryExitRow | null;
  avatarUrl?: string;
  isActionLoading?: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

function EntryExitUserCard({
  preview,
  todayEntry,
  avatarUrl,
  isActionLoading,
  onCheckIn,
  onCheckOut,
}: EntryExitUserCardProps) {
  const [booksExpanded, setBooksExpanded] = useState(true);
  const user = preview.user;
  const isCheckedIn = todayEntry?.currentStatus === "CHECKED_IN";
  const isInactive = user.isActive === false;
  const userActiveLabel = isInactive ? "Inactive" : "Active";
  const userActiveBadgeClass = isInactive
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-emerald-100 text-emerald-800 border-emerald-200";
  const programLabel = user.programCourseShortName?.trim() || user.programCourse || null;
  const fallbackBg = getColorFromName(user.name);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusLabel = isCheckedIn
    ? "Checked In"
    : todayEntry?.currentStatus === "CHECKED_OUT"
      ? "Checked Out"
      : "Not Checked In";

  const statusBadgeClass = isCheckedIn
    ? previewStatusBadgeMap.CHECKED_IN
    : todayEntry
      ? previewStatusBadgeMap.CHECKED_OUT
      : "bg-blue-100 text-blue-800 border-blue-200";

  const userDetailColumns: { label: string; value: string; mono?: boolean }[] = [
    { label: "UID", value: user.uid ?? "-", mono: true },
    { label: "Program Course", value: programLabel ?? "-" },
    { label: "Shift", value: user.shift ?? "-" },
    { label: "Semester", value: user.classOrSemester ?? "-" },
    { label: "RFID No.", value: user.rfid ?? "N/A", mono: true },
  ];

  const booksIssued = preview.bookCirculationSummary?.booksIssued ?? preview.circulationRows.length;
  const booksDueForReturn =
    preview.bookCirculationSummary?.booksDueForReturn ??
    preview.circulationRows.filter((r) => r.status !== "RETURNED").length;

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className="w-16 h-16 border-2 border-purple-300 shadow-md flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={user.name} className="object-cover" />
              <AvatarFallback className={`${fallbackBg} text-white font-bold text-lg`}>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center flex-wrap gap-3 min-w-0 flex-1">
              <div className="min-w-0">
                <Badge className={`${userActiveBadgeClass} mb-1.5 w-fit`}>{userActiveLabel}</Badge>
                <CardTitle className="flex items-center flex-wrap gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 uppercase tracking-wide truncate">
                    {user.name}
                  </span>
                  <Badge
                    className={
                      previewUserTypeBadgeClassMap[user.userType] ??
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }
                  >
                    {prettyLabel(user.userType)}
                  </Badge>
                </CardTitle>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={onCheckIn}
                  disabled={isActionLoading || isCheckedIn || isInactive}
                >
                  {isActionLoading && !isCheckedIn ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  Check In
                </Button>
                <Button
                  size="default"
                  variant="destructive"
                  onClick={onCheckOut}
                  disabled={isActionLoading || !isCheckedIn}
                >
                  {isActionLoading && isCheckedIn ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Check Out
                </Button>
              </div>
            </div>
          </div>

          <Badge className={`${statusBadgeClass} flex-shrink-0`}>{statusLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {userDetailColumns.length > 0 && (
          <div className="mb-6 rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  {userDetailColumns.map((col) => (
                    <TableHead
                      key={col.label}
                      className="whitespace-nowrap font-semibold text-center"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {userDetailColumns.map((col) => (
                    <TableCell
                      key={col.label}
                      className={`text-center font-semibold text-slate-900 ${col.mono ? "font-mono" : ""}`}
                      title={col.value}
                    >
                      {col.value}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-slate-200 overflow-hidden">
          {preview.circulationRows.length > 0 ? (
            <>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setBooksExpanded((v) => !v)}
              >
                <span>Borrowed Books ({preview.circulationRows.length})</span>
                {booksExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {booksExpanded && (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="whitespace-nowrap text-center font-semibold text-slate-600 bg-slate-50">
                        No. of books issued
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-900">
                        {booksIssued}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center font-semibold text-slate-600 bg-slate-50">
                        No. of books due for return
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-900">
                        {booksDueForReturn}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <div className="px-4 py-4 bg-slate-50 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-700 mb-1">Borrowed Books</p>
              <p className="text-sm text-slate-600">
                No borrowed books for this user. Go to{" "}
                <Link
                  to="/dashboard/library/book-circulation"
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Book Circulation
                </Link>{" "}
                to issue books — they will appear here after issue.
              </p>
            </div>
          )}
        </div>

        {todayEntry && (
          <div className="mb-6 rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="whitespace-nowrap text-center font-semibold text-slate-600 bg-slate-50">
                    Library Entry Date &amp; Time
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-900">
                    {formatDateTime(todayEntry.entryTimestamp)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center font-semibold text-slate-600 bg-slate-50">
                    Library Exit Date &amp; Time
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-900">
                    {formatDateTime(todayEntry.exitTimestamp)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {isInactive && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">User Inactive</p>
              <p className="text-sm text-red-800 mt-1">
                This user is inactive. Entry / exit may be restricted.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EntryExitPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>({
    userType: "all",
    currentStatus: "all",
    date: today,
  });
  const [rows, setRows] = useState<LibraryEntryExitRow[]>([]);
  const [dateCounts, setDateCounts] = useState({ checkedIn: 0, checkedOut: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [candidateSearchLoading, setCandidateSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewData, setPreviewData] = useState<LibraryEntryExitPreviewPayload | null>(null);
  const [todayEntry, setTodayEntry] = useState<LibraryEntryExitRow | null>(null);
  const [noCandidateFound, setNoCandidateFound] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLibraryEntryExitList({
        page,
        limit,
        ...(searchText.trim() ? { search: searchText.trim() } : {}),
        ...(filters.userType !== "all" ? { userType: filters.userType } : {}),
        ...(filters.currentStatus !== "all" ? { currentStatus: filters.currentStatus } : {}),
        ...(filters.date ? { date: filters.date } : {}),
      });

      setRows(response.payload.rows);
      setTotal(response.payload.total);
      setDateCounts({
        checkedIn: response.payload.checkedInCount ?? 0,
        checkedOut: response.payload.checkedOutCount ?? 0,
      });
    } catch (error) {
      toast.error("Failed to fetch entry/exit records");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchText, filters.userType, filters.currentStatus, filters.date]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_entry_exit");

    const handleLibraryEntryExitUpdate = (data: LibraryEntryExitSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_entry_exit_update", handleLibraryEntryExitUpdate);

    return () => {
      socket.off("library_entry_exit_update", handleLibraryEntryExitUpdate);
      socket.emit("unsubscribe_library_entry_exit");
    };
  }, [socket, isConnected, fetchRows]);

  const loadCandidateByUserId = useCallback(
    async (userId: number, searchLabel?: string) => {
      try {
        setCandidateSearchLoading(true);
        setNoCandidateFound(false);
        const [previewRes, listRes] = await Promise.all([
          getLibraryEntryExitPreview(userId),
          getLibraryEntryExitList({
            page: 1,
            limit: 200,
            date: filters.date || today,
          }),
        ]);
        setPreviewData(previewRes.payload);
        const activeEntry = listRes.payload.rows.find(
          (r) => r.userId === userId && r.currentStatus === "CHECKED_IN",
        );
        setTodayEntry(activeEntry ?? null);
        if (searchLabel) setCandidateSearchTerm(searchLabel);
        setSearchTriggered(true);
      } catch (error) {
        toast.error("Failed to load user details");
        console.error(error);
        setPreviewData(null);
        setTodayEntry(null);
      } finally {
        setCandidateSearchLoading(false);
      }
    },
    [filters.date, today],
  );

  // const activeFilterCount = useMemo(
  //   () =>
  //     [filters.userType !== "all", filters.currentStatus !== "all", !!filters.date].filter(Boolean)
  //       .length,
  //   [filters],
  // );

  const handleDownload = () => {
    const run = async () => {
      try {
        const blob = await downloadLibraryEntryExitExcel({
          ...(searchText.trim() ? { search: searchText.trim() } : {}),
          ...(filters.userType !== "all" ? { userType: filters.userType } : {}),
          ...(filters.currentStatus !== "all" ? { currentStatus: filters.currentStatus } : {}),
          ...(filters.date ? { date: filters.date } : {}),
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `library-entry-exit-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch (error) {
        toast.error("Failed to download Excel");
        console.error(error);
      }
    };

    void run();
  };

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
        setTodayEntry(null);
        setNoCandidateFound(true);
        return;
      }

      const match = usersRes.payload.rows[0];
      if (!match) return;
      await loadCandidateByUserId(match.userId);
    } catch (error) {
      toast.error("Failed to search user");
      console.error(error);
    } finally {
      setCandidateSearchLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!previewData?.user.userId) return;
    try {
      setActionLoading(true);
      await createLibraryEntryExit(previewData.user.userId);
      toast.success(`Checked in ${previewData.user.name}`);
      await fetchRows();
      await loadCandidateByUserId(previewData.user.userId);
    } catch (error) {
      toast.error("Failed to check in");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayEntry?.id) return;
    try {
      setActionLoading(true);
      await markLibraryEntryExitAsCheckedOut(todayEntry.id);
      toast.success("Checked out successfully");
      await fetchRows();
      if (previewData?.user.userId) {
        await loadCandidateByUserId(previewData.user.userId);
      }
    } catch (error) {
      toast.error("Failed to check out");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStudentAvatarUrl = (uid: string) =>
    `${import.meta.env.VITE_STUDENT_IMAGE_BASE_URL ?? "https://besc.academic360.app/id-card-generate/api/images?crop=true&uid="}${uid}`;

  const getPreviewAvatarUrl = () => {
    const user = previewData?.user;
    if (!user) return undefined;
    if (user.userType === "STUDENT" && user.uid) {
      return getStudentAvatarUrl(user.uid);
    }
    return user.image || undefined;
  };

  const getEntryRowAvatarUrl = (row: LibraryEntryExitRow) => {
    if (row.userType === "STUDENT" && row.studentUid) {
      return getStudentAvatarUrl(row.studentUid);
    }
    return row.image || undefined;
  };

  const getRowUid = (row: LibraryEntryExitRow) => row.studentUid ?? row.staffUid ?? null;

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");

  const renderCandidateResult = () => {
    if (!searchTriggered) return null;

    if (candidateSearchLoading) {
      return (
        <Card className="mt-10 border shadow-md">
          <CardContent className="py-12 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Searching user...
          </CardContent>
        </Card>
      );
    }

    if (noCandidateFound) {
      return (
        <Card className="mt-10 border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-l-8 border-l-amber-500">
          <CardContent className="pt-8 pb-8">
            <p className="text-lg font-bold text-amber-900">No User Found</p>
            <p className="text-amber-800 mt-2">
              No user matches your search. Verify the identifier and try again.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!previewData) return null;

    return (
      <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <EntryExitUserCard
          preview={previewData}
          todayEntry={todayEntry}
          avatarUrl={getPreviewAvatarUrl()}
          isActionLoading={actionLoading}
          onCheckIn={() => void handleCheckIn()}
          onCheckOut={() => void handleCheckOut()}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <Card className="mb-4 sm:mb-6 border-none">
          <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <DoorOpen className="mr-2 h-6 w-6 border rounded-md p-1 border-slate-400" />
                  Entry / Exit
                </CardTitle>
                <p className="text-[14px] sm:text-sm text-muted-foreground">
                  Search users and record library check-in or check-out
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                className="w-full sm:w-auto shrink-0"
              >
                <List className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Search User
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1">
              Student: UID, RFID, Registration, or Roll Number â€” Staff: UID, Code, or Attendance
              Code
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Label htmlFor="candidate-search" className="text-sm sm:text-base">
                  Identifier
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={() => void handleCandidateSearch()}
                  disabled={candidateSearchLoading || !candidateSearchTerm.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  {candidateSearchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {renderCandidateResult()}

        <Card className="mt-8 sm:mt-10 border shadow-md">
          <CardHeader className="p-4 sm:p-6 border-b">
            <CardTitle className="text-lg sm:text-xl">Today&apos;s Records</CardTitle>
            <CardDescription className="mt-1">
              Filter and manage entry / exit logs for the selected date
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pt-0">
            <div className="mb-0 border-b bg-background p-2 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="w-[150px]">
                    <Label className="mb-1 block text-[14px]">User Type</Label>
                    <Select
                      value={filters.userType}
                      onValueChange={(value) => {
                        setPage(1);
                        setFilters((prev) => ({ ...prev, userType: value as Filters["userType"] }));
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="User Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {USER_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {prettyLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-[150px]">
                    <Label className="mb-1 block text-[14px]">Current Status</Label>
                    <Select
                      value={filters.currentStatus}
                      onValueChange={(value) => {
                        setPage(1);
                        setFilters((prev) => ({
                          ...prev,
                          currentStatus: value as Filters["currentStatus"],
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                        <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-[150px]">
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="block text-[14px]">Date</Label>
                      {filters.date && (
                        <button
                          type="button"
                          className="text-[10px] text-slate-500 hover:text-slate-700 underline"
                          onClick={() => {
                            setPage(1);
                            setFilters((prev) => ({ ...prev, date: "" }));
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <Input
                      className="h-8"
                      type="date"
                      value={filters.date}
                      onChange={(e) => {
                        setPage(1);
                        setFilters((prev) => ({ ...prev, date: e.target.value }));
                      }}
                    />
                  </div>

                  {filters.date && (
                    <div className="mb-0.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                      Check In:{" "}
                      <span className="font-semibold text-green-700">{dateCounts.checkedIn}</span> |
                      Check Out:{" "}
                      <span className="font-semibold text-red-700">{dateCounts.checkedOut}</span>
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-64">
                  <Label className="mb-1 block text-[14px]">Search by name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchText}
                      onChange={(e) => {
                        setPage(1);
                        setSearchText(e.target.value);
                      }}
                      className="h-8 pl-9"
                      placeholder="Filter records..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative" style={{ height: "600px" }}>
              <div className="h-full overflow-y-auto overflow-x-auto">
                <Table className="border rounded-md min-w-[850px]" style={{ tableLayout: "fixed" }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-slate-100" style={{ width: 40 }}>
                        #
                      </TableHead>
                      <TableHead className="bg-slate-100" style={{ width: 240 }}>
                        User
                      </TableHead>
                      <TableHead className="bg-slate-100" style={{ width: 120 }}>
                        User Type
                      </TableHead>
                      <TableHead className="bg-slate-100" style={{ width: 130 }}>
                        Current Status
                      </TableHead>
                      <TableHead className="bg-slate-100" style={{ width: 190 }}>
                        Entry Time
                      </TableHead>
                      <TableHead className="bg-slate-100" style={{ width: 190 }}>
                        Exit Time
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading records...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No entry/exit records found for selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row, index) => {
                        const rowUid = getRowUid(row);
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="py-2">{(page - 1) * limit + index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                  <AvatarImage
                                    src={getEntryRowAvatarUrl(row)}
                                    alt={row.userName ?? "user"}
                                    className="object-cover"
                                  />
                                  <AvatarFallback
                                    className={`text-white text-[10px] font-semibold ${getColorFromName(row.userName)}`}
                                  >
                                    {getInitials(row.userName ?? "User")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-800">
                                    {row.userName ?? "-"}
                                  </p>
                                  {rowUid && (
                                    <p className="truncate text-xs font-mono text-slate-500 mt-0.5">
                                      UID:{rowUid}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {row.userType ? (
                                <Badge
                                  className={
                                    userTypeClassMap[row.userType] ?? "bg-slate-100 text-slate-700"
                                  }
                                >
                                  {prettyLabel(row.userType)}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusClassMap[row.currentStatus]}>
                                {row.currentStatus === "CHECKED_IN" ? "Checked In" : "Checked Out"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(row.entryTimestamp)}</TableCell>
                            <TableCell>{formatDateTime(row.exitTimestamp)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex items-center justify-between border-t bg-background px-3 py-2 text-sm">
              <p className="text-slate-500">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500">
                  Page {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
