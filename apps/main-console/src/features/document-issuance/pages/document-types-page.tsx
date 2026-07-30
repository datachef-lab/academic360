import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  BookOpen,
  Building2,
  FileText,
  Filter,
  FolderTree,
  Layers,
  Loader2,
  Pencil,
  PlusCircle,
  Repeat,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import documentTypesIllustration from "@/features/document-issuance/assets/document-types-illustration.svg?raw";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
const ALL = "__all__";
const DOCUMENT_TYPES_QUERY_KEY = ["document-types"] as const;

type TriState = typeof ALL | "YES" | "NO";

type Filters = {
  domain: DocumentDomain | typeof ALL;
  category: DocumentCategory | typeof ALL;
  eligibilityRule: DocumentEligibilityRule | typeof ALL;
  requiresFeeClearance: TriState;
  requiresLibraryClearance: TriState;
  issuingAuthority: DocumentIssuingAuthority | typeof ALL;
};

const emptyFilters = (): Filters => ({
  domain: ALL,
  category: ALL,
  eligibilityRule: ALL,
  requiresFeeClearance: ALL,
  requiresLibraryClearance: ALL,
  issuingAuthority: ALL,
});

/** Switch defaults to `bg-primary` when on; these read as "enabled" instead. */
const SWITCH_ON = "data-[state=checked]:bg-green-400";

/**
 * New types get a colour pair off this list rather than a colour picker — the
 * badges stay legible and consistent, and it's one less thing to fill in.
 * Light background, darker text of the same hue, matching the seeded types.
 */
const BADGE_PALETTE: { bgColor: string; textColor: string }[] = [
  { bgColor: "#DBEAFE", textColor: "#1D4ED8" },
  { bgColor: "#DCFCE7", textColor: "#15803D" },
  { bgColor: "#FEF3C7", textColor: "#B45309" },
  { bgColor: "#EDE9FE", textColor: "#6D28D9" },
  { bgColor: "#CCFBF1", textColor: "#0F766E" },
  { bgColor: "#FCE7F3", textColor: "#BE185D" },
];

const countActiveFilters = (f: Filters) => Object.values(f).filter((v) => v !== ALL).length;

/**
 * Header cells pin to the top of the page's scroll container (MasterLayout owns
 * it) — hence no inner `overflow` wrapper around the table, which would make
 * `sticky` resolve against a box that never scrolls.
 * Deliberately no `whitespace-nowrap` — headers wrap so the table can fit a
 * narrow screen instead of forcing a horizontal scrollbar.
 */
const STICKY_HEAD =
  "sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))] " +
  "first:rounded-tl-md last:rounded-tr-md";

const matchesTriState = (state: TriState, value: boolean) =>
  state === ALL || (state === "YES") === value;

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
  isActive: boolean;
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
  isActive: true,
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
  isActive: row.isActive !== false,
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
  isActive: f.isActive,
  // sequence / bgColor / textColor are deliberately absent. On create they are
  // assigned below; on update the PUT parses partially, so leaving them out
  // means the stored values survive untouched.
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
      // null authority renders as "Student" — student-supplied uploads.
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

function FlagRow({
  id,
  icon,
  title,
  hint,
  checked,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex shrink-0 items-center">{icon}</span>
        <div className="min-w-0">
          <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
            {title}
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className={`shrink-0 ${SWITCH_ON}`}
      />
    </div>
  );
}

function YesNoBadge({ value, activeLabel = "Yes" }: { value: boolean; activeLabel?: string }) {
  return value ? (
    <Badge variant="secondary" className="border-green-200 bg-green-50 text-[11px] text-green-700">
      {activeLabel}
    </Badge>
  ) : (
    <span className="text-sm text-foreground">No</span>
  );
}

export default function DocumentTypesPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  // `filters` is what the table honours; `filterDraft` is what the dialog edits,
  // so opening the dialog and closing it without hitting Apply changes nothing.
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters());
  const [filterDraft, setFilterDraft] = useState<Filters>(emptyFilters());
  const activeFilterCount = countActiveFilters(filters);

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

  const saving = createMutation.isLoading || updateMutation.isLoading;

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.domain ?? "").toLowerCase().includes(q) ||
        (r.category ?? "").toLowerCase().includes(q) ||
        (r.issuingAuthority ?? "").toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filters.domain !== ALL && (r.domain ?? "OTHER") !== filters.domain) return false;
      if (filters.category !== ALL && (r.category ?? "ADMINISTRATIVE") !== filters.category) {
        return false;
      }
      // A row with no rule only matches when the rule filter is off.
      if (filters.eligibilityRule !== ALL && r.eligibilityRule !== filters.eligibilityRule) {
        return false;
      }
      if (filters.issuingAuthority !== ALL && r.issuingAuthority !== filters.issuingAuthority) {
        return false;
      }
      if (!matchesTriState(filters.requiresFeeClearance, r.requiresFeeClearance ?? false)) {
        return false;
      }
      if (!matchesTriState(filters.requiresLibraryClearance, r.requiresLibraryClearance ?? false)) {
        return false;
      }
      return true;
    });
  }, [rows, searchText, filters]);

  const openFilter = () => {
    setFilterDraft(filters);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters(filterDraft);
    setFilterOpen(false);
  };

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
      // Sequence and colours are system-assigned: next free slot, and the next
      // palette entry so consecutive types don't all look alike.
      const nextSequence = rows.reduce((max, r) => Math.max(max, r.sequence ?? 0), 0) + 1;
      createMutation.mutate({
        ...body,
        sequence: nextSequence,
        ...BADGE_PALETTE[rows.length % BADGE_PALETTE.length],
      });
    } else {
      updateMutation.mutate({ id: editingId, body });
    }
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
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={openFilter}
              className="flex-1 shadow-none sm:flex-none"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 border-purple-200 bg-purple-50 px-1.5 text-[11px] text-purple-700"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="flex-1 bg-purple-600 text-white shadow-none hover:bg-purple-700 sm:flex-none"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="mb-3 bg-background px-2 py-3 sm:px-4">
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
              <div className="rounded-md border bg-background">
                <Table containerClassName="max-w-full">
                  <TableHeader>
                    <TableRow>
                      {/* Sticky lives on the cells, not the <thead> — a collapsed
                          border table won't hold a sticky section reliably. */}
                      <TableHead className={STICKY_HEAD}>#</TableHead>
                      <TableHead className={`${STICKY_HEAD} w-[26%]`}>Document</TableHead>
                      <TableHead className={STICKY_HEAD}>Description</TableHead>
                      <TableHead className={STICKY_HEAD}>Category</TableHead>
                      <TableHead className={`${STICKY_HEAD} text-center`}>Fee Clearance</TableHead>
                      <TableHead className={`${STICKY_HEAD} text-center`}>
                        Library Clearance
                      </TableHead>
                      <TableHead className={`${STICKY_HEAD} text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row, i) => (
                      <TableRow
                        key={row.id}
                        className={
                          row.isActive === false ? "bg-red-50 hover:bg-red-100/80" : undefined
                        }
                      >
                        <TableCell className="whitespace-nowrap align-top">{i + 1}</TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="flex items-start gap-1.5 font-medium">
                              <span className="break-words">{row.name}</span>
                              {row.isRecurring && (
                                <Repeat
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                                  aria-label="Recurring"
                                >
                                  <title>Issued every semester / promotion</title>
                                </Repeat>
                              )}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${issuingAuthorityBadgeClass(row.issuingAuthority)}`}
                            >
                              {/* No authority on the row means nobody at the
                                  college or university issues it — the student
                                  supplies it. */}
                              {row.issuingAuthority ? label(row.issuingAuthority) : "Student"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words align-top text-sm text-foreground">
                          {row.description}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="outline"
                            className={`whitespace-nowrap text-xs ${categoryBadgeClass(row.category)}`}
                          >
                            {label(row.category ?? "ADMINISTRATIVE")}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center align-top">
                          <YesNoBadge value={row.requiresFeeClearance ?? false} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center align-top">
                          <YesNoBadge value={row.requiresLibraryClearance ?? false} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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

      {/* -------------------------------- filters ------------------------------- */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="flex max-h-[84vh] w-[min(96vw,620px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[620px]">
          <DialogHeader className="shrink-0 border-b bg-muted/40 px-6 py-3">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-700" />
              Filter document types
            </DialogTitle>
          </DialogHeader>

          <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Domain
              </Label>
              <Select
                value={filterDraft.domain}
                onValueChange={(v) =>
                  setFilterDraft((f) => ({ ...f, domain: v as Filters["domain"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All domains</SelectItem>
                  {DOCUMENT_DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {label(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                Category
              </Label>
              <Select
                value={filterDraft.category}
                onValueChange={(v) =>
                  setFilterDraft((f) => ({ ...f, category: v as Filters["category"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {label(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Eligibility rule
              </Label>
              <Select
                value={filterDraft.eligibilityRule}
                onValueChange={(v) =>
                  setFilterDraft((f) => ({
                    ...f,
                    eligibilityRule: v as Filters["eligibilityRule"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All rules</SelectItem>
                  {DOCUMENT_ELIGIBILITY_RULES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {label(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Issued by
              </Label>
              <Select
                value={filterDraft.issuingAuthority}
                onValueChange={(v) =>
                  setFilterDraft((f) => ({
                    ...f,
                    issuingAuthority: v as Filters["issuingAuthority"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All authorities</SelectItem>
                  {DOCUMENT_ISSUING_AUTHORITIES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {label(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                Fee clearance
              </Label>
              <Select
                value={filterDraft.requiresFeeClearance}
                onValueChange={(v) =>
                  setFilterDraft((f) => ({ ...f, requiresFeeClearance: v as TriState }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any</SelectItem>
                  <SelectItem value="YES">Required</SelectItem>
                  <SelectItem value="NO">Not required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Library clearance
              </Label>
              <Select
                value={filterDraft.requiresLibraryClearance}
                onValueChange={(v) =>
                  setFilterDraft((f) => ({ ...f, requiresLibraryClearance: v as TriState }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any</SelectItem>
                  <SelectItem value="YES">Required</SelectItem>
                  <SelectItem value="NO">Not required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-between border-t bg-muted/40 px-6 py-3 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setFilterDraft(emptyFilters())}>
              Clear all
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setFilterOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={applyFilters}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------ create/edit ----------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[84vh] w-[min(96vw,940px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[940px] sm:flex-row">
          {/* Decorative only, so it drops out below `sm` rather than squeezing
              the form. "Personal files" by Storyset — see ATTRIBUTION.txt. */}
          <aside
            aria-hidden="true"
            className="relative hidden w-[38%] shrink-0 overflow-hidden border-r-2 border-purple-200 bg-purple-50/60 sm:block"
          >
            {/* Inlined rather than <img src>, so the accent can resolve
                `--brand-400` and follow the environment palette. The svg carries
                preserveAspectRatio="slice", which fills the rail top to bottom. */}
            <div
              className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: documentTypesIllustration }}
            />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <DialogHeader className="shrink-0 border-b bg-muted/40 px-6 py-3">
              <DialogTitle className="flex items-center gap-2">
                {editingId == null ? (
                  <PlusCircle className="h-5 w-5 text-purple-700" />
                ) : (
                  <Pencil className="h-5 w-5 text-purple-700" />
                )}
                {editingId == null ? "Add document type" : "Edit document type"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>
                    Name <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Domain <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        category: v as DocumentCategory,
                        // eligibilityRule only applies to EXAM_LINKED — dropped
                        // otherwise. Switching it on seeds the usual rule instead
                        // of leaving it unset; RCSI_RECORDED stays selectable for
                        // revised-marksheet types.
                        eligibilityRule:
                          v !== "EXAM_LINKED"
                            ? NONE
                            : f.eligibilityRule === NONE
                              ? "FORM_FILLUP_RECORDED"
                              : f.eligibilityRule,
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
              </div>

              <div className="divide-y rounded-md border bg-muted/20">
                <FlagRow
                  id="dt-fee"
                  icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                  title="Requires fee clearance"
                  hint="Gates issue on fee dues: an outstanding balance holds the document until it is cleared, or until a staff member overrides the check with a remark."
                  checked={form.requiresFeeClearance}
                  onChange={(c) => setForm((f) => ({ ...f, requiresFeeClearance: c }))}
                />
                <FlagRow
                  id="dt-library"
                  icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
                  title="Requires library clearance"
                  hint="The same gate for the library: unreturned books or pending fines hold the document until they are settled or the check is overridden."
                  checked={form.requiresLibraryClearance}
                  onChange={(c) => setForm((f) => ({ ...f, requiresLibraryClearance: c }))}
                />
                <FlagRow
                  id="dt-recurring"
                  icon={<Repeat className="h-4 w-4 text-muted-foreground" />}
                  title="Recurring"
                  hint="The student gets a fresh copy each semester or promotion (admit cards, fee receipts). Leave off for one-time documents such as an ID card or the CU registration form."
                  checked={form.isRecurring}
                  onChange={(c) => setForm((f) => ({ ...f, isRecurring: c }))}
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col gap-3 border-t bg-muted/40 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 sm:mr-auto">
                <Switch
                  id="dt-active"
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
                  className={SWITCH_ON}
                />
                <Label htmlFor="dt-active" className="cursor-pointer text-sm font-normal">
                  Active
                </Label>
              </div>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
