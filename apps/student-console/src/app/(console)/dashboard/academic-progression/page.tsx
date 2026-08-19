"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { axiosInstance } from "@/lib/utils";

interface ProgressionPaper {
  subjectName: string;
  paperCode: string | null;
  internalMarks: string | null;
  theoryMarks: string | null;
  practicalMarks: string | null;
  vivaMarks: string | null;
  projectMarks: string | null;
  total: string | null;
  fullMarks: string | null;
  grade: string | null;
  status: string | null;
}

interface ProgressionAttempt {
  semester: number;
  examYear: number;
  sgpa: number | null;
  cleared: boolean;
  remarks: string | null;
  papers: ProgressionPaper[];
}

interface AcademicProgression {
  registrationNo: string | null;
  years: number[];
  attempts: ProgressionAttempt[];
}

const isFailedPaper = (status: string | null) =>
  !!status && (status.startsWith("F") || status === "AB");

export default function AcademicProgressionPage() {
  const [data, setData] = useState<AcademicProgression | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProgressionAttempt | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await axiosInstance.get("/api/academic-progression/me");
        setData(response.data?.payload ?? null);
      } catch (error) {
        console.error("Failed to fetch academic progression", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const semesters = data ? [...new Set(data.attempts.map((a) => a.semester))].sort((a, b) => a - b) : [];
  const years = data?.years ?? [];
  const attemptFor = (semester: number, year: number) =>
    data?.attempts.find((a) => a.semester === semester && a.examYear === year);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
          <TrendingUp className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Academic Progression</h1>
          <p className="text-sm text-muted-foreground">
            Semester-wise SGPA{data?.registrationNo ? ` · Reg. No. ${data.registrationNo}` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SGPA by Semester & Academic Year</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.attempts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No marks data found for your registration number.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border bg-muted px-4 py-3 text-left font-medium">Semester</th>
                    {years.map((year) => (
                      <th key={year} className="border bg-muted px-4 py-3 text-center font-medium">
                        AY {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {semesters.map((semester) => (
                    <tr key={semester}>
                      <td className="border px-4 py-3 font-medium">SEM {semester}</td>
                      {years.map((year) => {
                        const attempt = attemptFor(semester, year);
                        if (!attempt) {
                          return <td key={year} className="border px-4 py-3 bg-gray-50" />;
                        }
                        return (
                          <td key={year} className="border p-0">
                            <button
                              type="button"
                              onClick={() => setSelected(attempt)}
                              className={`flex h-full w-full items-center justify-center gap-1.5 px-4 py-3 font-semibold transition-colors ${
                                attempt.cleared
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                              title={attempt.remarks ?? undefined}
                            >
                              {attempt.cleared ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 shrink-0" />
                              )}
                              {attempt.sgpa !== null ? attempt.sgpa.toFixed(3) : "Not Cleared"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                Click a cell to view subject-wise marks for that semester.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Semester {selected?.semester} — AY {selected?.examYear}
              {selected && (
                <Badge
                  className={
                    selected.cleared
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-red-100 text-red-800 hover:bg-red-100"
                  }
                >
                  {selected.cleared ? "Cleared" : "Not Cleared"}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selected?.sgpa !== null && selected?.sgpa !== undefined
                ? `SGPA: ${selected.sgpa.toFixed(3)}`
                : (selected?.remarks ?? "")}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border bg-muted px-3 py-2 text-left font-medium">Subject</th>
                    <th className="border bg-muted px-3 py-2 text-left font-medium">Paper Code</th>
                    <th className="border bg-muted px-3 py-2 text-center font-medium">Theory</th>
                    <th className="border bg-muted px-3 py-2 text-center font-medium">Prac/Viva/Proj</th>
                    <th className="border bg-muted px-3 py-2 text-center font-medium">Internal</th>
                    <th className="border bg-muted px-3 py-2 text-center font-medium">Total</th>
                    <th className="border bg-muted px-3 py-2 text-center font-medium">Grade</th>
                    <th className="border bg-muted px-3 py-2 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.papers.map((paper, index) => (
                    <tr key={index} className={isFailedPaper(paper.status) ? "bg-red-50" : ""}>
                      <td className="border px-3 py-2">{paper.subjectName}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">{paper.paperCode ?? "—"}</td>
                      <td className="border px-3 py-2 text-center">{paper.theoryMarks ?? "—"}</td>
                      <td className="border px-3 py-2 text-center">
                        {paper.practicalMarks ?? paper.vivaMarks ?? paper.projectMarks ?? "—"}
                      </td>
                      <td className="border px-3 py-2 text-center">{paper.internalMarks ?? "—"}</td>
                      <td className="border px-3 py-2 text-center font-medium">{paper.total ?? "—"}</td>
                      <td className="border px-3 py-2 text-center">{paper.grade ?? "—"}</td>
                      <td className="border px-3 py-2 text-center">
                        <span
                          className={`font-medium ${isFailedPaper(paper.status) ? "text-red-600" : "text-green-700"}`}
                        >
                          {paper.status ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
