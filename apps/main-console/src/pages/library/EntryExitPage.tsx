import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DoorOpen, Download, Filter, Loader2, PlusCircle, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { userTypeEnum } from "@repo/db/schemas/enums";
import {
  createLibraryEntryExit,
  getLibraryEntryExitList,
  LibraryCurrentStatus,
  LibraryEntryExitRow,
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
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
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

export default function EntryExitPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>({
    userType: "all",
    currentStatus: "all",
    date: today,
  });
  const [rows, setRows] = useState<LibraryEntryExitRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<number | null>(null);
  const [confirmCheckoutRow, setConfirmCheckoutRow] = useState<LibraryEntryExitRow | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userSearchRows, setUserSearchRows] = useState<LibrarySearchUser[]>([]);
  const [userSearchPage, setUserSearchPage] = useState(1);
  const [userSearchTotal, setUserSearchTotal] = useState(0);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const userSearchTotalPages = Math.max(1, Math.ceil(userSearchTotal / 8));

  const fetchRows = async () => {
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
    } catch (error) {
      toast.error("Failed to fetch entry/exit records");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
  }, [page, limit, searchText, filters.userType, filters.currentStatus, filters.date]);

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

  const activeFilterCount = useMemo(
    () =>
      [filters.userType !== "all", filters.currentStatus !== "all", !!filters.date].filter(Boolean)
        .length,
    [filters],
  );

  const handleDownload = () => {
    const headers = ["#", "User", "User Type", "Current Status", "Entry Time", "Exit Time"];
    const csvRows = rows.map((row, index) => [
      String(index + 1),
      row.userName ?? "-",
      row.userType ?? "-",
      row.currentStatus,
      formatDateTime(row.entryTimestamp),
      formatDateTime(row.exitTimestamp),
    ]);

    const csv = [headers, ...csvRows]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "library-entry-exit.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleMarkCheckedOut = async (row: LibraryEntryExitRow) => {
    if (row.currentStatus === "CHECKED_OUT") return;
    setConfirmCheckoutRow(row);
  };

  const confirmMarkCheckedOut = async () => {
    if (!confirmCheckoutRow) return;
    try {
      setCheckoutLoadingId(confirmCheckoutRow.id);
      await markLibraryEntryExitAsCheckedOut(confirmCheckoutRow.id);
      toast.success("Marked as checked out");
      await fetchRows();
    } catch (error) {
      toast.error("Failed to mark checked out");
      console.error(error);
    } finally {
      setCheckoutLoadingId(null);
      setConfirmCheckoutRow(null);
    }
  };

  const handleAddEntry = async (user: LibrarySearchUser) => {
    try {
      setCreatingUserId(user.userId);
      await createLibraryEntryExit(user.userId);
      toast.success(`Checked in ${user.userName}`);
      await fetchRows();
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

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start justify-between gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <DoorOpen className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Entry / Exit</span>
            </CardTitle>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Track daily library movement with status and timestamp-wise records.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <Button variant="outline" onClick={handleDownload} className="flex-shrink-0">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
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
          <div className="sticky top-[72px] z-20 mb-0 border-b bg-background p-2 sm:p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-80">
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

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Filter className="h-3.5 w-3.5" />
                  Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
                </div>
                <div className="w-[150px]">
                  <Label className="mb-1 block text-[11px]">User Type</Label>
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
                  <Label className="mb-1 block text-[11px]">Current Status</Label>
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
                    <Label className="block text-[11px]">Date</Label>
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
              </div>
            </div>
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="h-full overflow-y-auto overflow-x-auto">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 z-30 bg-slate-100" style={{ width: 40 }}>
                      #
                    </TableHead>
                    <TableHead className="sticky top-0 z-30 bg-slate-100" style={{ width: 240 }}>
                      User
                    </TableHead>
                    <TableHead className="sticky top-0 z-30 bg-slate-100" style={{ width: 120 }}>
                      User Type
                    </TableHead>
                    <TableHead className="sticky top-0 z-30 bg-slate-100" style={{ width: 130 }}>
                      Current Status
                    </TableHead>
                    <TableHead className="sticky top-0 z-30 bg-slate-100" style={{ width: 190 }}>
                      Entry Time
                    </TableHead>
                    <TableHead className="sticky top-0 z-30 bg-slate-100" style={{ width: 190 }}>
                      Exit Time
                    </TableHead>
                    <TableHead className="sticky top-0 z-30 bg-slate-100" style={{ width: 130 }}>
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
                              <AvatarFallback>{getInitials(row.userName ?? "User")}</AvatarFallback>
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
                        <TableCell>
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

      <AlertDialog
        open={!!confirmCheckoutRow}
        onOpenChange={(open) => !open && setConfirmCheckoutRow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Checked Out?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the current status to checked out and capture the current timestamp as
              exit time.
            </AlertDialogDescription>
            {confirmCheckoutRow && (
              <div className="mt-2 rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={getEntryRowAvatarUrl(confirmCheckoutRow)}
                      alt={confirmCheckoutRow.userName ?? "user"}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {getInitials(confirmCheckoutRow.userName ?? "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {confirmCheckoutRow.userName ?? "-"}
                      </p>
                      {confirmCheckoutRow.userType && (
                        <Badge
                          className={
                            userTypeClassMap[confirmCheckoutRow.userType] ??
                            "bg-slate-100 text-slate-700"
                          }
                        >
                          {prettyLabel(confirmCheckoutRow.userType)}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1">
                      <p className="text-xs text-slate-500">
                        {confirmCheckoutRow.userType === "STAFF"
                          ? `UID/Code: ${confirmCheckoutRow.staffUid || confirmCheckoutRow.staffAttendanceCode || "-"}`
                          : `UID: ${confirmCheckoutRow.studentUid || "-"}`}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">
                        Entry: {formatDateTime(confirmCheckoutRow.entryTimestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkCheckedOut}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    <div key={user.userId} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={getAvatarUrl(user)}
                            alt={user.userName}
                            className="object-cover"
                          />
                          <AvatarFallback>{getInitials(user.userName)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {user.userName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Badge
                              className={
                                userTypeClassMap[user.userType] ?? "bg-slate-100 text-slate-700"
                              }
                            >
                              {prettyLabel(user.userType)}
                            </Badge>
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5" />
                              {user.uid ?? "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddEntry(user)}
                        disabled={creatingUserId === user.userId}
                      >
                        {creatingUserId === user.userId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Check In"
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
    </div>
  );
}
