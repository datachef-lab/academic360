import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StudentDto } from "@repo/db/dtos/user";
import { Circle, User } from "lucide-react";

/**
 * Batch-related info for a student.
 * Marked optional because backend may not always return all relations.
 */
//   interface BatchInfo {
//     session?: { name?: string };
//     shift?: { name?: string };
//     section?: { name?: string };
//     semester?: { name?: string };
//   }

/**
 * ✅ UPDATED PROPS
 * - `loading` → matches the prop passed from parent
 * - `isError` → added because parent was passing it
 */
interface OnlineStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentDto[];
  loading: boolean;
  isError: boolean;
}

export function OnlineStudentsModal({ open, onOpenChange, students, loading, isError }: OnlineStudentsModalProps) {
  useEffect(() => {
    if (students.length > 0) {
      console.log("📘 Online Students Data:", JSON.stringify(students, null, 2));
    }
  }, [students]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 max-h-[70vh] border-none overflow-hidden">
        {/* ---------------- Header ---------------- */}

        <DialogHeader className="relative px-6 py-5 bg-blue-600 overflow-hidden">
          {/* Decorative elements */}
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

        {/* ---------------- Body ---------------- */}
        <div className="p-4 max-h-[60vh] overflow-auto">
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-14 text-center">#</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Reg. No.</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* 🔄 Loading state */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-sm">
                      Loading online students…
                    </TableCell>
                  </TableRow>
                )}

                {/* ❌ Error state */}
                {isError && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-sm text-red-500">
                      Failed to load online students
                    </TableCell>
                  </TableRow>
                )}

                {/* 🚫 Empty state */}
                {!loading && !isError && students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                      No students online
                    </TableCell>
                  </TableRow>
                )}

                {/* ✅ Data rows */}
                {!loading &&
                  !isError &&
                  students.map((student, index) => {
                    //   const batch = student.currentBatch as BatchInfo | null;

                    return (
                      <TableRow key={student.id ?? index} className="hover:bg-muted/50 transition">
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>{student.programCourse?.name ?? "-"}</TableCell>
                        <TableCell>{student.currentPromotion?.session?.name ?? "-"}</TableCell>
                        <TableCell>{student.currentPromotion?.shift?.name ?? "-"}</TableCell>
                        <TableCell>{student.currentPromotion?.section?.name ?? "-"}</TableCell>
                        <TableCell>{student.currentPromotion?.class?.name ?? "-"}</TableCell>
                        <TableCell>{student.uid ?? "-"}</TableCell>
                        <TableCell>{student.rollNumber ?? "-"}</TableCell>
                        <TableCell>{student.registrationNumber ?? "-"}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
