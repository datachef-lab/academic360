import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Download, Upload, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { makeResourceApi, type ResourceRow } from "./resource-api";
import type { ResourceConfig, ResourceField } from "./resource-configs";

type OptionRow = { id: number; label: string };
type FormState = Record<string, string | number | boolean | null>;

function defaultForm(config: ResourceConfig): FormState {
  const f: FormState = {};
  for (const field of config.fields) {
    if (field.type === "boolean") f[field.key] = field.key === "isActive";
    else f[field.key] = "";
  }
  return f;
}

function rowToForm(config: ResourceConfig, row: ResourceRow): FormState {
  const f: FormState = {};
  for (const field of config.fields) {
    const v = row[field.key];
    if (field.type === "boolean") f[field.key] = Boolean(v);
    else f[field.key] = v == null ? "" : (v as string | number);
  }
  return f;
}

export default function ResourceMasterPage({ config }: { config: ResourceConfig }) {
  const api = React.useMemo(() => makeResourceApi(config.basePath), [config.basePath]);
  const selectFields = React.useMemo(
    () => config.fields.filter((f) => f.type === "select" && f.optionsBasePath),
    [config],
  );

  const [rows, setRows] = React.useState<ResourceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ResourceRow | null>(null);
  const [form, setForm] = React.useState<FormState>(defaultForm(config));
  const [submitting, setSubmitting] = React.useState(false);
  const [options, setOptions] = React.useState<Record<string, OptionRow[]>>({});
  const [isBulkOpen, setIsBulkOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [bulkResult, setBulkResult] = React.useState<{ ok: number; failed: number } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAll();
      setRows(data);
      setError(null);
    } catch (e) {
      console.error(`Error fetching ${config.title}:`, e);
      setError(`Failed to fetch ${config.title}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api, config.title]);

  React.useEffect(() => {
    setSearch("");
    setForm(defaultForm(config));
    setSelected(null);
    load();
  }, [config, load]);

  // Load FK option lists for select fields (and to resolve labels in the table).
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, OptionRow[]> = {};
      for (const field of selectFields) {
        const base = field.optionsBasePath!;
        if (next[base]) continue;
        try {
          const opts = await makeResourceApi(base).getAll();
          next[base] = opts.map((o) => ({
            id: o.id,
            label: String(o[field.optionLabelKey ?? "name"] ?? o.id),
          }));
        } catch {
          next[base] = [];
        }
      }
      if (!cancelled) setOptions(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectFields]);

  const optionLabel = (field: ResourceField, value: unknown): string => {
    if (value == null || value === "") return "-";
    const base = field.optionsBasePath!;
    const match = (options[base] ?? []).find((o) => o.id === Number(value));
    return match ? match.label : String(value);
  };

  const openAdd = () => {
    setSelected(null);
    setForm(defaultForm(config));
    setIsFormOpen(true);
  };
  const openEdit = (row: ResourceRow) => {
    setSelected(row);
    setForm(rowToForm(config, row));
    setIsFormOpen(true);
  };

  const buildPayload = (state: FormState): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const v = state[field.key];
      if (field.type === "number" || field.type === "select") {
        payload[field.key] = v === "" || v == null ? null : Number(v);
      } else if (field.type === "boolean") {
        payload[field.key] = Boolean(v);
      } else {
        payload[field.key] = v === "" ? null : v;
      }
    }
    return payload;
  };

  const handleSubmit = async () => {
    // required validation
    for (const field of config.fields) {
      if (field.required && (form[field.key] === "" || form[field.key] == null)) {
        toast.error(`${field.label} is required`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(form);
      if (selected?.id) await api.update(selected.id, payload);
      else await api.create(payload);
      toast.success(`${config.title} ${selected ? "updated" : "created"} successfully`);
      setIsFormOpen(false);
      await load();
    } catch (e) {
      toast.error(`Failed to save: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.remove(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success(`${config.title} deleted`);
    } catch {
      toast.error("Failed to delete (it may be in use)");
    }
  };

  const handleDownload = () => {
    const data = rows.map((r) => {
      const o: Record<string, unknown> = { ID: r.id };
      for (const field of config.fields) {
        o[field.label] =
          field.type === "select"
            ? optionLabel(field, r[field.key])
            : field.type === "boolean"
              ? r[field.key]
                ? "Yes"
                : "No"
              : (r[field.key] ?? "");
      }
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.title.slice(0, 28));
    XLSX.writeFile(wb, `${config.key}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const sample: Record<string, unknown> = {};
    for (const field of config.fields) sample[field.label] = "";
    const ws = XLSX.utils.json_to_sheet([sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${config.key}-template.xlsx`);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkRunning(true);
    setBulkResult(null);
    try {
      const buf = await bulkFile.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) {
        toast.error("The file has no sheets");
        setBulkRunning(false);
        return;
      }
      const sheet = wb.Sheets[firstSheet];
      if (!sheet) {
        toast.error("The file has no sheets");
        setBulkRunning(false);
        return;
      }
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      let ok = 0;
      let failed = 0;
      for (const raw of json) {
        const state: FormState = {};
        for (const field of config.fields) {
          const cell = raw[field.label] ?? raw[field.key];
          if (field.type === "boolean") {
            state[field.key] = ["yes", "true", "1", "active"].includes(
              String(cell ?? "").toLowerCase(),
            );
          } else {
            state[field.key] = cell == null ? "" : (cell as string | number);
          }
        }
        const missingRequired = config.fields.some(
          (f) => f.required && (state[f.key] === "" || state[f.key] == null),
        );
        if (missingRequired) {
          failed++;
          continue;
        }
        try {
          await api.create(buildPayload(state));
          ok++;
        } catch {
          failed++;
        }
      }
      setBulkResult({ ok, failed });
      if (ok > 0) {
        toast.success(`Uploaded ${ok} ${config.title}`);
        await load();
      }
      if (failed > 0) toast.error(`${failed} rows failed`);
    } catch (e) {
      toast.error(`Bulk upload failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBulkRunning(false);
    }
  };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return config.fields.some((f) => {
      const v = f.type === "select" ? optionLabel(f, r[f.key]) : r[f.key];
      return String(v ?? "")
        .toLowerCase()
        .includes(q);
    });
  });

  const Icon = config.icon;

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="mb-3 flex flex-col items-start justify-between gap-4 rounded-md border p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Icon className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
              <span className="truncate">{config.title}</span>
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage {config.title.toLowerCase()}.
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Upload</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg sm:w-full">
                <DialogHeader>
                  <DialogTitle>Bulk Upload {config.title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Button variant="outline" onClick={handleDownloadTemplate} className="w-fit">
                    <Download className="mr-2 h-4 w-4" /> Download Template
                  </Button>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                  />
                  {bulkResult && (
                    <div className="text-sm">
                      <span className="text-green-600">Success: {bulkResult.ok}</span>
                      {" · "}
                      <span className="text-red-600">Failed: {bulkResult.failed}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkUpload}
                      disabled={!bulkFile || bulkRunning}
                      className="flex-1"
                    >
                      {bulkRunning ? "Uploading..." : "Upload"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsBulkOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={openAdd}
              className="flex-shrink-0 bg-purple-600 text-white hover:bg-purple-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add {config.title.replace(/s$/, "")}</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-0 z-20 mb-0 flex flex-col items-stretch gap-2 border-b bg-background p-2 sm:flex-row sm:items-center sm:p-4">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" className="flex-shrink-0 gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="h-full overflow-auto">
              <Table className="min-w-[640px] border">
                <TableHeader className="sticky top-0 z-10 bg-gray-100">
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    {config.fields.map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={config.fields.length + 2} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={config.fields.length + 2}
                        className="text-center text-red-500"
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={config.fields.length + 2} className="text-center">
                        No {config.title.toLowerCase()} found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((row) => (
                      <TableRow key={row.id} className="group">
                        <TableCell>{row.id}</TableCell>
                        {config.fields.map((f) => (
                          <TableCell key={f.key}>
                            {f.type === "boolean" ? (
                              f.key === "isActive" ? (
                                row[f.key] !== false ? (
                                  <Badge className="bg-green-500 text-white hover:bg-green-600">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )
                              ) : row[f.key] ? (
                                "Yes"
                              ) : (
                                "No"
                              )
                            ) : f.type === "select" ? (
                              optionLabel(f, row[f.key])
                            ) : (
                              ((row[f.key] as React.ReactNode) ?? "-")
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(row)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(row.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-lg sm:w-full">
          <DialogHeader>
            <DialogTitle>
              {selected
                ? `Edit ${config.title.replace(/s$/, "")}`
                : `Add ${config.title.replace(/s$/, "")}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {config.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <Label className="text-xs">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>
                {field.type === "boolean" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked }))}
                    />
                    {field.label}
                  </label>
                ) : field.type === "select" ? (
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={form[field.key] == null ? "" : String(form[field.key])}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  >
                    <option value="">— Select —</option>
                    {(options[field.optionsBasePath!] ?? []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    value={form[field.key] == null ? "" : String(form[field.key])}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
