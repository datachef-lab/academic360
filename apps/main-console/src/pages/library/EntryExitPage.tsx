import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { DoorOpen, Download, Loader2, PlusCircle, Search } from "lucide-react";
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
  LibrarySearchUser,
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

const formatDateOnly = (value: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const toSentenceCase = (value: string | null) => {
  if (!value) return "-";
  const sentenceCased = value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
  return sentenceCased.replace(/\b[ivxlcdm]+\b/gi, (token) => token.toUpperCase());
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
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"check_in" | "check_out">("check_in");
  const [previewTargetEntryId, setPreviewTargetEntryId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userSearchRows, setUserSearchRows] = useState<LibrarySearchUser[]>([]);
  const [userSearchPage, setUserSearchPage] = useState(1);
  const [userSearchTotal, setUserSearchTotal] = useState(0);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<LibraryEntryExitPreviewPayload | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const userSearchTotalPages = Math.max(1, Math.ceil(userSearchTotal / 8));

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearchText.trim());
      setUserSearchPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearchText]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAddDialogOpen || !debouncedUserSearch) {
        setUserSearchRows([]);
        setUserSearchTotal(0);
        return;
      }

      try {
        setUserSearchLoading(true);
        const response = await searchLibraryUsers(debouncedUserSearch, userSearchPage, 8);
        setUserSearchRows(response.payload.rows);
        setUserSearchTotal(response.payload.total);
      } catch (error) {
        toast.error("Failed to search users");
        console.error(error);
      } finally {
        setUserSearchLoading(false);
      }
    };

    void fetchUsers();
  }, [isAddDialogOpen, debouncedUserSearch, userSearchPage]);

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

  const handleMarkCheckedOut = async (row: LibraryEntryExitRow) => {
    if (row.currentStatus === "CHECKED_OUT") return;
    try {
      setPreviewLoading(true);
      setPreviewTargetEntryId(row.id);
      const response = await getLibraryEntryExitPreview(row.userId);
      setPreviewData(response.payload);
      setPreviewMode("check_out");
      setPreviewOpen(true);
    } catch (error) {
      toast.error("Failed to load user details");
      console.error(error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmPreviewAction = async () => {
    if (previewMode === "check_in") {
      if (!previewData?.user.userId) return;
      try {
        setCreatingUserId(previewData.user.userId);
        await createLibraryEntryExit(previewData.user.userId);
        toast.success(`Checked in ${previewData.user.name}`);
        await fetchRows();
        setPreviewOpen(false);
        setPreviewData(null);
        setPreviewTargetEntryId(null);
        setIsAddDialogOpen(false);
        setUserSearchText("");
        setDebouncedUserSearch("");
        setUserSearchRows([]);
      } catch (error) {
        toast.error("Failed to create entry");
        console.error(error);
      } finally {
        setCreatingUserId(null);
      }
      return;
    }

    if (!previewTargetEntryId) return;
    try {
      setCheckoutLoadingId(previewTargetEntryId);
      await markLibraryEntryExitAsCheckedOut(previewTargetEntryId);
      toast.success("Marked as checked out");
      await fetchRows();
    } catch (error) {
      toast.error("Failed to mark checked out");
      console.error(error);
    } finally {
      setCheckoutLoadingId(null);
      setPreviewOpen(false);
      setPreviewData(null);
      setPreviewTargetEntryId(null);
    }
  };

  const handleSelectUser = async (user: LibrarySearchUser) => {
    try {
      setCreatingUserId(user.userId);
      setPreviewLoading(true);
      const response = await getLibraryEntryExitPreview(user.userId);
      setPreviewData(response.payload);
      setPreviewMode("check_in");
      setIsAddDialogOpen(false);
      setPreviewOpen(true);
    } catch (error) {
      toast.error("Failed to load user details");
      console.error(error);
    } finally {
      setCreatingUserId(null);
      setPreviewLoading(false);
    }
  };

  const getStudentAvatarUrl = (uid: string) =>
    `${import.meta.env.VITE_STUDENT_IMAGE_BASE_URL ?? "https://besc.academic360.app/id-card-generate/api/images?crop=true&uid="}${uid}`;

  const getAvatarUrl = (user: LibrarySearchUser) => {
    if (user.userType === "STUDENT" && user.studentUid) {
      return getStudentAvatarUrl(user.studentUid);
    }
    return user.image || undefined;
  };

  const getEntryRowAvatarUrl = (row: LibraryEntryExitRow) => {
    if (row.userType === "STUDENT" && row.studentUid) {
      return getStudentAvatarUrl(row.studentUid);
    }
    return row.image || undefined;
  };

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");

  const previewUser = previewData?.user;
  const batchProgramLabel =
    previewUser?.programCourseShortName?.trim() || previewUser?.programCourse || "-";
  const affiliationLabel =
    previewUser?.affiliationShortName?.trim() || previewUser?.affiliation || "-";
  const regulationLabel =
    previewUser?.regulationTypeShortName?.trim() || previewUser?.regulationType || "-";
  const previewUserTypeClass =
    (previewUser?.userType && userTypeClassMap[previewUser.userType]) ||
    "bg-slate-100 text-slate-700";
  const borrowingTypeClassMap: Record<string, string> = {
    HOME_ISSUE: "bg-sky-100 text-sky-700",
    LIBRARY: "bg-indigo-100 text-indigo-700",
  };
  const fallbackAvatarBg = getColorFromName(previewUser?.name);

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="mb-3 flex flex-col items-start justify-between gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <DoorOpen className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Entry / Exit</span>
            </CardTitle>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Track daily library movement with status and timestamp-wise records.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchText}
                onChange={(e) => {
                  setPage(1);
                  setSearchText(e.target.value);
                }}
                className="pl-9"
                placeholder="Search by name..."
              />
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
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

              <div className="flex items-center justify-end">
                <Button variant="outline" onClick={handleDownload} className="flex-shrink-0">
                  <Download className="h-4 w-4 mr-2" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="h-full overflow-y-auto overflow-x-auto">
              <Table className="border rounded-md min-w-[980px]" style={{ tableLayout: "fixed" }}>
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
                    <TableHead className="bg-slate-100 sticky right-0 z-20" style={{ width: 130 }}>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading records...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No entry/exit records found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2">{(page - 1) * limit + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7">
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
                            <div className="truncate font-medium text-slate-800">
                              {row.userName ?? "-"}
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
                        <TableCell className="sticky right-0 bg-white z-10">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={
                              row.currentStatus === "CHECKED_OUT" || checkoutLoadingId === row.id
                            }
                            onClick={() => handleMarkCheckedOut(row)}
                          >
                            {checkoutLoadingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : row.currentStatus === "CHECKED_OUT" ? (
                              "Checked Out"
                            ) : (
                              "Mark Out"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Search user identifiers</Label>
              <Input
                placeholder="Student: UID/RFID/Reg/Roll | Staff: UID/Code/Attendance Code"
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
              />
            </div>

            <div className="h-[360px] overflow-y-auto rounded-md border">
              {!debouncedUserSearch ? (
                <div className="flex h-full items-center justify-center p-4 text-sm text-slate-500">
                  Start typing to search students and staffs.
                </div>
              ) : userSearchLoading ? (
                <div className="flex h-full items-center justify-center gap-2 p-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching users...
                </div>
              ) : userSearchRows.length === 0 ? (
                <div className="flex h-full items-center justify-center p-4 text-sm text-slate-500">
                  No users found for this search term.
                </div>
              ) : (
                <div className="divide-y">
                  {userSearchRows.map((user) => (
                    <div
                      key={user.userId}
                      className="grid grid-cols-[1fr_160px_auto] items-center gap-3 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={getAvatarUrl(user)}
                            alt={user.userName}
                            className="object-cover"
                          />
                          <AvatarFallback
                            className={`text-white ${getColorFromName(user.userName)}`}
                          >
                            {getInitials(user.userName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {user.userName}
                          </p>
                          <div className="mt-1 text-xs text-slate-500">
                            <Badge
                              className={
                                userTypeClassMap[user.userType] ?? "bg-slate-100 text-slate-700"
                              }
                            >
                              {prettyLabel(user.userType)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600">{user.uid ?? "-"}</div>

                      <Button
                        size="sm"
                        onClick={() => handleSelectUser(user)}
                        disabled={creatingUserId === user.userId}
                      >
                        {creatingUserId === user.userId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Select"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="min-h-8">
              {debouncedUserSearch && userSearchTotal > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <p>
                    Showing {(userSearchPage - 1) * 8 + 1}-
                    {Math.min(userSearchPage * 8, userSearchTotal)} of {userSearchTotal}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      disabled={userSearchPage <= 1}
                      onClick={() => setUserSearchPage((p) => p - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      disabled={userSearchPage >= userSearchTotalPages}
                      onClick={() => setUserSearchPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewData(null);
            setPreviewTargetEntryId(null);
          }
        }}
      >
        <DialogContent className="w-[94vw] max-w-none h-[94vh] max-h-none flex flex-col text-[14px]">
          <DialogHeader className="pr-4">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-sm">
                {previewMode === "check_in" ? "Confirm Check In" : "Mark as Checked Out?"}
              </DialogTitle>
              {previewUser && (
                <div className="flex items-center gap-2">
                  <Badge className={`${previewUserTypeClass} border border-slate-300`}>
                    {prettyLabel(previewUser.userType || "USER")}
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

          {previewLoading || !previewUser ? (
            <div className="flex h-56 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading details...
            </div>
          ) : (
            <div className="space-y-4 flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="rounded-md bg-slate-100">
                <div className="grid grid-cols-1  md:grid-cols-[12%_29%_33%_26%]">
                  <div className="basis-full md:basis-[18%] border border-slate-200 bg-blue-50">
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
                          className={`flex h-full w-full items-center justify-center text-4xl font-semibold text-white ${fallbackAvatarBg}`}
                        >
                          {getInitials(previewUser.name)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="basis-full md:basis-[27%] border border-slate-200 bg-emerald-50">
                    <p className="mb-2 border-b border-slate-200 p-2 pb-1 text-[14px] font-semibold uppercase tracking-wide text-slate-500">
                      User Info
                    </p>
                    <div className="space-y-1 p-2 text-[14px]">
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">Name:</span>{" "}
                        {previewUser.name || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">UID:</span>{" "}
                        {previewUser.uid || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">RFID:</span>{" "}
                        {previewUser.rfid || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">
                          Roll Number:
                        </span>{" "}
                        {previewUser.rollNumber || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">
                          Registration:
                        </span>{" "}
                        {previewUser.registrationNumber || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="basis-full md:basis-[31%] border border-slate-200 bg-amber-50 p-2">
                    <p className="mb-2 border-b border-slate-200 pb-1 text-[14px] font-semibold uppercase tracking-wide text-slate-500">
                      {previewUser.userType === "STAFF" ? "Staff Details" : "Batch Details"}
                    </p>
                    <div className="space-y-1 text-[14px]">
                      {previewUser.userType === "STAFF" ? (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Shift:
                            </span>{" "}
                            {previewUser.shift || "-"}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Attendance Code:
                            </span>{" "}
                            {previewUser.attendanceCode || "-"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Program Course:
                            </span>{" "}
                            {batchProgramLabel}{" "}
                            <span className="text-slate-500">
                              ({affiliationLabel}, {regulationLabel})
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Class/Semester:
                            </span>{" "}
                            {toSentenceCase(previewUser.classOrSemester)}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Shift:
                            </span>{" "}
                            {previewUser.shift || "-"}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Section:
                            </span>{" "}
                            {previewUser.section || "-"}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-block min-w-[120px] text-slate-500">
                              Class Roll No.:
                            </span>{" "}
                            {previewUser.classRollNumber || "-"}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="basis-full md:basis-[22%] border border-slate-200 bg-violet-50 p-2">
                    <p className="mb-2 border-b border-slate-200 pb-1 text-[14px] font-semibold uppercase tracking-wide text-slate-500">
                      Contact Details
                    </p>
                    <div className="space-y-1 text-[14px]">
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">Email:</span>{" "}
                        {previewUser.email || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">Phone:</span>{" "}
                        {previewUser.phone || "-"}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block min-w-[120px] text-slate-500">WhatsApp:</span>{" "}
                        {previewUser.whatsapp || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-md border">
                <Table className="min-w-[1220px]">
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="sticky top-0 z-30 bg-slate-100 whitespace-nowrap w-[56px]">
                        Sr No
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 bg-slate-100 whitespace-nowrap w-[86px]">
                        Access No.
                      </TableHead>
                      <TableHead className="sticky top-0 z-20 bg-slate-100">
                        Title of Book
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[150px]">
                        Author
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 bg-slate-100 whitespace-nowrap">
                        Borrowing Type
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 bg-slate-100">Status</TableHead>
                      <TableHead className="sticky top-0 z-30 bg-slate-100 whitespace-nowrap min-w-[150px]">
                        Issued At
                      </TableHead>
                      <TableHead className="sticky top-0 z-20 bg-slate-100 whitespace-nowrap">
                        Return Date
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 bg-slate-100 whitespace-nowrap min-w-[150px]">
                        Returned On
                      </TableHead>
                      <TableHead className="sticky top-0 z-30 bg-slate-100 whitespace-nowrap">
                        No. of Days Late
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.circulationRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center text-xs text-slate-500 border-b border-slate-200"
                        >
                          No circulation records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      previewData.circulationRows.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`[&>td]:border-b [&>td]:border-slate-200 ${
                            item.status === "RETURNED" ? "bg-green-100" : ""
                          }`}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.accessNumber || "-"}</TableCell>
                          <TableCell>{item.title || "-"}</TableCell>
                          <TableCell className="min-w-[120px] py-3">{item.author || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                borrowingTypeClassMap[item.borrowingType || ""] ??
                                "bg-cyan-100 text-cyan-700 border border-cyan-300"
                              }
                            >
                              {toSentenceCase(item.borrowingType || "-")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                item.status === "RETURNED"
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : "bg-amber-100 text-amber-700 border border-amber-300"
                              }
                            >
                              {toSentenceCase(item.status || "-")}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(item.issuedTimestamp)}</TableCell>
                          <TableCell>{formatDateOnly(item.approvedReturnTimestamp)}</TableCell>
                          <TableCell>{formatDateTime(item.returnTimestamp)}</TableCell>
                          <TableCell>{item.daysLate ?? 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="sticky bottom-0 z-20 mt-auto flex items-center justify-between gap-2 border-t bg-white pt-2">
                {previewMode === "check_in" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewOpen(false);
                      setIsAddDialogOpen(true);
                    }}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewOpen(false);
                      setPreviewData(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmPreviewAction}
                    disabled={
                      previewMode === "check_in"
                        ? creatingUserId === previewUser.userId
                        : checkoutLoadingId === previewTargetEntryId
                    }
                  >
                    {previewMode === "check_in" ? (
                      creatingUserId === previewUser.userId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Check In"
                      )
                    ) : checkoutLoadingId === previewTargetEntryId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
