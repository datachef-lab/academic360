import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createSubjectGrouping,
  updateSubjectGrouping,
  getAffiliations,
  getProgramCourses,
  getRegulationTypes,
  getSubjectGroupings,
  getSubjectTypes,
  getSubjects,
} from "@/services/course-design.api";
import type {
  Affiliation,
  ProgramCourse,
  RegulationType,
  Subject,
  SubjectGroupingMainDto,
  SubjectType,
} from "@repo/db";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Edit, FileText, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { AcademicYear } from "@/types/academics/academic-year";

interface UISubjectGroupingRow {
  id: number;
  name: string;
  code: string | null;
  academicYearId: number | null;
  subjectTypeId: number | null;
  programCourses: string[];
  subjectType: string;
  subjects: string[];
}

function SubjectGroupingsPage() {
  const { currentAcademicYear, availableAcademicYears } = useAcademicYear();
  const [rows, setRows] = useState<UISubjectGroupingRow[]>([]);
  const [groupings, setGroupings] = useState<SubjectGroupingMainDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourse[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [programCourseSearch, setProgramCourseSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(currentAcademicYear?.id ?? null);
  const [selectedAffiliationId, setSelectedAffiliationId] = useState<number | null>(null);
  const [selectedRegulationTypeId, setSelectedRegulationTypeId] = useState<number | null>(null);
  const [selectedSubjectTypeId, setSelectedSubjectTypeId] = useState<number | null>(null);
  const [groupingName, setGroupingName] = useState("");
  const [groupingCode, setGroupingCode] = useState("");
  const [selectedProgramCourseIds, setSelectedProgramCourseIds] = useState<number[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [editingGroupingId, setEditingGroupingId] = useState<number | null>(null);

  const [filterAcademicYearId, setFilterAcademicYearId] = useState<number | null>(currentAcademicYear?.id ?? null);
  const [filterSubjectTypeId, setFilterSubjectTypeId] = useState<number | null>(null);

  const loadGroupings = useCallback(async () => {
    let isMounted = true;
    try {
      setLoading(true);
      const data = (await getSubjectGroupings()) || [];
      if (!isMounted) return;
      const typed = data as unknown as SubjectGroupingMainDto[];
      setGroupings(typed);
      const mapped: UISubjectGroupingRow[] = typed.map((g: SubjectGroupingMainDto, idx: number) => ({
        id: g.id ?? idx,
        name: g.name || "",
        code: (g as SubjectGroupingMainDto & { code?: string | null }).code ?? null,
        academicYearId: (g.academicYear as AcademicYear | undefined)?.id ?? null,
        subjectTypeId: g.subjectType?.id ?? null,
        programCourses:
          g.subjectGroupingProgramCourses?.map((pc) => pc.programCourse?.name || "").filter(Boolean) || [],
        subjectType: g.subjectType?.code || g.subjectType?.name || "",
        subjects: g.subjectGroupingSubjects?.map((s) => s.subject?.name || "").filter(Boolean) || [],
      }));
      setRows(mapped);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load subject groupings";
      setError(msg);
    } finally {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // initial load
    void loadGroupings();
  }, [loadGroupings]);

  // Keep academic years in sync with global state
  useEffect(() => {
    setAcademicYears(availableAcademicYears || []);
  }, [availableAcademicYears]);

  // Keep list-level academic year filter aligned with currently selected academic year
  useEffect(() => {
    if (currentAcademicYear?.id) {
      setFilterAcademicYearId((prev) => (prev === null ? currentAcademicYear.id! : prev));
    }
  }, [currentAcademicYear?.id]);

  // Load subject types for filters on first mount
  useEffect(() => {
    async function loadSubjectTypesForFilter() {
      try {
        const st = await getSubjectTypes();
        if (Array.isArray(st)) {
          setSubjectTypes(st);
        }
      } catch {
        // ignore filter-only load errors
      }
    }
    void loadSubjectTypesForFilter();
  }, []);

  const resetModalStateForCreate = () => {
    setEditingGroupingId(null);
    setSelectedAcademicYearId(currentAcademicYear?.id ?? null);
    setSelectedAffiliationId(null);
    setSelectedRegulationTypeId(null);
    setSelectedSubjectTypeId(null);
    setGroupingName("");
    setGroupingCode("");
    setSelectedProgramCourseIds([]);
    setSelectedSubjectIds([]);
    setProgramCourseSearch("");
    setSubjectSearch("");
  };

  const openCreateModal = () => {
    resetModalStateForCreate();
    setIsAddOpen(true);
  };

  const openEditModal = (groupingId: number) => {
    const g = groupings.find((gg) => gg.id === groupingId);
    if (!g) return;
    setEditingGroupingId(groupingId);
    setSelectedAcademicYearId((g.academicYear as AcademicYear | undefined)?.id ?? null);
    setSelectedSubjectTypeId(g.subjectType?.id ?? null);
    setGroupingName(g.name || "");
    setGroupingCode(g.code || "");
    setSelectedProgramCourseIds(
      (g.subjectGroupingProgramCourses || []).map((pc) => pc.programCourseId).filter((id): id is number => !!id),
    );
    setSelectedSubjectIds((g.subjectGroupingSubjects || []).map((s) => s.subjectId).filter((id): id is number => !!id));
    // Clear filters/search so all relevant options are visible when editing
    setSelectedAffiliationId(null);
    setSelectedRegulationTypeId(null);
    setProgramCourseSearch("");
    setSubjectSearch("");
    setIsAddOpen(true);
  };

  // When affiliation or regulation filters change, keep only compatible selected program-courses
  useEffect(() => {
    if (!selectedAffiliationId && !selectedRegulationTypeId) return;
    setSelectedProgramCourseIds((prev) =>
      prev.filter((id) => {
        const pc = programCourses.find((p) => p.id === id);
        if (!pc) return false;
        if (selectedAffiliationId && pc.affiliationId !== selectedAffiliationId) return false;
        if (selectedRegulationTypeId && pc.regulationTypeId !== selectedRegulationTypeId) return false;
        return true;
      }),
    );
  }, [selectedAffiliationId, selectedRegulationTypeId, programCourses]);

  useEffect(() => {
    if (!isAddOpen) return;
    let isMounted = true;
    async function loadMasters() {
      try {
        const [affs, regs, stypes, pcs, subs] = await Promise.all([
          getAffiliations(),
          getRegulationTypes(),
          getSubjectTypes(),
          getProgramCourses(),
          getSubjects(),
        ]);
        if (!isMounted) return;
        setAffiliations(Array.isArray(affs) ? affs : []);
        setRegulationTypes(Array.isArray(regs) ? regs : []);
        setSubjectTypes(Array.isArray(stypes) ? stypes : []);
        setProgramCourses(Array.isArray(pcs) ? pcs : []);
        setSubjects(Array.isArray(subs) ? subs : []);
      } catch {
        toast.error("Failed to load masters for subject groupings");
      }
    }
    void loadMasters();
    return () => {
      isMounted = false;
    };
  }, [isAddOpen]);

  const filteredRows = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterAcademicYearId && r.academicYearId !== filterAcademicYearId) return false;
      if (filterSubjectTypeId && r.subjectTypeId !== filterSubjectTypeId) return false;
      if (!term) return true;
      const haystack = [r.subjectType, ...r.programCourses, ...r.subjects].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, searchText, filterAcademicYearId, filterSubjectTypeId]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage, itemsPerPage]);

  if (loading && rows.length === 0) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">Loading subject groupings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">Error: {error}</div>
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
              <FileText className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Subject Groupings</span>
            </CardTitle>
            {/* <div className="text-xs sm: text-muted-foreground mt-1">
              {currentAcademicYear
                ? `Configure subject groupings for ${currentAcademicYear.year}.`
                : "Configure subject groupings for program courses."}
            </div> */}
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <Button variant="outline" className="flex-shrink-0">
              Bulk Upload
            </Button>
            <Button variant="outline" className="flex-shrink-0">
              Download Template
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 hidden md:flex"
                  onClick={openCreateModal}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[100vw] sm:w-full max-w-[90vw] h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>{editingGroupingId ? "Edit Subject Grouping" : "Create Subject Grouping"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 flex-1 min-h-0 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Academic Year</div>
                      <Select
                        value={selectedAcademicYearId?.toString() ?? ""}
                        onValueChange={(value) => setSelectedAcademicYearId(value ? Number(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((ay) => (
                            <SelectItem key={ay.id} value={String(ay.id)}>
                              {ay.year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Affiliation</div>
                      <Select
                        value={selectedAffiliationId?.toString() ?? "all"}
                        onValueChange={(value) => setSelectedAffiliationId(value === "all" ? null : Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All affiliations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Affiliations</SelectItem>
                          {affiliations.map((a) => (
                            <SelectItem key={a.id!} value={String(a.id!)}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Regulation Type</div>
                      <Select
                        value={selectedRegulationTypeId?.toString() ?? "all"}
                        onValueChange={(value) => setSelectedRegulationTypeId(value === "all" ? null : Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All regulation types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Regulation Types</SelectItem>
                          {regulationTypes.map((rt) => (
                            <SelectItem key={rt.id!} value={String(rt.id!)}>
                              {rt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Subject Type</div>
                      <Select
                        value={selectedSubjectTypeId?.toString() ?? ""}
                        onValueChange={(value) => setSelectedSubjectTypeId(value ? Number(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject type" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjectTypes.map((st) => (
                            <SelectItem key={st.id!} value={String(st.id!)}>
                              {st.code || st.name || ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Grouping Name</div>
                      <Input
                        placeholder="Enter grouping name"
                        value={groupingName}
                        onChange={(e) => setGroupingName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Code (optional)</div>
                      <Input
                        placeholder="Enter code (optional)"
                        value={groupingCode}
                        onChange={(e) => setGroupingCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                    {/* Program Courses box */}
                    <div className="border rounded-md">
                      <div className=" font-semibold tracking-wide py-3 text-slate-800 bg-slate-50 border-b border-slate-200 px-3 rounded-t">
                        Program Courses
                      </div>
                      {/* Available program courses */}
                      <div className="flex items-center justify-between gap-2 py-2 px-3 mb-2 ">
                        <Input
                          value={programCourseSearch}
                          onChange={(e) => setProgramCourseSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-1/3 "
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 m-3 h-[500px]">
                        <div className="pr-1 md:pr-3 md:border-r md:border-slate-200 flex flex-col ">
                          <div className="flex-1 overflow-y-auto space-y-2">
                            {programCourses
                              .filter((pc) =>
                                selectedAffiliationId ? pc.affiliationId === selectedAffiliationId : true,
                              )
                              .filter((pc) =>
                                selectedRegulationTypeId ? pc.regulationTypeId === selectedRegulationTypeId : true,
                              )
                              .filter((pc) =>
                                programCourseSearch.trim()
                                  ? (pc.name || "").toLowerCase().includes(programCourseSearch.trim().toLowerCase())
                                  : true,
                              )
                              .map((pc) => (
                                <label key={pc.id} className="flex items-center gap-2 text-slate-800">
                                  <Checkbox
                                    className="border-slate-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    checked={selectedProgramCourseIds.includes(pc.id!)}
                                    onCheckedChange={(checked) => {
                                      setSelectedProgramCourseIds((prev) =>
                                        checked ? [...prev, pc.id!] : prev.filter((id) => id !== pc.id),
                                      );
                                    }}
                                  />
                                  <span>{pc.name}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                        {/* Selected program courses */}
                        <div className="h-full pl-1 md:pl-3 flex flex-col">
                          <div className=" font-medium text-slate-600 py-2 mb-2">Selected</div>
                          <div className="flex-1 overflow-y-auto space-y-2">
                            {programCourses
                              .filter((pc) => selectedProgramCourseIds.includes(pc.id!))
                              .filter((pc) =>
                                selectedAffiliationId ? pc.affiliationId === selectedAffiliationId : true,
                              )
                              .filter((pc) =>
                                selectedRegulationTypeId ? pc.regulationTypeId === selectedRegulationTypeId : true,
                              )
                              .map((pc) => (
                                <div key={pc.id} className="flex items-center justify-between gap-2  text-slate-800">
                                  <span className="truncate">{pc.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-500 hover:text-slate-800"
                                    onClick={() =>
                                      setSelectedProgramCourseIds((prev) => prev.filter((id) => id !== pc.id))
                                    }
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            {selectedProgramCourseIds.length === 0 && (
                              <div className=" text-slate-400 italic">No program courses selected</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subjects box */}
                    <div className="border rounded-md h-full border-slate-200">
                      <div className=" font-semibold tracking-wide py-3 text-slate-800 bg-slate-50 border-b border-slate-200 px-3 rounded-t">
                        Subjects
                      </div>
                      <div className="flex items-center gap-2 py-2 px-3 mb-2">
                        <Input
                          value={subjectSearch}
                          onChange={(e) => setSubjectSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-1/3 "
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 m-3 overflow-auto h-[500px]">
                        {/* Available subjects */}
                        <div className="h-full pr-1 md:pr-3 md:border-r md:border-slate-200 flex flex-col">
                          <div className="flex-1 overflow-y-auto space-y-2">
                            {subjects
                              .filter((s) => s.isActive !== false)
                              .filter((s) =>
                                subjectSearch.trim()
                                  ? ((s.code || s.name || "") as string)
                                      .toLowerCase()
                                      .includes(subjectSearch.trim().toLowerCase())
                                  : true,
                              )
                              .map((s) => (
                                <label key={s.id} className="flex items-center gap-2 text-slate-800">
                                  <Checkbox
                                    className="border-slate-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    checked={selectedSubjectIds.includes(s.id!)}
                                    onCheckedChange={(checked) => {
                                      setSelectedSubjectIds((prev) =>
                                        checked ? [...prev, s.id!] : prev.filter((id) => id !== s.id),
                                      );
                                    }}
                                  />
                                  <span>{s.code || s.name}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                        {/* Selected subjects */}
                        <div className="h-full pl-1 md:pl-3 flex flex-col">
                          <div className="font-medium text-slate-600 py-2 mb-2">Selected</div>
                          <div className="flex-1 overflow-y-auto space-y-2">
                            {subjects
                              .filter((s) => selectedSubjectIds.includes(s.id!))
                              .map((s) => (
                                <div key={s.id} className="flex items-center justify-between gap-2 text-slate-800">
                                  <span className="truncate">{s.code || s.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-500 hover:text-slate-800"
                                    onClick={() => setSelectedSubjectIds((prev) => prev.filter((id) => id !== s.id))}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            {selectedSubjectIds.length === 0 && (
                              <div className=" text-slate-400 italic">No subjects selected</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0 mt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsAddOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={
                      addLoading ||
                      !selectedAcademicYearId ||
                      !selectedSubjectTypeId ||
                      selectedProgramCourseIds.length === 0 ||
                      selectedSubjectIds.length === 0
                    }
                    onClick={async () => {
                      if (!selectedAcademicYearId || !selectedSubjectTypeId) {
                        toast.error("Select academic year and subject type");
                        return;
                      }
                      try {
                        setAddLoading(true);
                        const payload = {
                          academicYear: { id: selectedAcademicYearId },
                          subjectType: { id: selectedSubjectTypeId },
                          name:
                            groupingName ||
                            subjectTypes.find((st) => st.id === selectedSubjectTypeId)?.code ||
                            "Subject Grouping",
                          code: groupingCode || null,
                          subjectGroupingProgramCourses: selectedProgramCourseIds.map((id) => ({
                            programCourse: { id },
                          })),
                          subjectGroupingSubjects: selectedSubjectIds.map((id) => ({
                            subject: { id },
                          })),
                        };
                        const isEdit = editingGroupingId !== null;
                        const result = isEdit
                          ? await updateSubjectGrouping(editingGroupingId!, payload)
                          : await createSubjectGrouping(payload);
                        if (!result) {
                          toast.error(
                            isEdit ? "Failed to update subject grouping" : "Failed to create subject grouping",
                          );
                        } else {
                          toast.success(isEdit ? "Subject grouping updated" : "Subject grouping created");
                          setIsAddOpen(false);
                          setEditingGroupingId(null);
                          resetModalStateForCreate();
                          void loadGroupings();
                        }
                      } catch (err: unknown) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : editingGroupingId
                              ? "Failed to update subject grouping"
                              : "Failed to create subject grouping";
                        toast.error(msg);
                      } finally {
                        setAddLoading(false);
                      }
                    }}
                  >
                    {addLoading ? "Saving..." : editingGroupingId ? "Update" : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-40 bg-background p-2 sm:p-4 border-b flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-0">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <Select
                value={filterAcademicYearId?.toString() ?? "all"}
                onValueChange={(value) => {
                  setFilterAcademicYearId(value === "all" ? null : Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Academic Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map((ay) => (
                    <SelectItem key={ay.id} value={String(ay.id)}>
                      {ay.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterSubjectTypeId?.toString() ?? "all"}
                onValueChange={(value) => {
                  setFilterSubjectTypeId(value === "all" ? null : Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Subject Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subject Types</SelectItem>
                  {subjectTypes.map((st) => (
                    <SelectItem key={st.id!} value={String(st.id!)}>
                      {st.code || st.name || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="relative z-10 bg-white" style={{ height: "600px" }}>
            <div className="overflow-y-auto text-[14px] overflow-x-auto h-full border rounded-md">
              {/* Fixed Header */}
              <div className="sticky top-0 z-50 text-gray-500 bg-gray-100 border-b" style={{ minWidth: "980px" }}>
                <div className="flex">
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "6%" }}
                  >
                    Sr. No.
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "18%" }}
                  >
                    Grouping Name
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "10%" }}
                  >
                    Code
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "24%" }}
                  >
                    Program Courses
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "14%" }}
                  >
                    Subject Type
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "20%" }}
                  >
                    Subjects
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 flex items-center justify-center"
                    style={{ width: "8%" }}
                  >
                    Actions
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="bg-white relative">
                {loading ? (
                  <div className="flex items-center justify-center p-4 text-center" style={{ minWidth: "800px" }}>
                    Loading subject groupings...
                  </div>
                ) : !Array.isArray(pagedRows) || pagedRows.length === 0 ? (
                  <div className="flex items-center justify-center p-4 text-center" style={{ minWidth: "800px" }}>
                    {!Array.isArray(pagedRows) ? "Error loading data" : "No subject groupings found."}
                  </div>
                ) : (
                  pagedRows.map((row, idx) => (
                    <div key={row.id} className="flex border-b hover:bg-gray-50 group" style={{ minWidth: "980px" }}>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "6%" }}
                      >
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </div>
                      <div className="flex-shrink-0 p-3 border-r flex items-center" style={{ width: "18%" }}>
                        <span className=" text-slate-800 truncate">{row.name || "-"}</span>
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "10%" }}
                      >
                        <span className=" text-slate-700">{row.code || "-"}</span>
                      </div>
                      <div className="flex-shrink-0 p-3 border-r flex items-center" style={{ width: "24%" }}>
                        <div className="flex flex-wrap gap-1">
                          {row.programCourses.length === 0 ? (
                            <span className=" text-muted-foreground">No program courses mapped</span>
                          ) : (
                            row.programCourses.map((name) => (
                              <Badge
                                key={name}
                                variant="outline"
                                className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                              >
                                {name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "14%" }}
                      >
                        {row.subjectType ? (
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                          >
                            {row.subjectType}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="flex-shrink-0 p-3 flex items-center" style={{ width: "20%" }}>
                        <div className="flex flex-wrap gap-1">
                          {row.subjects.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No subjects mapped</span>
                          ) : (
                            row.subjects.map((name) => (
                              <Badge
                                key={name}
                                variant="outline"
                                className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50"
                              >
                                {name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-l flex items-center justify-center"
                        style={{ width: "8%" }}
                      >
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openEditModal(row.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {!loading && !error && totalItems > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-0">
          <div className="sm: text-gray-600 text-center sm:text-left">
            <span className="hidden sm:inline">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
              {totalItems} results
            </span>
            <span className="sm:hidden">
              Page {currentPage} of {totalPages} ({totalItems} total)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <div className="flex items-center gap-1 overflow-x-auto">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0 flex-shrink-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex-shrink-0"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectGroupingsPage;
