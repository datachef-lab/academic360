import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Download,
  Edit,
  LayoutGrid,
  Lock,
  Pencil,
  PlusCircle,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAffiliations,
  getProgramCourseDtos,
  getRegulationTypes,
} from "@/services/course-design.api";
import { getAllClasses } from "@/services/classes.service";
import type {
  AccessGroupDto,
  AccessGroupCreateInput,
  AccessGroupModuleInput,
} from "@repo/db/dtos/administration";
import {
  createAccessGroup,
  deleteAccessGroup,
  getAllAccessGroups,
  updateAccessGroup,
} from "../services/access-group.service";
import { getAllDesignations } from "../services/designation.service";
import { getAllUserTypes } from "../services/user-type.service";
import { getAllUserStatusMasters } from "../services/user-status.service";
import { getAllAppModules } from "../services/app-module.service";
import type { DesignationT } from "@repo/db/schemas";
import type { UserTypeT } from "@repo/db/schemas/models/administration";
import type { UserStatusMasterDto } from "../services/user-status.service";
import type { AppModuleDto } from "@repo/db/dtos/administration";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";
import type { Class } from "@/types/academics/class";
import type { Affiliation, RegulationType } from "@repo/db";

const APPLICATION_OPTIONS = [
  "MAIN_CONSOLE",
  "STUDENT_CONSOLE",
  "STUDENT_CONSOLE_MOBILE",
  "EXAM_ATTENDANCE_APP",
  "ID_CARD_GENERATOR",
  "EVENT_GATEKEEPER",
] as const;

const ACCESS_GROUP_TYPE_OPTIONS = ["BASIC", "ADD-ON", "SPECIAL"] as const;

const MODULE_TYPE_OPTIONS = ["STATIC", "CONDITIONAL"] as const;

const PERMISSION_OPTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "UPLOAD"] as const;

/** Display label for permission (READ -> VIEW) */
function getPermissionLabel(p: (typeof PERMISSION_OPTIONS)[number]): string {
  return p === "READ" ? "VIEW" : p;
}

/** Extract label from class name, removing redundant "SEMESTER"/"YEAR" prefix (e.g. "SEMESTER I" -> "I") */
function getClassShortLabel(name: string): string {
  const stripped = name.replace(/^(?:SEMESTER|YEAR)\s+/i, "").trim();
  return stripped || name;
}

function toSentenceCase(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const featureItemSchema = z.object({
  appModuleId: z.number().int().positive("Select a module"),
  type: z.enum(["STATIC", "CONDITIONAL"]).optional(),
  isAllowed: z.boolean().optional(),
  permissions: z.array(z.enum(["CREATE", "READ", "UPDATE", "DELETE", "UPLOAD"])).optional(),
  programCourses: z
    .array(
      z.object({
        programCourseId: z.number(),
        isAllowed: z.boolean().optional(),
        classes: z
          .array(z.object({ classId: z.number(), isAllowed: z.boolean().optional() }))
          .optional(),
      }),
    )
    .optional(),
});

type FeatureFormValue = z.infer<typeof featureItemSchema>;

interface ModuleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  /** When true (editing an existing access group), module + type cannot be changed in this dialog. */
  lockModuleAndType: boolean;
  initialValue: FeatureFormValue | null;
  appModules: AppModuleDto[];
  usedModuleIds: number[];
  selectedApplicationTypes: string[];
  programCourses: ProgramCourseDto[];
  classes: Class[];
  affiliations: Affiliation[];
  regulationTypes: RegulationType[];
  onSave: (value: FeatureFormValue) => void;
}

function ModuleConfigDialog({
  open,
  onOpenChange,
  mode,
  lockModuleAndType,
  initialValue,
  appModules,
  usedModuleIds,
  selectedApplicationTypes,
  programCourses,
  classes,
  affiliations,
  regulationTypes,
  onSave,
}: ModuleConfigDialogProps) {
  const disableModuleTypePicker = mode === "edit" && lockModuleAndType;
  const toProgramCourseSelections = (
    arr:
      | {
          programCourseId: number;
          isAllowed?: boolean;
          classes?: { classId: number; isAllowed?: boolean }[];
        }[]
      | undefined,
  ) =>
    (arr ?? []).map((x) => ({
      programCourseId: x.programCourseId,
      isAllowed: x.isAllowed ?? true,
      classes: (x.classes ?? []).map((c) => ({
        classId: c.classId,
        isAllowed: c.isAllowed ?? true,
      })),
    }));

  const filteredAppModules = useMemo(
    () =>
      selectedApplicationTypes.length > 0
        ? appModules.filter(
            (m) => m.application && selectedApplicationTypes.includes(m.application),
          )
        : appModules,
    [appModules, selectedApplicationTypes],
  );

  const [appModuleId, setAppModuleId] = useState<number>(initialValue?.appModuleId ?? 0);
  const [type, setType] = useState<"STATIC" | "CONDITIONAL">(initialValue?.type ?? "STATIC");
  const [permissions, setPermissions] = useState<(typeof PERMISSION_OPTIONS)[number][]>(
    (initialValue?.permissions?.length ?? 0) > 0 ? (initialValue?.permissions ?? []) : ["READ"],
  );
  const [affiliationFilterId, setAffiliationFilterId] = useState<number | null>(null);
  const [regulationFilterId, setRegulationFilterId] = useState<number | null>(null);
  const [programCourseSelections, setProgramCourseSelections] = useState<
    {
      programCourseId: number;
      isAllowed: boolean;
      classes: { classId: number; isAllowed: boolean }[];
    }[]
  >(() => toProgramCourseSelections(initialValue?.programCourses));

  const resetForm = useCallback(() => {
    setAppModuleId(initialValue?.appModuleId ?? 0);
    setType(initialValue?.type ?? "STATIC");
    setPermissions(
      (initialValue?.permissions?.length ?? 0) > 0 ? (initialValue?.permissions ?? []) : ["READ"],
    );
    setAffiliationFilterId(null);
    setRegulationFilterId(null);
    setProgramCourseSelections(toProgramCourseSelections(initialValue?.programCourses));
  }, [initialValue]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const togglePermission = (p: (typeof PERMISSION_OPTIONS)[number]) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const toggleClass = (programCourseId: number, classId: number) => {
    setProgramCourseSelections((prev) =>
      prev.map((pc) => {
        if (pc.programCourseId !== programCourseId) return pc;
        const exists = pc.classes.find((c) => c.classId === classId);
        const newClasses = exists
          ? pc.classes.filter((c) => c.classId !== classId)
          : [...pc.classes, { classId, isAllowed: true }];
        return { ...pc, classes: newClasses };
      }),
    );
  };

  const toggleProgramCourse = (programCourseId: number) => {
    setProgramCourseSelections((prev) => {
      const exists = prev.find((p) => p.programCourseId === programCourseId);
      if (exists) return prev.filter((p) => p.programCourseId !== programCourseId);
      return [...prev, { programCourseId, isAllowed: true, classes: [] }];
    });
  };

  const handleSave = () => {
    if (!appModuleId) {
      toast.error("Please select an app module.");
      return;
    }
    onSave({
      appModuleId,
      type,
      isAllowed: true,
      permissions,
      programCourses:
        type === "CONDITIONAL"
          ? programCourseSelections.map((pc) => ({
              programCourseId: pc.programCourseId,
              isAllowed: pc.isAllowed,
              classes: pc.classes.length > 0 ? pc.classes : undefined,
            }))
          : undefined,
    });
    onOpenChange(false);
  };

  const selectedProgramCourseIds = new Set(programCourseSelections.map((p) => p.programCourseId));
  const getSelectedClassIdsForProgramCourse = (programCourseId: number) =>
    new Set(
      programCourseSelections
        .find((p) => p.programCourseId === programCourseId)
        ?.classes.map((c) => c.classId) ?? [],
    );

  const filteredProgramCourses = useMemo(() => {
    let list = programCourses;
    if (affiliationFilterId) {
      list = list.filter((pc) => pc.affiliation?.id === affiliationFilterId);
    }
    if (regulationFilterId) {
      list = list.filter((pc) => pc.regulationType?.id === regulationFilterId);
    }
    return list;
  }, [programCourses, affiliationFilterId, regulationFilterId]);

  const allProgramCoursesSelected =
    filteredProgramCourses.length > 0 &&
    filteredProgramCourses.every((pc) => selectedProgramCourseIds.has(pc.id!));
  const someProgramCoursesSelected = filteredProgramCourses.some((pc) =>
    selectedProgramCourseIds.has(pc.id!),
  );

  const handleSelectAllProgramCourses = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setProgramCourseSelections((prev) => {
        const existing = new Set(prev.map((p) => p.programCourseId));
        const toAdd = filteredProgramCourses.filter((pc) => pc.id && !existing.has(pc.id));
        return [
          ...prev,
          ...toAdd.map((pc) => ({
            programCourseId: pc.id!,
            isAllowed: true,
            classes: [] as { classId: number; isAllowed: boolean }[],
          })),
        ];
      });
    } else {
      setProgramCourseSelections((prev) =>
        prev.filter((p) => !filteredProgramCourses.some((pc) => pc.id === p.programCourseId)),
      );
    }
  };

  const allClassesSelectedForAllRows =
    programCourseSelections.length > 0 &&
    programCourseSelections.every(
      (pc) =>
        classes.length > 0 && classes.every((c) => pc.classes.some((x) => x.classId === c.id)),
    );
  const someClassesSelectedForRows = programCourseSelections.some((pc) => pc.classes.length > 0);

  const handleSelectAllClasses = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setProgramCourseSelections((prev) =>
        prev.map((pc) => ({
          ...pc,
          classes: classes.filter((c) => c.id).map((c) => ({ classId: c.id!, isAllowed: true })),
        })),
      );
    } else {
      setProgramCourseSelections((prev) => prev.map((pc) => ({ ...pc, classes: [] })));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "add" ? "Add Module" : "Edit Module"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            <div className="space-y-2">
              <Label>App Module</Label>
              <Select
                value={appModuleId ? String(appModuleId) : ""}
                onValueChange={(v) => setAppModuleId(Number(v))}
                disabled={disableModuleTypePicker}
              >
                <SelectTrigger disabled={disableModuleTypePicker}>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAppModules.map((m) => {
                    const mid = m.id;
                    const isUsed = mid != null && usedModuleIds.includes(mid);
                    const isCurrent = mid === appModuleId;
                    const disabled = isUsed && !isCurrent;
                    return (
                      <SelectItem key={m.id} value={String(m.id)} disabled={disabled}>
                        {m.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "STATIC" | "CONDITIONAL")}
                disabled={disableModuleTypePicker}
              >
                <SelectTrigger disabled={disableModuleTypePicker}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {toSentenceCase(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "CONDITIONAL" ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
              <div className="flex items-center justify-between gap-4 shrink-0">
                <Label>Program Courses & Classes</Label>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select
                    value={affiliationFilterId ? String(affiliationFilterId) : "__all__"}
                    onValueChange={(v) =>
                      setAffiliationFilterId(v === "__all__" ? null : Number(v))
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Affiliation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All affiliations</SelectItem>
                      {affiliations.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={regulationFilterId ? String(regulationFilterId) : "__all__"}
                    onValueChange={(v) => setRegulationFilterId(v === "__all__" ? null : Number(v))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Regulation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All regulations</SelectItem>
                      {regulationTypes.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border rounded-md border-border [&_td]:border [&_th]:border flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 min-h-0">
                  <table className="w-full caption-bottom text-sm">
                    <TableHeader>
                      <TableRow className="border-b bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="border-r font-medium sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-[0_1px_0_0_hsl(var(--border))]">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                someProgramCoursesSelected && !allProgramCoursesSelected
                                  ? "indeterminate"
                                  : allProgramCoursesSelected
                              }
                              onCheckedChange={handleSelectAllProgramCourses}
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=indeterminate]:bg-purple-600 data-[state=indeterminate]:border-purple-600"
                            />
                            Program Course
                          </div>
                        </TableHead>
                        <TableHead className="border-r font-medium sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-[0_1px_0_0_hsl(var(--border))]">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                someClassesSelectedForRows && !allClassesSelectedForAllRows
                                  ? "indeterminate"
                                  : allClassesSelectedForAllRows
                              }
                              onCheckedChange={handleSelectAllClasses}
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=indeterminate]:bg-purple-600 data-[state=indeterminate]:border-purple-600"
                            />
                            Semesters
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProgramCourses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                            No program courses available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProgramCourses.map((pc) => (
                          <TableRow key={pc.id} className="border-b">
                            <TableCell className="border-r align-top">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Checkbox
                                  checked={selectedProgramCourseIds.has(pc.id!)}
                                  onCheckedChange={() => toggleProgramCourse(pc.id!)}
                                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <span className="font-medium">{pc.name}</span>
                                {pc.affiliation && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700"
                                  >
                                    {pc.affiliation.name}
                                  </Badge>
                                )}
                                {pc.regulationType && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                                  >
                                    {pc.regulationType.name}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="border-r align-top">
                              <div className="flex flex-wrap gap-3">
                                {classes.map((c) => (
                                  <div key={c.id} className="flex items-center gap-1.5">
                                    <Checkbox
                                      id={`pc-${pc.id}-class-${c.id}`}
                                      checked={getSelectedClassIdsForProgramCourse(pc.id!).has(
                                        c.id!,
                                      )}
                                      onCheckedChange={() => toggleClass(pc.id!, c.id!)}
                                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <Label
                                      htmlFor={`pc-${pc.id}-class-${c.id}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {getClassShortLabel(c.name)}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[280px]" aria-hidden />
          )}
        </div>
        <div className="flex justify-between items-center pt-4 mt-4 border-t shrink-0 bg-background">
          <div className="flex flex-wrap gap-4 items-center">
            <Label className="text-sm font-medium shrink-0">Permissions</Label>
            {PERMISSION_OPTIONS.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <Switch
                  checked={permissions.includes(p)}
                  onCheckedChange={() => togglePermission(p)}
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <Label className="text-sm font-normal cursor-pointer whitespace-nowrap">
                  {getPermissionLabel(p)}
                </Label>
              </div>
            ))}
          </div>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const accessGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((v) => v.trim()),
  type: z.enum(["BASIC", "ADD-ON", "SPECIAL"]).optional(),
  userStatusId: z
    .number({ invalid_type_error: "User status is required" })
    .int()
    .min(1, "User status is required"),
  code: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null),
  description: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null),
  remarks: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null),
  isActive: z.boolean().default(true),
  applications: z
    .array(z.object({ type: z.enum([...APPLICATION_OPTIONS]) }))
    .max(1, "Only one application can be selected")
    .optional(),
  designations: z.array(z.object({ designationId: z.number().int().positive() })).optional(),
  userTypes: z
    .array(z.object({ userTypeId: z.number().int().positive() }))
    .min(1, "Select a user type")
    .max(1, "Only one user type can be selected"),
  features: z.array(featureItemSchema).min(1, "Include at least one module feature"),
});

type AccessGroupFormValues = z.infer<typeof accessGroupSchema>;

interface AccessGroupFormProps {
  initialData: AccessGroupDto | null;
  userStatuses: UserStatusMasterDto[];
  designations: DesignationT[];
  userTypes: UserTypeT[];
  appModules: AppModuleDto[];
  programCourses: ProgramCourseDto[];
  classes: Class[];
  affiliations: Affiliation[];
  regulationTypes: RegulationType[];
  onSubmit: (payload: AccessGroupCreateInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function AccessGroupForm({
  initialData,
  userStatuses,
  designations,
  userTypes,
  appModules,
  programCourses,
  classes,
  affiliations,
  regulationTypes,
  onSubmit,
  onCancel,
  isSubmitting,
}: AccessGroupFormProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AccessGroupFormValues>({
    resolver: zodResolver(accessGroupSchema),
    defaultValues: {
      name: "",
      type: "BASIC",
      userStatusId: 0,
      code: "",
      description: "",
      remarks: "",
      isActive: true,
      applications: [],
      designations: [],
      userTypes: [],
      features: [],
    },
  });

  const { append: appendFeature, remove: removeFeature } = useFieldArray({
    control,
    name: "features",
  });

  const [featureDialogIndex, setFeatureDialogIndex] = useState<number | null>(null);

  const rootUserStatuses = useMemo(
    () => userStatuses.filter((s) => !s.parentUserStatusMaster),
    [userStatuses],
  );
  const childUserTypes = useMemo(
    () => userTypes.filter((ut) => ut.parentUserTypeId != null),
    [userTypes],
  );
  const parentUserTypeMap = useMemo(() => {
    const map = new Map<number, UserTypeT>();
    userTypes.forEach((ut) => {
      if (ut.id != null) map.set(ut.id, ut);
    });
    return map;
  }, [userTypes]);
  const accessGroupType = watch("type");
  const assignmentUserTypes = useMemo(() => {
    if (accessGroupType === "ADD-ON" || accessGroupType === "SPECIAL") {
      return childUserTypes.filter((ut) => {
        const parent =
          ut.parentUserTypeId != null ? parentUserTypeMap.get(ut.parentUserTypeId) : null;
        return parent?.name?.toLowerCase() !== "student";
      });
    }
    return childUserTypes;
  }, [childUserTypes, accessGroupType, parentUserTypeMap]);

  const isEditMode = initialData != null;
  const initiallyIncludedModuleIds = useMemo(
    () =>
      new Set(
        initialData?.features
          ?.map((f) => f.appModule?.id)
          .filter((id): id is number => id != null) ?? [],
      ),
    [initialData],
  );

  const applicationsWatch = watch("applications");
  const selectedApplicationTypes = useMemo(
    () => applicationsWatch?.map((a) => a.type) ?? [],
    [applicationsWatch],
  );

  const catalogModules = useMemo(() => {
    if (selectedApplicationTypes.length === 0) return [];
    const set = new Set(selectedApplicationTypes);
    return appModules
      .filter((m) => m.id != null && m.application && set.has(m.application))
      .slice()
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [appModules, selectedApplicationTypes]);

  useEffect(() => {
    const catalogIds = new Set(catalogModules.map((m) => m.id!));
    const features = getValues("features") ?? [];
    const next = features.filter((f) => catalogIds.has(f.appModuleId));
    if (next.length !== features.length) {
      setValue("features", next, { shouldDirty: true });
    }
  }, [catalogModules, getValues, setValue]);

  const usedModuleIds =
    watch("features")
      ?.map((f) => f.appModuleId)
      .filter((id): id is number => typeof id === "number") ?? [];
  const selectedUserTypeIds = watch("userTypes") ?? [];
  const selectedUtId = selectedUserTypeIds[0]?.userTypeId;
  const selectedUt = selectedUtId ? childUserTypes.find((u) => u.id === selectedUtId) : null;
  const selectedUtParent =
    selectedUt?.parentUserTypeId != null
      ? parentUserTypeMap.get(selectedUt.parentUserTypeId)
      : null;
  const isParentStudent = selectedUtParent?.name?.toLowerCase() === "student";

  useEffect(() => {
    if (selectedUt != null && isParentStudent) {
      setValue("designations", []);
    }
  }, [selectedUt, isParentStudent, setValue]);

  useEffect(() => {
    if (
      (accessGroupType === "ADD-ON" || accessGroupType === "SPECIAL") &&
      selectedUt != null &&
      isParentStudent
    ) {
      setValue("userTypes", []);
    }
  }, [accessGroupType, selectedUt, isParentStudent, setValue]);

  useEffect(() => {
    if (!initialData) {
      reset({
        name: "",
        type: "BASIC",
        userStatusId: 0,
        code: "",
        description: "",
        remarks: "",
        isActive: true,
        applications: [],
        designations: [],
        userTypes: [],
        features: [],
      });
      return;
    }
    reset({
      name: initialData.name ?? "",
      type: (initialData.type as "BASIC" | "ADD-ON" | "SPECIAL") ?? "BASIC",
      userStatusId: initialData.userStatusId ?? 0,
      code: initialData.code ?? "",
      description: initialData.description ?? "",
      remarks: initialData.remarks ?? "",
      isActive: initialData.isActive ?? true,
      applications:
        initialData.applications?.length && initialData.applications[0]
          ? [{ type: initialData.applications[0].type }]
          : [],
      designations:
        initialData.designations
          ?.filter((d) => d.designation?.id != null)
          .map((d) => ({ designationId: d.designation!.id })) ?? [],
      userTypes:
        initialData.userTypes
          ?.filter((u) => u.userType?.id != null)
          .map((u) => ({ userTypeId: u.userType!.id })) ?? [],
      features:
        initialData.features
          ?.filter((f) => f.appModule?.id != null)
          .map((f) => ({
            appModuleId: f.appModule!.id,
            type: (f.type as "STATIC" | "CONDITIONAL") ?? "STATIC",
            isAllowed: f.isAllowed ?? true,
            permissions:
              initialData.permissions
                ?.filter((p) => p.accessGroupModuleId === f.id)
                .map((p) => p.type) ?? [],
            programCourses:
              f.programCourseAndClasses
                ?.filter((pc) => pc.programCourse?.id != null)
                .map((pc) => ({
                  programCourseId: pc.programCourse!.id,
                  isAllowed: pc.isAllowed ?? true,
                  classes:
                    pc.classes
                      ?.filter((c) => c.class?.id != null)
                      .map((c) => ({
                        classId: c.class!.id,
                        isAllowed: c.isAllowed ?? true,
                      })) ?? [],
                })) ?? [],
          })) ?? [],
    });
  }, [initialData, reset]);

  const submit = async (values: AccessGroupFormValues) => {
    const payload: AccessGroupCreateInput = {
      name: values.name,
      type: values.type,
      userStatusId: values.userStatusId,
      code: values.code || undefined,
      description: values.description || undefined,
      remarks: values.remarks || undefined,
      isActive: values.isActive,
      applications: values.applications?.length
        ? values.applications.map((a) => ({ type: a.type }))
        : undefined,
      designations: values.designations?.length
        ? values.designations.map((d) => ({ designationId: d.designationId }))
        : undefined,
      userTypes: values.userTypes?.length
        ? values.userTypes.map((u) => ({ userTypeId: u.userTypeId }))
        : undefined,
      features:
        (values.features?.length ?? 0) > 0
          ? (values.features ?? []).map(
              (f): AccessGroupModuleInput => ({
                appModuleId: f.appModuleId,
                type: f.type,
                isAllowed: f.isAllowed,
                permissions:
                  (f.permissions?.length ?? 0) > 0
                    ? (f.permissions ?? []).map((p) => ({ type: p }))
                    : undefined,
                programCourses:
                  (f.programCourses?.length ?? 0) > 0
                    ? (f.programCourses ?? []).map((pc) => ({
                        programCourseId: pc.programCourseId,
                        isAllowed: pc.isAllowed,
                        classes:
                          (pc.classes?.length ?? 0) > 0
                            ? (pc.classes ?? []).map((c) => ({
                                classId: c.classId,
                                isAllowed: c.isAllowed,
                              }))
                            : undefined,
                      }))
                    : undefined,
              }),
            )
          : undefined,
    };
    await onSubmit(payload);
  };

  const handleModuleConfigSave = (value: FeatureFormValue) => {
    if (featureDialogIndex != null) {
      setValue(`features.${featureDialogIndex}`, value);
    }
    setFeatureDialogIndex(null);
  };

  const toggleModuleInFeatures = (appModuleId: number) => {
    const feats = getValues("features") ?? [];
    const idx = feats.findIndex((f) => f.appModuleId === appModuleId);
    if (idx >= 0) {
      removeFeature(idx);
      return;
    }
    appendFeature({
      appModuleId,
      type: "STATIC",
      isAllowed: true,
      permissions: ["READ"],
    });
  };

  const featureIndexForModule = (appModuleId: number) =>
    (watch("features") ?? []).findIndex((f) => f.appModuleId === appModuleId);

  const onSubmitInvalid = () => {
    toast.error(
      "Please complete required fields: user status, user type, application, and at least one module.",
    );
  };

  return (
    <form onSubmit={handleSubmit(submit, onSubmitInvalid)} className="flex flex-col min-h-0 flex-1">
      <div className="flex gap-6 overflow-hidden flex-1 min-h-0">
        {/* General */}
        <section className="flex-1 min-w-[200px] flex flex-col overflow-y-auto border-r pr-4">
          <div className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 border-b flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">General</h3>
          </div>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEditMode}
                    >
                      <SelectTrigger disabled={isEditMode}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESS_GROUP_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {toSentenceCase(opt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {accessGroupType === "BASIC" && (
                  <p className="text-xs text-muted-foreground">
                    This access group will be used by user account based on their user-account type.
                  </p>
                )}
                {accessGroupType === "ADD-ON" && (
                  <p className="text-xs text-muted-foreground">
                    Only be used or fetched based on designation.
                  </p>
                )}
                {accessGroupType === "SPECIAL" && (
                  <p className="text-xs text-muted-foreground">
                    Only for staff users and will have to attach this group specifically to users.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="userStatusId">User Status *</Label>
                <Controller
                  name="userStatusId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={
                        typeof field.value === "number" && field.value > 0
                          ? String(field.value)
                          : ""
                      }
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={isEditMode}
                    >
                      <SelectTrigger disabled={isEditMode}>
                        <SelectValue placeholder="Select user status" />
                      </SelectTrigger>
                      <SelectContent>
                        {rootUserStatuses.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.userStatusId && (
                  <p className="text-sm text-red-600">{errors.userStatusId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" {...register("code")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" className="min-h-[80px]" {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input id="remarks" {...register("remarks")} />
            </div>
          </div>
        </section>

        {/* Assignment */}
        <section className="flex-1 min-w-[200px] flex flex-col overflow-y-auto border-r pr-4">
          <div className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 border-b flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Assignment</h3>
          </div>
          <div className="space-y-4 pt-2">
            <div>
              <Label>User Types *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Assign this group to users with these types.
              </p>
              <Controller
                name="userTypes"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    {assignmentUserTypes.map((ut) => {
                      const checked = field.value?.some((x) => x.userTypeId === ut.id);
                      const disabled = isEditMode && checked;
                      const parent =
                        ut.parentUserTypeId != null
                          ? parentUserTypeMap.get(ut.parentUserTypeId)
                          : null;
                      return (
                        <div
                          key={ut.id}
                          className="flex items-center gap-2 p-2 rounded border hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <Checkbox
                            id={`ut-${ut.id}`}
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(checked) => {
                              if (disabled) return;
                              if (checked) {
                                field.onChange([{ userTypeId: ut.id }]);
                              } else {
                                field.onChange([]);
                              }
                            }}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=checked]:text-white"
                          />
                          <Label
                            htmlFor={`ut-${ut.id}`}
                            className="cursor-pointer flex-1 flex justify-between items-center"
                          >
                            <span>{ut.name}</span>
                            {parent && (
                              <span className="italic text-muted-foreground">({parent.name})</span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
              {errors.userTypes?.message && (
                <p className="text-sm text-red-600">{errors.userTypes.message}</p>
              )}
            </div>
            {selectedUt != null && !isParentStudent ? (
              <div>
                <Label>Designations</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Assign this group to staff with these designations.
                </p>
                <Controller
                  name="designations"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2">
                      {designations.map((d) => {
                        const checked = field.value?.some((x) => x.designationId === d.id);
                        const disabled = isEditMode && checked;
                        return (
                          <div
                            key={d.id}
                            className="flex items-center gap-2 p-2 rounded border hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <Checkbox
                              id={`des-${d.id}`}
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(checked) => {
                                if (disabled) return;
                                const current = field.value ?? [];
                                if (checked) {
                                  field.onChange([...current, { designationId: d.id }]);
                                } else {
                                  field.onChange(current.filter((x) => x.designationId !== d.id));
                                }
                              }}
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=checked]:text-white"
                            />
                            <Label htmlFor={`des-${d.id}`} className="cursor-pointer flex-1">
                              {d.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* Features / Module and Permissions */}
        <section className="flex-[2_1_0] min-w-[280px] flex flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 border-b flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Features / Module and Permissions
            </h3>
          </div>
          <div className="space-y-4 pt-2">
            <div className="max-w-md space-y-1.5">
              <Controller
                name="applications"
                control={control}
                render={({ field }) => {
                  const selectedType = field.value?.[0]?.type;
                  return (
                    <Select
                      value={selectedType ?? "__none__"}
                      onValueChange={(v) => {
                        if (v === "__none__") {
                          field.onChange([]);
                          return;
                        }
                        field.onChange([{ type: v as (typeof APPLICATION_OPTIONS)[number] }]);
                      }}
                      disabled={isEditMode}
                    >
                      <SelectTrigger disabled={isEditMode} className="w-full">
                        <SelectValue placeholder="Select application" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {APPLICATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {toSentenceCase(opt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.applications?.message && (
                <p className="text-sm text-red-600 mt-1">{errors.applications.message}</p>
              )}
            </div>
            {errors.features?.message && (
              <p className="text-sm text-red-600">{errors.features.message}</p>
            )}
            <div className="border rounded-md overflow-hidden border-border [&_td]:border [&_th]:border">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-slate-50 dark:bg-slate-800/50">
                    <TableHead
                      className="border-r font-medium w-10 text-center"
                      aria-label="Include"
                    />
                    <TableHead className="border-r font-medium">Sr. No</TableHead>
                    <TableHead className="border-r font-medium">Feature</TableHead>
                    <TableHead className="border-r font-medium">Type</TableHead>
                    <TableHead className="border-r font-medium">Permissions</TableHead>
                    <TableHead className="border-r font-medium">Eligible account</TableHead>
                    <TableHead className="border-r font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedApplicationTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        Select an application to load app modules.
                      </TableCell>
                    </TableRow>
                  ) : catalogModules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No app modules found for the selected application.
                      </TableCell>
                    </TableRow>
                  ) : (
                    catalogModules.map((mod, rowIdx) => {
                      const mid = mod.id!;
                      const fIdx = featureIndexForModule(mid);
                      const included = fIdx >= 0;
                      const feat = included ? watch(`features.${fIdx}`) : null;
                      const typeVal = feat?.type ?? "STATIC";
                      const perms = feat?.permissions ?? [];
                      const checkboxDisabled =
                        isEditMode && included && initiallyIncludedModuleIds.has(mid);
                      return (
                        <TableRow key={mid} className="border-b">
                          <TableCell className="border-r text-center align-middle">
                            <Checkbox
                              checked={included}
                              disabled={checkboxDisabled}
                              onCheckedChange={() => {
                                if (checkboxDisabled) return;
                                toggleModuleInFeatures(mid);
                              }}
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=checked]:text-white"
                              aria-label={`Include ${mod.name ?? "module"}`}
                            />
                          </TableCell>
                          <TableCell className="border-r">{rowIdx + 1}</TableCell>
                          <TableCell className="border-r">{mod.name ?? "—"}</TableCell>
                          <TableCell className="border-r">
                            {included ? (
                              <Badge
                                variant="outline"
                                className={
                                  typeVal === "CONDITIONAL"
                                    ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300"
                                    : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                                }
                              >
                                {typeVal}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="border-r">
                            {included ? (
                              <div className="flex flex-wrap gap-1">
                                {perms.length === 0 ? (
                                  <span className="text-muted-foreground text-xs">—</span>
                                ) : (
                                  perms.map((p) => (
                                    <Badge
                                      key={p}
                                      variant="outline"
                                      className="text-xs bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30"
                                    >
                                      {getPermissionLabel(p)}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="border-r">0</TableCell>
                          <TableCell className="border-r">
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={!included}
                                onClick={() =>
                                  included && fIdx >= 0 ? setFeatureDialogIndex(fIdx) : undefined
                                }
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                disabled={!included || checkboxDisabled}
                                onClick={() => included && fIdx >= 0 && removeFeature(fIdx)}
                                title="Remove from group"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

          <ModuleConfigDialog
            open={featureDialogIndex !== null}
            onOpenChange={(open) => !open && setFeatureDialogIndex(null)}
            mode="edit"
            lockModuleAndType={isEditMode}
            initialValue={
              featureDialogIndex != null ? (watch(`features.${featureDialogIndex}`) ?? null) : null
            }
            appModules={appModules}
            usedModuleIds={
              featureDialogIndex != null
                ? usedModuleIds.filter(
                    (id) => id !== watch(`features.${featureDialogIndex}`)?.appModuleId,
                  )
                : usedModuleIds
            }
            selectedApplicationTypes={(watch("applications") ?? []).map((a) => a.type)}
            programCourses={programCourses}
            classes={classes}
            affiliations={affiliations}
            regulationTypes={regulationTypes}
            onSave={handleModuleConfigSave}
          />
        </section>
      </div>

      <div className="flex justify-between items-center gap-2 pt-4 border-t shrink-0 mt-4">
        <div className="flex items-center gap-2">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="isActive"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=checked]:text-white"
              />
            )}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Active
          </Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function AccessGroupPage() {
  const [items, setItems] = useState<AccessGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<AccessGroupDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccessGroupDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [userStatuses, setUserStatuses] = useState<UserStatusMasterDto[]>([]);
  const [designations, setDesignations] = useState<DesignationT[]>([]);
  const [userTypes, setUserTypes] = useState<UserTypeT[]>([]);
  const [appModules, setAppModules] = useState<AppModuleDto[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourseDto[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllAccessGroups();
      const payload = Array.isArray(response.payload) ? response.payload : [];
      setItems(payload);
      setError(null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError("Failed to load access groups");
      toast.error("Failed to load access groups");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [statusRes, desRes, utRes, modRes, pcRes, clsRes, affRes, regRes] = await Promise.all([
        getAllUserStatusMasters(),
        getAllDesignations(),
        getAllUserTypes(),
        getAllAppModules(),
        getProgramCourseDtos(),
        getAllClasses(),
        getAffiliations(),
        getRegulationTypes(),
      ]);
      setUserStatuses(Array.isArray(statusRes.payload) ? statusRes.payload : []);
      setDesignations(Array.isArray(desRes.payload) ? desRes.payload : []);
      setUserTypes(Array.isArray(utRes.payload) ? utRes.payload : []);
      setAppModules(Array.isArray(modRes.payload) ? modRes.payload : []);
      setProgramCourses(Array.isArray(pcRes) ? pcRes : []);
      setClasses(Array.isArray(clsRes) ? clsRes : []);
      setAffiliations(Array.isArray(affRes) ? affRes : []);
      setRegulationTypes(Array.isArray(regRes) ? regRes : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    if (isDialogOpen) void loadLookups();
  }, [isDialogOpen, loadLookups]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(s) ||
        item.code?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s),
    );
  }, [items, search]);

  const onSave = async (payload: AccessGroupCreateInput) => {
    setIsSubmitting(true);
    try {
      if (selected?.id) {
        await updateAccessGroup(selected.id, payload);
        toast.success("Access group updated");
      } else {
        await createAccessGroup(payload);
        toast.success("Access group created");
      }
      setIsDialogOpen(false);
      setSelected(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Save failed", { description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      await deleteAccessGroup(deleteTarget.id);
      toast.success("Access group deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed", { description: "Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    const XLSX = await import("xlsx");
    const rows = filteredItems.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      code: item.code,
      description: item.description ?? "",
      isActive: item.isActive ? "Active" : "Inactive",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AccessGroups");
    XLSX.writeFile(workbook, "access_groups.xlsx");
  };

  const handleAddClick = () => {
    setSelected(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-4 min-h-[calc(100vh-140px)] overflow-x-hidden">
      <Card className="border-none">
        <CardHeader className="flex flex-col gap-4 border rounded-md p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 shrink-0 text-black" />
                <span className="text-lg font-semibold">Access Group Management</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Manage access groups: applications, designations, user types, and module
                permissions.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    onClick={handleAddClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {selected ? "Edit Access Group" : "Add New Access Group"}
                    </AlertDialogTitle>
                  </AlertDialogHeader>
                  <AccessGroupForm
                    initialData={selected}
                    userStatuses={userStatuses}
                    designations={designations}
                    userTypes={userTypes}
                    appModules={appModules}
                    programCourses={programCourses}
                    classes={classes}
                    affiliations={affiliations}
                    regulationTypes={regulationTypes}
                    onSubmit={onSave}
                    onCancel={() => setIsDialogOpen(false)}
                    isSubmitting={isSubmitting}
                  />
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 overflow-x-hidden">
          <div className="bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search by name, code, or description..."
              className="w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant="outline"
              className="flex items-center gap-2 flex-shrink-0"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>

          <div className="md:hidden space-y-2 p-2 sm:p-4 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No access groups found.</div>
            ) : (
              filteredItems.map((item, idx) => (
                <Card key={item.id ?? idx} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800 truncate">{item.name}</span>
                        {item.code && (
                          <Badge variant="outline" className="flex-shrink-0 text-xs">
                            {item.code}
                          </Badge>
                        )}
                        <Badge
                          variant={item.isActive ? "default" : "secondary"}
                          className={
                            item.isActive
                              ? "bg-green-500 text-white hover:bg-green-600 flex-shrink-0"
                              : "flex-shrink-0"
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelected(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={deleteTarget?.id === item.id}
                        onOpenChange={(open) => setDeleteTarget(open ? item : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw]">
                          <DialogHeader>
                            <DialogTitle>Delete access group?</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">
                            This will permanently remove <strong>{item.name}</strong>.
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setDeleteTarget(null)}
                              disabled={isDeleting}
                            >
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="hidden md:block relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto h-full overflow-x-hidden">
              <table
                className="w-full caption-bottom text-sm border rounded-md"
                style={{ tableLayout: "fixed" }}
              >
                <TableHeader>
                  <TableRow className="sticky top-0 z-30 bg-[#f3f4f6] [&>th]:border-b hover:bg-[#f3f4f6]">
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 60 }}
                    >
                      #
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 180 }}
                    >
                      Name
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 100 }}
                    >
                      Type
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 120 }}
                    >
                      Code
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 240 }}
                    >
                      Description
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 100 }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 120 }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No access groups found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <TableRow key={item.id ?? idx}>
                        <TableCell style={{ width: 60 }}>{idx + 1}.</TableCell>
                        <TableCell style={{ width: 180 }}>
                          <span className="font-medium">{item.name}</span>
                        </TableCell>
                        <TableCell style={{ width: 100 }}>
                          <Badge variant="outline">{item.type ?? "—"}</Badge>
                        </TableCell>
                        <TableCell style={{ width: 120 }}>{item.code ?? "—"}</TableCell>
                        <TableCell style={{ width: 240 }}>{item.description ?? "—"}</TableCell>
                        <TableCell style={{ width: 100 }}>
                          {item.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelected(item);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog
                              open={deleteTarget?.id === item.id}
                              onOpenChange={(open) => setDeleteTarget(open ? item : null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Delete access group?</DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground">
                                  This will permanently remove <strong>{item.name}</strong>.
                                </p>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isDeleting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={onDelete}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
