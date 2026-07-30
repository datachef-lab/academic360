import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { FileText, Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_DOMAINS,
  DOCUMENT_ELIGIBILITY_RULES,
  DOCUMENT_ISSUING_AUTHORITIES,
  createDocumentType,
  deleteDocumentType,
  getAllDocumentTypes,
  updateDocumentType,
  type DocumentCategory,
  type DocumentDomain,
  type DocumentEligibilityRule,
  type DocumentIssuingAuthority,
  type DocumentType,
  type DocumentTypeUpsertBody,
} from "@/features/document-issuance/services/document-type.service";

const NONE = "__none__";
const DOCUMENT_TYPES_QUERY_KEY = ["document-types"] as const;

type FormState = {
  domain: DocumentDomain;
  name: string;
  description: string;
  issuingAuthority: DocumentIssuingAuthority | typeof NONE;
  category: DocumentCategory;
  eligibilityRule: DocumentEligibilityRule | typeof NONE;
  requiresFeeClearance: boolean;
  requiresLibraryClearance: boolean;
  isRecurring: boolean;
  sequence: string;
  isActive: boolean;
  bgColor: string;
  textColor: string;
};

const emptyForm = (): FormState => ({
  domain: "OTHER",
  name: "",
  description: "",
  issuingAuthority: NONE,
  category: "ADMINISTRATIVE",
  eligibilityRule: NONE,
  requiresFeeClearance: false,
  requiresLibraryClearance: false,
  isRecurring: false,
  sequence: "",
  isActive: true,
  bgColor: "#E2E8F0",
  textColor: "#1E293B",
});

const rowToForm = (row: DocumentType): FormState => ({
  domain: row.domain ?? "OTHER",
  name: row.name ?? "",
  description: row.description ?? "",
  issuingAuthority: row.issuingAuthority ?? NONE,
  category: row.category ?? "ADMINISTRATIVE",
  eligibilityRule: row.eligibilityRule ?? NONE,
  requiresFeeClearance: row.requiresFeeClearance ?? false,
  requiresLibraryClearance: row.requiresLibraryClearance ?? false,
  isRecurring: row.isRecurring ?? false,
  sequence: row.sequence != null ? String(row.sequence) : "",
  isActive: row.isActive !== false,
  bgColor: row.bgColor ?? "#E2E8F0",
  textColor: row.textColor ?? "#1E293B",
});

const formToBody = (f: FormState): DocumentTypeUpsertBody => ({
  domain: f.domain,
  name: f.name.trim(),
  description: f.description.trim() ? f.description.trim() : null,
  issuingAuthority: f.issuingAuthority === NONE ? null : f.issuingAuthority,
  category: f.category,
  // eligibilityRule only makes sense for EXAM_LINKED documents — cleared otherwise
  // so switching category away from EXAM_LINKED can't leave a stale rule behind.
  eligibilityRule:
    f.category === "EXAM_LINKED" && f.eligibilityRule !== NONE ? f.eligibilityRule : null,
  requiresFeeClearance: f.requiresFeeClearance,
  requiresLibraryClearance: f.requiresLibraryClearance,
  isRecurring: f.isRecurring,
  sequence: f.sequence.trim() ? Number(f.sequence) : null,
  isActive: f.isActive,
  bgColor: f.bgColor.trim() || null,
  textColor: f.textColor.trim() || null,
});

const label = (value: string) =>
  value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");

/** Pulls the server's validation message out of an axios error, if there is one. */
function apiErrorMessage(e: unknown, fallback: string): string {
  const data = axios.isAxiosError(e) ? e.response?.data : undefined;
  if (data && typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    const errors = record.errorMessages ?? record.errors;
    if (Array.isArray(errors) && errors.length > 0) return errors.join(", ");
    if (typeof record.message === "string" && record.message) return record.message;
  }
  return fallback;
}

/** Fixed, literal Tailwind classes so each category reads as its own color at a glance. */
function categoryBadgeClass(category: DocumentCategory | null | undefined): string {
  switch (category) {
    case "EXAM_LINKED":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "UPLOAD":
      return "border-pink-200 bg-pink-50 text-pink-800";
    case "SYSTEM_GENERATED":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "ADMINISTRATIVE":
      return "border-sky-200 bg-sky-50 text-sky-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

/** Fixed, literal Tailwind classes so each issuing authority reads as its own color at a glance. */
function issuingAuthorityBadgeClass(
  authority: DocumentIssuingAuthority | null | undefined,
): string {
  switch (authority) {
    case "UNIVERSITY":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "COLLEGE":
      return "border-teal-200 bg-teal-50 text-teal-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

function YesNoBadge({ value, activeLabel = "Yes" }: { value: boolean; activeLabel?: string }) {
  return value ? (
    <Badge variant="secondary" className="border-green-200 bg-green-50 text-[11px] text-green-700">
      {activeLabel}
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground">No</span>
  );
}

export default function DocumentTypesPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<DocumentType | null>(null);

  const {
    data: rows = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: DOCUMENT_TYPES_QUERY_KEY,
    queryFn: async () => (await getAllDocumentTypes()).payload ?? [],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: DOCUMENT_TYPES_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (body: DocumentTypeUpsertBody) => createDocumentType(body),
    onSuccess: async () => {
      toast.success("Document type created");
      setDialogOpen(false);
      await invalidate();
    },
    onError: (e) => {
      toast.error(apiErrorMessage(e, "Could not create document type — name must be unique."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: DocumentTypeUpsertBody }) =>
      updateDocumentType(id, body),
    onSuccess: async () => {
      toast.success("Document type updated");
      setDialogOpen(false);
      await invalidate();
    },
    onError: (e) => {
      toast.error(apiErrorMessage(e, "Could not update document type — name must be unique."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDocumentType(id),
    onSuccess: async () => {
      toast.success("Document type deleted");
      setDeleteTarget(null);
      await invalidate();
    },
    onError: (e) => {
      toast.error(apiErrorMessage(e, "Delete failed — this document type may already be in use."));
    },
  });

  const saving = createMutation.isLoading || updateMutation.isLoading;
  const deleting = deleteMutation.isLoading;

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.domain ?? "").toLowerCase().includes(q) ||
        (r.category ?? "").toLowerCase().includes(q) ||
        (r.issuingAuthority ?? "").toLowerCase().includes(q),
    );
  }, [rows, searchText]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: DocumentType) => {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Document type name is required");
      return;
    }
    const body = formToBody(form);
    if (editingId == null) {
      createMutation.mutate(body);
    } else {
      updateMutation.mutate({ id: editingId, body });
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="mb-3 flex flex-col gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <FileText className="mr-2 h-8 w-8 shrink-0 rounded-md border border-slate-400 p-1 text-purple-700" />
              Document Types
            </CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
              Master list of document types issued to students, with the clearance and eligibility
              rules that govern them.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="w-full bg-purple-600 text-white shadow-none hover:bg-purple-700 sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add document type
          </Button>
        </CardHeader>

        <CardContent className="px-0">
          <div className="mb-3 border-b bg-background px-2 py-3 sm:px-4">
            <Input
              placeholder="Search by name, description, domain, category or issuing authority..."
              className="w-full max-w-md"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="px-2 sm:px-4" style={{ minHeight: "400px" }}>
            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : isError ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-red-600">
                Failed to load document types.
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                No document types found.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                <Table containerClassName="min-w-max">
                  <TableHeader style={{ background: "#f3f4f6" }}>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">#</TableHead>
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap">Description</TableHead>
                      <TableHead className="whitespace-nowrap">Issued By</TableHead>
                      <TableHead className="whitespace-nowrap">Category</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Fee Clearance</TableHead>
                      <TableHead className="whitespace-nowrap text-center">
                        Library Clearance
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center">Recurring</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Status</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">{i + 1}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.name}</TableCell>
                        <TableCell
                          className="max-w-[240px] truncate whitespace-nowrap text-xs text-muted-foreground"
                          title={row.description ?? undefined}
                        >
                          {row.description}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.issuingAuthority ? (
                            <Badge
                              variant="outline"
                              className={`text-xs ${issuingAuthorityBadgeClass(row.issuingAuthority)}`}
                            >
                              {label(row.issuingAuthority)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-xs ${categoryBadgeClass(row.category)}`}
                          >
                            {label(row.category ?? "ADMINISTRATIVE")}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          <YesNoBadge value={row.requiresFeeClearance ?? false} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          <YesNoBadge value={row.requiresLibraryClearance ?? false} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          <YesNoBadge value={row.isRecurring ?? false} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          <Badge
                            variant="outline"
                            className={
                              row.isActive !== false
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-300 text-slate-600"
                            }
                          >
                            {row.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() => setDeleteTarget(row)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------ create/edit ----------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(96vw,760px)] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              {editingId == null ? "Add document type" : "Edit document type"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Class XII Marksheet"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description shown to staff"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Domain *</Label>
                <Select
                  value={form.domain}
                  onValueChange={(v) => setForm((f) => ({ ...f, domain: v as DocumentDomain }))}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {label(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      category: v as DocumentCategory,
                      // eligibilityRule only applies to EXAM_LINKED — drop it otherwise
                      eligibilityRule: v === "EXAM_LINKED" ? f.eligibilityRule : NONE,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {label(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.category === "EXAM_LINKED" ? (
                <div className="space-y-1.5">
                  <Label>Eligibility rule</Label>
                  <Select
                    value={form.eligibilityRule}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, eligibilityRule: v as DocumentEligibilityRule }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select rule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— None —</SelectItem>
                      {DOCUMENT_ELIGIBILITY_RULES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {label(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>Issued By</Label>
                <Select
                  value={form.issuingAuthority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, issuingAuthority: v as DocumentIssuingAuthority }))
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {DOCUMENT_ISSUING_AUTHORITIES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {label(a)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Sequence</Label>
                <Input
                  type="number"
                  value={form.sequence}
                  onChange={(e) => setForm((f) => ({ ...f, sequence: e.target.value }))}
                  placeholder="Display order"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Background color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="h-10 w-14 p-1"
                    value={form.bgColor}
                    onChange={(e) => setForm((f) => ({ ...f, bgColor: e.target.value }))}
                  />
                  <Input
                    value={form.bgColor}
                    onChange={(e) => setForm((f) => ({ ...f, bgColor: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Text color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="h-10 w-14 p-1"
                    value={form.textColor}
                    onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))}
                  />
                  <Input
                    value={form.textColor}
                    onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 rounded-md border bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="dt-fee"
                  checked={form.requiresFeeClearance}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, requiresFeeClearance: c }))}
                />
                <Label htmlFor="dt-fee" className="cursor-pointer text-sm font-normal">
                  Requires fee clearance
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="dt-library"
                  checked={form.requiresLibraryClearance}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, requiresLibraryClearance: c }))}
                />
                <Label htmlFor="dt-library" className="cursor-pointer text-sm font-normal">
                  Requires library clearance
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="dt-recurring"
                  checked={form.isRecurring}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, isRecurring: c }))}
                />
                <Label htmlFor="dt-recurring" className="cursor-pointer text-sm font-normal">
                  Recurring
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="dt-active"
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
                />
                <Label htmlFor="dt-active" className="cursor-pointer text-sm font-normal">
                  Active
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full bg-purple-600 text-white shadow-none hover:bg-purple-700 sm:ml-2 sm:w-auto"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------- delete -------------------------------- */}
      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document type?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete{" "}
              <span className="font-medium text-foreground">&quot;{deleteTarget?.name}&quot;</span>.
              This cannot be undone, and may fail if the document type is already referenced
              elsewhere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
