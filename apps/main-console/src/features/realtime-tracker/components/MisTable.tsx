import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CheckCircle, Globe, Building } from "lucide-react";
import { MisTableData } from "../types/mis-types";
import { cn } from "@/lib/utils";

interface MisTableProps {
  data: MisTableData;
  isLoading?: boolean;
}

const METRIC_COLUMNS = [
  {
    key: "admitted",
    label: "Admitted",
    icon: Users,
    headBg: "bg-blue-600",
    headBorder: "border-blue-700",
    cellBg: "bg-blue-50",
    cellBorder: "border-blue-200",
    text: "text-blue-900",
    getValue: (row: MisTableData["data"][0]) => row.admitted,
  },
  {
    key: "subjectSelectionDone",
    label: "Subject selection done",
    icon: CheckCircle,
    headBg: "bg-green-600",
    headBorder: "border-green-700",
    cellBg: "bg-green-50",
    cellBorder: "border-green-200",
    text: "text-green-900",
    getValue: (row: MisTableData["data"][0]) => row.subjectSelectionDone,
  },
  {
    key: "onlineRegDone",
    label: "Online reg. done",
    icon: Globe,
    headBg: "bg-purple-600",
    headBorder: "border-purple-700",
    cellBg: "bg-purple-50",
    cellBorder: "border-purple-200",
    text: "text-purple-900",
    getValue: (row: MisTableData["data"][0]) => row.onlineRegDone,
  },
  {
    key: "physicalRegDone",
    label: "Physical reg. done",
    icon: Building,
    headBg: "bg-orange-600",
    headBorder: "border-orange-700",
    cellBg: "bg-orange-50",
    cellBorder: "border-orange-200",
    text: "text-orange-900",
    getValue: (row: MisTableData["data"][0]) => row.physicalRegDone,
  },
] as const;

function HeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TableHead
      className={cn(
        "h-16 border-b-2 p-2 align-middle font-bold text-white last:border-r-0",
        className,
      )}
    >
      <div className="flex min-h-[52px] flex-col items-center justify-center gap-1 text-center text-sm leading-snug">
        {children}
      </div>
    </TableHead>
  );
}

export function MisTable({ data, isLoading }: MisTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col">
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table containerClassName="overflow-x-auto" className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[15.5%]" />
            <col className="w-[15.5%]" />
            <col className="w-[15.5%]" />
            <col className="w-[15.5%]" />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50">
            <TableRow className="border-b-2 border-blue-200 hover:bg-transparent">
              <HeaderCell className="border-r-2 border-blue-200 bg-blue-100 text-left text-gray-900">
                <span className="items-start text-left text-base font-bold text-gray-800">
                  Program course
                </span>
              </HeaderCell>
              {METRIC_COLUMNS.map((col) => (
                <HeaderCell key={col.key} className={cn("border-r-2", col.headBorder, col.headBg)}>
                  <col.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{col.label}</span>
                </HeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((row, index) => {
              const isTotal = row.programCourseName === "Total";
              return (
                <TableRow
                  key={index}
                  className={cn(
                    "border-b border-gray-300 hover:bg-gray-50",
                    isTotal &&
                      "border-t-4 border-blue-400 bg-gradient-to-r from-blue-100 to-indigo-100 font-bold",
                  )}
                >
                  <TableCell
                    className={cn(
                      "border-r-2 border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900",
                      isTotal ? "bg-blue-100" : "bg-gray-50",
                    )}
                  >
                    {row.programCourseName}
                  </TableCell>
                  {METRIC_COLUMNS.map((col, colIdx) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-3 py-3 text-center text-sm tabular-nums",
                        col.cellBg,
                        colIdx < METRIC_COLUMNS.length - 1 && `border-r-2 ${col.cellBorder}`,
                        isTotal && "bg-blue-100",
                      )}
                    >
                      <span className={cn("text-sm font-bold", col.text)}>
                        {col.getValue(row).toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
