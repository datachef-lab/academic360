import { useCallback, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { CareerProgressionFormDto } from "@repo/db/dtos/academics";
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

async function fetchFormsForExport(
  academicYearFilter: string,
): Promise<CareerProgressionFormDto[]> {
  const params = new URLSearchParams();
  if (academicYearFilter !== "all") {
    params.set("academicYearId", academicYearFilter);
  }
  const qs = params.toString();
  const { data } = await axiosInstance.get<{ payload: CareerProgressionFormDto[] }>(
    `/api/academics/career-progression-forms${qs ? `?${qs}` : ""}`,
  );
  return Array.isArray(data.payload) ? data.payload : [];
}

function displayFieldValue(
  field: CareerProgressionFormDto["certificates"][number]["fields"][number],
): string {
  const opt = field.certificateFieldOptionMaster?.name?.trim();
  if (opt) return opt;
  return (field.value ?? "").trim();
}

type ExportRow = {
  "#": number;
  "Student name": string;
  UID: string;
  Reg: string;
  Roll: string;
  "Program-course": string;
  Semester: string;
  Shift: string;
  Section: string;
  "Student status": string;
  "Certificate name": string;
  Field: string;
  Value: string;
};

function buildExportRows(forms: CareerProgressionFormDto[]): ExportRow[] {
  const rows: ExportRow[] = [];
  let n = 0;

  for (const form of forms) {
    const st = form.student;
    const base = {
      "Student name": st?.name ?? "",
      UID: st?.uid ?? "",
      Reg: st?.registrationNumber ?? "",
      Roll: st?.rollNumber ?? "",
      "Program-course": st?.programCourse ?? "",
      Semester: st?.semester ?? "",
      Shift: st?.shift ?? "",
      Section: st?.section ?? "",
      "Student status": st?.studentStatus ?? "",
    };

    let anyField = false;
    for (const cert of form.certificates ?? []) {
      const certName = cert.certificateMaster?.name ?? "";
      for (const field of cert.fields ?? []) {
        anyField = true;
        n += 1;
        rows.push({
          "#": n,
          ...base,
          "Certificate name": certName,
          Field: field.certificateFieldMaster?.name ?? "",
          Value: displayFieldValue(field),
        });
      }
    }

    if (!anyField) {
      n += 1;
      rows.push({
        "#": n,
        ...base,
        "Certificate name": "",
        Field: "",
        Value: "",
      });
    }
  }

  return rows;
}

export default function CareerProgressionHomePage() {
  const { availableAcademicYears, currentAcademicYear } = useAcademicYear();
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  const handleDownloadExcel = useCallback(async () => {
    setExporting(true);
    try {
      const forms = await fetchFormsForExport(academicYearFilter);
      if (forms.length === 0) {
        toast.error("No career progression forms to export for this filter.");
        return;
      }

      const rows = buildExportRows(forms);
      if (rows.length === 0) {
        toast.error("No rows to export.");
        return;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);

      const headers = Object.keys(rows[0] ?? {});
      worksheet["!cols"] = headers.map((key) => {
        const maxLength = Math.max(
          key.length,
          ...rows.map((r) => String((r as Record<string, unknown>)[key] ?? "").length),
        );
        return { wch: Math.max(12, Math.min(60, maxLength + 2)) };
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, "Career progression");

      const datePart = new Date().toISOString().split("T")[0];
      const yearSuffix =
        academicYearFilter === "all"
          ? "all-years"
          : (availableAcademicYears.find((y) => String(y.id) === academicYearFilter)?.year ??
            academicYearFilter);
      const safeFileYear = String(yearSuffix).replace(/[/\\?%*:|"<>]/g, "-");
      XLSX.writeFile(workbook, `career-progression-forms_${safeFileYear}_${datePart}.xlsx`);

      toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"} to Excel.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [academicYearFilter, availableAcademicYears]);

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-violet-800">Career progression forms</h1>
          <p className="text-muted-foreground mt-1">
            Download submitted career progression data as Excel (one row per certificate field).
            Filter by academic year to limit the export.
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
                  Includes student profile, program / class placement, certificate type, field name,
                  and value (or selected option label).
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
