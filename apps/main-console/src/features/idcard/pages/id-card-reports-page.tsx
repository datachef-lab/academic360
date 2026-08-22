import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Filter, Images, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { downloadAuditReport, downloadAuditZip } from "../api/idcard-api";

/** yyyy-mm-dd in local time (matches the <input type="date"> value format). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Quick date-range presets → [from, to] as yyyy-mm-dd ("" = open bound). */
function presetRange(key: string): { from: string; to: string } {
  const today = new Date();
  const iso = toISODate(today);
  switch (key) {
    case "last7": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: toISODate(d), to: iso };
    }
    case "last30": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { from: toISODate(d), to: iso };
    }
    case "month":
      return { from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso };
    case "year":
      return { from: toISODate(new Date(today.getFullYear(), 0, 1)), to: iso };
    case "all":
    default:
      return { from: "", to: "" };
  }
}

const PRESETS: { key: string; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
];

export default function IdCardReportsPage() {
  // Applied range (drives the downloads); the dialog edits a draft first.
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<string>("");
  const [draftTo, setDraftTo] = useState<string>("");

  const activeFilters = [from, to].filter(Boolean).length;
  const rangeLabel = from || to ? `${from || "start"}_to_${to || "latest"}` : "all";
  const rangeText =
    from && to ? `${from} → ${to}` : from ? `from ${from}` : to ? `up to ${to}` : "All cards";

  const activePreset = useMemo(() => {
    for (const p of PRESETS) {
      const r = presetRange(p.key);
      if (r.from === draftFrom && r.to === draftTo) return p.key;
    }
    return "custom";
  }, [draftFrom, draftTo]);

  const openDialog = (open: boolean) => {
    if (open) {
      // Seed the draft from the currently-applied range.
      setDraftFrom(from);
      setDraftTo(to);
    }
    setDialogOpen(open);
  };

  const applyFilters = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setDialogOpen(false);
  };

  const auditMutation = useMutation({
    mutationFn: () => downloadAuditReport(from, to, `id-card-audit-${rangeLabel}.xlsx`),
    onError: () => toast.error("Could not download the audit report."),
  });
  const auditZipMutation = useMutation({
    mutationFn: () => downloadAuditZip(from, to, `id-card-audit-images-${rangeLabel}.zip`),
    onError: () => toast.error("Could not download the audit images ZIP."),
  });

  const reports = [
    {
      key: "audit-excel",
      icon: FileSpreadsheet,
      iconClass: "text-emerald-600",
      category: "Audit · Excel",
      badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
      name: "ID Card Audit (Excel)",
      description:
        "Per-student audit — academic year, program course, semester, shift, section, latest issue type, issued/printed by & at, RFID in use, and full RFID history (latest-first) in dynamic columns. Inactive students are flagged; drafts included.",
      loading: auditMutation.isLoading,
      run: () => auditMutation.mutate(),
    },
    {
      key: "audit-zip",
      icon: Images,
      iconClass: "text-amber-600",
      category: "Images · ZIP",
      badgeClass: "border-amber-300 bg-amber-50 text-amber-700",
      name: "ID Card Images (ZIP)",
      description: "ZIP of each student's latest card front image, named <rfid>.png.",
      loading: auditZipMutation.isLoading,
      run: () => auditZipMutation.mutate(),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Download ID card audit reports and captured card images.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Dialog open={dialogOpen} onOpenChange={openDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Export filters
              {activeFilters > 0 && (
                <span className="ml-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-800 px-1 text-[11px] font-semibold text-white">
                  {activeFilters}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Export filters</DialogTitle>
              <DialogDescription className="text-left">
                Restrict the audit to a range of issue dates. Leave it on{" "}
                <span className="font-medium">All time</span> to include every card.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Quick presets */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick range
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => {
                    const selected = activePreset === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          const r = presetRange(p.key);
                          setDraftFrom(r.from);
                          setDraftTo(r.to);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                  {activePreset === "custom" && (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                      Custom
                    </span>
                  )}
                </div>
              </div>

              {/* Custom range */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Custom range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">From</label>
                    <Input
                      type="date"
                      value={draftFrom}
                      max={draftTo || undefined}
                      onChange={(e) => setDraftFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">To</label>
                    <Input
                      type="date"
                      value={draftTo}
                      min={draftFrom || undefined}
                      onChange={(e) => setDraftTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setDraftFrom("");
                  setDraftTo("");
                }}
              >
                <X className="h-4 w-4" /> Clear
              </Button>
              <Button
                type="button"
                className="bg-slate-800 text-white hover:bg-slate-900"
                onClick={applyFilters}
              >
                Apply filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <span className="text-xs text-muted-foreground">
          Range: <span className="font-medium text-gray-700">{rangeText}</span>
        </span>
      </div>

      {/* Reports table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-16">Sr No.</TableHead>
              <TableHead className="w-40">Category</TableHead>
              <TableHead>Report</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r, i) => {
              const Icon = r.icon;
              return (
                <TableRow key={r.key}>
                  <TableCell className="text-slate-600">{i + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border ${r.badgeClass}`}>
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Icon className={`h-4 w-4 ${r.iconClass}`} />
                      {r.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xl text-sm text-muted-foreground">
                    {r.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      className="bg-slate-800 text-white hover:bg-slate-900"
                      onClick={r.run}
                      disabled={r.loading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {r.loading ? "Downloading…" : "Download"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
