import React from "react";
// import { AxiosError } from "axios";
import { ProgramCourseForm } from "./program-course-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Library, Download, Upload, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type {
  ProgramCourse,
  Stream,
  Course,
  CourseType,
  CourseLevel,
  Affiliation,
  RegulationType,
} from "@repo/db/index";
import {
  getProgramCourses,
  createProgramCourse,
  updateProgramCourse,
  deleteProgramCourse,
  bulkUploadProgramCourses,
  getStreams,
  getCourses,
  getCourseTypes,
  getCourseLevels,
  getAffiliations,
  getRegulationTypes,
  BulkUploadResult,
  BulkUploadError,
  BulkUploadRow,
  DeleteResult,
} from "@/services/course-design.api";
import * as XLSX from "xlsx";

const ProgramCoursesPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedProgramCourse, setSelectedProgramCourse] = React.useState<ProgramCourse | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [programCourses, setProgramCourses] = React.useState<ProgramCourse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);

  // Lookup data state
  const [streams, setStreams] = React.useState<Stream[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [courseTypes, setCourseTypes] = React.useState<CourseType[]>([]);
  const [courseLevels, setCourseLevels] = React.useState<CourseLevel[]>([]);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);

  // Create lookup objects
  const streamsLookup: Record<number, string> = React.useMemo(() => {
    return streams.reduce(
      (acc, stream) => {
        if (stream.id) {
          acc[stream.id] = stream.name;
        }
        return acc;
      },
      {} as Record<number, string>,
    );
  }, [streams]);

  const coursesLookup: Record<number, string> = React.useMemo(() => {
    return courses.reduce(
      (acc, course) => {
        if (course.id) {
          acc[course.id] = course.name;
        }
        return acc;
      },
      {} as Record<number, string>,
    );
  }, [courses]);

  const courseTypesLookup: Record<number, string> = React.useMemo(() => {
    return courseTypes.reduce(
      (acc, courseType) => {
        if (courseType.id) {
          acc[courseType.id] = courseType.name;
        }
        return acc;
      },
      {} as Record<number, string>,
    );
  }, [courseTypes]);

  //   const courseTypeShortNamesLookup: Record<number, string> = React.useMemo(() => {
  //     return courseTypes.reduce(
  //       (acc, courseType) => {
  //         if (courseType.id) {
  //           acc[courseType.id] = courseType.shortName || courseType.name.charAt(0);
  //         }
  //         return acc;
  //       },
  //       {} as Record<number, string>,
  //     );
  //   }, [courseTypes]);

  const courseLevelsLookup: Record<number, string> = React.useMemo(() => {
    return courseLevels.reduce(
      (acc, courseLevel) => {
        if (courseLevel.id) {
          acc[courseLevel.id] = courseLevel.name;
        }
        return acc;
      },
      {} as Record<number, string>,
    );
  }, [courseLevels]);

  const affiliationsLookup: Record<number, string> = React.useMemo(() => {
    return affiliations.reduce(
      (acc, affiliation) => {
        if (affiliation.id) {
          acc[affiliation.id] = affiliation.name;
        }
        return acc;
      },
      {} as Record<number, string>,
    );
  }, [affiliations]);

  const regulationTypesLookup: Record<number, string> = React.useMemo(() => {
    return regulationTypes.reduce(
      (acc, regulationType) => {
        if (regulationType.id) {
          acc[regulationType.id] = regulationType.name;
        }
        return acc;
      },
      {} as Record<number, string>,
    );
  }, [regulationTypes]);

  React.useEffect(() => {
    fetchProgramCourses();
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      const [streamsData, coursesData, courseTypesData, courseLevelsData, affiliationsData, regulationTypesData] =
        await Promise.all([
          getStreams(),
          getCourses(),
          getCourseTypes(),
          getCourseLevels(),
          getAffiliations(),
          getRegulationTypes(),
        ]);

      setStreams((streamsData as Stream[]) || []);
      setCourses((coursesData as Course[]) || []);
      setCourseTypes((courseTypesData as CourseType[]) || []);
      setCourseLevels((courseLevelsData as CourseLevel[]) || []);
      setAffiliations((affiliationsData as Affiliation[]) || []);
      setRegulationTypes((regulationTypesData as RegulationType[]) || []);
    } catch {
      console.error("Error fetching lookup data");
    }
  };

  const fetchProgramCourses = async () => {
    setLoading(true);
    try {
      const res = await getProgramCourses();
      setProgramCourses(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch program courses";
      setError(errorMessage);
      toast.error("Failed to fetch program courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (programCourse: ProgramCourse): void => {
    setSelectedProgramCourse(programCourse);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      const result: DeleteResult = await deleteProgramCourse(id);
      if (result.success) {
        toast.success(result.message || "Program course deleted successfully");
        fetchProgramCourses();
      } else {
        const details = (result.records || [])
          .filter((r) => r.count > 0)
          .map((r) => `${r.type}: ${r.count}`)
          .join(", ");
        toast.error(`${result.message}${details ? ` — ${details}` : ""}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete program course: ${errorMessage}`);
    }
  };

  const handleAddNew = () => {
    setSelectedProgramCourse(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<ProgramCourse, "id" | "createdAt" | "updatedAt">) => {
    setIsFormSubmitting(true);
    try {
      if (selectedProgramCourse) {
        const updated = await updateProgramCourse(selectedProgramCourse.id!, data);
        // Some APIs return null on duplicate; handle that explicitly
        if (!updated) {
          toast.error(
            "Duplicate program course: same stream, course, type, level, affiliation, regulation, duration and semesters already exists.",
          );
          return;
        }
        toast.success("Program course updated successfully");
      } else {
        const created = await createProgramCourse(data);
        console.log("created", created);
        toast.success("Program course created successfully");
      }
      setIsFormOpen(false);
      fetchProgramCourses();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setTimeout(() => {
        toast.error(`Failed to ${selectedProgramCourse ? "update" : "create"} program course: ${errorMessage}`);
      }, 2000);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedProgramCourse(null);
  };

  const validateBulkUploadData = async (
    file: File,
  ): Promise<{
    isValid: boolean;
    errors: Array<{ message: string; row?: number }>;
    warnings: Array<{ message: string; row?: number }>;
  }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            resolve({ isValid: false, errors: [{ message: "No sheets found in workbook" }], warnings: [] });
            return;
          }
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) {
            resolve({ isValid: false, errors: [{ message: "Sheet not found in workbook" }], warnings: [] });
            return;
          }
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          const rowsArr = Array.isArray(rows) ? rows : [];
          const [header, ...dataRows] = rowsArr;
          console.log(header);
          if (!Array.isArray(dataRows)) {
            resolve({ isValid: false, errors: [{ message: "Invalid file format" }], warnings: [] });
            return;
          }

          const rowsArray: string[][] = dataRows as string[][];
          const errors: Array<{ message: string; row?: number }> = [];
          const warnings: Array<{ message: string; row?: number }> = [];

          // Create reverse lookup objects for validation
          const streamsByName = streams.reduce(
            (acc, stream) => {
              acc[stream.name.toLowerCase()] = stream;
              return acc;
            },
            {} as Record<string, Stream>,
          );

          const coursesByName = courses.reduce(
            (acc, course) => {
              acc[course.name.toLowerCase()] = course;
              return acc;
            },
            {} as Record<string, Course>,
          );

          const courseTypesByName = courseTypes.reduce(
            (acc, courseType) => {
              acc[courseType.name.toLowerCase()] = courseType;
              return acc;
            },
            {} as Record<string, CourseType>,
          );

          const courseLevelsByName = courseLevels.reduce(
            (acc, courseLevel) => {
              acc[courseLevel.name.toLowerCase()] = courseLevel;
              return acc;
            },
            {} as Record<string, CourseLevel>,
          );

          const affiliationsByName = affiliations.reduce(
            (acc, affiliation) => {
              acc[affiliation.name.toLowerCase()] = affiliation;
              return acc;
            },
            {} as Record<string, Affiliation>,
          );

          const regulationTypesByName = regulationTypes.reduce(
            (acc, regulationType) => {
              acc[regulationType.name.toLowerCase()] = regulationType;
              return acc;
            },
            {} as Record<string, RegulationType>,
          );

          for (let i = 0; i < rowsArray.length; i++) {
            const row = rowsArray[i];
            const [
              streamName,
              courseName,
              courseTypeName,
              courseLevelName,
              duration,
              totalSemesters,
              affiliationName,
              regulationTypeName,
            ] = row || [];

            if (
              !streamName ||
              !courseName ||
              !courseTypeName ||
              !courseLevelName ||
              !duration ||
              !totalSemesters ||
              !affiliationName ||
              !regulationTypeName
            ) {
              errors.push({ row: i + 2, message: "All required fields must be provided." });
              continue;
            }

            // Check if all names exist
            if (!streamsByName[streamName.toLowerCase()]) {
              errors.push({ row: i + 2, message: `Stream "${streamName}" not found in the system.` });
            }
            if (!coursesByName[courseName.toLowerCase()]) {
              errors.push({ row: i + 2, message: `Course "${courseName}" not found in the system.` });
            }
            if (!courseTypesByName[courseTypeName.toLowerCase()]) {
              errors.push({ row: i + 2, message: `Course Type "${courseTypeName}" not found in the system.` });
            }
            if (!courseLevelsByName[courseLevelName.toLowerCase()]) {
              errors.push({ row: i + 2, message: `Course Level "${courseLevelName}" not found in the system.` });
            }
            if (!affiliationsByName[affiliationName.toLowerCase()]) {
              errors.push({ row: i + 2, message: `Affiliation "${affiliationName}" not found in the system.` });
            }
            if (!regulationTypesByName[regulationTypeName.toLowerCase()]) {
              errors.push({ row: i + 2, message: `Regulation Type "${regulationTypeName}" not found in the system.` });
            }

            // Validate numeric fields
            if (isNaN(Number(duration)) || Number(duration) < 1) {
              errors.push({ row: i + 2, message: `Duration must be a positive number.` });
            }
            if (isNaN(Number(totalSemesters)) || Number(totalSemesters) < 1) {
              errors.push({ row: i + 2, message: `Total Semesters must be a positive number.` });
            }
          }

          resolve({ isValid: errors.length === 0, errors, warnings });
        } catch {
          resolve({ isValid: false, errors: [{ message: "Error reading file" }], warnings: [] });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;

    // First validate the data
    const validation = await validateBulkUploadData(bulkFile);

    if (!validation.isValid) {
      // Show validation errors
      const errorMessages = validation.errors.map((err) => `Row ${err.row}: ${err.message}`).join("\n");
      toast.error(`Validation failed:\n${errorMessages}`, {
        duration: 10000,
      });
      return;
    }

    setIsBulkUploading(true);
    try {
      const result = await bulkUploadProgramCourses(bulkFile);
      setBulkUploadResult(result);
      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} program courses`);
        fetchProgramCourses();
      }
      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} program courses failed to upload`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Bulk upload failed: ${errorMessage}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template data using names instead of IDs
    const templateData: Array<{
      Stream: string;
      Course: string;
      CourseType: string;
      CourseLevel: string;
      Duration: number;
      TotalSemesters: number;
      Affiliation: string;
      RegulationType: string;
      Disabled: boolean;
    }> = [];

    if (
      streams.length > 0 &&
      courses.length > 0 &&
      courseTypes.length > 0 &&
      courseLevels.length > 0 &&
      affiliations.length > 0 &&
      regulationTypes.length > 0
    ) {
      // Use first available names from each category
      templateData.push({
        Stream: streams[0]?.name || "Example Stream",
        Course: courses[0]?.name || "Example Course",
        CourseType: courseTypes[0]?.name || "Example Type",
        CourseLevel: courseLevels[0]?.name || "Example Level",
        Duration: 3,
        TotalSemesters: 6,
        Affiliation: affiliations[0]?.name || "Example Affiliation",
        RegulationType: regulationTypes[0]?.name || "Example Regulation",
        Disabled: true,
      });

      // Add a second example if we have multiple items
      if (
        streams.length > 1 &&
        courses.length > 1 &&
        courseTypes.length > 1 &&
        courseLevels.length > 1 &&
        affiliations.length > 1 &&
        regulationTypes.length > 1
      ) {
        templateData.push({
          Stream: streams[1]?.name || "Example Stream 2",
          Course: courses[1]?.name || "Example Course 2",
          CourseType: courseTypes[1]?.name || "Example Type 2",
          CourseLevel: courseLevels[1]?.name || "Example Level 2",
          Duration: 2,
          TotalSemesters: 4,
          Affiliation: affiliations[1]?.name || "Example Affiliation 2",
          RegulationType: regulationTypes[1]?.name || "Example Regulation 2",
          Disabled: true,
        });
      }
    } else {
      // Fallback to example values if no data is available
      templateData.push({
        Stream: "Science",
        Course: "B.Sc",
        CourseType: "Honours",
        CourseLevel: "UG",
        Duration: 3,
        TotalSemesters: 6,
        Affiliation: "University of Example",
        RegulationType: "CBCS",
        Disabled: true,
      });
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Program Courses Template");
    XLSX.writeFile(wb, "program-course-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getProgramCourses();
      const data = (Array.isArray(res) ? res : []).map((pc: ProgramCourse) => ({
        ID: pc.id,
        Stream: pc.streamId ? (streamsLookup[pc.streamId] ?? "-") : "-",
        Course: pc.courseId ? (coursesLookup[pc.courseId] ?? "-") : "-",
        CourseType: pc.courseTypeId ? (courseTypesLookup[pc.courseTypeId] ?? "-") : "-",
        CourseLevel: pc.courseLevelId ? (courseLevelsLookup[pc.courseLevelId] ?? "-") : "-",
        Duration: pc.duration,
        TotalSemesters: pc.totalSemesters,
        Affiliation: pc.affiliationId ? (affiliationsLookup[pc.affiliationId] ?? "-") : "-",
        RegulationType: pc.regulationTypeId ? (regulationTypesLookup[pc.regulationTypeId] ?? "-") : "-",
        Status: pc.isActive ? "Active" : "Inactive",
        "Created At": pc.createdAt,
        "Updated At": pc.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Program Courses");
      XLSX.writeFile(wb, "program-courses.xlsx");
    } catch {
      toast.error("Failed to download program courses");
    }
  };

  const handleDownloadFailedData = () => {
    if (!bulkUploadResult || !bulkUploadResult.errors || bulkUploadResult.errors.length === 0) {
      toast.error("No failed data to download");
      return;
    }
    try {
      const failedData = bulkUploadResult.errors.map((error: BulkUploadError) => ({
        "Row Number": error.row,
        "Error Message": error.error,
        "Original Data": JSON.stringify(error.data),
        Stream: (error.data as unknown as string[])[0] || "",
        Course: (error.data as unknown as string[])[1] || "",
        CourseType: (error.data as unknown as string[])[2] || "",
        CourseLevel: (error.data as unknown as string[])[3] || "",
        Duration: (error.data as unknown as string[])[4] || "",
        TotalSemesters: (error.data as unknown as string[])[5] || "",
        Affiliation: (error.data as unknown as string[])[6] || "",
        RegulationType: (error.data as unknown as string[])[7] || "",
        Disabled: (error.data as unknown as string[])[8] || "",
      }));
      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed Program Courses");
      XLSX.writeFile(wb, "failed-program-courses-upload.xlsx");
      toast.success("Failed data downloaded successfully");
    } catch {
      toast.error("Failed to download error data");
    }
  };

  const handleDownloadUnprocessedData = () => {
    if (!bulkUploadResult || !bulkUploadResult.unprocessedData || bulkUploadResult.unprocessedData.length === 0) {
      toast.error("No unprocessed data to download");
      return;
    }
    try {
      const unprocessedData = bulkUploadResult.unprocessedData.map((item: BulkUploadRow, index: number) => ({
        "Row Number": index + 1,
        Reason: "Not processed",
        "Original Data": JSON.stringify(item),
        Stream: (item as unknown as string[])[0] || "",
        Course: (item as unknown as string[])[1] || "",
        CourseType: (item as unknown as string[])[2] || "",
        CourseLevel: (item as unknown as string[])[3] || "",
        Duration: (item as unknown as string[])[4] || "",
        TotalSemesters: (item as unknown as string[])[5] || "",
        Affiliation: (item as unknown as string[])[6] || "",
        RegulationType: (item as unknown as string[])[7] || "",
        Disabled: (item as unknown as string[])[8] || "",
      }));
      const ws = XLSX.utils.json_to_sheet(unprocessedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Unprocessed Program Courses");
      XLSX.writeFile(wb, "unprocessed-program-courses-upload.xlsx");
      toast.success("Unprocessed data downloaded successfully");
    } catch {
      toast.error("Failed to download unprocessed data");
    }
  };

  const filteredProgramCourses = programCourses.filter((pc) =>
    Object.values({
      stream: pc.streamId ? (streamsLookup[pc.streamId] ?? "-") : "-",
      course: pc.courseId ? (coursesLookup[pc.courseId] ?? "-") : "-",
      courseType: pc.courseTypeId ? (courseTypesLookup[pc.courseTypeId] ?? "-") : "-",
      courseLevel: pc.courseLevelId ? (courseLevelsLookup[pc.courseLevelId] ?? "-") : "-",
      affiliation: pc.affiliationId ? (affiliationsLookup[pc.affiliationId] ?? "-") : "-",
      regulationType: pc.regulationTypeId ? (regulationTypesLookup[pc.regulationTypeId] ?? "-") : "-",
    })
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">Loading program courses...</div>
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
              <Library className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Program Courses</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">A list of all program courses.</div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Upload</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:w-full max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Program Courses</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Download the template to see the required format
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Excel File</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border rounded"
                    />
                    {bulkFile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const validation = await validateBulkUploadData(bulkFile);
                          if (validation.isValid) {
                            toast.success("File validation passed! All data is valid.");
                          } else {
                            const errorMessages = validation.errors
                              .map((err) => `Row ${err.row}: ${err.message}`)
                              .join("\n");
                            toast.error(`Validation failed:\n${errorMessages}`, {
                              duration: 10000,
                            });
                          }
                        }}
                        className="w-full"
                      >
                        Validate File
                      </Button>
                    )}
                  </div>
                  {bulkUploadResult && (
                    <div className="space-y-4 p-4 border rounded">
                      <h4 className="font-medium">Upload Results</h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total:</span> {bulkUploadResult.summary.total}
                        </div>
                        <div className="text-green-600">
                          <span className="font-medium">Successful:</span> {bulkUploadResult.summary.successful}
                        </div>
                        <div className="text-red-600">
                          <span className="font-medium">Failed:</span> {bulkUploadResult.summary.failed}
                        </div>
                        <div className="text-orange-600">
                          <span className="font-medium">Unprocessed:</span> {bulkUploadResult.summary.unprocessed || 0}
                        </div>
                      </div>
                      {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-red-600">Errors:</h5>
                            <Button variant="outline" size="sm" onClick={handleDownloadFailedData} className="text-xs">
                              <Download className="mr-1 h-3 w-3" />
                              Download Failed Data
                            </Button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {bulkUploadResult.errors.map((error: BulkUploadError, index: number) => (
                              <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                                <span className="font-medium">Row {error.row}:</span> {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {bulkUploadResult.unprocessedData && bulkUploadResult.unprocessedData.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-orange-600">Unprocessed Data:</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadUnprocessedData}
                              className="text-xs"
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Download Unprocessed Data
                            </Button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {bulkUploadResult.unprocessedData.map((_item: BulkUploadRow, index: number) => (
                              <div key={index} className="text-xs p-2 bg-orange-50 border border-orange-200 rounded">
                                <span className="font-medium">Row {index + 1}:</span> Not processed
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleBulkUpload} disabled={!bulkFile || isBulkUploading} className="flex-1">
                      {isBulkUploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsBulkUploadOpen(false);
                        setBulkFile(null);
                        setBulkUploadResult(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadTemplate} className="flex-shrink-0">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedProgramCourse ? "Edit Program Course" : "Add New Program Course"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <ProgramCourseForm
                  initialData={selectedProgramCourse}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  isLoading={isFormSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" onClick={handleDownloadAll} className="flex-shrink-0">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 30, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 40 }}>#</TableHead>
                    <TableHead style={{ width: 90 }}>Stream</TableHead>
                    <TableHead style={{ width: 120 }}>Name</TableHead>
                    <TableHead style={{ width: 70 }}>Course Level</TableHead>
                    <TableHead style={{ width: 90 }}>Affiliated To</TableHead>
                    <TableHead style={{ width: 90 }}>Regulation Type</TableHead>
                    <TableHead style={{ width: 70 }}>Status</TableHead>
                    <TableHead style={{ width: 60 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProgramCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No program courses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProgramCourses.map((pc, idx) => (
                      <TableRow key={pc.id} className="group">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{pc.streamId ? (streamsLookup[pc.streamId] ?? "-") : "-"}</TableCell>
                        <TableCell>
                          <div>{pc.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Duration: {pc.duration} year{pc.duration > 1 ? "s" : ""} | Sems: {pc.totalSemesters}
                          </div>
                        </TableCell>
                        <TableCell>{pc.courseLevelId ? (courseLevelsLookup[pc.courseLevelId] ?? "-") : "-"}</TableCell>
                        <TableCell>{pc.affiliationId ? (affiliationsLookup[pc.affiliationId] ?? "-") : "-"}</TableCell>
                        <TableCell>
                          {pc.regulationTypeId ? (regulationTypesLookup[pc.regulationTypeId] ?? "-") : "-"}
                        </TableCell>
                        <TableCell>
                          {pc.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(pc)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(pc.id)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramCoursesPage;
