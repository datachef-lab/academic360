import { useState, useMemo } from "react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XCircle, Plus, Edit, Trash2, Download, Check, ChevronsUpDown } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  subjectSelectionApi,
  type CreateRelatedSubjectMainInput,
  type UpdateRelatedSubjectMainInput,
} from "@/services/subject-selection.api";
import { RelatedSubjectMainDto } from "@repo/db/dtos/subject-selection";
import { getProgramCourses, getSubjectTypes } from "@/services/course-design.api";
import { getActiveBoardSubjectNames, type BoardSubjectName } from "@/services/admissions.service";
import type { ProgramCourse, SubjectType } from "@repo/db";
import { toast as sonnerToast } from "sonner";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useAuth } from "@/features/auth/hooks/use-auth";
// import axiosInstance from "@/utils/api";

// UI shape derived from backend DTOs
type UIGrouping = {
  id: number;
  programCourses: string[];
  subjectCategory: string;
  subjects: string[]; // [target, ...alternatives]
  isActive: boolean;
};

// Consistent outline color for alternative subject badges
const altBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-300";

export default function AlternativeSubjectsPage() {
  const { currentAcademicYear } = useAcademicYear();
  const { isReady, accessToken } = useAuth();
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [groupings, setGroupings] = useState<UIGrouping[]>([]);
  const [, setLoading] = useState(false);
  const [, setSaving] = useState(false);

  // Lookup maps (built from backend payload) --------------------------------
  const [subjectNameToId, setSubjectNameToId] = useState<Record<string, number>>({});
  const [programCourseNameToId, setProgramCourseNameToId] = useState<Record<string, number>>({});
  const [subjectCategoryLabelToId, setSubjectCategoryLabelToId] = useState<Record<string, number>>({});

  // Master data arrays for dropdowns
  const [masterProgramCourses, setMasterProgramCourses] = useState<ProgramCourse[]>([]);
  const [masterSubjectTypes, setMasterSubjectTypes] = useState<SubjectType[]>([]);
  const [masterBoardSubjectNames, setMasterBoardSubjectNames] = useState<BoardSubjectName[]>([]);

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteSummary, setDeleteSummary] = useState<{
    programCourse: string;
    subjectCategory: string;
    subject: string;
    related: string[];
  } | null>(null);

  useEffect(() => {
    if (!isReady || !accessToken) return; // wait for auth
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Load masters for dialog selects
        const pcs = await getProgramCourses();
        if (!isMounted) return;
        const validPcs = pcs.filter((p: ProgramCourse) => p.name);
        setMasterProgramCourses(validPcs);
        setProgramCourseNameToId((prev) => {
          const map: Record<string, number> = { ...prev };
          validPcs.forEach((p: ProgramCourse) => {
            if (p.name) map[p.name] = p.id;
          });
          return map;
        });

        // Subject Types (categories)
        const sts = await getSubjectTypes();
        if (!isMounted) return;
        const validSts = sts.filter((t: SubjectType) => t.id && (t.code || t.name));
        setMasterSubjectTypes(validSts);
        const catMap: Record<string, number> = {};
        validSts.forEach((t: SubjectType) => {
          const label = t.code || t.name;
          if (label && t.id) catMap[label] = t.id;
        });
        setSubjectCategoryLabelToId(catMap);

        // Board Subject Names - fetch from master API
        const boardSubjectNames = await getActiveBoardSubjectNames();
        if (!isMounted) return;
        setMasterBoardSubjectNames(boardSubjectNames);
        // Ensure subject name->id map has all master subjects (even if no mains exist yet)
        setSubjectNameToId((prev) => {
          const map: Record<string, number> = { ...prev };
          for (const bsn of boardSubjectNames) {
            if (bsn.name && typeof bsn.id === "number") {
              map[bsn.name] = bsn.id;
            }
          }
          return map;
        });
        // Load existing related subjects data (server-paginated)
        const paged = await subjectSelectionApi.listRelatedSubjectMainsPaginated({
          page: currentPage,
          pageSize: itemsPerPage,
          search: searchTerm || undefined,
          programCourse: selectedProgramCourse && selectedProgramCourse !== "all" ? selectedProgramCourse : undefined,
        });
        if (!isMounted) return;
        const data = paged.content as RelatedSubjectMainDto[];
        const mapped: UIGrouping[] = data.map((dto) => ({
          id: dto.id || 0,
          programCourses: [dto.programCourse?.name || ""],
          subjectCategory: dto.subjectType?.code || dto.subjectType?.name || "",
          subjects: [
            dto.boardSubjectName?.name || "",
            ...dto.relatedSubjectSubs.map((s) => s.boardSubjectName?.name || "").filter(Boolean),
          ],
          isActive: dto.isActive ?? true,
        }));
        setGroupings(mapped);
        setTotalItems(paged.totalElements ?? 0);
        setTotalPages(paged.totalPages ?? 1);

        // Build additional lookups from payload (merge with existing)
        setSubjectNameToId((prev) => {
          const subjMap: Record<string, number> = { ...prev };
          for (const dto of data) {
            const mainLabel = dto.boardSubjectName?.name;
            const mainId = dto.boardSubjectName?.id;
            if (mainLabel && typeof mainId === "number") {
              subjMap[mainLabel] = mainId;
            }
            for (const sub of dto.relatedSubjectSubs) {
              const subLabel = sub.boardSubjectName?.name;
              const subId = sub.boardSubjectName?.id;
              if (subLabel && typeof subId === "number") {
                subjMap[subLabel] = subId;
              }
            }
          }
          return subjMap;
        });

        const pcMap: Record<string, number> = {};
        for (const dto of data) {
          if (dto.programCourse?.name && dto.programCourse?.id) {
            pcMap[dto.programCourse.name] = dto.programCourse.id;
          }
        }
        // Merge with existing map to avoid losing entries not present in mains
        setProgramCourseNameToId((prev) => ({ ...prev, ...pcMap }));
      } catch {
        // handled by interceptor toast/UI globally
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isReady, accessToken, currentPage, itemsPerPage, searchTerm, selectedProgramCourse]);

  // Server-side pagination state (moved above)

  // Derived for UI indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedGroupings = groupings; // already paginated from server

  // Client-side refinement so search also matches alternative subjects and category
  const displayGroupings = useMemo(() => {
    const s = (searchTerm || "").trim().toLowerCase();
    const selectedPc = selectedProgramCourse;
    return paginatedGroupings.filter((g) => {
      const matchesPc =
        !selectedPc ||
        selectedPc === "all" ||
        g.programCourses.some((pc) => pc.toLowerCase().includes(selectedPc.toLowerCase()));
      if (!s) return matchesPc;
      const haystack = [...g.programCourses, g.subjectCategory, ...g.subjects]
        .filter(Boolean)
        .map((x) => x.toLowerCase());
      const matchesSearch = haystack.some((x) => x.includes(s));
      return matchesPc && matchesSearch;
    });
  }, [paginatedGroupings, searchTerm, selectedProgramCourse]);

  // ---------- Add/Edit Dialog State ----------
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  // Removed hardcoded arrays - now using dynamic data from master APIs

  const programCourses = useMemo(() => {
    return masterProgramCourses.map((pc) => pc.name).filter((name): name is string => Boolean(name));
  }, [masterProgramCourses]);

  const subjectCategories = useMemo(() => {
    return masterSubjectTypes.map((st) => st.code || st.name).filter((name): name is string => Boolean(name));
  }, [masterSubjectTypes]);

  // Work with full objects to avoid collisions when different subjects share the same name
  const allSubjects = useMemo(() => {
    return masterBoardSubjectNames.filter((bsn) => typeof bsn.id === "number" && !!bsn.name);
  }, [masterBoardSubjectNames]);

  // (Combobox helpers removed after reverting to Select)

  type DialogRow = {
    programCourse: string;
    subjectCategory: string;
    // To avoid name collisions, store selections as token `${id}::${name}`
    targetedSubject: string;
    alternativeSubjects: string[];
    isActive?: boolean;
  };

  const [dialogRows, setDialogRows] = useState<DialogRow[]>([]);

  // Edit-form state (single mapping form) ---------------------------------
  const [editProgramCourse, setEditProgramCourse] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editTargetSubject, setEditTargetSubject] = useState<string>("");
  const [editSelectedAlternatives, setEditSelectedAlternatives] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  // Keep track of original identifiers to find the correct main even if user edits dropdowns
  const [editOriginal, setEditOriginal] = useState<{ pc: string; cat: string; subj: string } | null>(null);

  // Available alternatives (exclude already selected; INCLUDE target as allowed)
  const editAvailableAlternatives = useMemo(() => {
    const selectedIds = new Set(editSelectedAlternatives.map((t) => Number(t.split("::")[0])));
    return allSubjects.filter((s) => !selectedIds.has(s.id!));
  }, [allSubjects, editSelectedAlternatives, editTargetSubject]);

  // Search within available alternatives
  const [altSearch, setAltSearch] = useState("");
  const filteredEditAvailableAlternatives = useMemo(() => {
    const q = altSearch.trim().toLowerCase();
    if (!q) return editAvailableAlternatives;
    return editAvailableAlternatives.filter((s) => String(s.name).toLowerCase().includes(q));
  }, [editAvailableAlternatives, altSearch]);

  const addEditAlternative = (token: string) => {
    setEditSelectedAlternatives((prev: string[]) => (prev.includes(token) ? prev : [...prev, token]));
  };
  const removeEditAlternative = (token: string) => {
    setEditSelectedAlternatives((prev) => prev.filter((x) => x !== token));
  };

  const openAddDialog = () => {
    setDialogMode("add");
    setDialogRows([{ programCourse: "", subjectCategory: "", targetedSubject: "", alternativeSubjects: [] }]);
    setIsDialogOpen(true);
  };

  // Open delete dialog for a row
  const openDeleteDialog = (row: UIGrouping) => {
    setDeleteId(row.id);
    setDeleteSummary({
      programCourse: row.programCourses[0] ?? "",
      subjectCategory: row.subjectCategory ?? "",
      subject: row.subjects[0] ?? "",
      related: row.subjects.slice(1),
    });
    setDeleteOpen(true);
  };

  // Perform delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await subjectSelectionApi.deleteRelatedSubjectMain(deleteId);
      sonnerToast.success("Mapping deleted");
      // Reload current page
      const refreshedPaged = await subjectSelectionApi.listRelatedSubjectMainsPaginated({
        page: currentPage,
        pageSize: itemsPerPage,
        search: searchTerm || undefined,
        programCourse: selectedProgramCourse && selectedProgramCourse !== "all" ? selectedProgramCourse : undefined,
      });
      const refreshed = refreshedPaged.content as RelatedSubjectMainDto[];
      const mapped: UIGrouping[] = refreshed.map((dto) => ({
        id: dto.id || 0,
        programCourses: [dto.programCourse?.name || ""],
        subjectCategory: dto.subjectType?.code || dto.subjectType?.name || "",
        subjects: [
          dto.boardSubjectName?.name || "",
          ...dto.relatedSubjectSubs.map((s) => s.boardSubjectName?.name || "").filter(Boolean),
        ],
        isActive: dto.isActive ?? true,
      }));
      setGroupings(mapped);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete mapping";
      sonnerToast.error(message);
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const openEditDialog = (grouping: UIGrouping) => {
    setDialogMode("edit");
    // Convert existing names into id::name tokens for the controls
    const targetName = grouping.subjects[0] ?? "";
    const targetId = subjectNameToId[targetName];
    const targetToken = targetId ? `${targetId}::${targetName}` : "";
    const altTokens = grouping.subjects
      .slice(1)
      .map((name) => {
        const id = subjectNameToId[name];
        return id ? `${id}::${name}` : "";
      })
      .filter((t): t is string => Boolean(t));

    setDialogRows([
      {
        programCourse: grouping.programCourses[0] ?? "",
        subjectCategory: grouping.subjectCategory ?? "",
        targetedSubject: targetToken,
        alternativeSubjects: altTokens,
      },
    ]);
    // Initialize edit form state
    setEditProgramCourse(grouping.programCourses[0] ?? "");
    setEditCategory(grouping.subjectCategory ?? "");
    setEditTargetSubject(targetToken);
    setEditSelectedAlternatives(altTokens);
    setEditOriginal({
      pc: grouping.programCourses[0] ?? "",
      cat: grouping.subjectCategory ?? "",
      subj: grouping.subjects[0] ?? "",
    });
    setIsDialogOpen(true);
  };

  const addDialogRow = () => {
    setDialogRows((prev) => [
      ...prev,
      { programCourse: "", subjectCategory: "", targetedSubject: "", alternativeSubjects: [] },
    ]);
  };

  const deleteDialogRow = (idx: number) => {
    setDialogRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRowField = <K extends keyof DialogRow>(idx: number, key: K, value: DialogRow[K]) => {
    setDialogRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)) as DialogRow[]);
  };

  const handleSaveDialog = () => {
    if (dialogMode === "add") {
      void saveAddRows();
    } else {
      void saveEditRow();
    }
  };

  // Persist Add rows ---------------------------------------------------------
  const saveAddRows = async () => {
    setSaving(true);
    try {
      // Build a fast duplicate-check set from current mains
      const pagedExisting = await subjectSelectionApi.listRelatedSubjectMainsPaginated({
        page: 1,
        pageSize: 1000,
        search: searchTerm || undefined,
        programCourse: selectedProgramCourse && selectedProgramCourse !== "all" ? selectedProgramCourse : undefined,
      });
      const existingMains = pagedExisting.content as RelatedSubjectMainDto[];
      const existingKeys = new Set(
        existingMains.map((m: RelatedSubjectMainDto) => {
          const pcId = m.programCourse?.id;
          const stId = m.subjectType?.id;
          const tgtId = m.boardSubjectName?.id;
          return `${pcId}|${stId}|${tgtId}`;
        }),
      );
      const skipped: string[] = [];
      const duplicates: string[] = [];
      let createdCount = 0;
      for (const row of dialogRows) {
        const programCourseId = programCourseNameToId[row.programCourse];
        const subjectTypeId = subjectCategoryLabelToId[row.subjectCategory];
        // targetedSubject now stores tokens in the form `${id}::${name}`
        const targetId = row.targetedSubject ? Number(String(row.targetedSubject).split("::")[0]) : undefined;
        if (!programCourseId || !subjectTypeId || !targetId) {
          // Collect reason for skipping to inform user
          const missing: string[] = [];
          if (!programCourseId) missing.push("program-course");
          if (!subjectTypeId) missing.push("category");
          if (!targetId) missing.push("subject");
          skipped.push(
            `${row.programCourse || "—"} | ${row.subjectCategory || "—"} | ${
              (row.targetedSubject && String(row.targetedSubject).split("::")[1]) || row.targetedSubject || "—"
            } — missing: ${missing.join(", ")}`,
          );
          continue; // skip invalid row, but allow others to proceed
        }
        // Duplicate guard (client-side)
        const key = `${programCourseId}|${subjectTypeId}|${targetId}`;
        if (existingKeys.has(key)) {
          duplicates.push(`${row.programCourse} | ${row.subjectCategory} | ${row.targetedSubject}`);
          continue;
        }
        const payload: CreateRelatedSubjectMainInput = {
          programCourse: { id: programCourseId },
          subjectType: { id: subjectTypeId },
          boardSubjectName: { id: Number(row.targetedSubject.split("::")[0]) },
          isActive: true,
          relatedSubjectSubs: row.alternativeSubjects
            .map((token) => ({ boardSubjectName: { id: Number(token.split("::")[0]) } }))
            .filter((sub): sub is { boardSubjectName: { id: number } } => !!sub.boardSubjectName.id),
        };
        await subjectSelectionApi.createRelatedSubjectMain(payload);
        createdCount += 1;
        existingKeys.add(key); // prevent another row in same batch duplicating
      }
      // If nothing was created, inform the user why
      if (createdCount === 0) {
        if (duplicates.length > 0) {
          sonnerToast.error("Duplicate mappings detected", { description: duplicates.join("\n") });
        }
        if (skipped.length > 0) {
          sonnerToast.error("Missing required fields", {
            description:
              `No rows saved. Please fix missing fields (related subjects are optional):\n\n` + skipped.join("\n"),
          });
        }
        return;
      }
      if (duplicates.length > 0) {
        sonnerToast.info("Some rows were duplicates", { description: duplicates.join("\n") });
      }
      sonnerToast.success("Related subject mappings saved");
      // Reload newest-first on first page so newly added are visible immediately
      setCurrentPage(1);
      const refreshedPaged = await subjectSelectionApi.listRelatedSubjectMainsPaginated({
        page: 1,
        pageSize: itemsPerPage,
        search: searchTerm || undefined,
        programCourse: selectedProgramCourse && selectedProgramCourse !== "all" ? selectedProgramCourse : undefined,
      });
      const refreshed = refreshedPaged.content as RelatedSubjectMainDto[];
      // console.log("[RelatedSubjects] after SAVE ->", refreshed);
      const mapped: UIGrouping[] = refreshed.map((dto) => ({
        id: dto.id || 0,
        programCourses: [dto.programCourse?.name || ""],
        subjectCategory: dto.subjectType?.code || dto.subjectType?.name || "",
        subjects: [
          dto.boardSubjectName?.name || "",
          ...dto.relatedSubjectSubs.map((s) => s.boardSubjectName?.name || "").filter(Boolean),
        ],
        isActive: dto.isActive ?? true,
      }));
      setGroupings(mapped);
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save related subjects";
      sonnerToast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Persist Edit (single row) -----------------------------------------------
  const saveEditRow = async () => {
    if (dialogRows.length === 0) return;
    setSaving(true);
    try {
      // Fetch mains and find the original main regardless of current dropdown edits
      const mainsPaged = await subjectSelectionApi.listRelatedSubjectMainsPaginated({
        page: 1,
        pageSize: 1000,
        search: searchTerm || undefined,
        programCourse: selectedProgramCourse && selectedProgramCourse !== "all" ? selectedProgramCourse : undefined,
      });
      const mains = mainsPaged.content as RelatedSubjectMainDto[];
      const dto = mains.find((m: RelatedSubjectMainDto) => {
        const pcName = m.programCourse?.name;
        const catLabel = m.subjectType?.code || m.subjectType?.name;
        const subjName = m.boardSubjectName?.name;
        const orig = editOriginal ?? { pc: editProgramCourse, cat: editCategory, subj: editTargetSubject };
        return pcName === orig.pc && catLabel === orig.cat && subjName === orig.subj;
      });
      if (!dto) {
        setSaving(false);
        setIsDialogOpen(false);
        return;
      }
      // Always send a DTO-style update for main first (idempotent on backend)
      const programCourseId = programCourseNameToId[editProgramCourse];
      const subjectTypeId = subjectCategoryLabelToId[editCategory];
      const targetId = Number(editTargetSubject.split("::")[0]);
      if (!programCourseId || !subjectTypeId || !targetId) {
        sonnerToast.error("Missing required fields for update", {
          description: "Program-course, category and subject are required.",
        });
        setSaving(false);
        return;
      }
      // Build subs DTO from the current selection and let backend reconcile add/remove
      const desiredSubsDto = editSelectedAlternatives
        .map((token) => Number(token.split("::")[0]))
        .filter((id): id is number => !!id)
        .map((id) => ({ boardSubjectName: { id } }));

      // Debug: log outgoing DTO
      console.log("[RelatedSubjects] PUT dto:", {
        id: dto.id,
        programCourseId,
        subjectTypeId,
        targetId,
        editSelectedAlternatives,
        subjectNameToIdKeys: Object.keys(subjectNameToId),
        bengaliAId: subjectNameToId["Bengali A"],
        desiredSubsDto,
      });

      const updatePayload: UpdateRelatedSubjectMainInput = {
        programCourse: { id: programCourseId },
        subjectType: { id: subjectTypeId },
        boardSubjectName: { id: targetId },
        relatedSubjectSubs: desiredSubsDto,
      };
      await subjectSelectionApi.updateRelatedSubjectMain(dto.id || 0, updatePayload);
      // Reload
      const refreshedPaged2 = await subjectSelectionApi.listRelatedSubjectMainsPaginated({
        page: currentPage,
        pageSize: itemsPerPage,
        search: searchTerm || undefined,
        programCourse: selectedProgramCourse && selectedProgramCourse !== "all" ? selectedProgramCourse : undefined,
      });
      const refreshed = refreshedPaged2.content as RelatedSubjectMainDto[];
      // console.log("[RelatedSubjects] after UPDATE ->", refreshed);
      const mapped: UIGrouping[] = refreshed.map((d) => ({
        id: d.id || 0,
        programCourses: [d.programCourse?.name || ""],
        subjectCategory: d.subjectType?.code || d.subjectType?.name || "",
        subjects: [
          d.boardSubjectName?.name || "",
          ...d.relatedSubjectSubs.map((s) => s.boardSubjectName?.name || "").filter(Boolean),
        ],
        isActive: d.isActive ?? true,
      }));
      setGroupings(mapped);
      // Keep checkbox in sync with latest saved value
      setEditIsActive(Boolean((refreshed.find((d) => d.id === dto.id) || {}).isActive));
      setIsDialogOpen(false);
      sonnerToast.success("Related subject mapping updated");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update related subjects";
      sonnerToast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <XCircle className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Related Subjects
              </CardTitle>
              <div className="text-muted-foreground">Configure related subjects mapping for each program-course.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Fixed Filters */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="bg-background p-4 border border-gray-200 rounded-lg flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search major or related subjects..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              value={selectedProgramCourse}
              onValueChange={(value) => {
                setSelectedProgramCourse(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Program-Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Program-Courses</SelectItem>
                {programCourses.map((programCourse: string) => (
                  <SelectItem key={programCourse} value={programCourse}>
                    {programCourse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Table with Fixed Header */}
      <div className="flex-1 px-4 min-h-0">
        <Card className="h-full flex flex-col">
          <CardContent className="p-0 h-full flex flex-col min-h-0">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b-2 border-gray-200">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-16 border-r border-gray-300">
                      Sr. No.
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-64 border-r border-gray-300">
                      Program-Course
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-40 border-r border-gray-300">
                      Subject Category
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-56 border-r border-gray-300">
                      Subject
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300">
                      Related Subjects
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-24 border-r border-gray-300">
                      Status
                    </TableHead>
                    <TableHead className="text-center bg-gray-100 font-semibold text-gray-900 w-24 border-r border-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto border border-gray-300 rounded-md">
              <Table className="table-fixed">
                <TableBody>
                  {displayGroupings.map((grouping, index) => (
                    <TableRow
                      key={grouping.id}
                      className="border-b-2 border-gray-300 hover:bg-gray-50"
                      style={{ borderBottom: "2px solid #d1d5db" }}
                    >
                      <TableCell className="w-16 border-r border-gray-300">{startIndex + index + 1}</TableCell>
                      <TableCell className="w-64 border-r border-gray-300">{grouping.programCourses[0]}</TableCell>
                      <TableCell className="w-40 border-r border-gray-300">
                        <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50 text-xs">
                          {grouping.subjectCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-56 border-r border-gray-300">
                        <Badge variant="outline" className="text-xs border-red-500 text-red-700 bg-red-50">
                          {grouping.subjects[0]}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        <div className="flex flex-wrap gap-1 max-w-xl">
                          {grouping.subjects.slice(1).map((subject, i) => (
                            <Badge key={i} variant="outline" className={`text-xs ${altBadgeColor}`}>
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-24 border-r border-gray-300">
                        <Badge
                          variant="outline"
                          className={
                            grouping.isActive
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-red-500 text-red-700 bg-red-50"
                          }
                        >
                          {grouping.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-24 border-r border-gray-300">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(grouping)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => openDeleteDialog(grouping)}
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
          </CardContent>
        </Card>
      </div>

      {/* Fixed Pagination at Bottom */}
      <div className="flex-shrink-0 p-4 pt-0">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
          sticky={false}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90rem] w-[98vw] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add" : "Edit"} Related Subjects</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" ? (
                <>
                  Use the table below to add one or more mappings, then save.
                  {currentAcademicYear && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                      <strong>Note:</strong> These mappings will be created for the academic year{" "}
                      <span className="font-semibold text-blue-700">{currentAcademicYear.year}</span>
                      {currentAcademicYear.isCurrentYear === true && <span className="text-green-600"> (Current)</span>}
                      .
                    </div>
                  )}
                </>
              ) : (
                "Edit the related subjects mapping below."
              )}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === "add" ? (
            <div className="border-2 border-gray-300 rounded-md flex-1 min-h-[18rem]">
              <div className="h-[60vh] overflow-auto">
                <Table className="table-fixed">
                  <TableHeader className="sticky top-0 z-10 bg-gray-100">
                    <TableRow>
                      <TableHead className="w-16 border-r border-gray-300">Sr. No.</TableHead>
                      <TableHead className="w-[24rem] border-r border-gray-300">Program-Course</TableHead>
                      <TableHead className="w-36 border-r border-gray-300">Subject Category</TableHead>
                      <TableHead className="w-48 border-r border-gray-300">Subject</TableHead>
                      <TableHead className="w-[22rem] border-r border-gray-300">Related Subjects</TableHead>
                      <TableHead className="text-center w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dialogRows.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className="border-b-2 border-gray-300 hover:bg-gray-50"
                        style={{ borderBottom: "2px solid #d1d5db" }}
                      >
                        <TableCell className="border-r border-gray-200">{idx + 1}</TableCell>
                        <TableCell className="border-r border-gray-200">
                          <Select
                            value={row.programCourse}
                            onValueChange={(v) => updateRowField(idx, "programCourse", v)}
                          >
                            <SelectTrigger className="w-[22rem]">
                              <SelectValue placeholder="Select program-course" />
                            </SelectTrigger>
                            <SelectContent>
                              {programCourses.map((pc) => (
                                <SelectItem key={pc} value={pc}>
                                  {pc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-r border-gray-200">
                          <Select
                            value={row.subjectCategory}
                            onValueChange={(v) => updateRowField(idx, "subjectCategory", v)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjectCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-r border-gray-200">
                          <Select
                            value={row.targetedSubject}
                            onValueChange={(v) => updateRowField(idx, "targetedSubject", v)}
                          >
                            <SelectTrigger className="w-48 truncate">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-auto">
                              {allSubjects.map((s: { id: number; name: string }) => {
                                const key = String(s.id);
                                const value = `${s.id}::${s.name}`;
                                const label = String(s.name);
                                return (
                                  <SelectItem key={key} value={value}>
                                    {label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-r border-gray-200 w-[22rem]">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between min-h-10 h-auto"
                              >
                                {row.alternativeSubjects.length === 0 ? (
                                  <span className="text-muted-foreground">Select related subjects</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1 items-center justify-start h-auto">
                                    {row.alternativeSubjects.map((token) => {
                                      const name = token.split("::").slice(1).join("::");
                                      return (
                                        <Badge key={token} variant="outline" className={`text-xs ${altBadgeColor}`}>
                                          {name}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[22rem] p-0 z-50 max-h-80 overflow-hidden"
                              align="start"
                              sideOffset={4}
                              onWheel={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                            >
                              <Command className="max-h-80 overflow-hidden">
                                <CommandInput placeholder="Search subjects..." className="text-gray-700" />
                                <CommandList
                                  className="max-h-72 overflow-y-auto overscroll-contain pr-1"
                                  onWheel={(e) => e.stopPropagation()}
                                  onTouchMove={(e) => e.stopPropagation()}
                                  tabIndex={0}
                                >
                                  <CommandEmpty>No subjects found.</CommandEmpty>
                                  <CommandGroup>
                                    {allSubjects.map((opt: { id: number; name: string }) => {
                                      const token = `${opt.id}::${opt.name}`;
                                      const selected = row.alternativeSubjects.includes(token);
                                      return (
                                        <CommandItem
                                          key={String(opt.id)}
                                          onSelect={() => {
                                            const next = selected
                                              ? row.alternativeSubjects.filter((v) => v !== token)
                                              : [...row.alternativeSubjects, token];
                                            updateRowField(idx, "alternativeSubjects", next);
                                          }}
                                          className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
                                        >
                                          <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                                          <span className="block truncate">{String(opt.name)}</span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => deleteDialogRow(idx)}
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

              <div className="flex items-center justify-between mt-3">
                <Button onClick={addDialogRow} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Add Row
                </Button>
                <DialogFooter className="m-0 p-0">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {dialogMode === "add" ? "Save" : "Update"}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          ) : (
            // EDIT MODE LAYOUT -------------------------------------------------
            <div className="flex flex-col gap-4 flex-1">
              {/* Top dropdowns */}
              <div className="grid grid-cols-3 gap-6 pt-2 pb-2">
                <div className="flex flex-col gap-1">
                  <Label>Program-Course</Label>
                  <Select value={editProgramCourse} onValueChange={setEditProgramCourse} disabled>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select program-course" />
                    </SelectTrigger>
                    <SelectContent>
                      {programCourses.map((pc) => (
                        <SelectItem key={pc} value={pc}>
                          {pc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Subject Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory} disabled>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Subject</Label>
                  <Select value={editTargetSubject} onValueChange={setEditTargetSubject} disabled>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select targeted subject" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-auto">
                      {allSubjects.map((s) => {
                        const key = String(s.id);
                        const value = `${s.id}::${s.name}`;
                        const label = String(s.name);
                        return (
                          <SelectItem key={key} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>

              {/* Dual cards */}
              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Selected Alternatives */}
                <div className="border rounded-md flex flex-col h-[52vh]">
                  <div className="px-3 py-2 bg-gray-100 border-b font-semibold">Selected Related Subjects</div>
                  <div className="p-3 flex-1 min-h-0 overflow-auto">
                    {editSelectedAlternatives.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No related subjects selected</div>
                    ) : (
                      <div className="space-y-2">
                        {editSelectedAlternatives.map((token) => {
                          const name = token.split("::").slice(1).join("::");
                          return (
                            <div
                              key={token}
                              className="flex items-center justify-between gap-2 border rounded-md px-2 py-1"
                            >
                              <Badge variant="outline" className={`text-xs ${altBadgeColor}`}>
                                {name}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-700 bg-red-100 hover:bg-red-200 rounded"
                                onClick={() => removeEditAlternative(token)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 border-t bg-gray-50 flex justify-end">
                    <Button
                      variant="ghost"
                      className="bg-red-100 hover:bg-red-200 text-red-700 h-8 px-3"
                      onClick={() => setEditSelectedAlternatives([])}
                    >
                      Remove All
                    </Button>
                  </div>
                </div>

                {/* Available Subjects */}
                <div className="border rounded-md flex flex-col h-[52vh]">
                  <div className="px-3 py-2 bg-gray-100 border-b flex items-center justify-between gap-3">
                    <div className="font-semibold">Available Related Subjects</div>
                    <div className="w-72">
                      <Input
                        placeholder="Search subjects..."
                        value={altSearch}
                        onChange={(e) => setAltSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="p-3 flex-1 min-h-0 overflow-auto">
                    {filteredEditAvailableAlternatives.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No available related subjects</div>
                    ) : (
                      <div className="space-y-2">
                        {filteredEditAvailableAlternatives.map((s) => {
                          const token = `${s.id}::${s.name}`;
                          return (
                            <div
                              key={token}
                              className="flex items-center justify-between gap-2 border rounded-md px-2 py-1"
                            >
                              <span className="text-sm text-gray-700">{String(s.name)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-purple-700 bg-purple-100 hover:bg-purple-200 rounded"
                                onClick={() => addEditAlternative(token)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 border-t bg-gray-50 flex justify-end">
                    <Button
                      variant="ghost"
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 h-8 px-3"
                      onClick={() => {
                        const tokens = filteredEditAvailableAlternatives.map((s) => `${s.id}::${s.name}`);
                        setEditSelectedAlternatives((prev: string[]) => Array.from(new Set([...prev, ...tokens])));
                      }}
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-3xl w-[56rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete related subject mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected mapping.
            </AlertDialogDescription>
            {deleteSummary && (
              <div className="mt-3">
                <Table className="table-fixed border border-slate-300">
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="border border-slate-300 w-[16rem]">Program-Course</TableHead>
                      <TableHead className="border border-slate-300 w-[8rem]">Subject Category</TableHead>
                      <TableHead className="border border-slate-300 w-[10rem]">Subject</TableHead>
                      <TableHead className="border border-slate-300">Related Subjects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="border border-slate-300 text-sm font-medium">
                        {deleteSummary.programCourse || "—"}
                      </TableCell>
                      <TableCell className="border border-slate-300">
                        <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50 text-xs">
                          {deleteSummary.subjectCategory || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="border border-slate-300">
                        <Badge variant="outline" className="text-xs border-red-500 text-red-700 bg-red-50">
                          {deleteSummary.subject || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="border border-slate-300">
                        <div className="flex flex-wrap gap-1">
                          {deleteSummary.related.length > 0 ? (
                            deleteSummary.related.map((rs, i) => (
                              <Badge
                                key={`${rs}-${i}`}
                                variant="outline"
                                className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300"
                              >
                                {rs}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-500 text-sm">None</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
