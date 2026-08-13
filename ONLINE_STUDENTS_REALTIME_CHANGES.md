# Online Students Modal — Real-Time Update (No More Refetching)

## The bug

**Symptom:** The header count updated instantly (3 → 4), but the new student's row in the "Online Students" modal took a visible moment to appear — and while it did, it briefly showed a full "Loading online students…" spinner state for everyone who had the modal open.

**Root cause:** The backend's socket events for presence never carried any student data — just signals:

- `students_online_count` → just a number.
- `students_online_updated` → just a timestamp, meaning "presence changed, go re-check."

The modal's data was wired up as a React Query hook keyed on that changing timestamp: `queryKey: ["online-students", studentsOnlineVersion]`. Every time `studentsOnlineVersion` changed (i.e. **any** student joining or leaving, not just the one you'd expect), React Query treated it as a brand-new query and threw away the old data, refetching the **entire list** from `GET /api/students/online` from scratch — a full round trip to the server and a fresh database query — just to show one new row. That network round trip was the entire source of the delay.

In short: the backend never told the frontend _who_ came online, only _that_ someone did — so the frontend had no choice but to ask the server again, every single time.

## The problem before

The header showed a live count of online students (e.g. "3 Students") and this part always worked fine — it updates instantly using a socket connection.

But the **modal** that opens when you click that count (the table listing each online student) worked differently. Every time _any_ student came online or went offline, the modal didn't get the new student's info directly — it only got a signal saying "something changed, go fetch the list again." So it made a fresh API call (`GET /api/students/online`) to reload the _entire_ table from the database. That round trip to the server is what caused the visible delay — the count would jump from 3 to 4 instantly, but the new student's row would only show up a moment later, after the refetch finished.

## The fix

Instead of just telling the frontend "something changed, go fetch again," the backend now sends the **actual student's data** directly in the same real-time message. So the frontend never needs to ask the server for anything extra — it already has what it needs the instant a student logs in or out.

Think of it like this:

- **Before:** "Someone came online!" → frontend calls the server → "OK here's the full updated list" → table updates (slow, extra round trip).
- **After:** "Someone came online, and here's their full info!" → table updates immediately (no extra round trip).

## What changed, file by file

### Backend — `apps/backend/src/services/socketService.ts`

1. **When a student logs in / connects** (`registerUser`), the server now looks up that one student's details (name, UID, class, shift, program, login time) and sends them out immediately over a new event called `student_online_detail`.
   - This lookup happens in the background and does **not** block or slow down the existing "count" update — the header count still updates exactly as fast as before.

2. **When a student fully logs out / disconnects** (`removeSocket`), the server now sends a new event `student_offline_detail` with just that student's ID, once it's confirmed they're truly offline (not just refreshing the page or switching tabs).

These are two brand-new messages sent alongside the existing ones — nothing about the existing count messages was changed or removed.

### Frontend — `apps/main-console/src/hooks/useActiveUsers.ts`

- This is the hook that listens to the socket. It now also listens for the two new messages (`student_online_detail` / `student_offline_detail`) and can notify the component using it, without touching any of the existing count-related code.

### Frontend — `apps/main-console/src/components/globals/ActiveUsersAvatars.tsx`

- This is the component that shows the header pill and owns the table's data.
- Previously, it silently refetched the entire student list every time presence changed.
- Now, when it hears "a student came online," it just adds that student's row straight into the table's data (or updates it, if already there). When it hears "a student went offline," it removes that row. No server call involved for either case.
- The very first time you open the modal, it still does one normal API call to load the initial list — that part hasn't changed, it's only the "student joined/left while I'm watching" behavior that no longer refetches.

## Net result

- Header count: same as before, untouched, still instant.
- Modal table: now updates the instant a student comes online or goes offline — no loading delay, no extra network requests, because the server just hands over the data it already fetched instead of making the browser ask for it again.

---

## Full code — the entire online-students module, split by file

Everything below is the complete, current code for every file involved in showing the header count and the modal's live table, grouped by file name. Read top to bottom to see the whole flow: backend detects presence → backend emits socket events → frontend hook receives them → frontend component feeds the table → modal renders the table.

**Files in this module:**

| File                                                              | Role                                       | Changed?     |
| ----------------------------------------------------------------- | ------------------------------------------ | ------------ |
| `apps/backend/src/services/socketService.ts`                      | Detects presence, emits socket events      | ✅ Changed   |
| `apps/main-console/src/hooks/useActiveUsers.ts`                   | Owns the socket connection on the frontend | ✅ Changed   |
| `apps/main-console/src/components/globals/ActiveUsersAvatars.tsx` | Header pill + owns the modal's data        | ✅ Changed   |
| `apps/main-console/src/components/globals/onlineStudentModal.tsx` | The modal/table UI                         | ⬜ Unchanged |
| `apps/main-console/src/services/student.ts`                       | API call + row type                        | ⬜ Unchanged |

---

## Backend files

---

### `apps/backend/src/services/socketService.ts`

**What it does:** detects when a user connects/disconnects over the socket, tracks who's online, and broadcasts presence events. This file already ran the header-count broadcast; the new code adds the two per-student detail events.

_(relevant parts only — this file also handles unrelated things like notifications and realtime trackers, omitted here for clarity)_

```ts
import * as studentService from "@/features/user/services/student.service";

class SocketService {
  // ...

  // Register a user with their socket ID and fetch user info
  private async registerUser(userId: string, socketId: string) {
    this.socketToUserId.set(socketId, userId);

    const existingSockets = this.activeConnections.get(userId);
    if (!existingSockets || existingSockets.size === 0) {
      this.userConnectedAt.set(userId, new Date());
    }

    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    this.activeConnections.get(userId)?.add(socketId);

    // Fetch and cache user info if not already cached or if it's a new connection
    if (!this.userInfoCache.has(userId)) {
      try {
        const userIdNum = Number(userId);
        if (!isNaN(userIdNum)) {
          const user = await userService.findById(userIdNum);
          if (
            user &&
            (user.type === "ADMIN" || user.type === "STAFF" || user.type === "STUDENT") &&
            user.isActive !== false
          ) {
            this.userInfoCache.set(userId, {
              id: userIdNum,
              name: user.name || "Unknown",
              image: user.image || null,
              type: user.type as "ADMIN" | "STAFF" | "STUDENT",
              tabActive: true,
            });

            // Push the new student's full row data over the socket so the
            // online-students modal can splice it in directly instead of
            // refetching the whole list. Fire-and-forget: must not delay
            // the count broadcast below, which drives the header widget.
            if (user.type === "STUDENT") {
              void this.emitStudentOnlineDetail(userId);
            }
          }
        }
      } catch (error) {
        log.error(`Error fetching user info for ${userId}`, { error });
      }
    }

    // After adding a socket, recompute user's tabActive based on all sockets
    this.recomputeUserTabActive(userId);

    // ... (Redis presence-store writes — unchanged, omitted)
  }

  // Build and emit the full row data for a student who just came online, so
  // the online-students modal can append it to its list without a refetch.
  // Mirrors the per-student enrichment the REST getOnlineStudents controller
  // already does (findByUserId + loginTime + activeClassName) so the emitted
  // shape matches OnlineStudentDto exactly.
  private async emitStudentOnlineDetail(userId: string) {
    try {
      const userIdNum = Number(userId);
      if (Number.isNaN(userIdNum)) return;

      const student = await studentService.findByUserId(userIdNum);
      if (!student) return;

      const [loginTime, activeClassName] = await Promise.all([
        this.getOnlineStudentLoginTime(userIdNum),
        studentService.getActiveClassNameForStudent(student.id as number),
      ]);

      this.io?.emit("student_online_detail", {
        ...student,
        loginTime,
        activeClassName,
      });
    } catch (error) {
      log.error(`Error building online-student detail for ${userId}`, {
        error,
      });
    }
  }

  // Remove a socket when the connection is closed
  private async removeSocket(socketId: string) {
    const userIdForSocket = this.socketToUserId.get(socketId);
    this.socketToUserId.delete(socketId);
    this.socketTabActive.delete(socketId);

    let wasStudent = false;
    this.activeConnections.forEach((sockets, userId) => {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          if (this.userInfoCache.get(userId)?.type === "STUDENT") {
            wasStudent = true;
          }
          this.activeConnections.delete(userId);
          this.userConnectedAt.delete(userId);
          // Remove from cache when user has no active connections
          this.userInfoCache.delete(userId);
        } else {
          // Update tabActive based on remaining sockets
          this.recomputeUserTabActive(userId);
        }
      }
    });

    // Also recompute for socket-mapped userId in case it wasn't found via loop
    if (userIdForSocket) {
      this.recomputeUserTabActive(userIdForSocket);
    }

    // If this user has no sockets on this instance, check if they're offline globally
    if (userIdForSocket && !this.activeConnections.has(userIdForSocket)) {
      try {
        const allGlobal = await this.io?.in(`user:${userIdForSocket}`).allSockets();
        if (allGlobal && allGlobal.size === 0) {
          // Truly offline on all instances — clean up Redis
          const pub = getRedisPubClient();
          if (pub) {
            await pub.sRem(ONLINE_USERS_SET, userIdForSocket);
            await pub.del(userInfoKey(userIdForSocket));
          }
          if (wasStudent) {
            this.io?.emit("student_offline_detail", {
              userId: Number(userIdForSocket),
            });
          }
        }
      } catch (error) {
        log.error(`Error checking global sockets for user ${userIdForSocket}`, {
          error,
        });
      }
    }
  }

  // Broadcast active users list to all connected clients — drives the header
  // count. Untouched by this change.
  private async broadcastActiveUsers() {
    // ...
    this.io.emit("active_users_update", adminStaff);
    this.io.emit("students_online_count", studentCount);
    this.io.emit("students_online_updated", Date.now());
    // ...
  }
}
```

---

## Frontend files

---

### `apps/main-console/src/hooks/useActiveUsers.ts`

**What it does:** owns the actual socket connection. Listens for every presence event coming from the backend and hands the data up to whatever component uses this hook.

_(full file)_

```ts
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { OnlineStudentDto } from "@/services/student";

export interface ActiveUser {
  id: number;
  name: string;
  image: string | null;
  type: "ADMIN" | "STAFF";
  tabActive?: boolean;
}

interface UseActiveUsersOptions {
  userId?: string;
  /** Fired with a student's full row data the moment they come online. */
  onStudentOnline?: (student: OnlineStudentDto) => void;
  /** Fired with a student's userId the moment they go fully offline. */
  onStudentOffline?: (userId: number) => void;
}

interface UseActiveUsersResult {
  activeUsers: ActiveUser[];
  studentsOnlineCount: number;
  isConnected: boolean;
  error: string | null;
}

export function useActiveUsers(options: UseActiveUsersOptions = {}): UseActiveUsersResult {
  const { userId, onStudentOnline, onStudentOffline } = options;
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [studentsOnlineCount, setStudentsOnlineCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Kept in refs (not effect deps) so passing new callback identities never
  // tears down/reconnects the socket.
  const onStudentOnlineRef = useRef(onStudentOnline);
  const onStudentOfflineRef = useRef(onStudentOffline);
  useEffect(() => {
    onStudentOnlineRef.current = onStudentOnline;
    onStudentOfflineRef.current = onStudentOffline;
  }, [onStudentOnline, onStudentOffline]);

  useEffect(() => {
    // Initialize socket connection
    const backendEnv = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    const parsed = new URL(backendEnv);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const pathPrefix = parsed.pathname.replace(/\/$/, "");
    const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

    const socket = io(origin, {
      path: socketPath,
      withCredentials: false,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("[ActiveUsers] Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);

      // Authenticate with user ID if provided
      if (userId) {
        socket.emit("authenticate", userId);
      }

      // Request active users list
      socket.emit("get_active_users");

      // Send initial tab visibility state
      socket.emit("tab_visibility", { isActive: !document.hidden });
    });

    socket.on("disconnect", () => {
      console.log("[ActiveUsers] Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[ActiveUsers] Socket connection error:", err);
      setError(err.message);
      setIsConnected(false);
    });

    // Listen for active users updates
    socket.on("active_users_update", (users: ActiveUser[]) => {
      console.log("[ActiveUsers] Active users update received:", users);
      setActiveUsers(users);
    });

    // Listen for initial active users list
    socket.on("active_users_list", (users: ActiveUser[]) => {
      console.log("[ActiveUsers] Active users list received:", users);
      setActiveUsers(users);
    });

    socket.on("students_online_count", (count: number) => {
      setStudentsOnlineCount(Number(count) || 0);
    });

    // Push a student's full row data in the moment they come online / go
    // offline, so consumers (the online-students modal) can update their
    // list directly instead of refetching.
    socket.on("student_online_detail", (student: OnlineStudentDto) => {
      onStudentOnlineRef.current?.(student);
    });

    socket.on("student_offline_detail", (payload: { userId: number }) => {
      if (payload && typeof payload.userId === "number") {
        onStudentOfflineRef.current?.(payload.userId);
      }
    });

    // Tab visibility tracking (blur inactive tabs)
    const handleVisibilityChange = () => {
      try {
        socket.emit("tab_visibility", { isActive: !document.hidden });
      } catch {
        // ignore
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  // Re-authenticate when userId changes
  useEffect(() => {
    if (socketRef.current && userId && isConnected) {
      socketRef.current.emit("authenticate", userId);
      socketRef.current.emit("get_active_users");
    }
  }, [userId, isConnected]);

  return {
    activeUsers,
    studentsOnlineCount,
    isConnected,
    error,
  };
}
```

---

### `apps/main-console/src/components/globals/ActiveUsersAvatars.tsx`

**What it does:** renders the header pill (avatars + "Students N" count) and owns the online-students table data — calls `useActiveUsers`, keeps the React Query cache for the modal in sync, and renders `OnlineStudentsModal`.

_(full file)_

```tsx
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/hooks/UserAvatar";
import { useActiveUsers } from "@/hooks/useActiveUsers";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getOnlineStudents, type OnlineStudentDto } from "@/services/student";
import { OnlineStudentsModal } from "./onlineStudentModal";
import { Users } from "lucide-react";

const ONLINE_STUDENTS_QUERY_KEY = ["online-students"];

export function ActiveUsersAvatars() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { activeUsers, studentsOnlineCount, isConnected } = useActiveUsers({
    userId: user?.id?.toString(),
    // Splice presence changes straight into the cache instead of refetching —
    // the socket already carries the student's full row data.
    onStudentOnline: (student) => {
      queryClient.setQueryData<OnlineStudentDto[]>(ONLINE_STUDENTS_QUERY_KEY, (old = []) =>
        old.some((s) => s.id === student.id)
          ? old.map((s) => (s.id === student.id ? student : s))
          : [...old, student],
      );
    },
    onStudentOffline: (userId) => {
      queryClient.setQueryData<OnlineStudentDto[]>(ONLINE_STUDENTS_QUERY_KEY, (old = []) =>
        old.filter((s) => s.userId !== userId),
      );
    },
  });

  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);

  const {
    data: onlineStudents = [],
    isLoading,
    isError,
  } = useQuery<OnlineStudentDto[]>({
    queryKey: ONLINE_STUDENTS_QUERY_KEY,
    queryFn: () => getOnlineStudents(),
    enabled: isStudentsModalOpen,
    staleTime: 30 * 1000,
  });

  const otherActiveUsers = activeUsers.filter((activeUser) => activeUser.id !== user?.id);

  if (!isConnected) {
    return null;
  }

  const maxVisible = 5;
  const visibleUsers = otherActiveUsers.slice(0, maxVisible);

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2">
          {/* Avatars */}
          {otherActiveUsers.length > 0 && (
            <div className="flex items-center -space-x-2">
              {visibleUsers.map((activeUser) => (
                <Tooltip key={activeUser.id}>
                  <TooltipTrigger asChild>
                    <UserAvatar
                      user={{
                        name: activeUser.name,
                        image: activeUser.image || undefined,
                      }}
                      size="sm"
                      className={[
                        "border-2 border-white bg-white hover:border-purple-300 transition",
                        activeUser.tabActive === false ? "opacity-70 blur-[1px]" : "",
                      ].join(" ")}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div className="font-semibold">{activeUser.name}</div>
                      <div className="text-muted-foreground">{activeUser.type}</div>
                      {activeUser.tabActive === false && (
                        <div className="text-muted-foreground">Online • Tab inactive</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Online indicator */}
          {studentsOnlineCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsStudentsModalOpen(true)}
                  className="
                   group flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   bg-gradient-to-r from-purple-500 to-purple-600
                   text-white text-sm font-medium
                   shadow-sm shadow-purple-500/25
                   hover:shadow-md hover:shadow-purple-500/40
                   hover:from-purple-600 hover:to-purple-700
                   transition-all duration-200 ease-out
                 "
                >
                  <Users className="h-4 w-4" />
                  <span className="ml-1">Students </span>

                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold">
                    {studentsOnlineCount}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-white text-black ">
                <span className="text-xs">View Online Students</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Modal */}
      <OnlineStudentsModal
        open={isStudentsModalOpen}
        onOpenChange={setIsStudentsModalOpen}
        students={onlineStudents}
        loading={isLoading}
        isError={isError}
      />
    </>
  );
}
```

---

### `apps/main-console/src/components/globals/onlineStudentModal.tsx`

**What it does:** the modal dialog + table UI. Purely presentational — just renders whatever `students` array it's handed. **Not changed** by this update; included here for completeness since it's the visible end result.

_(full file)_

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OnlineStudentDto } from "@/services/student";
import { StudentAvatar } from "@/components/student/StudentAvatar";
import { Circle, User } from "lucide-react";

interface OnlineStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: OnlineStudentDto[];
  loading: boolean;
  isError: boolean;
}

function formatLoginTime(value: string | null | undefined): string {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function OnlineStudentsModal({
  open,
  onOpenChange,
  students,
  loading,
  isError,
}: OnlineStudentsModalProps) {
  const columnCount = 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 max-h-[70vh] min-h-[340px] border-none overflow-hidden">
        <DialogHeader className="relative px-6 py-5 bg-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.2)_0%,_transparent_60%)]" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <DialogTitle className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 backdrop-blur-md shadow-md rounded-xl border border-white/20">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl text-white font-semibold ">Online Students</span>
                <div className="flex items-center gap-1.5  ml-0.5">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400 " />
                  <span className="text-xs text-white">{students.length} active now</span>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 max-h-[60vh] min-h-[220px] overflow-auto">
          <div className="border rounded-xl overflow-hidden [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-14 text-center">#</TableHead>
                  <TableHead className="w-16 text-center">Photo</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program Course</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Login Time</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="text-center py-10 text-sm">
                      Loading online students…
                    </TableCell>
                  </TableRow>
                )}

                {isError && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      className="text-center py-10 text-sm text-red-500"
                    >
                      Failed to load online students
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !isError && students.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      No students online
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  !isError &&
                  students.map((student, index) => (
                    <TableRow key={student.id ?? index} className="hover:bg-muted/50 transition">
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <StudentAvatar uid={student.uid} name={student.name} size="sm" />
                        </div>
                      </TableCell>
                      <TableCell>{student.uid ?? "-"}</TableCell>
                      <TableCell>{student.name ?? "-"}</TableCell>
                      <TableCell>{student.programCourse?.name ?? "-"}</TableCell>
                      <TableCell>
                        {student.activeClassName ?? student.currentPromotion?.class?.name ?? "-"}
                      </TableCell>
                      <TableCell>{student.currentPromotion?.shift?.name ?? "-"}</TableCell>
                      <TableCell>{formatLoginTime(student.loginTime)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### `apps/main-console/src/services/student.ts`

**What it does:** the API/type layer — defines `OnlineStudentDto` (the shape of one row) and `getOnlineStudents()`, the REST call used only for the one-time baseline fetch when the modal is first opened.

_(relevant part)_

```ts
export type OnlineStudentDto = StudentDto & {
  loginTime?: string | null;
  /** Class/semester of the student's active promotion (end_date IS NULL). */
  activeClassName?: string | null;
};

// Online students (via WebSocket tracking on backend) — used only for the
// one-time baseline fetch when the modal is first opened.
export async function getOnlineStudents(): Promise<OnlineStudentDto[]> {
  const res = await axiosInstance.get(`/api/students/online`);
  return (res.data?.payload ?? []) as OnlineStudentDto[];
}
```

### How it all connects, in order

1. A student logs in → their browser opens a socket connection and emits `authenticate`.
2. Backend `socketService.ts` → `registerUser()` runs, marks them online, and (new) calls `emitStudentOnlineDetail()` in the background.
3. Backend emits two things almost simultaneously:
   - `students_online_count` — the new total (drives the header pill, unchanged).
   - `student_online_detail` — that one student's full row data (new).
4. Frontend `useActiveUsers.ts` is listening for both and calls back into whichever component is using the hook.
5. `ActiveUsersAvatars.tsx` receives the `onStudentOnline` callback and pushes the new row straight into the React Query cache — no network call.
6. `OnlineStudentsModal` (in `onlineStudentModal.tsx`) is just rendering whatever `students` array it's given — it re-renders automatically because its data prop changed.
7. The reverse happens on logout via `student_offline_detail` / `onStudentOffline`, removing the row.
