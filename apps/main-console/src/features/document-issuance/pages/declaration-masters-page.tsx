import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FileSignature,
  ListChecks,
  Loader2,
  Pencil,
  PlusCircle,
  ScrollText,
  Settings2,
  TableProperties,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import DOMPurify, { type Config } from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  DECLARATION_CONTEXTS,
  DECLARATION_FIELD_TYPES,
  createDeclarationMaster,
  createDeclarationStatement,
  createDeclarationStatementField,
  createDeclarationStatementFieldOption,
  deleteDeclarationStatement,
  deleteDeclarationStatementField,
  deleteDeclarationStatementFieldOption,
  getAllDeclarationMasters,
  previewDeclarationMasterDraft,
  updateDeclarationMaster,
  updateDeclarationStatement,
  updateDeclarationStatementField,
  updateDeclarationStatementFieldOption,
  type DeclarationContext,
  type DeclarationFieldType,
  type DeclarationMaster,
  type DeclarationMasterDraftPreviewPayload,
  type DeclarationMasterPreview,
} from "@/features/document-issuance/services/declaration-master.service";

/* -------------------------------------------------------------------------- */
/*                              draft (dialog) tree                            */
/* -------------------------------------------------------------------------- */

/**
 * The whole declaration tree is edited in memory inside the single master
 * dialog and flushed on "Save master" — rows that already exist carry their
 * server `id`, brand-new rows carry `id: null` and are created on save. This is
 * the same pending-queue trick the certificate fields screen uses, extended so
 * create and edit behave identically.
 */
type DraftOption = {
  key: string;
  id: number | null;
  name: string;
  sequence: number;
  isActive: boolean;
};

type DraftField = {
  key: string;
  id: number | null;
  label: string;
  type: DeclarationFieldType;
  sequence: number;
  isActive: boolean;
  options: DraftOption[];
};

type DraftStatement = {
  key: string;
  id: number | null;
  statement: string;
  isRequired: boolean;
  sequence: number;
  isActive: boolean;
  fields: DraftField[];
};

/** Server rows the user removed in the dialog; deleted when the master saves. */
type RemovedIds = {
  statements: number[];
  fields: number[];
  options: number[];
};

const emptyRemoved: RemovedIds = { statements: [], fields: [], options: [] };

function makeKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

function apiErrorMessage(e: unknown, fallback: string): string {
  const data = axios.isAxiosError(e) ? e.response?.data : undefined;
  const msg =
    data && typeof data === "object" && data !== null && "message" in data
      ? String((data as { message: unknown }).message)
      : "";
  return msg || fallback;
}

/** `isActive` is nullable on these rows; anything but an explicit false is live. */
function isRowActive(value: boolean | null | undefined): boolean {
  return value !== false;
}

/**
 * Statements are authored as rich text, so the table renders them as HTML.
 * `dompurify` is already a dependency of this app (see `lib/certificate-field-html.ts`),
 * so the markup is whitelisted through it before it ever reaches the DOM.
 */
const STATEMENT_SANITIZE_OPTIONS: Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "ul",
    "ol",
    "li",
    "a",
    "span",
    "sub",
    "sup",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
};

function sanitizeStatementHtml(html: string | null | undefined): string {
  if (!html) return "";
  return String(DOMPurify.sanitize(html, STATEMENT_SANITIZE_OPTIONS));
}

/** Tag-free version of a statement, used for `title` tooltips and validation. */
function statementPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function contextBadgeClass(context: DeclarationContext): string {
  switch (context) {
    case "ADMISSION":
      return "border-violet-200 bg-violet-100 text-violet-900 hover:bg-violet-100";
    case "EXAM":
      return "border-sky-200 bg-sky-100 text-sky-900 hover:bg-sky-100";
    case "FEES":
      return "border-amber-200 bg-amber-100 text-amber-950 hover:bg-amber-100";
    case "LIBRARY":
      return "border-emerald-200 bg-emerald-100 text-emerald-950 hover:bg-emerald-100";
    default:
      return "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-100";
  }
}

function sortBySequence<T extends { sequence?: number | null; id: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const diff = (a.sequence ?? 0) - (b.sequence ?? 0);
    return diff !== 0 ? diff : a.id - b.id;
  });
}

/** Builds the editable tree for a master (or an empty tree for a new one). */
function toDraft(master: DeclarationMaster | null): DraftStatement[] {
  return sortBySequence(master?.statements ?? []).map((s, si) => ({
    key: `s-${s.id}`,
    id: s.id,
    statement: s.statement,
    isRequired: s.isRequired ?? true,
    sequence: s.sequence ?? si + 1,
    isActive: isRowActive(s.isActive),
    fields: sortBySequence(s.fields ?? []).map((f, fi) => ({
      key: `f-${f.id}`,
      id: f.id,
      label: f.label,
      // The DTO's `type` is optional (DB default), the draft's is not.
      type: f.type ?? "TEXT",
      sequence: f.sequence ?? fi + 1,
      isActive: isRowActive(f.isActive),
      options: sortBySequence(f.options ?? []).map((o, oi) => ({
        key: `o-${o.id}`,
        id: o.id,
        name: o.name,
        sequence: o.sequence ?? oi + 1,
        isActive: isRowActive(o.isActive),
      })),
    })),
  }));
}

/** First empty required cell of one statement, as a message — `null` when valid. */
function statementProblem(s: DraftStatement): string | null {
  if (!statementPlainText(s.statement)) return "the wording is required.";
  for (const [j, f] of s.fields.entries()) {
    if (!f.label.trim()) return `field ${j + 1} needs a label.`;
    if (f.type !== "SELECT") continue;
    for (const [k, option] of f.options.entries()) {
      if (!option.name.trim()) {
        return `option ${k + 1} of field "${f.label.trim() || j + 1}" needs its text.`;
      }
    }
  }
  return null;
}

/** First empty required cell in the tree, as a message — `null` when valid. */
function draftProblem(draft: DraftStatement[]): string | null {
  for (const [i, statement] of draft.entries()) {
    const problem = statementProblem(statement);
    if (problem) return `Statement ${i + 1}: ${problem}`;
  }
  return null;
}

/** Applies the dialog tree to the API: deletes first, then upserts top-down. */
async function persistDraftApi(
  masterId: number,
  draft: DraftStatement[],
  removed: RemovedIds,
): Promise<void> {
  for (const id of removed.options) await deleteDeclarationStatementFieldOption(id);
  for (const id of removed.fields) await deleteDeclarationStatementField(id);
  for (const id of removed.statements) await deleteDeclarationStatement(id);

  for (const s of draft) {
    let statementId = s.id;
    if (statementId == null) {
      const created = await createDeclarationStatement({
        declarationMasterId: masterId,
        statement: s.statement.trim(),
        isRequired: s.isRequired,
        sequence: s.sequence,
        isActive: s.isActive,
      });
      statementId = created?.id ?? null;
    } else {
      await updateDeclarationStatement(statementId, {
        statement: s.statement.trim(),
        isRequired: s.isRequired,
        sequence: s.sequence,
        isActive: s.isActive,
      });
    }
    if (statementId == null) continue;

    for (const f of s.fields) {
      let fieldId = f.id;
      if (fieldId == null) {
        const created = await createDeclarationStatementField({
          declarationMasterStatementId: statementId,
          label: f.label.trim(),
          type: f.type,
          sequence: f.sequence,
          isActive: f.isActive,
        });
        fieldId = created?.id ?? null;
      } else {
        await updateDeclarationStatementField(fieldId, {
          label: f.label.trim(),
          type: f.type,
          sequence: f.sequence,
          isActive: f.isActive,
        });
      }
      if (fieldId == null) continue;

      for (const o of f.options) {
        if (o.id == null) {
          await createDeclarationStatementFieldOption({
            declarationMasterStatementFieldId: fieldId,
            name: o.name.trim(),
            sequence: o.sequence,
            isActive: o.isActive,
          });
        } else {
          await updateDeclarationStatementFieldOption(o.id, {
            name: o.name.trim(),
            sequence: o.sequence,
            isActive: o.isActive,
          });
        }
      }
    }
  }
}

const emptyMasterForm = {
  name: "",
  context: "ADMISSION" as DeclarationContext,
  template: "",
  isActive: true,
};

type DialogTab = "configuration" | "preview";

/**
 * The email preview is rendered by the declaration-master endpoint itself —
 * `POST /api/academics/declaration-masters/preview` takes the *unsaved* dialog
 * tree, resolves the EJS template named in the form and renders it with sample
 * data. It touches no rows, so the preview tracks the draft live and works for
 * brand-new masters that have never been saved.
 */
type PreviewState =
  | null
  | { kind: "error"; message: string }
  | { kind: "ready"; data: DeclarationMasterPreview };

/** How long typing has to settle before the draft is posted for a re-render. */
const PREVIEW_DEBOUNCE_MS = 400;

/**
 * The dialog draft, in the shape the preview endpoint wants — the same tree
 * "Save master" would persist, minus the ids and the flags the email does not
 * care about. Blank statements / unlabelled fields are left in: the server
 * skips them, which keeps half-typed rows from flickering into the email.
 */
function toPreviewPayload(
  form: { name: string; template: string },
  draft: DraftStatement[],
): DeclarationMasterDraftPreviewPayload {
  return {
    name: form.name.trim(),
    template: form.template.trim(),
    statements: draft.map((s) => ({
      statement: s.statement,
      isActive: s.isActive,
      sequence: s.sequence,
      fields: s.fields.map((f) => ({
        label: f.label,
        isActive: f.isActive,
        sequence: f.sequence,
        options: f.options.map((o) => ({
          name: o.name,
          isActive: o.isActive,
          sequence: o.sequence,
        })),
      })),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*                            option / field / statement                       */
/* -------------------------------------------------------------------------- */

function OptionRow({
  value,
  onChange,
  onRemove,
}: {
  value: DraftOption;
  onChange: (patch: Partial<DraftOption>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
      <div className="sm:col-span-7 min-w-0">
        <Input
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Option text"
          aria-label="Option text"
          autoComplete="off"
          className="h-9 w-full"
        />
      </div>
      <div className="sm:col-span-2 min-w-0">
        <Input
          type="number"
          value={value.sequence}
          onChange={(e) => onChange({ sequence: parseInt(e.target.value, 10) || 0 })}
          aria-label="Option sequence"
          className="h-9 w-full"
        />
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <Checkbox
          id={`opt-act-${value.key}`}
          checked={value.isActive}
          onCheckedChange={(c) => onChange({ isActive: Boolean(c) })}
        />
        <Label htmlFor={`opt-act-${value.key}`} className="cursor-pointer text-sm font-normal">
          Active
        </Label>
      </div>
      <div className="sm:col-span-1 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 text-red-600 border-red-200 hover:bg-red-50"
          onClick={onRemove}
          aria-label="Remove option"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * One field of a statement, rendered as a table row inside the nested statement
 * dialog and edited inline (no third dialog layer). A SELECT field gets an
 * expandable sub-row underneath that hosts its dropdown options — still inside
 * the same nested dialog and the same draft tree.
 */
function FieldRows({
  value,
  optionsOpen,
  onToggleOptions,
  onChange,
  onRemove,
}: {
  value: DraftField;
  optionsOpen: boolean;
  onToggleOptions: () => void;
  onChange: (patch: Partial<DraftField>) => void;
  onRemove: () => void;
}) {
  const setOptions = (options: DraftOption[]) => onChange({ options });
  const isSelect = value.type === "SELECT";

  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell className="min-w-0 align-middle">
          <Input
            value={value.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Field label"
            aria-label="Field label"
            autoComplete="off"
            className="h-9 w-full"
          />
        </TableCell>
        <TableCell className="align-middle">
          <Select
            value={value.type}
            onValueChange={(v) => onChange({ type: v as DeclarationFieldType })}
          >
            <SelectTrigger className="h-9 w-full" aria-label="Field type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DECLARATION_FIELD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="align-middle">
          <Input
            type="number"
            value={value.sequence}
            onChange={(e) => onChange({ sequence: parseInt(e.target.value, 10) || 0 })}
            aria-label="Field sequence"
            className="h-9 w-full"
          />
        </TableCell>
        <TableCell className="align-middle">
          <div className="flex justify-center">
            <Checkbox
              checked={value.isActive}
              onCheckedChange={(c) => onChange({ isActive: Boolean(c) })}
              aria-label="Field active"
            />
          </div>
        </TableCell>
        <TableCell className="align-middle">
          <div className="flex justify-end gap-1">
            {isSelect ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={onToggleOptions}
                aria-label="Toggle dropdown options"
                aria-expanded={optionsOpen}
              >
                {optionsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="ml-1 text-[11px] tabular-nums">{value.options.length}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
              onClick={onRemove}
              aria-label="Remove field"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isSelect && optionsOpen ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/20 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dropdown options
                <Badge variant="outline" className="text-[10px]">
                  {value.options.length}
                </Badge>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  setOptions([
                    ...value.options,
                    {
                      key: makeKey(),
                      id: null,
                      name: "",
                      sequence: value.options.length + 1,
                      isActive: true,
                    },
                  ])
                }
              >
                <PlusCircle className="mr-1 h-4 w-4" />
                Add option
              </Button>
            </div>

            {value.options.length === 0 ? (
              <p className="text-xs text-amber-700">
                No options yet — a SELECT field needs at least one choice.
              </p>
            ) : (
              <div className="space-y-3">
                {value.options.map((o) => (
                  <OptionRow
                    key={o.key}
                    value={o}
                    onChange={(patch) =>
                      setOptions(
                        value.options.map((x) => (x.key === o.key ? { ...x, ...patch } : x)),
                      )
                    }
                    onRemove={() => setOptions(value.options.filter((x) => x.key !== o.key))}
                  />
                ))}
              </div>
            )}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

/**
 * One statement in the master dialog, rendered as a single compact table row.
 * Editing happens in the nested `StatementEditorDialog` layered on top of the
 * master dialog — this row only summarises and reorders. Everything stays
 * inside the draft tree; nothing hits the API until "Save master".
 */
function StatementRow({
  value,
  index,
  total,
  onEdit,
  onChange,
  onRemove,
  onMove,
}: {
  value: DraftStatement;
  index: number;
  total: number;
  onEdit: () => void;
  onChange: (patch: Partial<DraftStatement>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const statementHtml = useMemo(() => sanitizeStatementHtml(value.statement), [value.statement]);
  const statementText = useMemo(() => statementPlainText(value.statement), [value.statement]);

  return (
    <TableRow>
      <TableCell className="align-top tabular-nums text-sm text-muted-foreground">
        {index + 1}
      </TableCell>
      <TableCell className="min-w-0 align-top">
        {statementText ? (
          <div className="line-clamp-2 text-sm" title={statementText}>
            {/* sanitized above with dompurify — statements are authored as rich text */}
            <div
              className="prose prose-sm max-w-none [&_p]:m-0 [&_p]:inline [&_ul]:m-0 [&_ol]:m-0"
              dangerouslySetInnerHTML={{ __html: statementHtml }}
            />
          </div>
        ) : (
          <span className="text-sm italic text-muted-foreground">New statement</span>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {value.isActive ? null : (
            <Badge variant="secondary" className="text-[10px]">
              Inactive
            </Badge>
          )}
          {value.id == null ? (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-[10px] text-amber-800"
            >
              Unsaved
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`st-req-cell-${value.key}`}
            checked={value.isRequired}
            onCheckedChange={(c) => onChange({ isRequired: Boolean(c) })}
            aria-label="Required"
          />
          <Label
            htmlFor={`st-req-cell-${value.key}`}
            className="cursor-pointer text-xs font-normal text-muted-foreground"
          >
            {value.isRequired ? "Yes" : "No"}
          </Label>
        </div>
      </TableCell>
      <TableCell className="align-top">
        {value.fields.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {value.fields.map((f) => (
              <Badge key={f.key} variant="outline" className="max-w-[160px] text-[10px]">
                <span className="truncate">{f.label.trim() || "Untitled field"}</span>
              </Badge>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell className="align-top">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onEdit}
            aria-label="Edit statement"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Move statement up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Move statement down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
            onClick={onRemove}
            aria-label="Remove statement"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * The statement editor, hosted in a dialog layered on top of the master dialog.
 * It works on its own copy of the statement: "Done" hands the copy back to the
 * master draft tree, "Cancel" throws it away. Either way nothing is persisted
 * until the master dialog's "Save master".
 */
function StatementEditorForm({
  statement,
  index,
  isNew,
  onCancel,
  onApply,
}: {
  statement: DraftStatement;
  index: number;
  isNew: boolean;
  onCancel: () => void;
  onApply: (next: DraftStatement) => void;
}) {
  const [value, setValue] = useState<DraftStatement>(statement);
  const [openFieldKey, setOpenFieldKey] = useState<string | null>(null);

  const patch = (p: Partial<DraftStatement>) => setValue((v) => ({ ...v, ...p }));
  const setFields = (fields: DraftField[]) => patch({ fields });

  const handleDone = () => {
    const problem = statementProblem(value);
    if (problem) {
      toast.error(`This statement — ${problem}`);
      return;
    }
    onApply(value);
  };

  return (
    <>
      <DialogHeader className="shrink-0 border-b px-6 py-4">
        <DialogTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 shrink-0 text-muted-foreground" />
          {isNew ? "Add statement" : `Edit statement ${index + 1}`}
        </DialogTitle>
        {/* kept for assistive tech only — the header row is icon + title */}
        <DialogDescription className="sr-only">
          Edit the statement wording, its flags and the inputs shown under it.
        </DialogDescription>
      </DialogHeader>

      {/* same fixed-box trick as the master dialog: the body never resizes */}
      <div className="h-[68vh] min-h-[320px] overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ------------------------ left: the wording ----------------------- */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`st-text-${value.key}`}>Statement</Label>
              <Textarea
                id={`st-text-${value.key}`}
                value={value.statement}
                onChange={(e) => patch({ statement: e.target.value })}
                placeholder="Checkbox wording shown to the student — basic HTML (<strong>, <em>, <a>) is allowed"
                rows={10}
                className="min-h-[240px] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`st-seq-${value.key}`}>Sequence</Label>
              <Input
                id={`st-seq-${value.key}`}
                type="number"
                value={value.sequence}
                onChange={(e) => patch({ sequence: parseInt(e.target.value, 10) || 0 })}
                className="h-10 w-full sm:max-w-[160px]"
              />
            </div>
          </div>

          {/* ------------------------- right: the fields ---------------------- */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <TableProperties className="h-4 w-4 shrink-0" />
                Fields under this statement
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  setFields([
                    ...value.fields,
                    {
                      key: makeKey(),
                      id: null,
                      label: "",
                      type: "TEXT",
                      sequence: value.fields.length + 1,
                      isActive: true,
                      options: [],
                    },
                  ])
                }
              >
                <PlusCircle className="mr-1 h-4 w-4" />
                Add field
              </Button>
            </div>

            <div className="rounded-md border">
              <Table containerClassName="min-w-0 !overflow-visible w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-0">Field</TableHead>
                    <TableHead style={{ width: 130 }}>Type</TableHead>
                    <TableHead style={{ width: 92 }}>Seq</TableHead>
                    <TableHead className="text-center" style={{ width: 72 }}>
                      Active
                    </TableHead>
                    <TableHead className="text-right" style={{ width: 110 }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {value.fields.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No extra inputs under this statement — the student only ticks the checkbox.
                      </TableCell>
                    </TableRow>
                  ) : (
                    value.fields.map((f) => (
                      <FieldRows
                        key={f.key}
                        value={f}
                        optionsOpen={openFieldKey === f.key}
                        onToggleOptions={() =>
                          setOpenFieldKey((cur) => (cur === f.key ? null : f.key))
                        }
                        onChange={(fieldPatch) =>
                          setFields(
                            value.fields.map((x) =>
                              x.key === f.key ? { ...x, ...fieldPatch } : x,
                            ),
                          )
                        }
                        onRemove={() => {
                          setFields(value.fields.filter((x) => x.key !== f.key));
                          if (openFieldKey === f.key) setOpenFieldKey(null);
                        }}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t px-6 py-4 sm:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id={`st-req-${value.key}`}
              checked={value.isRequired}
              onCheckedChange={(c) => patch({ isRequired: c })}
            />
            <Label htmlFor={`st-req-${value.key}`} className="cursor-pointer text-sm font-normal">
              Required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`st-act-${value.key}`}
              checked={value.isActive}
              onCheckedChange={(c) => patch({ isActive: c })}
            />
            <Label htmlFor={`st-act-${value.key}`} className="cursor-pointer text-sm font-normal">
              Active
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleDone} className="bg-purple-600 hover:bg-purple-700">
            Done
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

/**
 * Nested dialog wrapper. Radix stacks layers, so Esc / an overlay click dismiss
 * only this one; the master dialog underneath additionally ignores its own
 * `onOpenChange` while this is open. The form is keyed by the statement so a
 * different row always starts from a clean local copy.
 */
function StatementEditorDialog({
  statement,
  index,
  isNew,
  onCancel,
  onApply,
}: {
  statement: DraftStatement | null;
  index: number;
  isNew: boolean;
  onCancel: () => void;
  onApply: (next: DraftStatement) => void;
}) {
  return (
    <Dialog
      open={statement != null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="flex max-h-[88vh] w-[min(100vw-2rem,1320px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
        {statement ? (
          <StatementEditorForm
            key={statement.key}
            statement={statement}
            index={index}
            isNew={isNew}
            onCancel={onCancel}
            onApply={onApply}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    page                                    */
/* -------------------------------------------------------------------------- */

export default function DeclarationMastersPage() {
  const [masters, setMasters] = useState<DeclarationMaster[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  // the single create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [masterForm, setMasterForm] = useState(emptyMasterForm);
  const [draft, setDraft] = useState<DraftStatement[]>([]);
  const [removed, setRemoved] = useState<RemovedIds>(emptyRemoved);
  const [saving, setSaving] = useState(false);

  // the nested statement editor dialog; `newStatementKey` is the row that was
  // appended by "Add statement" and must be dropped again if the user cancels
  const [editingStatementKey, setEditingStatementKey] = useState<string | null>(null);
  const [newStatementKey, setNewStatementKey] = useState<string | null>(null);

  // dialog tabs + the EJS email preview that belongs to `masterForm.template`
  const [dialogTab, setDialogTab] = useState<DialogTab>("configuration");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllDeclarationMasters();
      setMasters(rows);
    } catch {
      toast.error("Failed to load declaration masters");
      setMasters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMasters = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = q
      ? masters.filter(
          (m) =>
            (m.name ?? "").toLowerCase().includes(q) ||
            m.template.toLowerCase().includes(q) ||
            m.context.toLowerCase().includes(q) ||
            (m.statements ?? []).some((s) => s.statement.toLowerCase().includes(q)),
        )
      : masters;
    return [...list].sort((a, b) => {
      const byName = (a.name ?? "").localeCompare(b.name ?? "");
      if (byName !== 0) return byName;
      return a.template.localeCompare(b.template);
    });
  }, [masters, searchText]);

  /* ------------------------------ dialog open ----------------------------- */

  const resetDialog = () => {
    setEditingMasterId(null);
    setMasterForm(emptyMasterForm);
    setDraft([]);
    setRemoved(emptyRemoved);
    setEditingStatementKey(null);
    setNewStatementKey(null);
    setDialogTab("configuration");
    setPreviewState(null);
    setPreviewLoading(false);
  };

  const openCreate = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const openEdit = (row: DeclarationMaster) => {
    const rows = toDraft(row);
    setEditingMasterId(row.id);
    setMasterForm({
      name: row.name ?? "",
      context: row.context,
      template: row.template,
      isActive: isRowActive(row.isActive),
    });
    setDraft(rows);
    setRemoved(emptyRemoved);
    setEditingStatementKey(null);
    setNewStatementKey(null);
    setDialogTab("configuration");
    setPreviewState(null);
    setPreviewLoading(false);
    setDialogOpen(true);
  };

  /* ----------------------------- email preview ---------------------------- */

  /**
   * The draft is serialised once per render and the effect keys off that string,
   * so only edits the email actually depends on (wording, labels, options,
   * order, active flags, name, template) trigger a request — toggling
   * "Required", for instance, does not.
   */
  const previewPayloadKey = useMemo(
    () =>
      JSON.stringify(
        toPreviewPayload({ name: masterForm.name, template: masterForm.template }, draft),
      ),
    [masterForm.name, masterForm.template, draft],
  );

  /**
   * Every keystroke can start a request, so responses can land out of order.
   * Each run stamps a monotonically increasing id and only the newest id is
   * allowed to write state — a slow earlier response is dropped on arrival.
   */
  const previewRequestIdRef = useRef(0);

  useEffect(() => {
    if (!dialogOpen || dialogTab !== "preview") return;

    const payload = JSON.parse(previewPayloadKey) as DeclarationMasterDraftPreviewPayload;
    const timer = window.setTimeout(() => {
      previewRequestIdRef.current += 1;
      const requestId = previewRequestIdRef.current;
      setPreviewLoading(true);

      void previewDeclarationMasterDraft(payload)
        .then((data) => {
          if (requestId !== previewRequestIdRef.current) return;
          setPreviewState({ kind: "ready", data });
        })
        .catch((e: unknown) => {
          if (requestId !== previewRequestIdRef.current) return;
          setPreviewState({
            kind: "error",
            message: apiErrorMessage(e, "Could not render the email preview."),
          });
        })
        .finally(() => {
          if (requestId !== previewRequestIdRef.current) return;
          setPreviewLoading(false);
        });
    }, PREVIEW_DEBOUNCE_MS);

    // a newer edit (or leaving the tab) cancels a request that has not fired yet
    return () => window.clearTimeout(timer);
  }, [dialogOpen, dialogTab, previewPayloadKey]);

  /* --------------------------- draft manipulation -------------------------- */

  const patchStatement = (key: string, patch: Partial<DraftStatement>) =>
    setDraft((rows) => rows.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  /** Appends a blank statement and opens the nested editor straight on it. */
  const addStatement = () => {
    const key = makeKey();
    setDraft((rows) => [
      ...rows,
      {
        key,
        id: null,
        statement: "",
        isRequired: true,
        sequence: rows.length + 1,
        isActive: true,
        fields: [],
      },
    ]);
    setNewStatementKey(key);
    setEditingStatementKey(key);
  };

  const removeStatement = (row: DraftStatement) => {
    // fields/options cascade on the server, so only the statement id is queued
    if (row.id != null) {
      setRemoved((r) => ({ ...r, statements: [...r.statements, row.id as number] }));
    }
    setDraft((rows) => rows.filter((s) => s.key !== row.key));
    if (editingStatementKey === row.key) setEditingStatementKey(null);
    if (newStatementKey === row.key) setNewStatementKey(null);
  };

  const moveStatement = (index: number, direction: -1 | 1) => {
    setDraft((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      const moved = next[index];
      const displaced = next[target];
      if (!moved || !displaced) return rows;
      next[index] = displaced;
      next[target] = moved;
      return next.map((s, i) => ({ ...s, sequence: i + 1 }));
    });
  };

  /**
   * Removing a nested field/option has to remember the server id so the row is
   * deleted on save — this diff runs before the tree patch is applied.
   */
  const patchStatementTracked = (key: string, patch: Partial<DraftStatement>) => {
    if (patch.fields) {
      const before = draft.find((s) => s.key === key);
      if (before) {
        const nextFieldKeys = new Set(patch.fields.map((f) => f.key));
        const droppedFields = before.fields.filter((f) => !nextFieldKeys.has(f.key));
        const droppedFieldIds = droppedFields
          .map((f) => f.id)
          .filter((id): id is number => id != null);

        const nextOptionIds = new Set(
          patch.fields.flatMap((f) => f.options.map((o) => o.id)).filter((id) => id != null),
        );
        const droppedOptionIds = before.fields
          .filter((f) => nextFieldKeys.has(f.key))
          .flatMap((f) => f.options)
          .map((o) => o.id)
          .filter((id): id is number => id != null && !nextOptionIds.has(id));

        if (droppedFieldIds.length > 0 || droppedOptionIds.length > 0) {
          setRemoved((r) => ({
            ...r,
            fields: [...r.fields, ...droppedFieldIds],
            options: [...r.options, ...droppedOptionIds],
          }));
        }
      }
    }
    patchStatement(key, patch);
  };

  /* ------------------------ nested statement editor ------------------------ */

  const editingStatementIndex = draft.findIndex((s) => s.key === editingStatementKey);
  const editingStatement =
    editingStatementIndex >= 0 ? (draft[editingStatementIndex] ?? null) : null;

  /** Esc / overlay / Cancel on the nested dialog — a fresh row is rolled back. */
  const cancelStatementEdit = () => {
    if (newStatementKey != null && editingStatementKey === newStatementKey) {
      setDraft((rows) => rows.filter((s) => s.key !== newStatementKey));
    }
    setNewStatementKey(null);
    setEditingStatementKey(null);
  };

  /** "Done" — the edited copy goes back into the in-memory tree, nothing more. */
  const applyStatementEdit = (next: DraftStatement) => {
    patchStatementTracked(next.key, {
      statement: next.statement,
      isRequired: next.isRequired,
      sequence: next.sequence,
      isActive: next.isActive,
      fields: next.fields,
    });
    setNewStatementKey(null);
    setEditingStatementKey(null);
  };

  /* ------------------------------ master save ----------------------------- */

  const saveMaster = async () => {
    const name = masterForm.name.trim();
    const template = masterForm.template.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!template) {
      toast.error("Template file name is required");
      return;
    }
    const problem = draftProblem(draft);
    if (problem) {
      toast.error(problem);
      return;
    }

    const isEdit = editingMasterId != null;
    setSaving(true);
    try {
      const body = {
        name,
        context: masterForm.context,
        template,
        isActive: masterForm.isActive,
      };
      let masterId = editingMasterId;
      if (masterId != null) {
        await updateDeclarationMaster(masterId, body);
      } else {
        const created = await createDeclarationMaster(body);
        masterId = created?.id ?? null;
      }
      if (masterId == null) throw new Error("The server did not return the saved master.");

      await persistDraftApi(masterId, draft, removed);

      toast.success(isEdit ? "Declaration master saved" : "Declaration master created");
      setDialogOpen(false);
      resetDialog();
      await load();
    } catch (e: unknown) {
      toast.error(apiErrorMessage(e, "Save failed — the template name must be unique"));
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------- render -------------------------------- */

  if (loading) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">Loading declaration masters…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <FileSignature className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0 text-violet-700" />
              <span className="truncate text-violet-900">Declaration masters</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Declaration templates per context, with the statements, inputs and dropdown options
              students see.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={openCreate}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add master</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>

        {/* -------------------- the one create/edit dialog -------------------- */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            // while the nested statement editor is up it owns Esc / overlay clicks
            if (!open && editingStatementKey != null) return;
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogContent className="w-[min(100vw-2rem,1200px)] sm:max-w-6xl max-h-[90vh] gap-0 p-0 flex flex-col overflow-hidden">
            {/*
              The Tabs root has to wrap the header and the body so the triggers
              can sit in the sticky header while the panels live in the scroll
              box below.
            */}
            <Tabs
              value={dialogTab}
              onValueChange={(v) => setDialogTab(v as DialogTab)}
              className="flex min-h-0 w-full flex-col overflow-hidden"
            >
              <DialogHeader className="shrink-0 px-6 pb-3 pt-4">
                <DialogTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  {editingMasterId != null ? "Edit declaration master" : "New declaration master"}
                </DialogTitle>
                {/*
                  Radix warns when a dialog has no description, so keep one for
                  assistive tech only — the header row is icon + title.
                */}
                <DialogDescription className="sr-only">
                  Configure the declaration master, its statements, their fields and dropdown
                  options.
                </DialogDescription>
              </DialogHeader>

              {/* Tab strip: its own full-width row under the header, still outside the scroll box. */}
              <div className="shrink-0 border-b px-6 pb-3">
                <TabsList className="justify-start">
                  <TabsTrigger value="configuration">Configuration</TabsTrigger>
                  {/* renders the unsaved draft, so it works for new masters too */}
                  <TabsTrigger value="preview">Email preview</TabsTrigger>
                </TabsList>
              </div>

              {/*
                A fixed 72vh scroll box: the dialog is header + 72vh + footer no
                matter which tab is active or how many statements the draft has,
                so switching tabs never resizes the dialog — the content scrolls.
              */}
              <div className="flex h-[72vh] min-h-[320px] flex-col overflow-y-auto px-6 py-5">
                <TabsContent value="configuration" className="mt-0 flex-1 space-y-6">
                  {/* ------------------------ master details ----------------------- */}
                  <section className="space-y-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Settings2 className="h-4 w-4 shrink-0" />
                      Master details
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 min-w-0">
                        <Label htmlFor="dm-name">Name</Label>
                        <Input
                          id="dm-name"
                          value={masterForm.name}
                          onChange={(e) => setMasterForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Fee Due Declaration"
                          autoComplete="off"
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label htmlFor="dm-context">Context</Label>
                        <Select
                          value={masterForm.context}
                          onValueChange={(v) =>
                            setMasterForm((f) => ({ ...f, context: v as DeclarationContext }))
                          }
                        >
                          <SelectTrigger id="dm-context" className="h-10 w-full">
                            <SelectValue placeholder="Select context" />
                          </SelectTrigger>
                          <SelectContent>
                            {DECLARATION_CONTEXTS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label htmlFor="dm-template">Template</Label>
                        <Input
                          id="dm-template"
                          value={masterForm.template}
                          onChange={(e) =>
                            setMasterForm((f) => ({ ...f, template: e.target.value }))
                          }
                          placeholder="fee-due-declaration"
                          autoComplete="off"
                          className="h-10 w-full"
                        />
                      </div>
                    </div>
                  </section>

                  {/* -------------------------- statements ------------------------- */}
                  <section className="space-y-3 border-t pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <ListChecks className="h-4 w-4 shrink-0" />
                        Statements
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={addStatement}
                      >
                        <PlusCircle className="mr-1 h-4 w-4" />
                        Add statement
                      </Button>
                    </div>

                    <div className="rounded-md border">
                      <Table containerClassName="min-w-0 !overflow-visible w-full">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead style={{ width: 70 }}>Sr No</TableHead>
                            <TableHead className="min-w-0">Statement</TableHead>
                            <TableHead style={{ width: 110 }}>Required</TableHead>
                            <TableHead style={{ width: 240 }}>Fields</TableHead>
                            <TableHead className="text-right" style={{ width: 170 }}>
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {draft.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                              <TableCell
                                colSpan={5}
                                className="py-10 text-center text-sm text-muted-foreground"
                              >
                                No statements yet. Click <strong>Add statement</strong> to start.
                              </TableCell>
                            </TableRow>
                          ) : (
                            draft.map((s, idx) => (
                              <StatementRow
                                key={s.key}
                                value={s}
                                index={idx}
                                total={draft.length}
                                onEdit={() => {
                                  setNewStatementKey(null);
                                  setEditingStatementKey(s.key);
                                }}
                                onChange={(patch) => patchStatementTracked(s.key, patch)}
                                onRemove={() => removeStatement(s)}
                                onMove={(direction) => moveStatement(idx, direction)}
                              />
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                </TabsContent>

                {/*
                  Every state below fills the same box, so the dialog never
                  resizes. A re-render never blanks what is already on screen
                  either: the previous html stays put and an "Updating…" pill is
                  overlaid on top of it while the new one is fetched.
                */}
                <TabsContent value="preview" className="mt-0 flex min-h-0 flex-1 flex-col">
                  <div className="relative flex min-h-0 flex-1 flex-col">
                    {previewState?.kind === "error" ? (
                      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        {previewState.message}
                      </div>
                    ) : previewState?.kind === "ready" ? (
                      previewState.data.kind === "EMAIL" ? (
                        <iframe
                          title="Email template preview"
                          srcDoc={previewState.data.html}
                          className="h-full min-h-0 w-full flex-1 rounded-md border bg-white"
                          sandbox=""
                        />
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            The &quot;{previewState.data.templateKey ?? masterForm.template.trim()}
                            &quot; template could not be rendered.
                          </p>
                          {previewState.data.error ? (
                            <p className="max-w-lg text-xs text-muted-foreground/80">
                              {previewState.data.error}
                            </p>
                          ) : null}
                        </div>
                      )
                    ) : (
                      // first render of this dialog — nothing to keep on screen yet
                      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        {previewLoading ? "Rendering the email preview…" : ""}
                      </div>
                    )}

                    {previewLoading && previewState != null ? (
                      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full border bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating…
                      </div>
                    ) : null}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t px-6 py-4 sm:justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="dm-active"
                  checked={masterForm.isActive}
                  onCheckedChange={(c) => setMasterForm((f) => ({ ...f, isActive: c }))}
                />
                <Label htmlFor="dm-active" className="cursor-pointer text-sm font-normal">
                  Active
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void saveMaster()}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? "Saving…" : "Save master"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ------- statement editor, layered on top of the master dialog ------ */}
        <StatementEditorDialog
          statement={editingStatement}
          index={editingStatementIndex}
          isNew={editingStatementKey != null && editingStatementKey === newStatementKey}
          onCancel={cancelStatementEdit}
          onApply={applyStatementEdit}
        />

        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="relative min-h-0" style={{ height: "480px" }}>
            <div className="h-full min-h-0 overflow-auto">
              <Table
                containerClassName="min-w-0 !overflow-visible w-full h-full"
                className="border rounded-md min-w-[900px]"
                style={{ tableLayout: "fixed" }}
              >
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead
                      className="sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                      style={{ width: 70 }}
                    >
                      Sr No
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                      style={{ width: 220 }}
                    >
                      Name
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                      style={{ width: 130 }}
                    >
                      Context
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 min-w-0 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
                      Statement
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                      style={{ width: 100 }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-20 text-right bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
                      style={{ width: 110 }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMasters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        {masters.length === 0
                          ? "No declaration masters yet."
                          : "No masters match your search."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMasters.map((m, idx) => {
                      const statements = sortBySequence(m.statements ?? []);
                      const first = statements[0];
                      return (
                        <TableRow key={m.id} className="group">
                          <TableCell className="tabular-nums text-sm text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="min-w-0">
                            <span
                              className="block truncate text-sm font-medium"
                              title={m.name ?? ""}
                            >
                              {m.name?.trim() || (
                                <span className="italic text-muted-foreground">Unnamed</span>
                              )}
                            </span>
                            <span
                              className="block truncate font-mono text-[11px] text-muted-foreground"
                              title={m.template}
                            >
                              {m.template}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono text-[10px] border",
                                contextBadgeClass(m.context),
                              )}
                            >
                              {m.context}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-0">
                            {first ? (
                              <div className="min-w-0">
                                {/* statements can be rich text — the list shows the tag-free text */}
                                <p
                                  className="truncate text-sm"
                                  title={statementPlainText(first.statement)}
                                >
                                  {statementPlainText(first.statement)}
                                </p>
                                {statements.length > 1 ? (
                                  <span className="text-xs text-muted-foreground">
                                    +{statements.length - 1} more
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No statements</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isRowActive(m.isActive) ? (
                              <Badge className="bg-green-500 text-white hover:bg-green-600">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEdit(m)}
                                aria-label="Edit master"
                              >
                                <Pencil className="h-4 w-4" />
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
    </div>
  );
}
