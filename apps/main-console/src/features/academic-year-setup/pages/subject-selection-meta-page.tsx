import { useEffect, useMemo, useState } from "react";
import { Layers, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance from "@/utils/api";
import { AcademicYearSelector } from "@/components/academic-year/AcademicYearSelector";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { subjectSelectionApi } from "@/services/subject-selection.api";
import { getSubjectTypes } from "@/services/course-design.api";
import { getAllClasses } from "@/services/classes.service";
import { getAllStreams } from "@/services/stream.api";
import { useResourceRoom } from "@/features/academic-year-setup/general/useResourceRoom";
import type { SubjectSelectionMetaDto } from "@repo/db/dtos/subject-selection";

const BADGE = {
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
  orange: "border-orange-300 bg-orange-50 text-orange-700",
  violet: "border-violet-300 bg-violet-50 text-violet-700",
} as const;

type IdNamed = {
  id: number;
  name: string | null;
  code?: string | null;
  shortName?: string | null;
  isActive?: boolean;
};

function chips(values: string[], color: keyof typeof BADGE) {
  if (!values.length) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((v, i) => (
        <Badge key={`${v}-${i}`} variant="outline" className={`text-xs ${BADGE[color]}`}>
          {v}
        </Badge>
      ))}
    </div>
  );
}

/** "SEMESTER II" -> "II" */
function roman(name: string): string {
  const s = name.replace(/semester/gi, "").trim();
  return (s || name).toUpperCase();
}

/**
 * "SEMESTER II" -> "Semester II". Sentence-cases each word but keeps roman
 * numerals fully uppercase, since class names end in one (I, II, … VIII).
 */
function sentenceCaseClass(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      /^[ivxlcdm]+$/.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** Where a meta's student options come from (mirrors the backend enum). */
type OptionSource = "ELECTIVE_SUBJECTS" | "PRIOR_SELECTION";

const OPTION_SOURCE_LABEL: Record<OptionSource, string> = {
  ELECTIVE_SUBJECTS: "Elective subjects",
  PRIOR_SELECTION: "Student's earlier selections",
};

const OPTION_SOURCE_HELP: Record<OptionSource, string> = {
  ELECTIVE_SUBJECTS:
    "Students choose from the elective subjects offered for their course in the selected semesters.",
  PRIOR_SELECTION:
    "Students choose only from what they already selected in the settings ticked alongside (e.g. offer Minor 5 from their Minor 1 / Minor 2 choices).",
};

export default function SubjectSelectionMetaPage() {
  const { currentAcademicYear } = useAcademicYear();
  const [metas, setMetas] = useState<SubjectSelectionMetaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Master lists for the edit dialog selects
  const [subjectTypes, setSubjectTypes] = useState<IdNamed[]>([]);
  const [classes, setClasses] = useState<IdNamed[]>([]);
  const [streams, setStreams] = useState<IdNamed[]>([]);

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSubjectTypeId, setEditSubjectTypeId] = useState<string>("");
  // Falls back to this when the meta's current category was since deactivated
  // (and so is no longer in the active-only `subjectTypes` combobox options).
  const [editSubjectTypeLabel, setEditSubjectTypeLabel] = useState<string>("");
  const [editClassIds, setEditClassIds] = useState<number[]>([]);
  const [editStreamIds, setEditStreamIds] = useState<number[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editOptionSource, setEditOptionSource] = useState<OptionSource>("ELECTIVE_SUBJECTS");
  const [editSourceMetaIds, setEditSourceMetaIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Add dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addSubjectTypeId, setAddSubjectTypeId] = useState<string>("");
  const [addClassIds, setAddClassIds] = useState<number[]>([]);
  const [addStreamIds, setAddStreamIds] = useState<number[]>([]);
  const [addIsActive, setAddIsActive] = useState(true);
  const [addOptionSource, setAddOptionSource] = useState<OptionSource>("ELECTIVE_SUBJECTS");
  const [addSourceMetaIds, setAddSourceMetaIds] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);

  const loadMetas = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/subject-selection/metas");
      const all = (res.data?.payload ?? []) as SubjectSelectionMetaDto[];
      setMetas(all);
    } catch {
      toast.error("Failed to load subject-selection metas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetas();
  }, []);

  // Load master lists once on mount
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getSubjectTypes(), getAllClasses(), getAllStreams()]).then(
      ([stRes, clRes, strRes]) => {
        if (cancelled) return;
        if (stRes.status === "fulfilled") {
          const allSubjectTypes = stRes.value as unknown as IdNamed[];
          setSubjectTypes(allSubjectTypes.filter((st) => st.isActive !== false));
        }
        if (clRes.status === "fulfilled") setClasses(clRes.value as unknown as IdNamed[]);
        if (strRes.status === "fulfilled") setStreams(strRes.value as unknown as IdNamed[]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleId = (id: number, arr: number[], setter: (next: number[]) => void) => {
    if (arr.includes(id)) setter(arr.filter((v) => v !== id));
    else setter([...arr, id]);
  };

  const openEdit = (m: SubjectSelectionMetaDto) => {
    setEditId(m.id ?? null);
    setEditLabel(m.label ?? "");
    setEditSubjectTypeId(m.subjectType?.id != null ? String(m.subjectType.id) : "");
    setEditSubjectTypeLabel(m.subjectType?.code || m.subjectType?.name || "");
    setEditClassIds(
      (m.forClasses ?? [])
        .map((c) => c.class?.id)
        .filter((id): id is number => typeof id === "number"),
    );
    setEditStreamIds(
      (m.streams ?? [])
        .map((s) => s.stream?.id)
        .filter((id): id is number => typeof id === "number"),
    );
    setEditOptionSource(
      ((m as { optionSource?: OptionSource }).optionSource ?? "ELECTIVE_SUBJECTS") as OptionSource,
    );
    setEditSourceMetaIds(
      ((m as { sources?: { sourceMeta?: { id?: number } }[] }).sources ?? [])
        .map((s) => s.sourceMeta?.id)
        .filter((id): id is number => typeof id === "number"),
    );
    setEditIsActive(m.isActive !== false);
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (editId == null) return;
    if (!editLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!editSubjectTypeId) {
      toast.error("Subject Category is required");
      return;
    }
    setSaving(true);
    try {
      await subjectSelectionApi.updateSubjectSelectionMeta(editId, {
        label: editLabel.trim(),
        subjectType: { id: Number(editSubjectTypeId) },
        isActive: editIsActive,
        forClasses: editClassIds.map((id) => ({ id })),
        streams: editStreamIds.map((id) => ({ id })),
        optionSource: editOptionSource,
        // Sources only apply to PRIOR_SELECTION; the backend clears them
        // otherwise so a stale list can't drive options later.
        sourceMetas:
          editOptionSource === "PRIOR_SELECTION" ? editSourceMetaIds.map((id) => ({ id })) : [],
      });
      toast.success("Subject-selection meta updated");
      setIsEditOpen(false);
      await loadMetas();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update meta";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setAddLabel("");
    setAddSubjectTypeId("");
    setAddClassIds([]);
    setAddStreamIds([]);
    setAddIsActive(true);
    setAddOptionSource("ELECTIVE_SUBJECTS");
    setAddSourceMetaIds([]);
    setIsAddOpen(true);
  };

  const saveAdd = async () => {
    if (!currentAcademicYear?.id) {
      toast.error("Select an academic year first");
      return;
    }
    if (!addLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!addSubjectTypeId) {
      toast.error("Subject Category is required");
      return;
    }
    setAdding(true);
    try {
      // Append after the highest existing sequence for this academic year —
      // sequence only controls row ordering, no need to make the admin pick it.
      const nextSequence =
        Math.max(
          0,
          ...metas
            .filter((m) => m.academicYear?.id === currentAcademicYear.id)
            .map((m) => m.sequence ?? 0),
        ) + 1;
      await subjectSelectionApi.createSubjectSelectionMeta({
        label: addLabel.trim(),
        sequence: nextSequence,
        subjectType: { id: Number(addSubjectTypeId) },
        academicYear: { id: currentAcademicYear.id },
        isActive: addIsActive,
        forClasses: addClassIds.map((id) => ({ id })),
        streams: addStreamIds.map((id) => ({ id })),
        optionSource: addOptionSource,
        sourceMetas:
          addOptionSource === "PRIOR_SELECTION" ? addSourceMetaIds.map((id) => ({ id })) : [],
      });
      toast.success("Subject-selection meta created");
      setIsAddOpen(false);
      await loadMetas();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create meta";
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  /**
   * Metas that can act as a source: others in the same academic year. A meta
   * can't source from itself, so the one being edited is excluded.
   */
  /**
   * Every meta in the current academic year, ordered by sequence. Callers pass
   * the id of the meta being edited so it cannot be its own source; the Add
   * dialog passes null (a new meta has no id yet) — using `editId` directly here
   * leaked the last-edited meta out of the Add dialog's list.
   */
  const yearMetas = useMemo(() => {
    const yearId = currentAcademicYear?.id;
    return metas
      .filter((m) => (yearId ? m.academicYear?.id === yearId : true))
      .filter((m) => m.id != null)
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      .map((m) => ({
        id: m.id as number,
        label: m.label ?? `Meta ${m.id}`,
        isActive: m.isActive !== false,
      }));
  }, [metas, currentAcademicYear?.id]);

  /**
   * Inactive metas are excluded — an inactive meta shows no dropdown to
   * students, so sourcing from one yields options that can never grow. A meta
   * also cannot be its own source.
   *
   * One exception: an inactive meta that is ALREADY saved as a source stays
   * listed (flagged), so a source configured before it was deactivated is
   * visible and can be unticked, rather than sitting in hidden state.
   */
  const sourceMetaChoicesFor = (selfId: number | null, selected: number[]) =>
    yearMetas.filter((m) => m.id !== selfId && (m.isActive || selected.includes(m.id)));

  const rows = useMemo(() => {
    const yearId = currentAcademicYear?.id;
    return (
      metas
        .filter((m) => (yearId ? m.academicYear?.id === yearId : true))
        // Inactive metas stay listed (flagged as a red row) so admins can find and
        // re-activate them — hiding them made them unreachable from this page.
        .filter((m) => (m.label ?? "").toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    );
  }, [metas, currentAcademicYear?.id, search]);

  useResourceRoom("subject-selection/metas", () => loadMetas());

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start justify-between gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Layers className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
              <span className="truncate">Subject-selection Meta</span>
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Subject-selection groups (Minor / IDC / AEC / CVAC) for{" "}
              <span className="font-medium">{currentAcademicYear?.year ?? "—"}</span>.
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <AcademicYearSelector showLabel={false} className="w-full sm:w-56" />
            <Input
              placeholder="Search label…"
              className="w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={openAdd} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="rounded-md border">
            <Table containerClassName="h-[70vh] overflow-auto rounded-md">
              <TableHeader className="sticky top-0 z-10 bg-gray-50">
                <TableRow>
                  <TableHead className="w-[22%]">Label</TableHead>
                  <TableHead>Subject Category</TableHead>
                  <TableHead>Semesters</TableHead>
                  <TableHead>Streams</TableHead>
                  <TableHead>Subject options from</TableHead>
                  <TableHead>Taken from</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((m) => (
                    <TableRow
                      key={m.id}
                      // Inactive metas are hidden from students entirely, so flag
                      // the whole row rather than tucking the status in a column.
                      className={m.isActive === false ? "bg-red-50 hover:bg-red-100" : undefined}
                    >
                      <TableCell className="font-medium">{m.label}</TableCell>
                      <TableCell>
                        {m.subjectType?.code || m.subjectType?.name ? (
                          <Badge variant="outline" className={`text-xs ${BADGE.emerald}`}>
                            {m.subjectType?.code || m.subjectType?.name}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {chips(
                          (m.forClasses ?? [])
                            .map((c) => c.class?.name)
                            .filter((n): n is string => !!n)
                            .map(roman),
                          "orange",
                        )}
                      </TableCell>
                      <TableCell>
                        {chips(
                          (m.streams ?? [])
                            .map((s) => s.stream?.shortName || s.stream?.name || s.stream?.code)
                            .filter((n): n is string => !!n),
                          "violet",
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const src = ((m as { optionSource?: OptionSource }).optionSource ??
                            "ELECTIVE_SUBJECTS") as OptionSource;
                          return (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                src === "PRIOR_SELECTION"
                                  ? "border-sky-300 bg-sky-50 text-sky-700"
                                  : "border-amber-300 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {OPTION_SOURCE_LABEL[src]}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {chips(
                          ((m as { sources?: { sourceMeta?: { label?: string } }[] }).sources ?? [])
                            .map((s) => s.sourceMeta?.label)
                            .filter((l): l is string => !!l),
                          "violet",
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(m)}
                          aria-label="Edit meta"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No subject-selection metas for {currentAcademicYear?.year ?? "this year"}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Plus className="h-4 w-4" />
              </span>
              Add Subject-selection Meta
            </DialogTitle>
            <DialogDescription>
              Create a new subject-selection group for{" "}
              <span className="font-medium">{currentAcademicYear?.year ?? "—"}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="add-meta-label">Label</Label>
              <Input
                id="add-meta-label"
                className="mt-1"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="Label"
              />
            </div>
            <div>
              <Label>Subject Category</Label>
              <Combobox
                className="mt-1"
                value={addSubjectTypeId}
                onChange={setAddSubjectTypeId}
                placeholder="Select subject category"
                dataArr={subjectTypes.map((st) => ({
                  value: String(st.id),
                  label: st.code || st.name || "",
                }))}
              />
            </div>
            <div>
              <Label>Subject options come from</Label>
              <Combobox
                className="mt-1"
                value={addOptionSource}
                onChange={(v) => setAddOptionSource((v || "ELECTIVE_SUBJECTS") as OptionSource)}
                placeholder="Select where options come from"
                dataArr={(Object.keys(OPTION_SOURCE_LABEL) as OptionSource[]).map((k) => ({
                  value: k,
                  label: OPTION_SOURCE_LABEL[k],
                }))}
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {OPTION_SOURCE_HELP[addOptionSource]}
          </p>

          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Applicable semesters</Label>
              <div className="mt-2 h-72 overflow-auto rounded border p-3">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`add-cls-${c.id}`}
                      checked={addClassIds.includes(c.id)}
                      onCheckedChange={() => toggleId(c.id, addClassIds, setAddClassIds)}
                    />
                    <Label htmlFor={`add-cls-${c.id}`} className="text-sm">
                      {sentenceCaseClass(c.name ?? "")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Streams</Label>
              <div className="mt-2 h-72 overflow-auto rounded border p-3">
                {streams.map((s) => (
                  <div key={s.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`add-str-${s.id}`}
                      checked={addStreamIds.includes(s.id)}
                      onCheckedChange={() => toggleId(s.id, addStreamIds, setAddStreamIds)}
                    />
                    <Label htmlFor={`add-str-${s.id}`} className="text-sm">
                      {s.shortName || s.name || s.code}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label
                className={addOptionSource === "ELECTIVE_SUBJECTS" ? "text-muted-foreground" : ""}
              >
                Take options from
              </Label>
              <div
                className={`mt-2 h-72 overflow-auto rounded border p-3 ${
                  addOptionSource === "ELECTIVE_SUBJECTS" ? "bg-muted/40" : ""
                }`}
              >
                {sourceMetaChoicesFor(null, addSourceMetaIds).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No other settings exist for this academic year yet.
                  </p>
                ) : (
                  sourceMetaChoicesFor(null, addSourceMetaIds).map((m) => (
                    <div key={m.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`add-src-${m.id}`}
                        disabled={addOptionSource === "ELECTIVE_SUBJECTS"}
                        checked={addSourceMetaIds.includes(m.id)}
                        onCheckedChange={() =>
                          toggleId(m.id, addSourceMetaIds, setAddSourceMetaIds)
                        }
                      />
                      <Label
                        htmlFor={`add-src-${m.id}`}
                        className={`text-sm ${
                          addOptionSource === "ELECTIVE_SUBJECTS" ? "text-muted-foreground" : ""
                        }`}
                      >
                        {m.label}
                        {!m.isActive && (
                          <span className="ml-1 text-xs text-red-600">(inactive)</span>
                        )}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 sm:justify-between">
            {/* Inactive metas are hidden from students — the backend meta query
                filters on isActive, so this switch controls whether the dropdown
                appears in CU-reg and the student console at all. */}
            <div className="flex items-center space-x-2">
              <Switch
                id="add-meta-active"
                checked={addIsActive}
                onCheckedChange={setAddIsActive}
                className="data-[state=checked]:bg-green-600"
              />
              <Label
                htmlFor="add-meta-active"
                className={`text-sm font-medium ${addIsActive ? "text-green-600" : "text-red-600"}`}
              >
                {addIsActive ? "Active" : "Inactive"}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={adding}>
                Cancel
              </Button>
              <Button onClick={saveAdd} disabled={adding}>
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Pencil className="h-4 w-4" />
              </span>
              Edit Subject-selection Meta
            </DialogTitle>
            <DialogDescription>
              Update the label, subject category, applicable classes, streams and status.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="meta-label">Label</Label>
              <Input
                id="meta-label"
                className="mt-1"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Label"
              />
            </div>
            <div>
              <Label>Subject Category</Label>
              <Combobox
                className="mt-1"
                value={editSubjectTypeId}
                onChange={(v) => {
                  setEditSubjectTypeId(v);
                  const picked = subjectTypes.find((st) => String(st.id) === v);
                  setEditSubjectTypeLabel(picked?.code || picked?.name || "");
                }}
                placeholder="Select subject category"
                selectedLabel={editSubjectTypeLabel}
                dataArr={subjectTypes.map((st) => ({
                  value: String(st.id),
                  label: st.code || st.name || "",
                }))}
              />
            </div>
            <div>
              <Label>Subject options come from</Label>
              <Combobox
                className="mt-1"
                value={editOptionSource}
                onChange={(v) => setEditOptionSource((v || "ELECTIVE_SUBJECTS") as OptionSource)}
                placeholder="Select where options come from"
                dataArr={(Object.keys(OPTION_SOURCE_LABEL) as OptionSource[]).map((k) => ({
                  value: k,
                  label: OPTION_SOURCE_LABEL[k],
                }))}
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {OPTION_SOURCE_HELP[editOptionSource]}
          </p>

          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Applicable semesters</Label>
              <div className="mt-2 h-72 overflow-auto rounded border p-3">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`cls-${c.id}`}
                      checked={editClassIds.includes(c.id)}
                      onCheckedChange={() => toggleId(c.id, editClassIds, setEditClassIds)}
                    />
                    <Label htmlFor={`cls-${c.id}`} className="text-sm">
                      {sentenceCaseClass(c.name ?? "")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Streams</Label>
              <div className="mt-2 h-72 overflow-auto rounded border p-3">
                {streams.map((s) => (
                  <div key={s.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`str-${s.id}`}
                      checked={editStreamIds.includes(s.id)}
                      onCheckedChange={() => toggleId(s.id, editStreamIds, setEditStreamIds)}
                    />
                    <Label htmlFor={`str-${s.id}`} className="text-sm">
                      {s.shortName || s.name || s.code}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label
                className={editOptionSource === "ELECTIVE_SUBJECTS" ? "text-muted-foreground" : ""}
              >
                Take options from
              </Label>
              <div
                className={`mt-2 h-72 overflow-auto rounded border p-3 ${
                  editOptionSource === "ELECTIVE_SUBJECTS" ? "bg-muted/40" : ""
                }`}
              >
                {sourceMetaChoicesFor(editId, editSourceMetaIds).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No other settings exist for this academic year yet.
                  </p>
                ) : (
                  sourceMetaChoicesFor(editId, editSourceMetaIds).map((m) => (
                    <div key={m.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`edit-src-${m.id}`}
                        disabled={editOptionSource === "ELECTIVE_SUBJECTS"}
                        checked={editSourceMetaIds.includes(m.id)}
                        onCheckedChange={() =>
                          toggleId(m.id, editSourceMetaIds, setEditSourceMetaIds)
                        }
                      />
                      <Label
                        htmlFor={`edit-src-${m.id}`}
                        className={`text-sm ${
                          editOptionSource === "ELECTIVE_SUBJECTS" ? "text-muted-foreground" : ""
                        }`}
                      >
                        {m.label}
                        {!m.isActive && (
                          <span className="ml-1 text-xs text-red-600">(inactive)</span>
                        )}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 sm:justify-between">
            {/* Inactive metas are hidden from students — the backend meta query
                filters on isActive, so this switch controls whether the dropdown
                appears in CU-reg and the student console at all. */}
            <div className="flex items-center space-x-2">
              <Switch
                id="meta-active"
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
                className="data-[state=checked]:bg-green-600"
              />
              <Label
                htmlFor="meta-active"
                className={`text-sm font-medium ${editIsActive ? "text-green-600" : "text-red-600"}`}
              >
                {editIsActive ? "Active" : "Inactive"}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
