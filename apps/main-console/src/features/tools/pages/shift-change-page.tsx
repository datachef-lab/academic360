import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowLeftRight, Loader2, RefreshCcw, Search, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchStudentByUid } from "@/services/student";
import ShiftChangePanel from "@/components/student/ShiftChangePanel";
import { IdCardPageHeader } from "@/features/idcard/components/page-header";

export default function ShiftChangePage() {
  const navigate = useNavigate();
  const [uidInput, setUidInput] = useState("");
  // The UID actually being looked up (set on submit, not on every keystroke).
  const [searchUid, setSearchUid] = useState<string>("");

  const studentQuery = useQuery({
    queryKey: ["shift-change-student", searchUid],
    enabled: Boolean(searchUid),
    queryFn: () => fetchStudentByUid(searchUid),
    retry: false,
  });

  const handleSearch = () => {
    const uid = uidInput.trim();
    if (!uid) return;
    setSearchUid(uid);
  };

  const student = studentQuery.data;
  const notFound =
    Boolean(searchUid) && !studentQuery.isFetching && !student && studentQuery.isError;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <IdCardPageHeader
        icon={ArrowLeftRight}
        title="Shift Change"
        subtitle="Search a student by UID to change their shift, section, or class roll number."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/tools")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
        }
      />

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <label className="text-xs font-medium text-muted-foreground">Student UID</label>
        <div className="mt-1.5 flex gap-2">
          <Input
            value={uidInput}
            onChange={(e) => setUidInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Enter student UID, e.g. 0704230099"
            className="max-w-md"
          />
          <Button onClick={handleSearch} disabled={!uidInput.trim() || studentQuery.isFetching}>
            {studentQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Search</span>
          </Button>
        </div>
      </div>

      {/* Result */}
      {studentQuery.isFetching ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading student…
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <UserX className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-gray-700">
            No student found for UID “{searchUid}”.
          </p>
          <p className="text-xs text-muted-foreground">Check the UID and try again.</p>
        </div>
      ) : student ? (
        <ShiftChangePanel
          // remount when a different student is loaded so internal state resets cleanly
          key={student.id ?? student.uid}
          student={student}
          onSuccess={async (newUid) => {
            // After a shift change the UID may rotate; refetch by the new UID.
            if (newUid && newUid !== searchUid) {
              setUidInput(newUid);
              setSearchUid(newUid);
            } else {
              await studentQuery.refetch();
            }
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <RefreshCcw className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Search a UID above to load the student and change their shift.
          </p>
        </div>
      )}
    </div>
  );
}
