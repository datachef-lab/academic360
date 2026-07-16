import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CheckCircle, Globe, Building, IdCard } from "lucide-react";
import { MisTableData } from "../types/mis-types";
import { cn } from "@/lib/utils";

/** How long a just-updated cell stays highlighted (ms). */
const CELL_FLASH_MS = 1600;

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
    key: "idCardIssued",
    label: "ID card issued",
    icon: IdCard,
    headBg: "bg-teal-600",
    headBorder: "border-teal-700",
    cellBg: "bg-teal-50",
    cellBorder: "border-teal-200",
    text: "text-teal-900",
    getValue: (row: MisTableData["data"][0]) => row.idCardIssued ?? 0,
  },
  {
    key: "subjectSelectionDone",
    label: "Subject selection",
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
    label: "Online Reg.",
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
    label: "Physical Reg.",
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
  // Realtime change flash: remember the previous value of every (row, metric)
  // cell; when a socket update changes a value, highlight that cell briefly so
  // the viewer can spot exactly what moved.
  const prevValuesRef = useRef<Map<string, number>>(new Map());
  const [flashedCells, setFlashedCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevValuesRef.current;
    const next = new Map<string, number>();
    const changed = new Set<string>();
    for (const row of data.data) {
      for (const col of METRIC_COLUMNS) {
        const key = `${row.programCourseName}|${col.key}`;
        const value = col.getValue(row);
        next.set(key, value);
        if (prev.size > 0 && prev.has(key) && prev.get(key) !== value) {
          changed.add(key);
        }
      }
    }
    prevValuesRef.current = next;
    if (changed.size === 0) return;
    setFlashedCells((cur) => new Set([...cur, ...changed]));
    // No cleanup: parent re-renders recreate `data` while fetching, and a
    // cleanup would cancel the un-flash timer, leaving cells stuck highlighted.
    setTimeout(() => {
      setFlashedCells((cur) => {
        const rest = new Set(cur);
        changed.forEach((k) => rest.delete(k));
        return rest;
      });
    }, CELL_FLASH_MS);
  }, [data]);

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
            <col className="w-[30%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
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
                  {METRIC_COLUMNS.map((col, colIdx) => {
                    const isFlashed = flashedCells.has(`${row.programCourseName}|${col.key}`);
                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "px-3 py-3 text-center text-sm tabular-nums transition-colors duration-500",
                          col.cellBg,
                          colIdx < METRIC_COLUMNS.length - 1 && `border-r-2 ${col.cellBorder}`,
                          isTotal && "bg-blue-100",
                          isFlashed && "bg-yellow-200",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block text-sm font-bold transition-transform duration-300",
                            col.text,
                            isFlashed && "scale-150 text-base",
                          )}
                        >
                          {col.getValue(row).toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
