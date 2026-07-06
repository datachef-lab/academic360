import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutTemplate,
  Search,
  Filter,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listNotificationMasters,
  createNotificationMaster,
  updateNotificationMaster,
  uploadMasterPreviewImage,
  getMasterFields,
  getMasterPreview,
  downloadMastersExcel,
  type NotificationMasterRow,
  type NotificationMasterField,
  type MasterPreview,
} from "@/features/notifications/api/notifications-api";
import { VariantBadge, ActiveBadge } from "@/features/notifications/components/badges";
import { humanizeFieldName } from "@/features/notifications/utils/format";

function TriggerBadge({ system }: { system: boolean }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        system
          ? "border-violet-300 bg-violet-100 text-violet-700"
          : "border-sky-300 bg-sky-100 text-sky-700"
      }`}
    >
      {system ? "Auto" : "Manual"}
    </span>
  );
}

const VARIANTS = ["EMAIL", "WHATSAPP", "SMS", "WEB", "OTHER"];
const ALL = "__all__";
const PAGE_SIZE = 10;

type Filters = { variant: string; active: string };
const EMPTY_FILTERS: Filters = { variant: ALL, active: ALL };

type DialogMode = "add" | "edit";

export default function NotificationMastersPage() {
  const [masters, setMasters] = useState<NotificationMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editing, setEditing] = useState<NotificationMasterRow | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    template: "",
    variant: "EMAIL",
    isActive: true,
  });
  const [existingFields, setExistingFields] = useState<NotificationMasterField[]>([]);
  const [metaDraft, setMetaDraft] = useState<Record<number, { sequence: number; flag: boolean }>>(
    {},
  );
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [newFields, setNewFields] = useState<string[]>([]);
  const [newFieldInput, setNewFieldInput] = useState("");
  const [preview, setPreview] = useState<MasterPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (file: File | null) => {
    setImageFile(file);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const locked = dialogMode === "edit" && !!editing?.isSystemTriggered;
  const dialogVariant = dialogMode === "edit" ? (editing?.variant ?? "EMAIL") : editDraft.variant;
  // Any WhatsApp master accepts a preview image upload (auto masters can still
  // update their image + active status, just not their fields/template).
  const canUploadImage = dialogVariant === "WHATSAPP";

  const openAdd = () => {
    setDialogMode("add");
    setEditing(null);
    // Only WhatsApp masters can be created from the console for now; they are
    // always manual (non-system-triggered).
    setEditDraft({ name: "", template: "", variant: "WHATSAPP", isActive: true });
    setExistingFields([]);
    setMetaDraft({});
    setNewFields([]);
    setNewFieldInput("");
    setPreview(null);
    pickImage(null);
  };

  const openEdit = (m: NotificationMasterRow) => {
    setDialogMode("edit");
    setEditing(m);
    setEditDraft({
      name: m.name,
      template: m.template ?? "",
      variant: m.variant,
      isActive: m.isActive,
    });
    setExistingFields([]);
    setMetaDraft({});
    setNewFields([]);
    setNewFieldInput("");
    pickImage(null);
    setFieldsLoading(true);
    getMasterFields(m.id)
      .then((fields) => {
        setExistingFields(fields);
        const draft: Record<number, { sequence: number; flag: boolean }> = {};
        fields
          .filter((f) => f.source === "db")
          .forEach((f, i) => {
            draft[f.id] = { sequence: f.sequence ?? i + 1, flag: f.flag ?? true };
          });
        setMetaDraft(draft);
      })
      .catch(() => undefined)
      .finally(() => setFieldsLoading(false));
    setPreview(null);
    setPreviewLoading(true);
    getMasterPreview(m.id)
      .then(setPreview)
      .catch(() => undefined)
      .finally(() => setPreviewLoading(false));
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditing(null);
  };

  const addField = () => {
    const name = newFieldInput.trim();
    if (!name) return;
    const exists = [...existingFields.map((f) => f.name), ...newFields].some(
      (f) => f.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      toast.error("A field with this name already exists.");
      return;
    }
    setNewFields((prev) => [...prev, name]);
    setNewFieldInput("");
  };

  const save = async () => {
    if (!locked && !editDraft.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    try {
      setSaving(true);
      if (dialogMode === "add") {
        const created = await createNotificationMaster({
          name: editDraft.name,
          variant: editDraft.variant,
          template: editDraft.template.trim() || null,
          isActive: editDraft.isActive,
          fields: newFields,
        });
        let row = created;
        if (imageFile) {
          try {
            row = await uploadMasterPreviewImage(created.id, imageFile);
          } catch {
            toast.error("Master created, but the preview image upload failed.");
          }
        }
        setMasters((prev) => [...prev, { ...row, fieldsCount: newFields.length }]);
        toast.success("Master created.");
      } else if (editing) {
        // Fields & sequence are editable for every master; only name/channel/
        // template-key are frozen for auto-triggered ones (backend enforces it).
        const dbFields = existingFields.filter((f) => f.source === "db");
        let row: Omit<NotificationMasterRow, "fieldsCount"> | null = await updateNotificationMaster(
          editing.id,
          {
            ...(locked
              ? {}
              : { name: editDraft.name, template: editDraft.template.trim() || null }),
            isActive: editDraft.isActive,
            newFields: newFields.length ? newFields : undefined,
            meta: dbFields.length
              ? dbFields.map((f, i) => ({
                  fieldId: f.id,
                  sequence: metaDraft[f.id]?.sequence ?? i + 1,
                  flag: metaDraft[f.id]?.flag ?? true,
                }))
              : undefined,
          },
        );
        if (imageFile) {
          try {
            row = await uploadMasterPreviewImage(editing.id, imageFile);
          } catch {
            toast.error("Saved, but the preview image upload failed.");
          }
        }
        const patch = row;
        setMasters((prev) =>
          prev.map((m) =>
            m.id === editing.id
              ? { ...m, ...patch, fieldsCount: m.fieldsCount + newFields.length }
              : m,
          ),
        );
        toast.success("Master updated.");
      }
      closeDialog();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Could not save the master.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    listNotificationMasters()
      .then((res) => {
        if (!cancelled) setMasters(res);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load notification masters.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return masters.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !(m.template ?? "").toLowerCase().includes(q))
        return false;
      if (filters.variant !== ALL && m.variant !== filters.variant) return false;
      if (filters.active !== ALL && String(m.isActive) !== filters.active) return false;
      return true;
    });
  }, [masters, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeFilterCount = Object.values(filters).filter((v) => v !== ALL).length;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadMastersExcel();
    } catch {
      toast.error("Could not download the Excel export.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start gap-4 rounded-md border bg-background p-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <LayoutTemplate className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
                <span className="truncate">Notification Masters</span>
              </CardTitle>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Configured templates and their channels.
              </div>
            </div>
            <Button
              className="flex-shrink-0 bg-violet-600 text-white hover:bg-violet-700"
              onClick={openAdd}
            >
              <Plus className="mr-2 h-4 w-4" /> Add master
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name / template..."
                className="w-64 pl-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Dialog
                open={isFilterOpen}
                onOpenChange={(open) => {
                  setIsFilterOpen(open);
                  if (open) setDraft(filters);
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2 bg-violet-600 px-1.5 text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Filter masters</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Channel</label>
                      <Select
                        value={draft.variant}
                        onValueChange={(v) => setDraft((d) => ({ ...d, variant: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All channels</SelectItem>
                          {VARIANTS.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Status</label>
                      <Select
                        value={draft.active}
                        onValueChange={(v) => setDraft((d) => ({ ...d, active: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All</SelectItem>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDraft(EMPTY_FILTERS);
                        setFilters(EMPTY_FILTERS);
                        setPage(1);
                        setIsFilterOpen(false);
                      }}
                    >
                      Clear all
                    </Button>
                    <Button
                      onClick={() => {
                        setFilters(draft);
                        setPage(1);
                        setIsFilterOpen(false);
                      }}
                    >
                      Apply filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="flex-shrink-0"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-md border">
            <div className="max-h-[65vh] overflow-auto">
              <table className="w-full text-sm [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-gray-50 [&_th]:shadow-[inset_0_-1px_0_#e5e7eb]">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="w-16 px-4 py-3">Sr No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Template key</th>
                    <th className="px-4 py-3">Fields</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Trigger</th>
                    <th className="w-20 px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-gray-200/70" />
                        </td>
                      </tr>
                    ))
                  ) : pageRows.length > 0 ? (
                    pageRows.map((m, i) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-center text-gray-600">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="max-w-[260px] px-4 py-3 font-medium text-gray-900">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate">{m.name}</span>
                            {m.hasAttachments && (
                              <span title="Sends a file attachment" className="flex-shrink-0">
                                <Paperclip className="h-3.5 w-3.5 text-sky-600" />
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <VariantBadge variant={m.variant} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {m.template ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{m.fieldsCount}</td>
                        <td className="px-4 py-3">
                          <ActiveBadge active={m.isActive} />
                        </td>
                        <td className="px-4 py-3">
                          <TriggerBadge system={m.isSystemTriggered} />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`Edit ${m.name}`}
                            title="Edit"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                        No notification masters found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {filtered.length.toLocaleString("en-IN")} masters
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="flex h-[92vh] w-[95vw] max-w-[1250px] flex-col xl:max-w-[80vw]">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === "add" ? (
                <>
                  <Plus className="h-4 w-4 text-violet-600" /> Add master
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 text-violet-600" /> Edit master
                </>
              )}
              <VariantBadge variant={dialogVariant} />
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid min-h-full grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1fr]">
              {/* LEFT — master form + fields/sequence + flags */}
              <div className="space-y-4">
                {/* Master fields: name + template key. Read-only for auto. */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Name</label>
                  {locked ? (
                    <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                      {editDraft.name}
                    </p>
                  ) : (
                    <Input
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Master name"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Template key</label>
                  {locked ? (
                    <p className="rounded-md border bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">
                      {editDraft.template || "—"}
                    </p>
                  ) : (
                    <Input
                      value={editDraft.template}
                      onChange={(e) => setEditDraft((d) => ({ ...d, template: e.target.value }))}
                      placeholder="e.g. regp1conf"
                      className="font-mono text-xs"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  {/* Header with the add-field control on the right (non-auto only). */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-medium text-gray-600">
                      Notification fields &amp; sequence
                    </label>
                    {!locked && (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newFieldInput}
                          onChange={(e) => setNewFieldInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addField();
                            }
                          }}
                          placeholder="New field name"
                          className="h-8 w-44 text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 flex-shrink-0"
                          onClick={addField}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add field
                        </Button>
                      </div>
                    )}
                  </div>

                  {fieldsLoading ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border">
                      <table className="w-full text-sm [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0">
                        <thead>
                          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                            <th className="w-14 px-3 py-2">Sr No</th>
                            <th className="px-3 py-2">Field name</th>
                            <th className="w-24 px-3 py-2">Sequence</th>
                            <th className="w-20 px-3 py-2 text-center">Enabled</th>
                            {!locked && <th className="w-12 px-3 py-2"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {existingFields.map((f, i) => {
                            const rowEditable = !locked && f.source === "db";
                            return (
                              <tr key={`e${f.id}`} className="border-b last:border-0">
                                <td className="px-3 py-2 text-center text-gray-600">{i + 1}</td>
                                <td className="px-3 py-2 text-gray-800">
                                  {humanizeFieldName(f.name)}
                                </td>
                                <td className="px-3 py-2">
                                  {rowEditable ? (
                                    <Input
                                      type="number"
                                      min={1}
                                      value={metaDraft[f.id]?.sequence ?? i + 1}
                                      onChange={(e) => {
                                        const sequence = Number(e.target.value);
                                        setMetaDraft((prev) => ({
                                          ...prev,
                                          [f.id]: {
                                            sequence: Number.isFinite(sequence) ? sequence : 1,
                                            flag: prev[f.id]?.flag ?? true,
                                          },
                                        }));
                                      }}
                                      className="h-7 w-16 text-xs"
                                    />
                                  ) : (
                                    <span className="text-gray-600">{f.sequence ?? "—"}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {f.source === "template" ? (
                                    <span className="text-xs text-gray-400">—</span>
                                  ) : (
                                    <Checkbox
                                      checked={
                                        rowEditable
                                          ? (metaDraft[f.id]?.flag ?? true)
                                          : (f.flag ?? true)
                                      }
                                      disabled={!rowEditable}
                                      onCheckedChange={(v) =>
                                        setMetaDraft((prev) => ({
                                          ...prev,
                                          [f.id]: {
                                            sequence: prev[f.id]?.sequence ?? i + 1,
                                            flag: v === true,
                                          },
                                        }))
                                      }
                                    />
                                  )}
                                </td>
                                {!locked && (
                                  <td className="px-3 py-2 text-center text-[11px] text-gray-400">
                                    {f.source === "template" ? "template" : "saved"}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                          {!locked &&
                            newFields.map((name, i) => (
                              <tr
                                key={`n${name}`}
                                className="border-b bg-violet-50/50 last:border-0"
                              >
                                <td className="px-3 py-2 text-center text-gray-600">
                                  {existingFields.length + i + 1}
                                </td>
                                <td className="px-3 py-2 font-medium text-violet-700">
                                  {humanizeFieldName(name)}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">auto</td>
                                <td className="px-3 py-2 text-center">
                                  <Checkbox checked disabled />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    aria-label={`Remove ${name}`}
                                    className="text-gray-400 hover:text-rose-600"
                                    onClick={() =>
                                      setNewFields((prev) => prev.filter((ff) => ff !== name))
                                    }
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {existingFields.length === 0 && newFields.length === 0 && (
                            <tr>
                              <td
                                colSpan={locked ? 4 : 5}
                                className="px-3 py-4 text-center text-xs text-gray-400"
                              >
                                {locked ? "No fields." : "No fields yet — add one above."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {existingFields.some((f) => f.source === "template") && (
                    <p className="text-[11px] text-muted-foreground">
                      These fields are part of the notification template and are shown here for
                      reference.
                    </p>
                  )}
                  {!locked && (
                    <p className="text-[11px] text-muted-foreground">
                      Sequence drives the WhatsApp body-value order. New fields are appended and
                      saved with “{dialogMode === "add" ? "Create master" : "Save changes"}”.
                      {dialogMode === "edit" &&
                        " Existing fields cannot be removed — past notifications reference them."}
                    </p>
                  )}

                  {dialogMode === "edit" && editing?.hasAttachments && (
                    <div className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-800">
                      <Paperclip className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        This notification sends a file attachment (such as a PDF). The file is added
                        automatically by the system when the notification is sent — it isn’t
                        configured here.
                      </span>
                    </div>
                  )}

                  {/* Flags, stacked below the table after the notes. */}
                  <div className="space-y-2 border-t pt-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                      <Checkbox
                        checked={editDraft.isActive}
                        onCheckedChange={(v) =>
                          setEditDraft((d) => ({ ...d, isActive: v === true }))
                        }
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Checkbox
                        checked={dialogMode === "edit" ? !!editing?.isSystemTriggered : false}
                        disabled
                      />
                      System triggered
                      <span className="text-[11px] font-normal text-muted-foreground">
                        (set by the system — read-only)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* RIGHT — preview. WhatsApp non-auto: click to upload S3 image.
                  Auto WhatsApp: read-only image. Email: read-only EJS render. */}
              <div className="flex min-h-[55vh] flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
                />
                <div
                  onClick={canUploadImage ? () => fileRef.current?.click() : undefined}
                  className={`relative flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-md border bg-white p-2 ${
                    canUploadImage
                      ? "cursor-pointer border-dashed hover:border-violet-400 hover:bg-violet-50/40"
                      : ""
                  }`}
                >
                  {previewLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                  ) : imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Selected preview"
                      className="mx-auto max-h-full max-w-full object-contain"
                    />
                  ) : dialogMode === "edit" && preview?.kind === "IMAGE" ? (
                    <img
                      src={preview.url}
                      alt="Template preview"
                      className="mx-auto max-h-full max-w-full object-contain"
                    />
                  ) : dialogMode === "edit" && preview?.kind === "EMAIL" ? (
                    <iframe
                      title="Template preview"
                      srcDoc={preview.html}
                      sandbox=""
                      className="h-full w-full rounded bg-white"
                    />
                  ) : (
                    <p className="px-4 text-center text-xs text-gray-400">
                      {canUploadImage
                        ? "Click to upload a preview image (stored in S3)."
                        : dialogVariant === "WHATSAPP"
                          ? "No preview available."
                          : dialogMode === "add"
                            ? "The EJS template preview appears after the master is created."
                            : "No preview available."}
                    </p>
                  )}
                </div>
                {canUploadImage && imageFile && (
                  <p className="shrink-0 text-[11px] text-muted-foreground">
                    Selected: {imageFile.name} — click the box to change.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t pt-3">
            <Button variant="outline" disabled={saving} onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              className="bg-violet-600 text-white hover:bg-violet-700"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Create master" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
