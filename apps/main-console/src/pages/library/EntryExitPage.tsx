import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, DoorOpen, List, Loader2, LogIn, LogOut, Search } from "lucide-react";
import { toast } from "sonner";
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
  markLibraryEntryExitAsCheckedOut,
  searchLibraryUsers,
} from "@/services/library-entry-exit.service";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

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
  const user = preview.user;
  const isCheckedIn = todayEntry?.currentStatus === "CHECKED_IN";
  const isInactive = user.isActive === false;
  const programLabel = user.programCourseShortName?.trim() || user.programCourse || "-";
  const fallbackBg = getColorFromName(user.name);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const overdueRows = preview.circulationRows.filter(
    (r) => r.status !== "RETURNED" && (r.status === "OVERDUE" || r.daysLate > 0),
  );
  const overdueCount = overdueRows.length;

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

  return (
    <Card className="overflow-hidden border shadow-md">
      <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge
            className={
              previewUserTypeBadgeClassMap[user.userType] ??
              "bg-slate-100 text-slate-700 border-slate-200"
            }
          >
            {prettyLabel(user.userType)}
          </Badge>
          <Badge
            className={
              isInactive
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-emerald-100 text-emerald-800 border-emerald-200"
            }
          >
            {isInactive ? "Inactive" : "Active"}
          </Badge>
        </div>
        <Badge className={statusBadgeClass}>{statusLabel}</Badge>
      </div>

      <div className="grid grid-cols-3 [&>*]:border [&>*]:border-slate-300">
        <div className="row-span-2 flex flex-col items-center justify-center gap-3 p-6">
          <Avatar className="h-32 w-32 border-2 border-purple-300 shadow-md">
            <AvatarImage src={avatarUrl} alt={user.name} className="object-cover" />
            <AvatarFallback className={`${fallbackBg} text-white font-bold text-3xl`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center text-2xl font-bold uppercase tracking-wide text-slate-900">
            {user.name}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">UID</div>
          <div className="font-mono text-lg font-semibold text-slate-900">{user.uid || "-"}</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Shift</div>
          <div className="text-lg font-semibold text-slate-900">{user.shift || "-"}</div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Program Course</div>
          <div className="text-lg font-semibold text-slate-900">{programLabel}</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Semester</div>
          <div className="text-lg font-semibold text-slate-900">{user.classOrSemester || "-"}</div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Books Overdue</div>
          <div
            className={`text-4xl font-bold ${overdueCount > 0 ? "text-red-600" : "text-slate-400"}`}
          >
            {overdueCount}
          </div>
        </div>
        <div className="col-span-2 flex items-center p-4">
          {overdueCount === 0 ? (
            <span className="text-sm text-slate-500">No overdue books.</span>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {overdueRows.slice(0, 3).map((r) => (
                <li key={r.id} className="text-slate-700">
                  • {r.title || "-"} <span className="text-red-600">({r.daysLate}d late)</span>
                </li>
              ))}
              {overdueRows.length > 3 && (
                <li className="text-slate-500">+ {overdueRows.length - 3} more</li>
              )}
            </ul>
          )}
        </div>

        <div className="p-3">
          <Button
            type="button"
            onClick={onCheckIn}
            disabled={isActionLoading || isCheckedIn || isInactive}
            className="h-20 w-full bg-green-600 text-xl font-bold text-white hover:bg-green-700"
          >
            {isActionLoading && !isCheckedIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            ENTRY
          </Button>
        </div>
        <div className="col-span-2 p-3">
          <Button
            type="button"
            onClick={onCheckOut}
            disabled={isActionLoading || !isCheckedIn}
            variant="destructive"
            className="h-20 w-full text-xl font-bold"
          >
            {isActionLoading && isCheckedIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-5 w-5" />
            )}
            EXIT
          </Button>
        </div>
      </div>

      {isInactive && (
        <div className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-900">User Inactive</p>
            <p className="mt-1 text-sm text-red-800">
              This user is inactive. Entry / exit may be restricted.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function EntryExitPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [candidateSearchLoading, setCandidateSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewData, setPreviewData] = useState<LibraryEntryExitPreviewPayload | null>(null);
  const [todayEntry, setTodayEntry] = useState<LibraryEntryExitRow | null>(null);
  const [noCandidateFound, setNoCandidateFound] = useState(false);

  const loadCandidateByUserId = useCallback(
    async (userId: number, searchLabel?: string) => {
      try {
        setCandidateSearchLoading(true);
        setNoCandidateFound(false);
        const [previewRes, listRes] = await Promise.all([
          getLibraryEntryExitPreview(userId),
          getLibraryEntryExitList({ page: 1, limit: 200, date: today }),
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
    [today],
  );

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_entry_exit");

    const handleLibraryEntryExitUpdate = (data: LibraryEntryExitSocketUpdate) => {
      toast.info(data.message);
      if (previewData?.user.userId === data.userId) {
        void loadCandidateByUserId(data.userId);
      }
    };

    socket.on("library_entry_exit_update", handleLibraryEntryExitUpdate);

    return () => {
      socket.off("library_entry_exit_update", handleLibraryEntryExitUpdate);
      socket.emit("unsubscribe_library_entry_exit");
    };
  }, [socket, isConnected, previewData?.user.userId, loadCandidateByUserId]);

  const handleDownload = () => {
    const run = async () => {
      try {
        const blob = await downloadLibraryEntryExitExcel({ date: today });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `library-entry-exit-${today}.xlsx`;
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
    <div className="min-h-screen py-2 sm:py-4">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <LibraryPageHeader
          icon={DoorOpen}
          title="Library Entry / Exit"
          subtitle="Search users and record library check-in or check-out."
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              className="w-full sm:w-auto shrink-0"
            >
              <List className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          }
        />

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
      </div>
    </div>
  );
}
