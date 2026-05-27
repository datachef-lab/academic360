import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LIVE_STUDENTS, type LiveStudentAction } from "../data/mock-data";
import { VisualCard } from "./VisualCard";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "./FeesTable";

const ACTION_LABEL: Record<LiveStudentAction, string> = {
  viewing_fees: "Fees page",
  on_gateway: "Gateway",
  downloading_pdf: "Receipt PDF",
  generating_challan: "Challan",
  viewing_slabs: "Slabs",
  installment_plan: "Installment",
};

const ACTION_STYLE: Record<LiveStudentAction, string> = {
  viewing_fees: "bg-violet-100 text-violet-800",
  on_gateway: "bg-amber-100 text-amber-800",
  downloading_pdf: "bg-sky-100 text-sky-800",
  generating_challan: "bg-orange-100 text-orange-800",
  viewing_slabs: "bg-emerald-100 text-emerald-800",
  installment_plan: "bg-pink-100 text-pink-800",
};

export function LiveStudentsTracker() {
  const onlineCount = LIVE_STUDENTS.filter((s) => s.lastSeenSec < 30).length;

  return (
    <VisualCard
      title="Students on fees portal"
      headerRight={
        <Badge className="border-0 bg-[#7c3aed] text-white hover:bg-[#7c3aed]">
          {onlineCount} active
        </Badge>
      }
      noPadding
    >
      <div className="p-3">
        <div className="max-h-[min(420px,55vh)] w-full overflow-auto rounded-md border border-[#a0a0a0] bg-white">
          <FeesTable fixed={false}>
            <FeesTableHeader>
              <FeesTableHead className="min-w-[160px]">Student</FeesTableHead>
              <FeesTableHead className="min-w-[140px]">Program · batch</FeesTableHead>
              <FeesTableHead className="min-w-[72px]">Sem</FeesTableHead>
              <FeesTableHead className="min-w-[100px]">Action</FeesTableHead>
              <FeesTableHead className="min-w-[180px]">Detail</FeesTableHead>
              <FeesTableHead className="min-w-[88px]">Since</FeesTableHead>
            </FeesTableHeader>
            <FeesTableBody>
              {LIVE_STUDENTS.map((student) => (
                <FeesTableRow key={student.id}>
                  <FeesTableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#ede9fe] text-xs font-semibold text-[#1a1a1a]">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-[#1a1a1a]">{student.name}</p>
                        <p className="text-xs text-[#1a1a1a]">{student.prn}</p>
                      </div>
                    </div>
                  </FeesTableCell>
                  <FeesTableCell>
                    <p className="text-[#1a1a1a]">{student.program}</p>
                    <p className="text-xs text-[#1a1a1a]">Batch {student.batch}</p>
                  </FeesTableCell>
                  <FeesTableCell>{student.semester}</FeesTableCell>
                  <FeesTableCell>
                    <Badge className={ACTION_STYLE[student.action]}>
                      {ACTION_LABEL[student.action]}
                    </Badge>
                  </FeesTableCell>
                  <FeesTableCell className="max-w-[220px] truncate">{student.detail}</FeesTableCell>
                  <FeesTableCell>
                    <span className="flex items-center gap-1.5 text-[#1a1a1a]">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${student.lastSeenSec < 30 ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      {student.startedAt}
                    </span>
                  </FeesTableCell>
                </FeesTableRow>
              ))}
            </FeesTableBody>
          </FeesTable>
        </div>
      </div>
    </VisualCard>
  );
}
