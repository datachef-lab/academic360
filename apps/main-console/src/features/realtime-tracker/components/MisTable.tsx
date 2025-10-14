import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, Globe, Building } from "lucide-react";
import { MisTableData } from "../types/mis-types";

interface MisTableProps {
  data: MisTableData;
  isLoading?: boolean;
}

export function MisTable({ data, isLoading }: MisTableProps) {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table className="border-collapse w-full">
            {/* Fixed Header */}
            <TableHeader className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 z-10">
              <TableRow className="border-b-2 border-blue-200">
                <TableHead className="w-[300px] text-sm font-bold text-gray-800 py-4 px-6 text-left border-r-2 border-blue-200 bg-blue-100">
                  Program Course
                </TableHead>
                <TableHead className="text-center text-sm font-bold text-white py-4 px-4 border-r-2 border-blue-200 bg-blue-600">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    Admitted
                  </div>
                </TableHead>
                <TableHead className="text-center text-sm font-bold text-white py-4 px-4 border-r-2 border-green-200 bg-green-600">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Subject Selection Done
                  </div>
                </TableHead>
                <TableHead className="text-center text-sm font-bold text-white py-4 px-4 border-r-2 border-purple-200 bg-purple-600">
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="h-4 w-4" />
                    Online Reg. Done
                  </div>
                </TableHead>
                <TableHead className="text-center text-sm font-bold text-white py-4 px-6 bg-orange-600">
                  <div className="flex items-center justify-center gap-2">
                    <Building className="h-4 w-4" />
                    Physical Reg. Done
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            {/* Table Body with All Data Rows */}
            <TableBody>
              {data.data.map((row, index) => {
                const isTotal = row.programCourseName === "Total";
                return (
                  <TableRow
                    key={index}
                    className={`border-b border-gray-300 hover:bg-gray-100 transition-colors duration-200 ${
                      isTotal ? "bg-gradient-to-r from-blue-100 to-indigo-100 font-bold border-t-4 border-blue-400" : ""
                    }`}
                  >
                    <TableCell
                      className={`font-semibold text-sm py-3 px-6 text-gray-900 border-r-2 border-gray-300 ${
                        isTotal ? "bg-blue-100" : "bg-gray-50"
                      }`}
                    >
                      {row.programCourseName}
                    </TableCell>
                    <TableCell
                      className={`text-center py-3 px-4 border-r-2 border-blue-200 ${
                        isTotal ? "bg-blue-100" : "bg-blue-50"
                      }`}
                    >
                      <span className="text-sm font-bold text-blue-800">{row.admitted.toLocaleString()}</span>
                    </TableCell>
                    <TableCell
                      className={`text-center py-3 px-4 border-r-2 border-green-200 ${
                        isTotal ? "bg-blue-100" : "bg-green-50"
                      }`}
                    >
                      <span className="text-sm font-bold text-green-800">
                        {row.subjectSelectionDone.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-center py-3 px-4 border-r-2 border-purple-200 ${
                        isTotal ? "bg-blue-100" : "bg-purple-50"
                      }`}
                    >
                      <span className="text-sm font-bold text-purple-800">{row.onlineRegDone.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className={`text-center py-3 px-6 ${isTotal ? "bg-blue-100" : "bg-orange-50"}`}>
                      <span className="text-sm font-bold text-orange-800">{row.physicalRegDone.toLocaleString()}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
