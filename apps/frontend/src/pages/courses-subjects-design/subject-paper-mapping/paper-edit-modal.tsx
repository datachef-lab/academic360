import React, { useState, useEffect, useCallback } from "react";
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
  // State for all fields
  const [form, setForm] = useState<Partial<Paper>>({});
  const [components, setComponents] = useState<PaperComponent[]>([]);
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);

  // Single useEffect to handle both editing and creating
  useEffect(() => {
    if (isOpen) {
      if (paperId) {
        // Fetch paper details for editing
        setIsLoadingPaper(true);
        getPaperById(paperId)
          .then((res) => {
            console.log("paper in paper-edit fetch", res);
            const paperData = res.data.payload;
            if (paperData) {
              setForm(paperData);
              setComponents(paperData.components || []);
            }
          })
          .catch((error) => {
            console.error("Error fetching paper:", error);
            toast.error("Failed to fetch paper details");
          })
          .finally(() => {
            setIsLoadingPaper(false);
          });
      } else if (givenPaper && givenPaper.id) {
        // Use givenPaper if provided
        setForm({ ...givenPaper });
        setComponents(givenPaper.components || []);
      } else {
        // Initialize with default values for new paper
        setForm({
          name: "",
          subjectId: undefined,
          affiliationId: undefined,
          regulationTypeId: undefined,
          academicYearId: undefined,
          courseId: undefined,
          subjectTypeId: undefined,
          classId: undefined,
          code: "",
          isOptional: false,
          disabled: false,
        });
        setComponents(
          examComponents.map((component) => ({
            examComponent: component,
            fullMarks: 0,
            credit: 0,
            paperId: 0, // Default to 0 for new papers
          }))
        );
      }
    }
  }, [isOpen, paperId, givenPaper, examComponents]);

  // Handlers for each field
  const handleChange = (field: keyof Paper, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Component handlers
  const addComponent = useCallback(() => {
    const selectedComponentIds = components.map((comp) => comp.examComponent.id);
    const availableComponents = examComponents.filter((ec) => !selectedComponentIds.includes(ec.id!));
    if (availableComponents.length > 0) {
      const newComponent: PaperComponent = {
        examComponent: availableComponents[0],
        paperId: form.id || 0,
        fullMarks: 0,
        credit: 0,
      };
      setComponents((prev) => [...prev, newComponent]);
    } else {
      toast.error("All exam components have already been added");
    }
  }, [components, examComponents, form.id]);

  const removeComponent = useCallback((index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateComponent = useCallback((index: number, field: keyof PaperComponent, value: string | number) => {
    setComponents((prev) =>
      prev.map((comp, i) => (i === index ? { ...comp, [field]: value } : comp))
    );
  }, []);

  const handleClose = useCallback(() => {
    setForm({});
    setComponents([]);
    onClose();
  }, [onClose]);

  const handleFormSubmit = async () => {
    try {
      const data: Paper = {
        ...form,
        components,
      } as Paper;
      await onSubmit(data);
      handleClose();
    } catch {
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
            <Input
              id="paperName"
              placeholder="Enter paper name"
              className="mt-1 text-lg font-semibold w-1/2"
              autoFocus={true}
              disabled={isLoadingPaper}
              value={form.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isOptional"
                checked={!!form.isOptional}
                onCheckedChange={(checked) => handleChange("isOptional", checked as boolean)}
                disabled={isLoadingPaper}
              />
              <Label htmlFor="isOptional" className="text-sm">
                Optional Paper
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={!form.disabled}
                onCheckedChange={(checked) => handleChange("disabled", !checked)}
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

        {/* Content - Two Columns with Adjusted Widths */}
        <div className="flex-1 flex p-6 w-full">
          <div className="flex gap-6 w-full">
            {/* Left Column - Smaller Width - Fixed */}
            <div className="space-y-4 w-[25%] pr-6 border-r">
              <div className="w-full">
                <Label htmlFor="subjectId">Subject</Label>
                <Select
                  value={form.subjectId?.toString() || ""}
                  onValueChange={(value) => handleChange("subjectId", Number(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id?.toString() || ""}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="affiliationId">Affiliation</Label>
                <Select
                  value={form.affiliationId?.toString() || ""}
                  onValueChange={(value) => handleChange("affiliationId", Number(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select affiliation" />
                  </SelectTrigger>
                  <SelectContent>
                    {affiliations.map((affiliation) => (
                      <SelectItem key={affiliation.id} value={affiliation.id?.toString() || ""}>
                        {affiliation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="regulationTypeId">Regulation Type</Label>
                <Select
                  value={form.regulationTypeId?.toString() || ""}
                  onValueChange={(value) => handleChange("regulationTypeId", Number(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select regulation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {regulationTypes.map((regulationType) => (
                      <SelectItem key={regulationType.id} value={regulationType.id?.toString() || ""}>
                        {regulationType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academicYearId">Academic Year</Label>
                <Select
                  value={form.academicYearId?.toString() || ""}
                  onValueChange={(value) => handleChange("academicYearId", Number(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((academicYear) => (
                      <SelectItem key={academicYear.id} value={academicYear.id?.toString() || ""}>
                        {academicYear.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column - Larger Width with Paper Components - Scrollable */}
            <div className="col-span-2 overflow-y-auto pr-2 w-[75%]">
              <div className="space-y-6">
                {/* Paper Details */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="courseId">Course</Label>
                    <Select
                      value={form.courseId !== undefined && form.courseId !== null ? form.courseId.toString() : ""}
                      onValueChange={(value) => handleChange("courseId", Number(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id?.toString() || ""}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subjectTypeId">Subject Type</Label>
                    <Select
                      value={form.subjectTypeId !== undefined && form.subjectTypeId !== null ? form.subjectTypeId.toString() : ""}
                      onValueChange={(value) => handleChange("subjectTypeId", Number(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select subject type" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectTypes.map((subjectType) => (
                          <SelectItem key={subjectType.id} value={subjectType.id?.toString() || ""}>
                            {subjectType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={form.classId?.toString() || ""}
                      onValueChange={(value) => handleChange("classId", Number(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes
                          .filter((cls) => cls.type === "SEMESTER")
                          .map((cls) => (
                            <SelectItem key={cls.id} value={cls.id?.toString() || ""}>
                              {cls.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paperCode">Paper Code</Label>
                    <Input
                      id="code"
                      placeholder="Enter paper code"
                      className="mt-1"
                      value={form.code || ""}
                      onChange={(e) => handleChange("code", e.target.value)}
                    />
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
                            const otherSelectedIds = components
                              .map((comp, i) => (i !== index ? comp.examComponent?.id : null))
                              .filter((id) => id !== null);
                            const availableComponents = examComponents.filter(
                              (ec) => ec.id === component.examComponent?.id || !otherSelectedIds.includes(ec.id!)
                            );
                            return (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell>
                                  <Select
                                    value={component.examComponent?.id ? component.examComponent.id.toString() : ""}
                                    onValueChange={(value) => updateComponent(index, "examComponent", examComponents.find(ec => ec.id === Number(value)))}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select component" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableComponents.map((ec) => (
                                        <SelectItem key={ec.id} value={ec.id?.toString() || ""}>
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

        {/* Footer with Action Buttons */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleFormSubmit}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Saving..." : form.id ? "Update Paper" : "Create Paper"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
