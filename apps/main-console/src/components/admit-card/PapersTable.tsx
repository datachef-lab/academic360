import React from "react";
import { BookOpen } from "lucide-react";
import type { AdmitCardPaper } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  papers: AdmitCardPaper[];
}

export const PapersTable: React.FC<Props> = ({ papers }) => {
  if (!papers.length) {
    return null;
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-xl">Exam Papers</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:bg-slate-100">
                <TableHead className="font-semibold text-slate-700">Paper Code</TableHead>
                <TableHead className="font-semibold text-slate-700">Paper Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper, idx) => (
                <TableRow key={`${paper.paperCode}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <code className="text-sm font-mono font-semibold text-slate-900">{paper.paperCode}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-700 font-medium">{paper.paperName}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
