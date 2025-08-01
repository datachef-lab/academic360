import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, X } from "lucide-react";
import {
  Subject,
  Affiliation,
  RegulationType,
  SubjectType,
  Paper,
  ExamComponent,
  Course,
  PaperComponent,
} from "@/types/course-design";
import { toast } from "sonner";
import { getPaperById } from "@/services/course-design.api";
import { Class } from "@/types/academics/class";
import { AcademicYear } from "@/types/academics/academic-year";

interface PaperEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Paper) => void;
  isLoading?: boolean;
  subjects: Subject[];
  affiliations: Affiliation[];
  regulationTypes: RegulationType[];
  subjectTypes: SubjectType[];
  examComponents: ExamComponent[];
  academicYears: AcademicYear[];
  courses: Course[];
  classes: Class[];
  givenPaper: Paper,
  paperId?: number; // New prop for paper ID
}

export const PaperEditModal: React.FC<PaperEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  subjects,
  affiliations,
  regulationTypes,
  subjectTypes,
  examComponents,
  academicYears,
  courses,
  classes,
  givenPaper,
  paperId,
}) => {
  const [components, setComponents] = useState<PaperComponent[]>([]);
  // const [formKey, setFormKey] = useState(0); // Add key to force form reset when needed
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);
  const [paperData, setPaperData] = useState<Paper | null>(givenPaper);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Paper>({
    // resolver: zodResolver(paperEditSchema),
    defaultValues: givenPaper,
  });

  const fetchPaperDetails = useCallback(async () => {
    if (!paperId) return;

    setIsLoadingPaper(true);
    try {
      const response = await getPaperById(paperId);
      const paper = response.data.payload;

      if (paper) {
        setPaperData(paper);
      }
    } catch (error) {
      console.error("Error fetching paper details:", error);
      toast.error("Failed to fetch paper details");
    } finally {
      setIsLoadingPaper(false);
    }
  }, [paperId]);

  // Fetch paper details when modal opens with paperId
  useEffect(() => {
    if (isOpen && paperId) {
      fetchPaperDetails();
    } else if (isOpen && !paperId) {
      // Initialize with default values for new paper
      const defaultFormData = {
        paperName: "",
        subjectId: 0,
        affiliationId: 0,
        regulationTypeId: 0,
        academicYearId: 0,
        courseId: 0,
        subjectTypeId: 0,
        semester: classes.length > 0 ? classes[0].name : "",
        paperCode: "",
        isOptional: false,
        isActive: true,
        components: examComponents.map((component) => ({
          examComponentId: component.id!,
          fullMarks: 0,
          credit: 0,
        })),
      };
      reset(defaultFormData);
      setComponents(
        examComponents.map((component) => ({
          examComponent: component,
          fullMarks: 0,
          credit: 0,
          paperId: paperId!,
        })),
      );
      setPaperData(null);
    }
  }, [isOpen, paperId, examComponents, classes, fetchPaperDetails, reset]);

  const addComponent = useCallback(() => {
    // Get already selected component IDs
    const selectedComponentIds = components.map((comp) => comp.examComponent.id);

    // Find available components (not already selected)
    const availableComponents = examComponents.filter((ec) => !selectedComponentIds.includes(ec.id!));

    if (availableComponents.length > 0) {
      const newComponent: PaperComponent = {
        examComponent: availableComponents[0],
        paperId: paperId!, // This will be set when the paper is created
        fullMarks: 0,
        credit: 0,
      };
      const updatedComponents = [...components, newComponent];
      setComponents(updatedComponents);
      setValue("components", updatedComponents);
    } else {
      toast.error("All exam components have already been added");
    }
  }, [components, examComponents, setValue, paperId]);

  const removeComponent = useCallback(
    (index: number) => {
      const updatedComponents = components.filter((_, i) => i !== index);
      setComponents(updatedComponents);
      setValue("components", updatedComponents);
    },
    [components, setValue],
  );

  const updateComponent = useCallback(
    (index: number, field: keyof PaperComponent, value: unknown) => {
      const updatedComponents = components.map((component, i) =>
        i === index ? { ...component, [field]: value } : component,
      );
      setComponents(updatedComponents);
      setValue("components", updatedComponents);
    },
    [components, setValue],
  );

  const handleClose = useCallback(() => {
    reset();
    setComponents([]);
    onClose();
  }, [reset, onClose]);

  const handleFormSubmit = async (data: Paper) => {
    try {
      console.log("Submitting paper edit data:", data);
      console.log("Data being sent to backend:", data);
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting paper edit:", error);
      toast.error("Failed to save paper changes");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-6xl h-[95vh] overflow-hidden flex flex-col">
        {/* Header with Paper Name */}
        <div className="flex items-center p-3 justify-between border-b">
          <div className="flex-1">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="paperName"
                  placeholder="Enter paper name"
                  className="mt-1 text-lg font-semibold w-1/2"
                  autoFocus
                  disabled={isLoadingPaper}
                />
              )}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isOptional"
                checked={watch("isOptional")}
                onCheckedChange={(checked) => setValue("isOptional", checked as boolean)}
                disabled={isLoadingPaper}
              />
              <Label htmlFor="isOptional" className="text-sm">
                Optional Paper
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={watch("disabled") ? false : true}
                onCheckedChange={(checked) => setValue("disabled", checked as boolean)}
                disabled={isLoadingPaper}
              />
              <Label htmlFor="isActive" className="text-sm">
                Active
              </Label>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0" disabled={isLoadingPaper}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingPaper && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading paper details...</p>
            </div>
          </div>
        )}

        {/* Content - Two Columns with Adjusted Widths */}
        {!isLoadingPaper && (
          <div className="flex-1 flex p-6 w-full">
            <div className="flex gap-6 w-full">
              {/* Left Column - Smaller Width - Fixed */}
              <div className="space-y-4 w-[25%] pr-6 border-r">
                <div className="w-full">
                  <Label htmlFor="subjectId">Subject</Label>
                  <Controller
                    name="subjectId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id!.toString()}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.subjectId && <p className="text-red-500 text-sm mt-1">{errors.subjectId.message}</p>}
                </div>

                <div>
                  <Label htmlFor="affiliationId">Affiliation</Label>
                  <Controller
                    name="affiliationId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select affiliation" />
                        </SelectTrigger>
                        <SelectContent>
                          {affiliations.map((affiliation) => (
                            <SelectItem key={affiliation.id} value={affiliation.id!.toString()}>
                              {affiliation.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.affiliationId && <p className="text-red-500 text-sm mt-1">{errors.affiliationId.message}</p>}
                </div>

                <div>
                  <Label htmlFor="regulationTypeId">Regulation Type</Label>
                  <Controller
                    name="regulationTypeId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select regulation type" />
                        </SelectTrigger>
                        <SelectContent>
                          {regulationTypes.map((regulationType) => (
                            <SelectItem key={regulationType.id} value={regulationType.id!.toString()}>
                              {regulationType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.regulationTypeId && (
                    <p className="text-red-500 text-sm mt-1">{errors.regulationTypeId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="academicYearId">Academic Year</Label>
                  <Controller
                    name="academicYearId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((academicYear) => (
                            <SelectItem key={academicYear.id} value={academicYear.id!.toString()}>
                              {academicYear.year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.academicYearId && (
                    <p className="text-red-500 text-sm mt-1">{errors.academicYearId.message}</p>
                  )}
                </div>
              </div>

              {/* Right Column - Larger Width with Paper Components - Scrollable */}
              <div className="col-span-2 overflow-y-auto pr-2 w-[75%]">
                <div className="space-y-6">
                  {/* Paper Details */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="courseId">Course</Label>
                      <Controller
                        name="courseId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value !== undefined && field.value !== null ? field.value.toString() : ""}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id!.toString()}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="subjectTypeId">Subject Type</Label>
                      <Controller
                        name="subjectTypeId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value !== undefined && field.value !== null ? field.value.toString() : ""}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select subject type" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjectTypes.map((subjectType) => (
                                <SelectItem key={subjectType.id} value={subjectType.id!.toString()}>
                                  {subjectType.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.subjectTypeId && (
                        <p className="text-red-500 text-sm mt-1">{errors.subjectTypeId.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="semester">Semester</Label>
                      <Controller
                        name="classId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value?.toString()} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes
                                .filter((cls) => cls.type === "SEMESTER")
                                .map((cls) => (
                                  <SelectItem key={cls.id} value={cls.name}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.classId && <p className="text-red-500 text-sm mt-1">{errors.classId.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="paperCode">Paper Code</Label>
                      <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} id="code" placeholder="Enter paper code" className="mt-1" />
                        )}
                      />
                      {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
                    </div>
                  </div>

                  {/* Paper Components Table */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Paper Components</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addComponent}
                        disabled={components.length >= examComponents.length}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Component
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-gray-50 sticky top-0">
                            <TableRow>
                              <TableHead className="w-[40%]">Component</TableHead>
                              <TableHead className="w-[25%]">Marks</TableHead>
                              <TableHead className="w-[25%]">Credit</TableHead>
                              <TableHead className="w-[10%]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {components.map((component, index) => {
                              // Get available components for this dropdown (exclude current selection and other selected components)
                              const otherSelectedIds = components
                                .map((comp, i) => (i !== index ? comp.examComponent.id : null))
                                .filter((id) => id !== null);

                              const availableComponents = examComponents.filter(
                                (ec) => ec.id === component.examComponent.id || !otherSelectedIds.includes(ec.id!),
                              );

                              return (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell>
                                    <Select
                                      value={component.examComponent.id!.toString()}
                                      onValueChange={(value) =>
                                        updateComponent(index, "examComponent", Number(value))
                                      }
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select component" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableComponents.map((ec) => (
                                          <SelectItem key={ec.id} value={ec.id!.toString()}>
                                            {ec.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={component.fullMarks ?? 0}
                                      onChange={(e) => updateComponent(index, "fullMarks", Number(e.target.value))}
                                      placeholder="0"
                                      className="w-20"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={component.credit ?? 0}
                                      onChange={(e) => updateComponent(index, "credit", Number(e.target.value))}
                                      placeholder="0"
                                      className="w-20"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeComponent(index)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Action Buttons */}
        {!isLoadingPaper && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "Saving..." : paperData ? "Update Paper" : "Create Paper"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
