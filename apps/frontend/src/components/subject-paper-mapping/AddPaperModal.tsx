import { Class } from "@/types/academics/class";
import { Affiliation, Course, ExamComponent, Paper, RegulationType, Subject, SubjectType } from "@/types/course-design";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { createPaper } from "@/services/course-design.api";
import { AcademicYear } from "@/types/academics/academic-year";
import { MultiSelect } from "@/components/ui/AdvancedMultiSelect";

interface AddModalProps {
  fetchData: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  dropdownData: {
    subjects: Subject[];
    affiliations: Affiliation[];
    regulationTypes: RegulationType[];
    subjectTypes: SubjectType[];
    examComponents: ExamComponent[];
    academicYears: AcademicYear[];
    courses: Course[];
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
    academicYears,
    courses,
    classes,
  },
}: AddModalProps) {
  const [defaultPaper] = useState<Paper>({
    name: "",
    subjectId: 0, // No default value
    affiliationId: 0, // No default value
    regulationTypeId: 0, // No default value
    subjectTypeId: 0, // No default value
    academicYearId: 0, // No default value
    courseId: 0, // No default value
    classIds: [], // Allow multiple semesters/classes
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
  const [papers, setPapers] = useState<Paper[]>([defaultPaper]);

  const handleAddPaper = () => {
    setPapers((prevPapers) => [...prevPapers, { ...defaultPaper }]);
  };

  const removePaper = (removeIndex: number) => {
    if (papers.length > 1) {
      setPapers(papers.filter((_, i) => i !== removeIndex));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting papers:", papers);
    const formattedPapers = [];
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      if (
        !paper.subjectTypeId ||
        !paper.courseId ||
        !paper.classIds || paper.classIds.length === 0 ||
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
        .filter((comp) => comp !== undefined);

      formattedPapers.push({ ...paper, components: components });
    }

    try {
      const response = await createPaper(formattedPapers);
      console.log("create papers response:", response);
      toast.success("Papers saved successfully");
    } catch (error) {
      console.log(error);
      toast.error("Papers doesn't saved");
    } finally {
      setPapers([defaultPaper]); // Reset to default paper after submission
      fetchData();
    }

    // onCancel();
  };

  const update = (index: number, newData: Paper) => {
    setPapers((prevPapers) => {
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
    setPapers((prevPapers) => {
      const updatedPapers = [...prevPapers];
      const updatedComponents = [...updatedPapers[paperIndex].components];
      if (updatedComponents[componentIndex]) {
        updatedComponents[componentIndex] = {
          ...updatedComponents[componentIndex],
          [field]: value,
        };
      }
      updatedPapers[paperIndex] = {
        ...updatedPapers[paperIndex],
        components: updatedComponents,
      };
      return updatedPapers;
    });
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="flex mb-5 gap-2 items-center">
        <div className="flex w-[95%] gap-2 items-center">
          <Select
            value={papers[0].subjectId ? papers[0].subjectId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = papers.map((paper) => ({
                ...paper,
                subjectId: Number(value),
              }));
              setPapers(newPapers);
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
            value={papers[0].affiliationId ? papers[0].affiliationId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = papers.map((paper) => ({
                ...paper,
                affiliationId: Number(value),
              }));
              setPapers(newPapers);
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
            value={papers[0].regulationTypeId ? papers[0].regulationTypeId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = papers.map((paper) => ({
                ...paper,
                regulationTypeId: Number(value),
              }));
              setPapers(newPapers);
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
            value={papers[0].academicYearId ? papers[0].academicYearId.toString() : ""}
            onValueChange={(value) => {
              const newPapers = papers.map((paper) => ({
                ...paper,
                academicYearId: Number(value),
              }));
              setPapers(newPapers);
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
              !papers[0].subjectId || papers[0].subjectId === 0 ||
              !papers[0].affiliationId || papers[0].affiliationId === 0 ||
              !papers[0].regulationTypeId || papers[0].regulationTypeId === 0 ||
              !papers[0].academicYearId || papers[0].academicYearId === 0
            }
          >
            Add Paper
          </Button>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="h-[calc(100vh-269px)] overflow-y-auto border border-black rounded-none">
          <div className="sticky top-0 z-50 bg-white border-b border-black">
            <div className="flex border-b border-black bg-[#f3f4f6]">
              {[
                {
                  label: "Subject Type",
                  className: "w-32 p-2 border-r border-black font-medium flex items-center justify-center",
                },
                {
                  label: "Applicable Course",
                  className: "w-48 p-2 border-r border-black font-medium flex items-center justify-center",
                },
                {
                  label: "Semester",
                  className: "w-24 p-2 border-r border-black font-medium flex items-center justify-center",
                },
                {
                  label: "Paper Name",
                  className: "w-32 p-2 border-r border-black font-medium flex items-center justify-center",
                },
                {
                  label: "Paper Code",
                  className: "w-32 p-2 border-r border-black font-medium flex items-center justify-center",
                },
                {
                  label: "Is Optional",
                  className: "w-20 p-2 border-r border-black font-medium flex items-center justify-center",
                },
                {
                  label: "Paper Component & Marks",
                  className: "flex-1 p-2 border-r border-black font-medium flex items-center justify-center",
                },
                { label: "Actions", className: "w-20 p-2 font-medium flex items-center justify-center" },
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
                      className="flex-1 p-1 text-center font-medium text-sm border-r border-black flex items-center justify-center"
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
                      <div className="flex-1 font-medium p-1 text-center border-r border-black flex items-center justify-center">
                        Marks
                      </div>
                      <div className="flex-1 font-medium p-1 text-center border-r border-black flex items-center justify-center">
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
            {papers.map((field, paperIndex) => (
              <div key={field.id} className="flex border-b border-black hover:bg-gray-50">
                <div className="w-32 p-2 border-r border-black flex items-center justify-center">
                  <Select
                    value={field.subjectTypeId ? field.subjectTypeId.toString() : ""}
                    onValueChange={(value) => {
                      update(paperIndex, { ...field, subjectTypeId: Number(value) });
                    }}
                  >
                    <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
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
                  <Select
                    value={field.courseId ? field.courseId.toString() : ""}
                    onValueChange={(value) => {
                      update(paperIndex, { ...field, courseId: Number(value) });
                    }}
                  >
                    <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id!.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24 max-w-[120px] p-2 border-r border-black flex items-center justify-center overflow-hidden">
                  <MultiSelect
                    options={classes.map((classItem) => ({
                      label: classItem.name,
                      value: classItem.id?.toString() || "",
                    }))}
                    value={field.classIds ? field.classIds.map(String) : []}
                    onValueChange={(selected: string[]) => {
                      update(paperIndex, {
                        ...field,
                        classIds: selected.map(Number),
                      });
                    }}
                    placeholder="Select Semester"
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
                    className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none whitespace-pre-wrap break-words"
                    style={{ minHeight: '2rem', maxHeight: '6rem', overflow: 'auto' }}
                  />
                </div>

                <div className="w-32 p-2 border-r border-black flex items-center justify-center">
                  <Input
                    value={field.code ?? ""}
                    onChange={(e) => {
                      update(paperIndex, { ...field, code: e.target.value });
                    }}
                    placeholder="Paper Code"
                    className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                              className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                              className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="w-20 p-2 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaper(paperIndex)}
                    // disabled={fields.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* {errors.papers && errors.papers.message && (
        <p className="text-sm text-red-500">{errors.papers.message}</p>
      )} */}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading || papers.length === 0}>
          {isLoading ? "Saving..." : "Save Mapping"}
        </Button>
      </div>
    </form>
  );
}
