import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Clock, IndianRupee, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useSocket } from "@/hooks/useSocket";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { ProgressUpdate } from "@/types/progress";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import {
  downloadFeeStructuresExcelFile,
  downloadFeeStudentMappingsExcelFile,
} from "@/services/fees-api";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { cn } from "@/lib/utils";

type FeeReportRow = {
  id: string;
  name: string;
  description: string;
  domains: string[];
  iconClassName: string;
  socketOperation: string;
  download: () => Promise<void>;
};

function getReportDomains(domains: string[]): string[] {
  return domains.length > 0 ? domains : ["POST_ADMISSION"];
}

function domainToSentenceCase(domain: string): string {
  const s = domain.replace(/_/g, " ").trim().toLowerCase();
  if (!s.length) return domain;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDomainBadgeLabel(domain: string): string {
  const label = domainToSentenceCase(domain);
  return domain === "FEES" ? `₹ ${label}` : label;
}

function domainBadgeClassName(domain: string): string {
  switch (domain) {
    case "ADMISSION_PHASE":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "FEES":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

export default function FeesReportsPage() {
  useRestrictTempUsers();

  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentProgressUpdate, setCurrentProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const { user } = useAuth();
  const userId = (user?.id ?? "").toString();

  const { availableAcademicYears, loadAcademicYears } = useAcademicYear();

  useEffect(() => {
    if (availableAcademicYears.length === 0) {
      void loadAcademicYears();
    }
  }, [availableAcademicYears.length, loadAcademicYears]);

  const selectedAcademicYear = useMemo(
    () =>
      availableAcademicYears.find((year) => year.isCurrentYear) ||
      availableAcademicYears[0] ||
      null,
    [availableAcademicYears],
  );
  const selectedAcademicYearId = selectedAcademicYear?.id?.toString() || "";

  const handleProgressUpdate = useCallback(
    (data: ProgressUpdate) => {
      if (currentOperation && data?.meta?.operation && data.meta.operation !== currentOperation) {
        return;
      }
      setCurrentProgressUpdate(data);
      if (data.status === "completed" || data.status === "error") {
        setIsExporting(false);
      }
    },
    [currentOperation],
  );

  useSocket({
    userId,
    onProgressUpdate: handleProgressUpdate,
  });

  const downloadFeeStructuresReport = useCallback(async () => {
    if (!selectedAcademicYearId) {
      throw new Error("Please select an academic year (use the global academic year selector).");
    }
    await downloadFeeStructuresExcelFile(Number(selectedAcademicYearId));
    setIsExporting(false);
    toast.success("Fee structures Excel downloaded.");
  }, [selectedAcademicYearId]);

  const downloadFeeStudentMappingsReport = useCallback(async () => {
    if (!selectedAcademicYearId) {
      throw new Error("Please select an academic year (use the global academic year selector).");
    }
    await downloadFeeStudentMappingsExcelFile(Number(selectedAcademicYearId));
    setIsExporting(false);
    toast.success("Fee student mappings Excel downloaded.");
  }, [selectedAcademicYearId]);

  const feeReports: FeeReportRow[] = useMemo(
    () => [
      {
        id: "fee-structures-excel",
        name: "Fee Structures (Excel)",
        description:
          "Download configured fee structures, slabs, components, and amounts for the selected academic year.",
        domains: ["FEES", "ADMISSION_PHASE"],
        iconClassName: "text-emerald-600",
        socketOperation: "fee_structures_excel_download",
        download: downloadFeeStructuresReport,
      },
      {
        id: "fee-student-mappings-excel",
        name: "Fee Student Mappings (Excel)",
        description:
          "Download fee–student mappings, payments, and component lines for the selected academic year.",
        domains: ["FEES", "ADMISSION_PHASE"],
        iconClassName: "text-amber-700",
        socketOperation: "fee_student_mappings_excel_download",
        download: downloadFeeStudentMappingsReport,
      },
    ],
    [downloadFeeStructuresReport, downloadFeeStudentMappingsReport],
  );

  const handleDownload = async (
    reportId: string,
    downloadFunction: () => Promise<void>,
    socketOperation?: string | null,
  ) => {
    try {
      setIsExporting(true);
      setExportProgressOpen(true);
      setCurrentOperation(socketOperation ?? null);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        message: "Starting export process…",
        progress: 0,
        status: "started",
        createdAt: new Date(),
      });
      await downloadFunction();
    } catch (error) {
      console.error(`Download failed for ${reportId}:`, error);
      setCurrentProgressUpdate({
        id: `export_${Date.now()}`,
        userId,
        type: "export_progress",
        message: "Export failed due to an error",
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        createdAt: new Date(),
      });
      setIsExporting(false);
      toast.error(
        error instanceof Error && error.message ? error.message : `Failed to download ${reportId}`,
      );
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full box-border px-4 py-4 sm:px-6 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 w-full">Fees Reports</h1>
      <p className="text-sm sm:text-base text-slate-600 mb-4 w-full max-w-none">
        Export fee configuration and student fee data for the selected academic year.
      </p>

      {!selectedAcademicYearId && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-800" />
          <AlertTitle className="text-amber-900">Academic year required</AlertTitle>
          <AlertDescription className="text-amber-900/90">
            Choose an academic year from the global selector in the header before downloading.
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full min-w-0 overflow-x-auto rounded-md border border-slate-200 shadow-sm">
        <Table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-10 bg-slate-100 shadow-[inset_0_-1px_0_0_rgb(226_232_240)]">
            <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
              <TableHead className="w-[6%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
                Sr. No.
              </TableHead>
              <TableHead className="w-[18%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
                Domain
              </TableHead>
              <TableHead className="w-[18%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
                Report
              </TableHead>
              <TableHead className="w-[34%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
                Description
              </TableHead>
              <TableHead className="w-[10%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
                Filters
              </TableHead>
              <TableHead className="w-[14%] border border-slate-200 text-xs sm:text-sm bg-slate-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feeReports.map((report, index) => (
              <TableRow key={report.id} className="hover:bg-slate-50">
                <TableCell className="font-medium border border-slate-200 text-xs sm:text-sm py-3 px-2 sm:px-4">
                  {index + 1}
                </TableCell>
                <TableCell className="border border-slate-200 py-3 px-2 sm:px-4 min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    {getReportDomains(report.domains).map((domain) => (
                      <Badge
                        key={domain}
                        variant="outline"
                        title={formatDomainBadgeLabel(domain)}
                        className={cn("text-xs max-w-full", domainBadgeClassName(domain))}
                      >
                        {formatDomainBadgeLabel(domain)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="border border-slate-200 py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <IndianRupee className={cn("h-5 w-5 shrink-0", report.iconClassName)} />
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {report.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 border border-slate-200 py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-normal break-words">
                  {report.description}
                </TableCell>
                <TableCell className="border border-slate-200 py-3 px-2 sm:px-4">
                  <span className="text-xs text-slate-400">—</span>
                </TableCell>
                <TableCell className="border border-slate-200 py-3 px-2 sm:px-4">
                  <Button
                    type="button"
                    onClick={() =>
                      handleDownload(report.id, report.download, report.socketOperation)
                    }
                    disabled={isExporting || !selectedAcademicYearId}
                    className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm disabled:opacity-50 w-full sm:w-auto"
                    size="sm"
                  >
                    {isExporting ? (
                      <>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Downloading…</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Download</span>
                        <span className="sm:hidden">DL</span>
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExportProgressDialog
        isOpen={exportProgressOpen}
        onClose={() => {
          setExportProgressOpen(false);
          setIsExporting(false);
          setCurrentProgressUpdate(null);
        }}
        progressUpdate={currentProgressUpdate}
      />
    </div>
  );
}
