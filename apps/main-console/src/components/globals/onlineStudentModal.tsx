import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentAvatar } from "@/components/student/StudentAvatar";
import type { OnlineStudentDto } from "@/services/student";
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
  const columnCount = 7;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 max-h-[70vh] border-none overflow-hidden">
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

        <div className="p-4 max-h-[60vh] overflow-auto">
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-14 text-center">#</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Program Course</TableHead>
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
                      <TableCell>{student.uid ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <StudentAvatar uid={student.uid} name={student.name} size="sm" />
                          <span className="font-medium">{student.name ?? "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.currentPromotion?.class?.name ?? "-"}</TableCell>
                      <TableCell>{student.programCourse?.name ?? "-"}</TableCell>
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
