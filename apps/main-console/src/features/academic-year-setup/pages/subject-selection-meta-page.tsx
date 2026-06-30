import { useEffect, useMemo, useState } from "react";
import { Layers, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { SubjectSelectionMetaDto } from "@repo/db/dtos/subject-selection";

const BADGE = {
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
  orange: "border-orange-300 bg-orange-50 text-orange-700",
  violet: "border-violet-300 bg-violet-50 text-violet-700",
} as const;

type IdNamed = { id: number; name: string | null; code?: string | null; shortName?: string | null };

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

function getMetaSubjectTypeLabel(m: SubjectSelectionMetaDto): string | null {
  return m.subjectType?.code || m.subjectType?.name || null;
}

function getMetaClassLabels(m: SubjectSelectionMetaDto): string[] {
  return (m.forClasses ?? [])
    .map((c) => c.class?.name)
    .filter((n): n is string => !!n)
    .map(roman);
}

function getMetaStreamLabels(m: SubjectSelectionMetaDto): string[] {
  return (m.streams ?? [])
    .map((s) => s.stream?.shortName || s.stream?.name || s.stream?.code)
    .filter((n): n is string => !!n);
}

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
  const [editClassIds, setEditClassIds] = useState<number[]>([]);
  const [editStreamIds, setEditStreamIds] = useState<number[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

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
        if (stRes.status === "fulfilled") setSubjectTypes(stRes.value as unknown as IdNamed[]);
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
      toast.error("Subject type is required");
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

  const rows = useMemo(() => {
    const yearId = currentAcademicYear?.id;
    return metas
      .filter((m) => (yearId ? m.academicYear?.id === yearId : true))
      .filter((m) => m.isActive !== false)
      .filter((m) => (m.label ?? "").toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }, [metas, currentAcademicYear?.id, search]);

  return (
    <div className="mx-auto min-h-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4 md:p-5">
      <Card className="border-none shadow-none sm:shadow-sm">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start justify-between gap-3 rounded-md border bg-background p-3 sm:gap-4 sm:p-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Layers className="mr-2 h-6 w-6 shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
              <span className="truncate">Subject-selection Meta</span>
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Subject-selection groups (Minor / IDC / AEC / CVAC) for{" "}
              <span className="font-medium">{currentAcademicYear?.year ?? "—"}</span>.
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
            <AcademicYearSelector showLabel={false} className="w-full sm:w-56" />
            <Input
              placeholder="Search label…"
              className="w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {loading ? (
            <div className="rounded-md border px-4 py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-md border px-4 py-10 text-center text-sm text-muted-foreground">
              No subject-selection metas for {currentAcademicYear?.year ?? "this year"}.
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="divide-y divide-gray-200 overflow-hidden rounded-md border md:hidden">
                {rows.map((m) => {
                  const subjectType = getMetaSubjectTypeLabel(m);
                  const classLabels = getMetaClassLabels(m);
                  const streamLabels = getMetaStreamLabels(m);
                  return (
                    <div key={m.id} className="space-y-3 p-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold leading-snug text-gray-900">
                            {m.label}
                          </div>
                          <div className="mt-2">
                            {subjectType ? (
                              <Badge variant="outline" className={`text-xs ${BADGE.emerald}`}>
                                {subjectType}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                            Classes
                          </div>
                          <div className="mt-1.5">{chips(classLabels, "orange")}</div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                            Streams
                          </div>
                          <div className="mt-1.5">{chips(streamLabels, "violet")}</div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden rounded-md border md:block">
                <Table containerClassName="h-[70vh] overflow-auto rounded-md">
                  <TableHeader className="sticky top-0 z-10 bg-gray-50">
                    <TableRow>
                      <TableHead className="w-[35%]">Label</TableHead>
                      <TableHead>Subject type</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Streams</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((m) => {
                      const subjectType = getMetaSubjectTypeLabel(m);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.label}</TableCell>
                          <TableCell>
                            {subjectType ? (
                              <Badge variant="outline" className={`text-xs ${BADGE.emerald}`}>
                                {subjectType}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>{chips(getMetaClassLabels(m), "orange")}</TableCell>
                          <TableCell>{chips(getMetaStreamLabels(m), "violet")}</TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="flex max-h-[min(92dvh,92vh)] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogTitle>Edit Subject-selection Meta</DialogTitle>
            <DialogDescription>
              Update the label, subject type, applicable classes, streams and status.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label>Subject type</Label>
                <Select value={editSubjectTypeId} onValueChange={setEditSubjectTypeId}>
                  <SelectTrigger className="mt-1 w-full text-gray-700">
                    <SelectValue placeholder="Select subject type" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectTypes.map((st) => (
                      <SelectItem key={st.id} value={String(st.id)}>
                        {st.code || st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Applicable classes</Label>
                <div className="mt-2 h-44 overflow-auto rounded border p-3 sm:h-56">
                  {classes.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`cls-${c.id}`}
                        checked={editClassIds.includes(c.id)}
                        onCheckedChange={() => toggleId(c.id, editClassIds, setEditClassIds)}
                      />
                      <Label htmlFor={`cls-${c.id}`} className="text-sm">
                        {c.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Streams</Label>
                <div className="mt-2 h-44 overflow-auto rounded border p-3 sm:h-56">
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
            </div>

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
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:px-6">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={saveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
