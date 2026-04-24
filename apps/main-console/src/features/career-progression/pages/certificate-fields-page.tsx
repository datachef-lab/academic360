import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, ListTree, MessageCircleQuestion, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import axiosInstance from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CertificateNameBadge } from "@/features/career-progression/components/certificate-name-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CertificateMaster = {
  id: number;
  name: string;
  sequence: number;
  color: string | null;
  bgColor: string | null;
};

type FieldType = "TEXT" | "TEXTAREA" | "SELECT" | "NUMBER" | "DATE";

type FieldOption = {
  id: number;
  certificateFieldMasterId: number;
  name: string;
  sequence: number;
  isActive: boolean;
};

type CertificateFieldMaster = {
  id: number;
  certificateMasterId: number;
  name: string;
  type: FieldType;
  isQuestion: boolean;
  sequence: number;
  isRequired: boolean;
  isActive: boolean;
  options?: FieldOption[];
};

/** Options queued locally until "Save field" runs (no API on Add). */
type PendingOption = {
  tempId: string;
  name: string;
  isActive: boolean;
  sequence: number;
};

const FIELD_TYPES: FieldType[] = ["TEXT", "TEXTAREA", "SELECT", "NUMBER", "DATE"];

function nextOptionSequence(rows: FieldOption[], pending: PendingOption[]): number {
  const seqs = [...rows.map((r) => r.sequence), ...pending.map((p) => p.sequence)];
  if (seqs.length === 0) return 0;
  return Math.max(...seqs) + 1;
}

async function persistPendingOptionsApi(fieldId: number, list: PendingOption[]): Promise<void> {
  for (const p of list) {
    await axiosInstance.post("/api/academics/certificate-field-option-masters", {
      certificateFieldMasterId: fieldId,
      name: p.name,
      sequence: p.sequence,
      isActive: p.isActive,
    });
  }
}

function fieldTypeBadgeClass(type: FieldType): string {
  switch (type) {
    case "SELECT":
      return "border-violet-200 bg-violet-100 text-violet-900 hover:bg-violet-100";
    case "TEXT":
      return "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-100";
    case "TEXTAREA":
      return "border-sky-200 bg-sky-100 text-sky-900 hover:bg-sky-100";
    case "NUMBER":
      return "border-amber-200 bg-amber-100 text-amber-950 hover:bg-amber-100";
    case "DATE":
      return "border-emerald-200 bg-emerald-100 text-emerald-950 hover:bg-emerald-100";
    default:
      return "border-border bg-muted text-muted-foreground hover:bg-muted";
  }
}

const emptyForm = {
  certificateMasterId: "" as string | number,
  name: "",
  type: "TEXT" as FieldType,
  isQuestion: false,
  sequence: 0,
  isRequired: false,
  isActive: true,
};

const emptyOptionForm = {
  name: "",
  sequence: 0,
  isActive: true,
};

export default function CertificateFieldsPage() {
  const [masters, setMasters] = useState<CertificateMaster[]>([]);
  const [fields, setFields] = useState<CertificateFieldMaster[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateFieldMaster | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterMasterId, setFilterMasterId] = useState<string>("all");

  const [optionRows, setOptionRows] = useState<FieldOption[]>([]);
  const [pendingOptions, setPendingOptions] = useState<PendingOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionForm, setOptionForm] = useState(emptyOptionForm);
  const [editingOption, setEditingOption] = useState<FieldOption | null>(null);
  const [savingOption, setSavingOption] = useState(false);
  const [deleteOptionId, setDeleteOptionId] = useState<number | null>(null);

  const masterById = useMemo(() => {
    const m = new Map<number, CertificateMaster>();
    masters.forEach((x) => m.set(x.id, x));
    return m;
  }, [masters]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cm, cf] = await Promise.all([
        axiosInstance.get<{ payload: CertificateMaster[] }>("/api/academics/certificate-masters"),
        axiosInstance.get<{ payload: CertificateFieldMaster[] }>(
          "/api/academics/certificate-field-masters",
        ),
      ]);
      setMasters(Array.isArray(cm.data.payload) ? cm.data.payload : []);
      setFields(Array.isArray(cf.data.payload) ? cf.data.payload : []);
    } catch {
      toast.error("Failed to load certificate fields");
      setMasters([]);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (form.type !== "SELECT") {
      setPendingOptions([]);
    }
  }, [form.type]);

  const combinedOptionRows = useMemo(() => {
    type Row =
      | {
          kind: "server";
          key: number;
          sequence: number;
          name: string;
          isActive: boolean;
          server: FieldOption;
        }
      | {
          kind: "pending";
          key: string;
          tempId: string;
          sequence: number;
          name: string;
          isActive: boolean;
        };
    const server: Row[] = optionRows.map((o) => ({
      kind: "server" as const,
      key: o.id,
      sequence: o.sequence,
      name: o.name,
      isActive: o.isActive,
      server: o,
    }));
    const pend: Row[] = pendingOptions.map((p) => ({
      kind: "pending" as const,
      key: p.tempId,
      tempId: p.tempId,
      sequence: p.sequence,
      name: p.name,
      isActive: p.isActive,
    }));
    return [...server, ...pend].sort((a, b) => a.sequence - b.sequence);
  }, [optionRows, pendingOptions]);

  const filteredFields = useMemo(() => {
    let list = fields;
    if (filterMasterId !== "all") {
      const id = parseInt(filterMasterId, 10);
      if (!Number.isNaN(id)) list = list.filter((f) => f.certificateMasterId === id);
    }
    const q = searchText.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (masterById.get(f.certificateMasterId)?.name ?? "").toLowerCase().includes(q),
    );
  }, [fields, filterMasterId, searchText, masterById]);

  const sortedFields = useMemo(() => {
    return [...filteredFields].sort((a, b) => {
      const an = masterById.get(a.certificateMasterId)?.name ?? "";
      const bn = masterById.get(b.certificateMasterId)?.name ?? "";
      if (an !== bn) return an.localeCompare(bn);
      return a.sequence - b.sequence;
    });
  }, [filteredFields, masterById]);

  const openCreate = () => {
    setEditing(null);
    setEditingOption(null);
    setOptionForm(emptyOptionForm);
    setOptionRows([]);
    setPendingOptions([]);
    setForm({
      ...emptyForm,
      certificateMasterId: masters[0]?.id ?? "",
    });
    setDialogOpen(true);
  };

  const openEdit = (row: CertificateFieldMaster) => {
    setEditing(row);
    setEditingOption(null);
    setOptionForm(emptyOptionForm);
    setOptionRows([]);
    setPendingOptions([]);
    setForm({
      certificateMasterId: row.certificateMasterId,
      name: row.name,
      type: row.type,
      isQuestion: row.isQuestion,
      sequence: row.sequence,
      isRequired: row.isRequired,
      isActive: row.isActive,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const mid =
      typeof form.certificateMasterId === "string"
        ? parseInt(form.certificateMasterId, 10)
        : form.certificateMasterId;
    if (!form.name.trim() || Number.isNaN(mid)) {
      toast.error("Certificate and field name are required");
      return;
    }
    const pendingSnapshot = [...pendingOptions];
    setSaving(true);
    try {
      const body = {
        certificateMasterId: mid,
        name: form.name.trim(),
        type: form.type,
        isQuestion: form.isQuestion,
        sequence: Number(form.sequence) || 0,
        isRequired: form.isRequired,
        isActive: form.isActive,
      };
      if (editing) {
        await axiosInstance.put(`/api/academics/certificate-field-masters/${editing.id}`, body);
        if (form.type === "SELECT" && pendingSnapshot.length > 0) {
          await persistPendingOptionsApi(editing.id, pendingSnapshot);
          setPendingOptions([]);
        }
        toast.success("Field saved");
        await load();
        if (form.type === "SELECT") {
          await fetchOptionsForField(editing.id);
          return;
        }
        setDialogOpen(false);
        return;
      }
      const { data } = await axiosInstance.post("/api/academics/certificate-field-masters", body);
      const created = data.payload as CertificateFieldMaster | null;
      toast.success("Field created");
      await load();
      if (form.type === "SELECT" && created?.id) {
        if (pendingSnapshot.length > 0) {
          await persistPendingOptionsApi(created.id, pendingSnapshot);
          setPendingOptions([]);
        }
        setEditing(created);
        setForm({
          certificateMasterId: created.certificateMasterId,
          name: created.name,
          type: created.type,
          isQuestion: created.isQuestion,
          sequence: created.sequence,
          isRequired: created.isRequired,
          isActive: created.isActive,
        });
        await fetchOptionsForField(created.id);
        return;
      }
      setDialogOpen(false);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await axiosInstance.delete(`/api/academics/certificate-field-masters/${deleteId}`);
      toast.success("Deleted");
      setDeleteId(null);
      await load();
    } catch {
      toast.error("Delete failed — field may be in use");
      setDeleteId(null);
    }
  };

  const fetchOptionsForField = useCallback(async (fieldId: number) => {
    setOptionsLoading(true);
    try {
      const { data } = await axiosInstance.get<{ payload: FieldOption[] }>(
        `/api/academics/certificate-field-option-masters?certificateFieldMasterId=${fieldId}`,
      );
      setOptionRows(Array.isArray(data.payload) ? data.payload : []);
    } catch {
      toast.error("Failed to load options");
      setOptionRows([]);
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!dialogOpen || form.type !== "SELECT" || !editing?.id) return;
    void fetchOptionsForField(editing.id);
  }, [dialogOpen, form.type, editing?.id, fetchOptionsForField]);

  const openEditOption = (opt: FieldOption) => {
    setEditingOption(opt);
    setOptionForm({
      name: opt.name,
      sequence: opt.sequence,
      isActive: opt.isActive,
    });
  };

  const queueNewOption = () => {
    const name = optionForm.name.trim();
    if (!name) {
      toast.error("Enter the option text.");
      return;
    }
    const seq = nextOptionSequence(optionRows, pendingOptions);
    const tempId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPendingOptions((p) => [
      ...p,
      { tempId, name, isActive: optionForm.isActive, sequence: seq },
    ]);
    setOptionForm(emptyOptionForm);
  };

  const removePendingOption = (tempId: string) => {
    setPendingOptions((p) => p.filter((x) => x.tempId !== tempId));
  };

  const saveOption = async () => {
    if (!editing?.id || !editingOption) {
      toast.error("Nothing to update.");
      return;
    }
    const name = optionForm.name.trim();
    if (!name) {
      toast.error("Enter the option text.");
      return;
    }

    setSavingOption(true);
    try {
      await axiosInstance.put(
        `/api/academics/certificate-field-option-masters/${editingOption.id}`,
        {
          name,
          sequence: editingOption.sequence,
          isActive: optionForm.isActive,
        },
      );
      toast.success("Option updated");
      setEditingOption(null);
      setOptionForm(emptyOptionForm);
      await fetchOptionsForField(editing.id);
      await load();
    } catch (e: unknown) {
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      const msg =
        data && typeof data === "object" && data !== null && "message" in data
          ? String((data as { message: unknown }).message)
          : "";
      toast.error(msg || "Save option failed");
    } finally {
      setSavingOption(false);
    }
  };

  const confirmDeleteOption = async () => {
    if (deleteOptionId == null || !editing?.id) return;
    try {
      await axiosInstance.delete(
        `/api/academics/certificate-field-option-masters/${deleteOptionId}`,
      );
      toast.success("Option removed");
      setDeleteOptionId(null);
      await fetchOptionsForField(editing.id);
      await load();
    } catch {
      toast.error("Could not delete option");
      setDeleteOptionId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">Loading certificate fields…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <ListTree className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0 text-violet-700" />
                <span className="truncate text-violet-900">Certificate fields</span>
              </CardTitle>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Field definitions for each certificate master (used on career progression forms).
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterMasterId} onValueChange={setFilterMasterId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Certificate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All certificates</SelectItem>
                  {masters.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={openCreate}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                disabled={masters.length === 0}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add field</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </CardHeader>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingOption(null);
                setOptionForm(emptyOptionForm);
                setOptionRows([]);
                setPendingOptions([]);
              }
            }}
          >
            <DialogContent className="w-[min(100vw-2rem,1200px)] sm:max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col gap-0">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit field" : "New field"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-5 space-y-2 min-w-0">
                    <Label>Certificate</Label>
                    <Select
                      value={String(form.certificateMasterId)}
                      onValueChange={(v) => setForm((f) => ({ ...f, certificateMasterId: v }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select certificate" />
                      </SelectTrigger>
                      <SelectContent>
                        {masters.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-4 space-y-2 min-w-0">
                    <Label>Type</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm((f) => ({ ...f, type: v as FieldType }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 space-y-2 min-w-0">
                    <Label htmlFor="cf-seq">Sequence</Label>
                    <Input
                      id="cf-seq"
                      type="number"
                      value={form.sequence}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sequence: parseInt(e.target.value, 10) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cf-name">Field name</Label>
                  <Textarea
                    id="cf-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Label or question shown to students"
                    rows={4}
                    className="min-h-[100px] resize-y"
                  />
                </div>
              </div>

              {form.type === "SELECT" ? (
                <div className="space-y-3 border-t border-violet-100 pt-5 mt-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-violet-900">Dropdown options</p>
                    <p className="text-xs text-muted-foreground">
                      Add options below; they are stored when you click <strong>Save field</strong>{" "}
                      (new options are not sent to the server until then). Editing an existing
                      option still saves immediately when you click Update.
                    </p>
                  </div>

                  {!editing?.id ? (
                    <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2.5">
                      For a new field, click <strong>Save field</strong> once to create it; any
                      options you added below will be saved at the same time.
                    </p>
                  ) : null}

                  <div className="rounded-xl space-y-4">
                    <form
                      className="rounded-lg border bg-card p-4 shadow-sm space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editingOption) {
                          void saveOption();
                        } else {
                          queueNewOption();
                        }
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {editingOption ? "Edit option" : "Add option"}
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 min-w-0">
                        <Input
                          value={optionForm.name}
                          onChange={(e) => setOptionForm((o) => ({ ...o, name: e.target.value }))}
                          placeholder="Option text shown to students"
                          className="h-10 w-full min-w-0 flex-1"
                          aria-label="Option text"
                          autoComplete="off"
                        />
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="opt-act"
                              checked={optionForm.isActive}
                              onCheckedChange={(c) =>
                                setOptionForm((o) => ({ ...o, isActive: Boolean(c) }))
                              }
                            />
                            <Label htmlFor="opt-act" className="font-normal cursor-pointer text-sm">
                              Active
                            </Label>
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 h-10 px-4"
                            disabled={savingOption && Boolean(editingOption)}
                          >
                            {savingOption && editingOption
                              ? "Saving…"
                              : editingOption
                                ? "Update"
                                : "Add option"}
                          </Button>
                          {editingOption ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-10"
                              onClick={() => {
                                setEditingOption(null);
                                setOptionForm(emptyOptionForm);
                              }}
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        New rows are queued locally. Order is assigned automatically. Use Update
                        only when editing an option already saved on the server.
                      </p>
                    </form>

                    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/50 border-b">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Options list
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {optionsLoading
                            ? "…"
                            : `${combinedOptionRows.length} total${pendingOptions.length > 0 ? ` (${pendingOptions.length} unsaved)` : ""}`}
                        </span>
                      </div>
                      {optionsLoading && editing?.id ? (
                        <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
                      ) : combinedOptionRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-12 text-center px-4">
                          No options yet. Add options above; they will be saved when you save the
                          field.
                        </p>
                      ) : (
                        <div className="max-h-[min(280px,42vh)] overflow-y-auto overflow-x-hidden">
                          <Table
                            containerClassName="w-full min-w-0 overflow-x-hidden"
                            className="w-full table-fixed"
                          >
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-b bg-muted/30">
                                <TableHead className="w-12 h-10 text-xs font-semibold">#</TableHead>
                                <TableHead className="h-10 text-xs font-semibold min-w-0">
                                  Option
                                </TableHead>
                                <TableHead className="w-24 h-10 text-xs font-semibold">
                                  Status
                                </TableHead>
                                <TableHead className="w-[100px] h-10 text-right text-xs font-semibold">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {combinedOptionRows.map((row, idx) =>
                                row.kind === "server" ? (
                                  <TableRow key={`s-${row.key}`} className="hover:bg-muted/20">
                                    <TableCell className="tabular-nums text-muted-foreground text-xs">
                                      {idx + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm min-w-0 break-words">
                                      {row.name}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap items-center gap-1">
                                        {row.isActive ? (
                                          <Badge className="bg-green-600 text-white hover:bg-green-600 text-xs">
                                            Yes
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">
                                            No
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => openEditOption(row.server)}
                                          aria-label="Edit option"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-600"
                                          onClick={() => setDeleteOptionId(row.server.id)}
                                          aria-label="Delete option"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <TableRow
                                    key={`p-${row.tempId}`}
                                    className="hover:bg-muted/20 bg-amber-50/40"
                                  >
                                    <TableCell className="tabular-nums text-muted-foreground text-xs">
                                      {idx + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm min-w-0 break-words">
                                      <span className="mr-2">{row.name}</span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] border-amber-300 text-amber-900 bg-amber-100"
                                      >
                                        Unsaved
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {row.isActive ? (
                                        <Badge className="bg-green-600 text-white hover:bg-green-600 text-xs">
                                          Yes
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          No
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2 text-red-600"
                                        onClick={() => removePendingOption(row.tempId)}
                                      >
                                        Remove
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ),
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-start order-2 sm:order-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cf-req"
                      checked={form.isRequired}
                      onCheckedChange={(c) => setForm((f) => ({ ...f, isRequired: Boolean(c) }))}
                    />
                    <Label htmlFor="cf-req" className="font-normal cursor-pointer text-sm">
                      Required
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cf-q"
                      checked={form.isQuestion}
                      onCheckedChange={(c) => setForm((f) => ({ ...f, isQuestion: Boolean(c) }))}
                    />
                    <Label htmlFor="cf-q" className="font-normal cursor-pointer text-sm">
                      Question
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cf-act"
                      checked={form.isActive}
                      onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: Boolean(c) }))}
                    />
                    <Label htmlFor="cf-act" className="font-normal cursor-pointer text-sm">
                      Active
                    </Label>
                  </div>
                </div>
                <div className="flex w-full sm:w-auto gap-2 justify-end order-1 sm:order-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {form.type === "SELECT" && editing?.id ? "Close" : "Cancel"}
                  </Button>
                  <Button
                    onClick={() => void save()}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {saving ? "Saving…" : "Save field"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <CardContent className="px-0">
            <div className="sticky top-[72px] z-20 bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
              <Input
                placeholder="Search..."
                className="w-full sm:w-64"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="relative min-h-0" style={{ height: "600px" }}>
              <div className="h-full min-h-0 overflow-auto">
                <Table
                  containerClassName="min-w-0 !overflow-visible w-full h-full"
                  className="border rounded-md min-w-[980px]"
                  style={{ tableLayout: "fixed" }}
                >
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead
                        className="sticky top-0 z-20 min-w-0 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                        style={{ width: 44 }}
                      >
                        Seq
                      </TableHead>
                      <TableHead
                        className="sticky top-0 z-20 min-w-0 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                        style={{ width: 200 }}
                      >
                        Certificate
                      </TableHead>
                      <TableHead className="sticky top-0 z-20 min-w-0 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
                        Field
                      </TableHead>
                      <TableHead
                        className="sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                        style={{ width: 88 }}
                      >
                        Type
                      </TableHead>
                      <TableHead className="sticky top-0 z-20 min-w-0 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
                        Select options
                      </TableHead>
                      <TableHead
                        className="sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                        style={{ width: 80 }}
                      >
                        Status
                      </TableHead>
                      <TableHead
                        className="sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                        style={{ width: 140 }}
                      >
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFields.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          {fields.length === 0
                            ? "No certificate fields yet."
                            : "No fields match your search or filter."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedFields.map((r) => {
                        const master = masterById.get(r.certificateMasterId);
                        const opts = r.options ?? [];
                        return (
                          <TableRow key={r.id} className="group">
                            <TableCell>{r.sequence}</TableCell>
                            <TableCell className="min-w-0 align-middle">
                              {master ? (
                                <CertificateNameBadge
                                  name={master.name}
                                  color={master.color}
                                  bgColor={master.bgColor}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="min-w-0 align-top">
                              <div className="flex items-start gap-1 min-w-0">
                                {r.isQuestion ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="mt-0.5 inline-flex shrink-0 text-violet-600 leading-none">
                                        <MessageCircleQuestion className="h-4 w-4" aria-hidden />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      Question field
                                    </TooltipContent>
                                  </Tooltip>
                                ) : null}
                                <p
                                  className="text-sm leading-snug text-foreground min-w-0 break-words"
                                  title={r.name}
                                >
                                  {r.name}
                                  {r.isRequired ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className="text-red-600 font-semibold whitespace-nowrap"
                                          aria-label="Required"
                                        >
                                          {" "}
                                          *
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>Required field</TooltipContent>
                                    </Tooltip>
                                  ) : null}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono text-[10px] border",
                                  fieldTypeBadgeClass(r.type),
                                )}
                              >
                                {r.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-0 align-top">
                              {r.type === "SELECT" ? (
                                opts.length === 0 ? (
                                  <span className="text-xs text-amber-700">No options</span>
                                ) : (
                                  <ol className="my-0 list-decimal pl-5 text-sm leading-snug text-foreground space-y-1 max-w-full marker:text-muted-foreground">
                                    {[...opts]
                                      .sort((a, b) => a.sequence - b.sequence)
                                      .map((o) => (
                                        <li key={o.id} className="min-w-0 break-words pl-0.5">
                                          {o.name}
                                        </li>
                                      ))}
                                  </ol>
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {r.isActive ? (
                                <Badge className="bg-green-500 text-white hover:bg-green-600">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEdit(r)}
                                  aria-label="Edit field"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => setDeleteId(r.id)}
                                  aria-label="Delete field"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={deleteId != null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this field?</AlertDialogTitle>
              <AlertDialogDescription>
                Options under this field will be removed. Submitted student data may still reference
                it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteOptionId != null} onOpenChange={() => setDeleteOptionId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this option?</AlertDialogTitle>
              <AlertDialogDescription>
                Students who already chose this option may still reference it in saved forms.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirmDeleteOption()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
