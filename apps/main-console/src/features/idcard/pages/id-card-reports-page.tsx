import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { downloadReport, listReportDates } from "../api/idcard-api";
import { IdCardPageHeader } from "../components/page-header";

const formatHuman = (iso: string) => {
  // YYYY-MM-DD → DD-MM-YYYY
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

export default function IdCardReportsPage() {
  const [date, setDate] = useState<string>("");

  const datesQuery = useQuery({
    queryKey: ["idcard", "report-dates"],
    queryFn: listReportDates,
  });

  const excelMutation = useMutation({
    mutationFn: () => downloadReport("excel", date, `id-cards-${date}.xlsx`),
    onError: () => toast.error("Could not download Excel report."),
  });

  const zipMutation = useMutation({
    mutationFn: () => downloadReport("zip", date, `id-cards-${date}.zip`),
    onError: () => toast.error("Could not download ZIP."),
  });

  return (
    <div className="p-6 space-y-4">
      <IdCardPageHeader
        icon={BarChart3}
        title="Reports Dashboard"
        subtitle="Pick an issuance date to download daily ID card data and captured images."
      />

      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[260px] max-w-2xl">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Issuance Date</label>
            <Select value={date} onValueChange={(v) => setDate(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Date" />
              </SelectTrigger>
              <SelectContent>
                {datesQuery.isLoading && (
                  <SelectItem value="__loading__" disabled>
                    Loading…
                  </SelectItem>
                )}
                {datesQuery.data?.length === 0 && (
                  <SelectItem value="__empty__" disabled>
                    No issuance records found
                  </SelectItem>
                )}
                {datesQuery.data?.map((d) => (
                  <SelectItem key={d} value={d}>
                    {formatHuman(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => excelMutation.mutate()}
            disabled={!date || excelMutation.isLoading}
          >
            <Download className="w-5 h-5 mr-3" />
            {excelMutation.isLoading ? "Downloading…" : "Download Excel"}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => zipMutation.mutate()}
            disabled={!date || zipMutation.isLoading}
          >
            <Download className="w-5 h-5 mr-3" />
            {zipMutation.isLoading ? "Downloading…" : "Download ZIP"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500">
        Excel includes ID, UID, Name, Phone, Blood Group, Course, Section, Class Roll No., Valid
        Till, Status, Remarks and Created At. ZIP packs each card's S3-stored front PNG under{" "}
        <code>&lt;UID&gt;.png</code>.
      </p>
    </div>
  );
}
