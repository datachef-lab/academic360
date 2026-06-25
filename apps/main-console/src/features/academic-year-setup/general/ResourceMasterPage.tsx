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
import {
  PlusCircle,
  Download,
  Upload,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import axiosInstance from "@/utils/api";
import { makeResourceApi, type ResourceRow } from "./resource-api";
import { useResourceRoom } from "./useResourceRoom";
import { SearchableSelect } from "./SearchableSelect";
import {
  RESOURCE_TABLE_BY_KEY,
  type BadgeSpec,
  type ResourceConfig,
  type ResourceField,
} from "./resource-configs";

type OptionRow = { id: number; label: string };
type FormState = Record<string, string | number | boolean | null>;

const PAGE_SIZE = 15;

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

  // Editable form fields, split for the dialog layout.
  const topFields = config.fields.filter((f) => f.type !== "boolean" && f.key !== "sequence");
  const seqField = config.fields.find((f) => f.key === "sequence");
  const boolFields = config.fields.filter((f) => f.type === "boolean");
  // Table value columns (FK selects are shown via badges instead).
  const valueFields = config.fields.filter(
    (f) => f.type !== "select" && f.type !== "boolean" && f.key !== "sequence",
  );
  const badges = config.badges ?? [];

  // Every related basePath we need to load (FK select options + badge hops).
  const relatedBasePaths = React.useMemo(() => {
    const set = new Set<string>();
    for (const f of config.fields)
      if (f.type === "select" && f.optionsBasePath) set.add(f.optionsBasePath);
    for (const b of badges) for (const h of b.hops) set.add(h.basePath);
    return Array.from(set);
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  const [rows, setRows] = React.useState<ResourceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ResourceRow | null>(null);
  const [form, setForm] = React.useState<FormState>(defaultForm(config));
  const [submitting, setSubmitting] = React.useState(false);
  const [related, setRelated] = React.useState<Record<string, ResourceRow[]>>({});
  const [isBulkOpen, setIsBulkOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [bulkResult, setBulkResult] = React.useState<{ ok: number; failed: number } | null>(null);
  const [usage, setUsage] = React.useState<Record<number, number> | null>(null);
  const [usageTick, setUsageTick] = React.useState(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAll();
      data.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
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
    setPage(1);
    setForm(defaultForm(config));
    setSelected(null);
    load();
  }, [config, load]);

  // Load related lists (FK options + badge chains).
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, ResourceRow[]> = {};
      for (const base of relatedBasePaths) {
        try {
          next[base] = await makeResourceApi(base).getAll();
        } catch {
          next[base] = [];
        }
      }
      if (!cancelled) setRelated(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [relatedBasePaths]);

  // Cross-DB usage counts: how many times each row is referenced elsewhere.
  React.useEffect(() => {
    let cancelled = false;
    setUsage(null);
    const table = RESOURCE_TABLE_BY_KEY[config.key];
    if (!table) return;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/resource-usage/${table}`);
        const payload = res.data?.payload ?? res.data;
        if (!cancelled) setUsage((payload?.counts ?? {}) as Record<number, number>);
      } catch {
        if (!cancelled) setUsage({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.key, usageTick]);

  // Live collaboration: refresh when another online user changes this resource.
  const refresh = React.useCallback(() => {
    load();
    setUsageTick((t) => t + 1);
  }, [load]);
  useResourceRoom(config.basePath, refresh);

  const mapsById = React.useMemo(() => {
    const m: Record<string, Map<number, ResourceRow>> = {};
    for (const [base, list] of Object.entries(related)) {
      m[base] = new Map(list.map((r) => [Number(r.id), r]));
    }
    return m;
  }, [related]);

  const optionsFor = (field: ResourceField): OptionRow[] => {
    let list = related[field.optionsBasePath ?? ""] ?? [];
    if (field.cascadeParentKey && field.cascadeRefField) {
      const parentVal = form[field.cascadeParentKey];
      if (parentVal !== "" && parentVal != null) {
        list = list.filter((o) => Number(o[field.cascadeRefField!]) === Number(parentVal));
      }
    }
    return list.map((o) => ({
      id: Number(o.id),
      label: String(o[field.optionLabelKey ?? "name"] ?? o.id),
    }));
  };

  // Changing a select clears any descendant selects that cascade from it.
  const handleSelectChange = (key: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const changed = [key];
      let again = true;
      while (again) {
        again = false;
        for (const f of config.fields) {
          if (f.cascadeParentKey && changed.includes(f.cascadeParentKey) && next[f.key] !== "") {
            next[f.key] = "";
            changed.push(f.key);
            again = true;
          }
        }
      }
      return next;
    });
  };

  const resolveBadge = (row: ResourceRow, badge: BadgeSpec): string => {
    let cur: ResourceRow | undefined = row;
    for (const hop of badge.hops) {
      if (!cur) return "-";
      const fk = cur[hop.fromKey];
      if (fk == null) return "-";
      cur = mapsById[hop.basePath]?.get(Number(fk));
    }
    if (!cur) return "-";
    return String(cur[badge.labelKey ?? "name"] ?? "-");
  };

  const openAdd = () => {
    setSelected(null);
    setForm(defaultForm(config));
    setIsFormOpen(true);
  };
  // Backfill virtual cascade fields (e.g. Country/State) from the row's FK chain.
  const deriveVirtuals = (row: ResourceRow, base: FormState): FormState => {
    const f = { ...base };
    for (const field of config.fields) {
      if (!field.virtual || !field.deriveHops) continue;
      let cur: ResourceRow | undefined = row;
      for (const hop of field.deriveHops) {
        const fk = cur?.[hop.fromKey];
        cur = fk == null ? undefined : mapsById[hop.basePath]?.get(Number(fk));
      }
      const val = cur && field.deriveValueKey ? cur[field.deriveValueKey] : undefined;
      f[field.key] = val == null ? "" : (val as number);
    }
    return f;
  };

  const openEdit = (row: ResourceRow) => {
    setSelected(row);
    setForm(deriveVirtuals(row, rowToForm(config, row)));
    setIsFormOpen(true);
  };

  const buildPayload = (state: FormState): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      if (field.virtual) continue; // UI-only cascade helpers are not submitted
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
      for (const b of badges) o[b.label] = resolveBadge(r, b);
      for (const field of config.fields) {
        if (field.type === "select") continue;
        o[field.label] =
          field.type === "boolean" ? (r[field.key] ? "Yes" : "No") : (r[field.key] ?? "");
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
    const inFields = config.fields.some((f) => {
      if (f.type === "select") return false;
      return String(r[f.key] ?? "")
        .toLowerCase()
        .includes(q);
    });
    const inBadges = badges.some((b) => resolveBadge(r, b).toLowerCase().includes(q));
    return inFields || inBadges;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  React.useEffect(() => setPage(1), [search]);

  const colCount =
    1 + badges.length + valueFields.length + (seqField ? 1 : 0) + boolFields.length + 2;
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
          <div className="mb-0 flex flex-col items-stretch gap-2 border-b bg-background p-2 sm:flex-row sm:items-center sm:p-4">
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
          <div className="relative" style={{ height: "560px" }}>
            <div className="h-full overflow-auto">
              <Table className="min-w-[640px] border">
                <TableHeader className="sticky top-0 z-10 bg-gray-100">
                  <TableRow>
                    <TableHead className="w-[60px] bg-gray-100">ID</TableHead>
                    {badges.map((b) => (
                      <TableHead key={b.label} className="bg-gray-100">
                        {b.label}
                      </TableHead>
                    ))}
                    {valueFields.map((f) => (
                      <TableHead key={f.key} className="bg-gray-100">
                        {f.label}
                      </TableHead>
                    ))}
                    {seqField && <TableHead className="bg-gray-100">Sequence</TableHead>}
                    {boolFields.map((f) => (
                      <TableHead key={f.key} className="bg-gray-100">
                        {f.label}
                      </TableHead>
                    ))}
                    <TableHead
                      className="w-[90px] bg-gray-100"
                      title="Times referenced across the DB"
                    >
                      Used
                    </TableHead>
                    <TableHead className="w-[120px] bg-gray-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={colCount} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={colCount} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colCount} className="text-center">
                        No {config.title.toLowerCase()} found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map((row) => (
                      <TableRow key={row.id} className="group">
                        <TableCell>{row.id}</TableCell>
                        {badges.map((b) => {
                          const v = resolveBadge(row, b);
                          return (
                            <TableCell key={b.label}>
                              {v === "-" ? (
                                <span className="text-muted-foreground">-</span>
                              ) : (
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.color}`}
                                >
                                  {v}
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                        {valueFields.map((f) => (
                          <TableCell key={f.key}>
                            {(row[f.key] as React.ReactNode) ?? "-"}
                          </TableCell>
                        ))}
                        {seqField && (
                          <TableCell>{(row.sequence as React.ReactNode) ?? "-"}</TableCell>
                        )}
                        {boolFields.map((f) => (
                          <TableCell key={f.key}>
                            {f.key === "isActive" ? (
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
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          {usage == null ? (
                            <span className="text-muted-foreground">…</span>
                          ) : usage[Number(row.id)] ? (
                            <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {usage[Number(row.id)]}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
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
          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-2 border-t p-2 sm:flex-row sm:p-3">
            <div className="text-xs text-muted-foreground">
              {filtered.length === 0
                ? "0 records"
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                    currentPage * PAGE_SIZE,
                    filtered.length,
                  )} of ${filtered.length}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
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
          <div className="flex flex-col gap-3">
            {/* text / number fields (2-col) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topFields
                .filter((f) => f.type !== "select")
                .map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <Label className="text-xs">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={form[field.key] == null ? "" : String(form[field.key])}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    />
                  </div>
                ))}
            </div>
            {/* each FK dropdown (country/state/city/…) on its own full-width row */}
            {topFields
              .filter((f) => f.type === "select")
              .map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <Label className="text-xs">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </Label>
                  <SearchableSelect
                    value={form[field.key] == null ? "" : String(form[field.key])}
                    onChange={(v) => handleSelectChange(field.key, v)}
                    disabled={
                      field.cascadeParentKey
                        ? !form[field.cascadeParentKey] || form[field.cascadeParentKey] === ""
                        : false
                    }
                    placeholder={
                      field.cascadeParentKey && !form[field.cascadeParentKey]
                        ? `Select ${field.label} (pick parent first)`
                        : `Select ${field.label}`
                    }
                    options={optionsFor(field).map((o) => ({
                      value: String(o.id),
                      label: o.label,
                    }))}
                  />
                </div>
              ))}
            {/* sequence on its own row */}
            {seqField && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{seqField.label}</Label>
                <Input
                  type="number"
                  className="sm:w-48"
                  value={form[seqField.key] == null ? "" : String(form[seqField.key])}
                  onChange={(e) => setForm((p) => ({ ...p, [seqField.key]: e.target.value }))}
                />
              </div>
            )}
            {/* each checkbox on its own row */}
            {boolFields.map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form[field.key])}
                  onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked }))}
                />
                {field.label}
              </label>
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
