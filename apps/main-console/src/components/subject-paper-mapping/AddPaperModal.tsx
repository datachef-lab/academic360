import { Class } from "@/types/academics/class";
import {
  Affiliation,
  Course,
  ExamComponent,
  Paper,
  ProgramCourse,
  RegulationType,
  Subject,
  SubjectType,
} from "@/types/course-design";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Trash2, Eye } from "lucide-react";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { createPaper } from "@/services/course-design.api";
import { AcademicYear } from "@/types/academics/academic-year";
import { MultiSelect } from "@/components/ui/AdvancedMultiSelect";
import { CourseType } from "@/schemas";
interface InputPaper extends Omit<Paper, "programCourseId" | "classId"> {
  programCourses: number[];
  classes: number[];
}

interface AddModalProps {
  fetchData: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  dropdownData: {
    subjects: Subject[];
    affiliations: Affiliation[];
    regulationTypes: RegulationType[];
    subjectTypes: SubjectType[];
    courses: Course[];
    courseTypes: CourseType[];
    examComponents: ExamComponent[];
    academicYears: AcademicYear[];
    programCourses: ProgramCourse[];
    classes: Class[];
  };
}

export default function AddPaperModal({
  fetchData,
  onCancel,
  isLoading,
  dropdownData: {
    subjects,
    affiliations,
    regulationTypes,
    subjectTypes,
    examComponents,
    courses,
    academicYears,
    programCourses,
    classes,
    courseTypes,
  },
}: AddModalProps) {
  const [defaultPaper] = useState<Paper>({
    name: "",
    subjectId: 0, // No default value
    affiliationId: 0, // No default value
    regulationTypeId: 0, // No default value
    subjectTypeId: 0, // No default value
    academicYearId: 0, // No default value
    programCourseId: 0, // No default value
    classId: 0, // Allow multiple semesters/classes
    components: examComponents.map((examComponent) => ({
      paperId: 0, // This will be set when the paper is created
      examComponent,
      fullMarks: null,
      credit: null,
    })),
    code: "",
    isOptional: false,
    sequence: null,
    disabled: false,
    topics: [],
  });
  const setPapers = useState<Paper[]>([defaultPaper])[1];
  const [inputPaper, setInputPaper] = useState<InputPaper[]>([
    {
      name: "",
      subjectId: 0, // No default value
      affiliationId: 0, // No default value
      regulationTypeId: 0, // No default value
      subjectTypeId: 0, // No default value
      academicYearId: 0, // No default value
      programCourses: [], // No default value
      classes: [], // Allow multiple semesters/classes
      components: examComponents.map((examComponent) => ({
        paperId: 0, // This will be set when the paper is created
        examComponent,
        fullMarks: null,
        credit: null,
      })),
      code: "",
      isOptional: false,
      sequence: null,
      disabled: false,
      topics: [],
    },
  ]);

  // New state for showing selected items
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Set the last row as active by default when inputPaper changes
  React.useEffect(() => {
    if (inputPaper.length > 1) {
      setSelectedRowIndex(inputPaper.length - 1);
    }
  }, [inputPaper.length]);

  const handleAddPaper = () => {
    const base = inputPaper[0];
    setInputPaper((prevPapers) => [
      ...prevPapers,
      {
        name: "",
        subjectId: base?.subjectId ?? 0,
        affiliationId: base?.affiliationId ?? 0,
        regulationTypeId: base?.regulationTypeId ?? 0,
        subjectTypeId: 0,
        academicYearId: base?.academicYearId ?? 0,
        programCourses: [],
        classes: [],
        components: examComponents.map((examComponent) => ({
          paperId: 0, // This will be set when the paper is created
          examComponent,
          fullMarks: 0,
          credit: 0,
        })),
        code: "",
        isOptional: false,
        sequence: null,
        disabled: false,
        topics: [],
      },
    ]);
  };

  const removePaper = (removeIndex: number) => {
    if (inputPaper.length > 1) {
      setInputPaper((prevPapers) => prevPapers.filter((_, i) => i !== removeIndex));
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    toast.success("Data saved successfully. Click Confirm to submit.");
  };

  const handleEyeClick = (rowIndex: number) => {
    setSelectedRowIndex(selectedRowIndex === rowIndex ? null : rowIndex);
  };

  const getProgramCourseName = (programCourseId: number) => {
    const programCourse = programCourses.find((pc) => pc.id === programCourseId);
    if (!programCourse) return "Unknown Course";
    const course = courses.find((c) => c.id === programCourse.courseId);
    return course ? course.name : "Unknown Course";
  };

  const getClassName = (classId: number) => {
    const classItem = classes.find((c) => c.id === classId);
    return classItem ? classItem.name : "Unknown Class";
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const papers: Paper[] = [];
    console.log(papers);
    for (const paper of inputPaper) {
      for (const programCourseId of paper.programCourses) {
        for (const classId of paper.classes) {
          const { programCourses, classes, ...rest } = paper;
          console.log(classes, programCourses);
          papers.push({
            ...rest,
            programCourseId: programCourseId,
            classId: classId,
          });
        }
      }
    }
    console.log("Papers:", papers);

    const formattedPapers: Paper[] = [];
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i]!;
      if (
        !paper.subjectTypeId ||
        !paper.programCourseId ||
        !paper.classId ||
        paper.classId === 0 ||
        !paper.name ||
        paper.name?.trim() === "" ||
        !paper.code ||
        paper.code.trim() === ""
      ) {
        toast.error(`Please fill in all required fields for paper ${i + 1}`);
        return;
      }

      const components = paper.components
        .map((comp) => {
          if (comp.fullMarks !== null || comp.fullMarks != 0 || comp.credit !== null || comp.credit != 0) {
            return comp;
          }
        })
        .filter((comp): comp is (typeof paper.components)[number] => comp !== undefined);

      formattedPapers.push({ ...paper, components: components as typeof paper.components });
    }

    try {
      const response = await createPaper(formattedPapers as Paper[]);
      console.log("create papers response:", response);
      toast.success("Papers saved successfully");
      onCancel(); // Close the modal after successful submission
    } catch (error) {
      console.log(error);
      toast.error("Papers doesn't saved");
    } finally {
      setPapers([defaultPaper]); // Reset to default paper after submission
      fetchData();
    }
  };

  const update = (index: number, newData: InputPaper) => {
    setInputPaper((prevPapers) => {
      const updatedPapers = [...prevPapers];
      updatedPapers[index] = newData;
      return updatedPapers;
    });
  };

  const updatePaperComponent = (
    paperIndex: number,
    componentIndex: number,
    field: "fullMarks" | "credit",
    value: number,
  ) => {
    setInputPaper((prevPapers) => {
      const existingPaper = prevPapers[paperIndex];
      if (!existingPaper) return prevPapers;

      const baseComponents = existingPaper.components ?? [];
      if (!baseComponents[componentIndex]) return prevPapers;

      const updatedComponents = [...baseComponents];
      const prevComponent = updatedComponents[componentIndex]!;
      updatedComponents[componentIndex] = {
        ...prevComponent,
        paperId: prevComponent.paperId ?? 0,
        examComponent: prevComponent.examComponent!,
        [field]: value,
      };

      const updatedPaper: InputPaper = {
        ...existingPaper,
        components: updatedComponents,
        programCourses: existingPaper.programCourses ?? [],
        classes: existingPaper.classes ?? [],
      };

      const updatedPapers = [...prevPapers];
      updatedPapers[paperIndex] = updatedPaper;
      return updatedPapers;
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="h-[80vh] flex flex-col">
      <div className="flex mb-5 gap-2 items-center">
        <div className="flex w-[95%] gap-2 items-center">
          <Select
            value={inputPaper[0]?.subjectId ? inputPaper[0].subjectId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = inputPaper.map((paper) => ({
                ...paper,
                subjectId: Number(value),
              }));
              setInputPaper(newPapers);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id!.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={inputPaper[0]?.affiliationId ? inputPaper[0].affiliationId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = inputPaper.map((paper) => ({
                ...paper,
                affiliationId: Number(value),
              }));
              setInputPaper(newPapers);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Affiliation" />
            </SelectTrigger>
            <SelectContent>
              {affiliations.map((affiliation) => (
                <SelectItem key={affiliation.id} value={affiliation.id!.toString()}>
                  {affiliation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={inputPaper[0]?.regulationTypeId ? inputPaper[0].regulationTypeId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = inputPaper.map((paper) => ({
                ...paper,
                regulationTypeId: Number(value),
              }));
              setInputPaper(newPapers);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Regulations" />
            </SelectTrigger>
            <SelectContent>
              {regulationTypes.map((regulationType) => (
                <SelectItem key={regulationType.id} value={regulationType.id!.toString()}>
                  {regulationType.name} ({regulationType.shortName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={inputPaper[0]?.academicYearId ? inputPaper[0].academicYearId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = inputPaper.map((paper) => ({
                ...paper,
                academicYearId: Number(value),
              }));
              setInputPaper(newPapers);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((academicYear) => (
                <SelectItem key={academicYear.id} value={academicYear.id!.toString()}>
                  {academicYear.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="ml-2"
            onClick={handleAddPaper}
            disabled={
              !inputPaper[0]?.subjectId ||
              inputPaper[0].subjectId === 0 ||
              !inputPaper[0]?.affiliationId ||
              inputPaper[0]?.affiliationId === 0 ||
              !inputPaper[0]?.regulationTypeId ||
              inputPaper[0]?.regulationTypeId === 0 ||
              !inputPaper[0]?.academicYearId ||
              inputPaper[0]?.academicYearId === 0
            }
          >
            Add Paper
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-[500px] overflow-y-auto border border-black rounded-none">
          <div className="sticky top-0 z-50 bg-white border-b border-black">
            <div className="flex border-b border-black bg-[#f3f4f6]">
              {[
                {
                  label: "Subject Type",
                  className: "w-32 p-2 border-r border-black font-medium flex items-center justify-center text-sm",
                },
                {
                  label: "Applicable Program Course",
                  className: "w-48 p-2 border-r border-black font-medium flex items-center justify-center text-sm",
                },
                {
                  label: "Semester",
                  className: "w-24 p-2 border-r border-black font-medium flex items-center justify-center text-sm",
                },
                {
                  label: "Paper Name",
                  className: "w-32 p-2 border-r border-black font-medium flex items-center justify-center text-sm",
                },
                {
                  label: "Paper Code",
                  className: "w-32 p-2 border-r border-black font-medium flex items-center justify-center text-sm",
                },
                {
                  label: "Is Optional",
                  className: "w-20 p-2 border-r border-black font-medium flex items-center justify-center text-sm",
                },
                {
                  label: "Paper Component & Marks",
                  className: "flex-1 p-2 border-r border-black font-medium flex items-center justify-center text-sm",
                },
                { label: "Actions", className: "w-20 p-2 font-medium flex items-center justify-center text-sm" },
              ].map((header) => (
                <div key={header.label} className={`${header.className}`}>
                  {header.label}
                </div>
              ))}
              {/* <div className="w-20 p-2 font-medium flex items-center justify-center">Actions</div> */}
            </div>

            <div className="flex border-b border-black bg-[#f3f4f6]">
              <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-48 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-24 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-20 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="flex-1 border-r border-black">
                <div className="flex">
                  {examComponents.map((component) => (
                    <div
                      key={component.id}
                      className="flex-1 p-2 text-center font-medium text-sm border-r border-black flex items-center justify-center"
                    >
                      {component.code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-20 flex items-center justify-center bg-[#f3f4f6]"></div>
            </div>

            <div className="flex border-b border-black bg-[#f3f4f6]">
              <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-48 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-24 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="w-20 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
              <div className="flex-1 border-r border-black">
                <div className="flex">
                  {examComponents.map((component) => (
                    <React.Fragment key={component.id}>
                      <div className="flex-1 font-medium p-2 text-center border-r border-black flex items-center justify-center text-sm">
                        Marks
                      </div>
                      <div className="flex-1 font-medium p-2 text-center border-r border-black flex items-center justify-center text-sm">
                        Credit
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="w-20 flex items-center justify-center bg-[#f3f4f6]"></div>
            </div>
          </div>

          <div className="bg-white">
            {inputPaper.map((field, paperIndex) => (
              <div
                key={field.id}
                className={`flex border-b border-black hover:bg-gray-50 ${
                  selectedRowIndex === paperIndex ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="w-32 p-2 border-r border-black flex items-center justify-center">
                  <Select
                    value={field.subjectTypeId ? field.subjectTypeId.toString() : ""}
                    onValueChange={(value) => {
                      update(paperIndex, { ...field, subjectTypeId: Number(value) });
                    }}
                  >
                    <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectTypes.map((subjectType) => (
                        <SelectItem key={subjectType.id} value={subjectType.id!.toString()}>
                          {subjectType.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-48 p-2 border-r border-black">
                  <MultiSelect
                    options={
                      programCourses
                        .map(
                          (programCourseItem) =>
                            programCourseItem.regulationTypeId === field.regulationTypeId && {
                              label: `${courses.find((crs) => crs.id == programCourseItem.courseId)?.name} (${courseTypes.find((crs) => crs.id == programCourseItem.courseTypeId)?.shortName ?? "-"})`,
                              value: programCourseItem.id?.toString() || "",
                            },
                        )
                        .filter(Boolean) as { label: string; value: string }[]
                    }
                    defaultValue={field.programCourses.map((prog) => prog.toString())}
                    onValueChange={(selected: string[]) => {
                      const selectedCourses = selected.map(Number);
                      let updatedClasses = [...field.classes];

                      if (selectedCourses.length > 1 && field.classes.length > 1) {
                        toast.warning("Multiple courses selected. Restricting classes.");
                        updatedClasses = []; // force one class
                      }

                      update(paperIndex, {
                        ...field,
                        programCourses: selectedCourses,
                        classes: updatedClasses,
                      });
                    }}
                    placeholder="Select Courses"
                    modalPopover={true}
                  />
                  {/* <Select
                    value={field.programCourseId ? field.programCourseId.toString() : ""}
                    onValueChange={(value) => {
                      update(paperIndex, { ...field, programCourseId: Number(value) });
                    }}
                  >
                    <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {programCourses.map((programCourse) => (
                        <SelectItem key={programCourse.id} value={programCourse.id!.toString()}>
                          {programCourse.courseId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                </div>

                <div className="w-24 p-2 border-r border-black flex items-center justify-center">
                  <MultiSelect
                    options={classes.map((classItem) => ({
                      label: classItem.name,
                      value: classItem.id?.toString() || "",
                    }))}
                    defaultValue={field.classes.map((cls) => cls.toString())}
                    onValueChange={(selected: string[]) => {
                      const selectedClasses = selected.map(Number);
                      let updatedProgramCourses = [...field.programCourses];

                      if (selectedClasses.length > 1 && field.programCourses.length > 1) {
                        toast.warning("Multiple classes selected. Restricting courses.");
                        updatedProgramCourses = []; // force one course
                      }

                      update(paperIndex, {
                        ...field,
                        classes: selectedClasses,
                        programCourses: updatedProgramCourses,
                      });
                    }}
                    placeholder="Select Sems."
                    modalPopover={true}
                  />
                </div>

                <div className="w-32 p-2 border-r border-black flex items-center justify-center">
                  <textarea
                    value={field.name}
                    onChange={(e) => {
                      update(paperIndex, { ...field, name: e.target.value });
                    }}
                    placeholder="Paper Name"
                    rows={1}
                    className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none whitespace-pre-wrap break-words text-sm"
                    style={{ minHeight: "2rem", maxHeight: "6rem", overflow: "auto" }}
                  />
                </div>

                <div className="w-32 p-2 border-r border-black flex items-center justify-center">
                  <Input
                    value={field.code ?? ""}
                    onChange={(e) => {
                      update(paperIndex, { ...field, code: e.target.value });
                    }}
                    placeholder="Paper Code"
                    className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="w-20 p-2 border-r border-black flex items-center justify-center">
                  <Checkbox
                    checked={field.isOptional}
                    onCheckedChange={(checked) => {
                      update(paperIndex, { ...field, isOptional: checked as boolean });
                    }}
                  />
                </div>

                <div className="flex-1 border-r border-black">
                  <div className="flex h-full">
                    {examComponents.map((examComponent) => {
                      const component = field.components.find((c) => c.examComponent.id === examComponent.id);
                      const componentIndex = field.components.findIndex((c) => c.examComponent.id === examComponent.id);

                      const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          const numericValue = Number(value) || 0;
                          if (component?.fullMarks !== numericValue) {
                            updatePaperComponent(paperIndex, componentIndex, "fullMarks", numericValue);
                          }
                        }
                      };

                      const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          const numericValue = Number(value) || 0;
                          if (component?.credit !== numericValue) {
                            updatePaperComponent(paperIndex, componentIndex, "credit", numericValue);
                          }
                        }
                      };

                      return (
                        <div key={examComponent.id} className="flex h-full">
                          <div className="flex-1 p-1 border-r border-black h-full">
                            <Input
                              type="text"
                              value={component?.fullMarks || 0}
                              onChange={handleMarksChange}
                              placeholder="0"
                              className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div
                            className={`flex-1 p-1 border-r border-black h-full ${componentIndex === examComponents.length - 1 ? "border-r-0" : ""}`}
                          >
                            <Input
                              type="text"
                              value={component?.credit || 0}
                              onChange={handleCreditChange}
                              placeholder="0"
                              className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="w-20 p-2 flex items-center justify-center space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEyeClick(paperIndex)}
                    className={`h-8 w-8 p-0 ${
                      selectedRowIndex === paperIndex
                        ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        : "hover:bg-gray-100"
                    }`}
                    title="View selected courses and classes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaper(paperIndex)}
                    // disabled={fields.length <= 1}
                    className="h-8 w-8 p-0"
                    title="Remove paper"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Items Display */}
      {selectedRowIndex !== null && inputPaper[selectedRowIndex] && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Items for Row {selectedRowIndex + 1}:</h3>

          <div className="flex gap-6">
            {/* Program Courses */}
            {inputPaper[selectedRowIndex].programCourses.length > 0 && (
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-600 mb-1">Program Courses:</h4>
                <div className="flex flex-wrap gap-1">
                  {inputPaper[selectedRowIndex].programCourses.map((programCourseId) => (
                    <span
                      key={programCourseId}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {getProgramCourseName(programCourseId)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Classes/Semesters */}
            {inputPaper[selectedRowIndex].classes.length > 0 && (
              <div className="flex-1">
                <h4 className="text-xs font-medium text-gray-600 mb-1">Classes/Semesters:</h4>
                <div className="flex flex-wrap gap-1">
                  {inputPaper[selectedRowIndex].classes.map((classId) => (
                    <span
                      key={classId}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                      {getClassName(classId)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {inputPaper[selectedRowIndex].programCourses.length === 0 &&
            inputPaper[selectedRowIndex].classes.length === 0 && (
              <p className="text-sm text-gray-500">No courses or classes selected for this row.</p>
            )}
        </div>
      )}

      {/* {errors.papers && errors.papers.message && (
        <p className="text-sm text-red-500">{errors.papers.message}</p>
      )} */}

      <div className="flex justify-between pt-4">
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={handleSave} disabled={isLoading || inputPaper.length === 0}>
            Save
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={isLoading || inputPaper.length === 0 || !isSaved}
          >
            {isLoading ? "Submitting..." : "Confirm"}
          </Button>
        </div>
      </div>
    </form>
  );
}
