import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Check, ChevronsUpDown, Download } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { downloadReport, listReportDates } from "../api/idcard-api";
import { IdCardPageHeader } from "../components/page-header";

const formatHuman = (iso: string) => {
  // YYYY-MM-DD → DD-MM-YYYY
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

type Mode = "preset" | "range";

export default function IdCardReportsPage() {
  const [mode, setMode] = useState<Mode>("preset");
  const [presetDate, setPresetDate] = useState<string>("");
  const [presetOpen, setPresetOpen] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const datesQuery = useQuery({
    queryKey: ["idcard", "report-dates"],
    queryFn: listReportDates,
  });

  // Resolve the active range from whichever mode is selected.
  const range = useMemo(() => {
    if (mode === "preset") {
      return presetDate ? { from: presetDate, to: presetDate } : null;
    }
    if (!fromDate || !toDate) return null;
    if (fromDate > toDate) return null;
    return { from: fromDate, to: toDate };
  }, [mode, presetDate, fromDate, toDate]);

  const fileLabel = range
    ? range.from === range.to
      ? range.from
      : `${range.from}_to_${range.to}`
    : "";

  const rangeInvalid = mode === "range" && !!fromDate && !!toDate && fromDate > toDate;

  const excelMutation = useMutation({
    mutationFn: () => downloadReport("excel", range!, `id-cards-${fileLabel}.xlsx`),
    onError: () => toast.error("Could not download Excel report."),
  });

  const zipMutation = useMutation({
    mutationFn: () => downloadReport("zip", range!, `id-cards-${fileLabel}.zip`),
    onError: () => toast.error("Could not download ZIP."),
  });

  return (
    <div className="p-6 space-y-4">
      <IdCardPageHeader
        icon={BarChart3}
        title="Reports Dashboard"
        subtitle="Pick an issuance date or a custom date range to download ID card data and captured images."
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "preset" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("preset")}
            >
              Single date
            </Button>
            <Button
              type="button"
              variant={mode === "range" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("range")}
            >
              Custom date range
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {mode === "preset" ? (
              <div className="flex-1 min-w-[260px] max-w-2xl">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Issuance Date
                </label>
                <Popover open={presetOpen} onOpenChange={setPresetOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={presetOpen}
                      className="w-full justify-between font-normal"
                    >
                      {presetDate ? formatHuman(presetDate) : "Select Date"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search date…" />
                      <CommandList>
                        {datesQuery.isLoading ? (
                          <CommandEmpty>Loading…</CommandEmpty>
                        ) : (
                          <CommandEmpty>No issuance records found.</CommandEmpty>
                        )}
                        <CommandGroup>
                          {datesQuery.data?.map((d) => (
                            <CommandItem
                              key={d}
                              value={d}
                              keywords={[formatHuman(d)]}
                              onSelect={(current) => {
                                setPresetDate(current === presetDate ? "" : current);
                                setPresetOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  presetDate === d ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {formatHuman(d)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <>
                <div className="min-w-[180px]">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">From</label>
                  <Input
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="min-w-[180px]">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">To</label>
                  <Input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => excelMutation.mutate()}
              disabled={!range || excelMutation.isLoading}
            >
              <Download className="w-5 h-5 mr-3" />
              {excelMutation.isLoading ? "Downloading…" : "Download Excel"}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => zipMutation.mutate()}
              disabled={!range || zipMutation.isLoading}
            >
              <Download className="w-5 h-5 mr-3" />
              {zipMutation.isLoading ? "Downloading…" : "Download ZIP"}
            </Button>
          </div>

          {rangeInvalid && (
            <p className="text-xs text-red-600">
              The “From” date must be on or before the “To” date.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500">
        Excel includes ID, Name, Emergency Contact Number, Academic Year, Program Course, UID, RFID,
        Status, Issued At, Valid Till Date, Remarks, Shift, Section, Class Roll No., Blood Group,
        Quota Type and issuer details (name, type, email, phone). ZIP packs each card's S3-stored
        front PNG under <code>&lt;UID&gt;.png</code>.
      </p>
    </div>
  );
}
