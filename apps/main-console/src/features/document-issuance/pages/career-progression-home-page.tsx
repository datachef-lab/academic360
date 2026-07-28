import { useCallback, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAcademicYear } from "@/hooks/useAcademicYear";

function parseExportFileName(contentDisposition: string | undefined): string | null {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}

async function downloadCareerProgressionExport(academicYearFilter: string): Promise<void> {
  const params = new URLSearchParams();
  if (academicYearFilter !== "all") {
    params.set("academicYearId", academicYearFilter);
  }
  const qs = params.toString();

  const response = await axiosInstance.get(
    `/api/academics/career-progression-forms/export${qs ? `?${qs}` : ""}`,
    { responseType: "blob" },
  );

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    parseExportFileName(response.headers["content-disposition"]) ??
    `career-progression-forms_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function CareerProgressionHomePage() {
  const { availableAcademicYears, currentAcademicYear } = useAcademicYear();
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  const handleDownloadExcel = useCallback(async () => {
    setExporting(true);
    try {
      await downloadCareerProgressionExport(academicYearFilter);
      toast.success("Career progression Excel export downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [academicYearFilter]);

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-violet-800">Career progression forms</h1>
          <p className="text-muted-foreground mt-1">
            Download submitted career progression data as a formatted Excel report (one row per
            student; active field masters as columns in certificate/field sequence order).
          </p>
        </div>

        <Card className="border-violet-100 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-violet-100 p-2 text-violet-800">
                <FileSpreadsheet className="h-6 w-6" aria-hidden />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg text-violet-900">Export to Excel</CardTitle>
                <CardDescription>
                  Uses the same styled Excel format as other admin reports: grey header row, grid
                  borders, frozen header, and auto-sized columns.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground shrink-0">Academic year</span>
                <Select
                  value={academicYearFilter}
                  onValueChange={setAcademicYearFilter}
                  disabled={exporting}
                >
                  <SelectTrigger className="w-[min(100%,280px)]">
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {availableAcademicYears.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)}>
                        {y.year}
                        {currentAcademicYear?.id === y.id ? " (current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                className="bg-violet-700 hover:bg-violet-800 sm:shrink-0"
                disabled={exporting}
                onClick={() => void handleDownloadExcel()}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Preparing…" : "Download Excel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
