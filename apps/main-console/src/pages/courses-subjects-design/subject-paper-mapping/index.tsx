import React, { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, FileText, Download, Upload, Edit } from "lucide-react";
import * as XLSX from "xlsx";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// import { PaperEditModal } from "./paper-edit-modal";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import {
  getSubjects,
  getAffiliations,
  getRegulationTypes,
  getExamComponents,
  getSubjectTypes,
  bulkUploadSubjectPapers,
  getAcademicYears,
  getProgramCourses,
  getPapers,
  //   BulkUploadRow,
  //   BulkUploadError,
  updatePaperWithComponents,
  getCourses,
  getCourseTypes,
  //   createPaper,
} from "@/services/course-design.api";
import { getAllClasses } from "@/services/classes.service";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type {
  Subject,
  Affiliation,
  RegulationType,
  SubjectType,

  // ExamComponent,
  Paper,
  ExamComponent,
  PaperComponent,
  ProgramCourse,
  Course,
  CourseType,
} from "@/types/course-design";
import { Class } from "@/types/academics/class";
import { AxiosError } from "axios";
import AddPaperModal from "@/components/subject-paper-mapping/AddPaperModal";
import { AcademicYear } from "@/types/academics/academic-year";
import { PaperEditModal } from "./paper-edit-modal";

const SubjectPaperMappingPage = () => {
  const { accessToken, displayFlag } = useAuth();

  const [searchText, setSearchText] = React.useState("");

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedPaper, setSelectedPaper] = React.useState<Paper | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<{
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
    errors: Array<{
      row: number;
      error: string;
    }>;
  } | null>(null);
  const [isPaperEditModalOpen, setIsPaperEditModalOpen] = React.useState(false);
  const [selectedPaperForEdit, setSelectedPaperForEdit] = React.useState<Paper | null>(null);

  const [filtersObj, setFiltersObj] = useState({
    subjectId: null as number | null,
    affiliationId: null as number | null,
    regulationTypeId: null as number | null,
    academicYearId: null as number | null,
    searchText: "",
    page: 1,
    limit: 10,
  });
  //   const [subjectFilter, setSubjectFilter] = React.useState<Subject | null>(null);
  //   const [affiliationFilter, setAffiliationFilter] = React.useState<Affiliation | null>(null);
  //   const [regulationTypeFilter, setRegulationTypeFilter] = React.useState<RegulationType | null>(null);
  //   const [academicYearFilter, setAcademicYearsFilter] = React.useState<AcademicYear | null>();

  // State for dropdowns and table
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);
  const [subjectTypes, setSubjectTypes] = React.useState<SubjectType[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);
  const [examComponents, setExamComponents] = React.useState<ExamComponent[]>([]);
  const [programCourses, setProgramCourses] = React.useState<ProgramCourse[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [courseTypes, setCourseTypes] = React.useState<CourseType[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [itemsPerPage] = React.useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  //   const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);

  const [papers, setPapers] = React.useState<Paper[]>([]);
  //   const [examComponents, setExamComponents] = React.useState<ExamComponent[]>([]);

  //   const [programCourses, setProgramCourses] = React.useState<Course[]>([]);
  //   const [classes, setClasses] = React.useState<Class[]>([]);

  const fetchFilteredData = React.useCallback(async () => {
    console.log("Fetching papers data");
    try {
      const result = await getPapers();
      console.log("API Response:", result);

      // Handle null/undefined response
      if (!result) {
        console.error("API returned null/undefined result");
        setPapers([]);
        setTotalPages(1);
        setTotalItems(0);
        toast.error("No data received from server");
        return;
      }

      // Ensure result is an array before filtering
      if (Array.isArray(result)) {
        // Apply client-side filtering
        let filteredPapers = result as Paper[];

        // Filter by subject
        if (filtersObj.subjectId) {
          filteredPapers = filteredPapers.filter((paper) => paper.subjectId === filtersObj.subjectId);
        }

        // Filter by affiliation
        if (filtersObj.affiliationId) {
          filteredPapers = filteredPapers.filter((paper) => paper.affiliationId === filtersObj.affiliationId);
        }

        // Filter by regulation type
        if (filtersObj.regulationTypeId) {
          filteredPapers = filteredPapers.filter((paper) => paper.regulationTypeId === filtersObj.regulationTypeId);
        }

        // Filter by academic year
        if (filtersObj.academicYearId) {
          filteredPapers = filteredPapers.filter((paper) => paper.academicYearId === filtersObj.academicYearId);
        }

        // Filter by search text
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          filteredPapers = filteredPapers.filter(
            (paper) =>
              paper.name?.toLowerCase().includes(searchLower) ||
              paper.code?.toLowerCase().includes(searchLower) ||
              subjects
                .find((s) => s.id === paper.subjectId)
                ?.name?.toLowerCase()
                .includes(searchLower),
          );
        }

        setPapers(filteredPapers);
        setTotalPages(1); // For now, set to 1 since we're not paginating
        setTotalItems(filteredPapers.length);

        console.log("Set papers:", filteredPapers);
        console.log("Total pages:", 1);
        console.log("Total items:", filteredPapers.length);
      } else {
        console.error("API returned non-array result:", result);
        setPapers([]);
        setTotalPages(1);
        setTotalItems(0);
        toast.error("Invalid data format received from server");
      }
    } catch (error: unknown) {
      console.error("Error fetching filtered data:", error);

      // Check for authentication error
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
        setError("Authentication failed. Please log in again.");
      } else {
        toast.error("Failed to fetch filtered data");
      }

      // Set empty array on error to prevent map error
      setPapers([]);
      setTotalPages(1);
      setTotalItems(0);
    }
  }, [filtersObj, searchText, subjects]);

  // Fetch filtered data when filters change
  useEffect(() => {
    fetchFilteredData();
  }, [
    searchText,
    currentPage,
    itemsPerPage,
    programCourses.length,
    classes.length,
    subjects.length,
    affiliations.length,
    regulationTypes.length,
    academicYears.length,
    fetchFilteredData,
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        subjectsRes,
        affiliationsRes,
        regulationTypesRes,
        subjectTypesRes,
        academicYearRes,
        examComponentsRes,
        programCourseRes,
        classesRes,
        courseRes,
        courseTypesRes,
      ] = await Promise.all([
        getSubjects(),
        getAffiliations(),
        getRegulationTypes(),
        getSubjectTypes(),
        getAcademicYears(),
        getExamComponents(),
        getProgramCourses(),
        getAllClasses(),
        getCourses(),
        getCourseTypes(),
      ]);

      //   console.log("API Responses:", {
      //     subjects: subjectsRes,
      //     affiliations: affiliationsRes,
      //     regulationTypes: regulationTypesRes,
      //     subjectTypes: subjectTypesRes,
      //     examComponents: examComponentsRes,
      //     academicYears: academicYearsRes,
      //     programCourses: programCourseRes,
      //     classes: classesRes,
      //     sessions: academicYearRes,
      //   });

      console.log("SubjectTypes response details:", {
        isArray: Array.isArray(subjectTypesRes),
        length: Array.isArray(subjectTypesRes) ? subjectTypesRes.length : "not array",
        data: subjectTypesRes,
      });

      // Handle different response structures
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
      setAffiliations(Array.isArray(affiliationsRes) ? affiliationsRes : []);
      setRegulationTypes(Array.isArray(regulationTypesRes) ? regulationTypesRes : []);
      setSubjectTypes(Array.isArray(subjectTypesRes) ? subjectTypesRes : []);
      setExamComponents(Array.isArray(examComponentsRes) ? examComponentsRes : []);
      setAcademicYears(Array.isArray(academicYearRes) ? academicYearRes : []);
      setProgramCourses(Array.isArray(programCourseRes) ? programCourseRes : []);
      setCourses(Array.isArray(courseRes) ? courseRes : []);
      setCourseTypes(Array.isArray(courseTypesRes) ? courseTypesRes : []);
      setClasses(
        Array.isArray(classesRes) ? classesRes : (classesRes as unknown as { payload: Class[] })?.payload || [],
      );
      console.log(
        "Classes data set:",
        Array.isArray(classesRes) ? classesRes : (classesRes as unknown as { payload: Class[] })?.payload || [],
      );
      console.log(
        "Filtered SEMESTER classes:",
        Array.isArray(classesRes)
          ? classesRes.filter((cls: Class) => cls.type === "SEMESTER")
          : (classesRes as unknown as { payload: Class[] })?.payload?.filter((cls: Class) => cls.type === "SEMESTER") ||
              [],
      );

      setFiltersObj({
        subjectId: null, // Don't filter initially - show all data
        affiliationId: null,
        regulationTypeId: null,
        academicYearId: null,
        searchText: "",
        page: 1,
        limit: 10,
      });

      // Fetch all data initially
      await fetchFilteredData();

      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);

      // Check for authentication error
      if (err instanceof AxiosError && err.response?.status === 401) {
        const errorMessage = "Authentication failed. Please log in again.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
        setError(errorMessage);
        toast.error("Failed to load data");
      }

      // Log more details about the error
      if (err instanceof Error) {
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }

      // Set empty arrays on error to prevent map errors
      setPapers([]);
      setSubjects([]);
      setAffiliations([]);
      setRegulationTypes([]);
      setSubjectTypes([]);
      setExamComponents([]);
      setAcademicYears([]);
      setProgramCourses([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFilteredData]);

  useEffect(() => {
    // Only fetch data when authentication is ready
    if (displayFlag && accessToken) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayFlag, accessToken]);

  const handlePaperEditSubmit = async (data: Paper) => {
    console.log("Paper edit submitted with data:", data);
    console.log("Selected paper for edit:", selectedPaperForEdit);
    try {
      if (!selectedPaperForEdit?.id) {
        toast.error("Paper ID not found");
        return;
      }

      console.log("Calling updatePaperWithComponents with:", {
        paperId: selectedPaperForEdit.id,
        data: data,
      });

      // Transform the data to match the API expected format
      const updateData = {
        classId: data.classId,
        name: data.name,
        subjectId: data.subjectId,
        affiliationId: data.affiliationId,
        regulationTypeId: data.regulationTypeId,
        academicYearId: data.academicYearId,
        programCourseId: data.programCourseId,
        subjectTypeId: data.subjectTypeId,
        code: data.code,
        isOptional: data.isOptional,
        disabled: data.disabled,
        components:
          data.components
            ?.filter((comp) => comp.examComponent?.id && comp.fullMarks !== null && comp.credit !== null)
            .map((comp) => ({
              examComponent: {
                id: comp.examComponent.id!,
              },
              fullMarks: comp.fullMarks!,
              credit: comp.credit!,
            })) || [],
      };

      await updatePaperWithComponents(selectedPaperForEdit.id, updateData);
      toast.success("Paper updated successfully!");
      setIsPaperEditModalOpen(false);
      setSelectedPaperForEdit(null);
      fetchFilteredData(); // Refresh the data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update paper";
      toast.error(`Failed to update paper: ${errorMessage}`);
      console.error("Full error object:", error);
    }
  };

  const handleAddNew = () => {
    setSelectedPaper(null);
    setIsFormOpen(true);
  };

  //   const handleFormSubmit = async (data: Paper) => {
  //     console.log("Form submitted with data:", data);
  //     setIsFormSubmitting(true);
  //     try {
  //       // The form component already handles the API call and success/error messages
  //       // We just need to refresh the data and close the form
  //       setIsFormOpen(false);
  //       fetchData(); // Refresh the data to show the new mapping
  //     } catch (error: unknown) {
  //       const errorMessage = error instanceof Error ? error.message : "Failed to save subject paper mapping";
  //       toast.error(`Failed to create subject paper mapping: ${errorMessage}`);
  //     } finally {
  //       setIsFormSubmitting(false);
  //     }
  //   };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;

    setIsBulkUploading(true);
    try {
      const result = await bulkUploadSubjectPapers(bulkFile);
      setBulkUploadResult(result);

      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} papers`);
        // Re-fetch the data to show new papers
        // You might want to add a fetch function here
      }

      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} papers failed to upload`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Bulk upload failed: ${errorMessage}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template data with headers
    const templateData = [
      {
        Subject: "",
        "Subject Type": "",
        "Applicable programCourses": "",
        Affiliation: "",
        Regulation: "",
        "Academic Year": "",
        "Course Type": "",
        Class: "",
        "Paper Code": "",
        "Paper Name": "",
        "Is Optional": "",
        ...examComponents.reduce(
          (acc, component) => {
            acc[`Full Marks ${component.code}`] = "";
            acc[`Credit ${component.code}`] = "";
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Subject
      { wch: 15 }, // Subject Type
      { wch: 25 }, // Applicable programCourses
      { wch: 20 }, // Affiliation
      { wch: 15 }, // Regulation
      { wch: 15 }, // Academic Year
      { wch: 15 }, // Paper Code
      { wch: 25 }, // Paper Name
      { wch: 12 }, // Is Optional
      ...examComponents.flatMap(() => [
        { wch: 15 }, // Full Marks
        { wch: 12 }, // Credit
      ]),
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Subject Paper Mapping Template");

    // Download the file
    XLSX.writeFile(wb, "subject-paper-mapping-template.xlsx");
  };

  //   const validateBulkUploadData = (data: BulkUploadRow[]) => {
  //     const errors: BulkUploadError[] = [];
  //     const unprocessedData: BulkUploadRow[] = [];
  //     const paperCodes = new Set<string>();

  //     data.map((row, index) => {
  //       const rowNumber = index + 2; // Excel rows start from 1, and we have header at row 1
  //       const rowErrors: string[] = [];

  //       // Check if subject exists
  //       const subject = subjects.find((s) => s.name.toLowerCase() === ((row.Subject as string) || "").toLowerCase());
  //       if (!subject) {
  //         rowErrors.push("Subject not found");
  //       }

  //       // Check if subject type exists
  //       const subjectType = subjectTypes.find((st) => {
  //         if (
  //           st.name.toLowerCase() === ((row["Subject Type"] as string) || "").toLowerCase() ||
  //           (st.code && st.code.toLowerCase() === ((row["Subject Type"] as string) || "").toLowerCase())
  //         ) {
  //           return true;
  //         }
  //       });
  //       if (!subjectType) {
  //         rowErrors.push("Subject Type not found");
  //       }

  //       // Check if affiliation exists
  //       const affiliation = affiliations.find(
  //         (a) => a.name.toLowerCase() === ((row.Affiliation as string) || "").toLowerCase(),
  //       );
  //       if (!affiliation) {
  //         rowErrors.push("Affiliation not found");
  //       }

  //       // Check if regulation type exists
  //       const regulationType = regulationTypes.find(
  //         (rt) => rt.name.toLowerCase() === ((row.Regulation as string) || "").toLowerCase(),
  //       );
  //       if (!regulationType) {
  //         rowErrors.push("Regulation not found");
  //       }

  //       //   // Check if academic year exists (if provided)
  //       //   let session = null;
  //       //   if (row["Session"]) {
  //       //     session = sessions.find(
  //       //       (sess) => sess.year.toLowerCase() === ((row["Academic Year"] as string) || "").toLowerCase(),
  //       //     );
  //       //     if (!academicYear) {
  //       //       rowErrors.push("Academic Year not found");
  //       //     }
  //       //   }

  //       // Check if paper code is unique
  //       const paperCode = (row["Paper Code"] as string)?.toString().trim();
  //       if (paperCode) {
  //         if (paperCodes.has(paperCode)) {
  //           rowErrors.push("Paper Code must be unique");
  //         } else {
  //           paperCodes.add(paperCode);
  //         }
  //       } else {
  //         rowErrors.push("Paper Code is required");
  //       }

  //       // Check if all exam components are present and valid
  //       examComponents.forEach((component) => {
  //         const fullMarksField = `Full Marks ${component.code}`;
  //         const creditField = `Credit ${component.code}`;

  //         if (!row[fullMarksField] && row[fullMarksField] !== 0) {
  //           rowErrors.push(`${fullMarksField} is required`);
  //         }

  //         if (!row[creditField] && row[creditField] !== 0) {
  //           rowErrors.push(`${creditField} is required`);
  //         }

  //         // Validate that full marks and credit are numbers
  //         if (row[fullMarksField] && isNaN(Number(row[fullMarksField]))) {
  //           rowErrors.push(`${fullMarksField} must be a number`);
  //         }

  //         if (row[creditField] && isNaN(Number(row[creditField]))) {
  //           rowErrors.push(`${creditField} must be a number`);
  //         }
  //       });

  //       if (rowErrors.length > 0) {
  //         errors.push({
  //           row: rowNumber,
  //           data: row,
  //           error: rowErrors.join(", "),
  //         });
  //       } else {
  //         // If no validation errors, add to unprocessed data for backend processing
  //         unprocessedData.push(row);
  //       }
  //     });

  //     return { errors, unprocessedData };
  //   };

  //   const validateBulkUploadData = (data: BulkUploadRow[]) => {
  //     const errors: BulkUploadError[] = [];
  //     const unprocessedData: BulkUploadRow[] = [];
  //     const paperCodes = new Set<string>();
  //     const dtos: Paper[] = [];

  //     data.forEach((row, index) => {
  //       const rowNumber = index + 2; // Excel rows start from 1, header at row 1
  //       const rowErrors: string[] = [];

  //       // Academic Year
  //       const academicYear = academicYears.find(
  //         (a) => a.year.toLowerCase() === ((row["Academic Year"] as string) || "").toLowerCase(),
  //       );
  //       if (!academicYear) {
  //         rowErrors.push("Academic Year not found");
  //       }

  //       // Program Course
  //       const programCourse = programCourses.find(
  //         (pc) =>
  //           (

  //           )
  //       );
  //       if (!programCourse) {
  //         rowErrors.push("Program Course not found");
  //       }

  //       // Class
  //       const aClass = classes.find((c) => {
  //         if (
  //           c?.name.toLowerCase() === ((row["Class"] as string) || "").toLowerCase().trim() ||
  //           (c?.shortName && c?.shortName.toLowerCase() === ((row["Class"] as string) || "").toLowerCase().trim())
  //         ) {
  //           return true;
  //         }
  //       });
  //       if (!aClass) {
  //         rowErrors.push("Class not found");
  //       }

  //       // === Subject ===
  //       const subject = subjects.find((s) => s.name.toLowerCase() === ((row.Subject as string) || "").toLowerCase());
  //       if (!subject) {
  //         rowErrors.push("Subject not found");
  //       }

  //       // === Subject Type ===
  //       const subjectType = subjectTypes.find((st) => {
  //         const val = (row["Subject Type"] as string) || "";
  //         return st.name.toLowerCase() === val.toLowerCase() || (st.code && st.code.toLowerCase() === val.toLowerCase());
  //       });
  //       if (!subjectType) {
  //         rowErrors.push("Subject Type not found");
  //       }

  //       // === Affiliation ===
  //       const affiliation = affiliations.find(
  //         (a) => a.name.toLowerCase() === ((row.Affiliation as string) || "").toLowerCase(),
  //       );
  //       if (!affiliation) {
  //         rowErrors.push("Affiliation not found");
  //       }

  //       // === Regulation Type ===
  //       const regulationType = regulationTypes.find(
  //         (rt) => rt.name.toLowerCase() === ((row.Regulation as string) || "").toLowerCase(),
  //       );
  //       if (!regulationType) {
  //         rowErrors.push("Regulation not found");
  //       }

  //       // === Paper Code uniqueness ===
  //       const paperCode = (row["Paper Code"] as string)?.toString().trim();
  //       if (paperCode) {
  //         if (paperCodes.has(paperCode)) {
  //           rowErrors.push("Paper Code must be unique");
  //         } else {
  //           paperCodes.add(paperCode);
  //         }
  //       } else {
  //         rowErrors.push("Paper Code is required");
  //       }

  //       // === Exam Components ===
  //       const paperComponents: PaperComponent[] = [];
  //       examComponents.forEach((component) => {
  //         const fullMarksField = `Full Marks ${component.code}`;
  //         const creditField = `Credit ${component.code}`;

  //         const fullMarks = row[fullMarksField];
  //         const credit = row[creditField];

  //         if (fullMarks === undefined || fullMarks === null || fullMarks === "") {
  //           rowErrors.push(`${fullMarksField} is required`);
  //         } else if (isNaN(Number(fullMarks))) {
  //           rowErrors.push(`${fullMarksField} must be a number`);
  //         }

  //         if (credit === undefined || credit === null || credit === "") {
  //           rowErrors.push(`${creditField} is required`);
  //         } else if (isNaN(Number(credit))) {
  //           rowErrors.push(`${creditField} must be a number`);
  //         }

  //         if (!rowErrors.length) {
  //           paperComponents.push({
  //             paperId: 0, // backend will assign after insert
  //             examComponent: component,
  //             fullMarks: fullMarks ? Number(fullMarks) : null,
  //             credit: credit ? Number(credit) : null,
  //           });
  //         }
  //       });

  //       // === Handle validation result ===
  //       if (rowErrors.length > 0) {
  //         errors.push({
  //           row: rowNumber,
  //           data: row,
  //           error: rowErrors.join(", "),
  //         });
  //       } else {
  //         unprocessedData.push(row);

  //         // Build DTO
  //         const dto: Paper = {
  //           subjectId: subject!.id!,
  //           affiliationId: affiliation!.id!,
  //           regulationTypeId: regulationType!.id!,
  //           academicYearId: academicYear!.id!, // Map if available in row
  //           subjectTypeId: subjectType!.id!,
  //           programCourseId: programCourse!.id!, // Derive/match if available
  //           classId: aClass!.id!, // Map if available
  //           name: row.Subject as string,
  //           code: paperCode!,
  //           isOptional: !!row["Is Optional"], // Decide based on row if optional
  //           sequence: null,
  //           disabled: false,
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //           components: paperComponents,
  //           topics: [],
  //         };

  //         dtos.push(dto);
  //       }
  //     });

  //     return { errors, unprocessedData, dtos };
  //   };

  //   const handleBulkUpload = async () => {
  //     if (!bulkFile) return;

  //     try {
  //       const data = await new Promise<BulkUploadRow[]>((resolve, reject) => {
  //         const reader = new FileReader();
  //         reader.onload = (e) => {
  //           try {
  //             const workbook = XLSX.read(e.target?.result, { type: "binary" });
  //             const sheetName = workbook.SheetNames[0];
  //             const worksheet = workbook.Sheets[sheetName];
  //             const jsonData = XLSX.utils.sheet_to_json(worksheet);
  //             resolve(jsonData as BulkUploadRow[]);
  //           } catch (error) {
  //             reject(error);
  //           }
  //         };
  //         reader.readAsBinaryString(bulkFile);
  //       });

  //       // Validate the data
  //       const { errors, unprocessedData, dtos } = validateBulkUploadData(data);

  //       if (errors.length > 0) {
  //         toast.error(`Validation failed: ${errors.length} rows have errors`);
  //         // TODO: Show errors in a modal or download error file
  //         alert(
  //           `Validation failed for ${errors.length} rows:\n${errors
  //             .map((err) => `Row ${err.row}: ${err.error}`)
  //             .join("\n")}`,
  //         );
  //         console.error("Validation errors:", errors);
  //         setBulkFile(null); // Clear the file after processing

  //         return;
  //       }

  //       if (unprocessedData.length === 0) {
  //         toast.error("No valid data to upload");
  //         return;
  //       }

  //       // Call backend API for bulk upload
  //       try {
  //         // const result = await bulkUploadSubjectPapers(bulkFile);
  //         const result = await createPaper(dtos);
  //         toast.success(`Bulk upload completed: ${result.data.payload?.length} successful`);

  //         fetchData(); // Refresh the data

  //         setIsBulkUploadOpen(false);
  //         setBulkFile(null);
  //       } catch (error: unknown) {
  //         const errorMessage = error instanceof Error ? error.message : "Bulk upload failed";
  //         toast.error(`Bulk upload failed: ${errorMessage}`);
  //       }
  //     } catch {
  //       toast.error("Failed to process file");
  //     }
  //   };

  // Show loading while authentication is in progress
  if (!displayFlag || !accessToken) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">Authenticating...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">Loading subject paper mappings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Subject Paper Mapping
            </CardTitle>
            <div className="text-muted-foreground">Map subject papers to programCourses.</div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Subject Paper Mappings</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      setBulkFile(e.target.files?.[0] || null);
                      setBulkUploadResult(null); // Clear previous results
                    }}
                  />
                  <Button onClick={handleBulkUpload} disabled={!bulkFile || isBulkUploading}>
                    {isBulkUploading ? "Uploading..." : "Upload"}
                  </Button>

                  {bulkUploadResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium mb-2">Upload Results:</h4>
                      <div className="text-sm space-y-1">
                        <p>Total: {bulkUploadResult.summary?.total || 0}</p>
                        <p className="text-green-600">Successful: {bulkUploadResult.summary?.successful || 0}</p>
                        <p className="text-red-600">Failed: {bulkUploadResult.summary?.failed || 0}</p>
                      </div>
                      {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-red-600">Errors:</p>
                          <ul className="text-xs text-red-600 max-h-32 overflow-y-auto">
                            {bulkUploadResult.errors.map((error, index: number) => (
                              <li key={index}>
                                Row {error.row}: {error.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="min-w-[99vw] min-h-[98vh] overflow-auto flex flex-col">
                <AlertDialogHeader className="border-b pb-2">
                  <AlertDialogTitle>
                    {selectedPaper ? "Edit Subject Paper Mapping" : "Add New Subject Paper Mapping"}
                  </AlertDialogTitle>
                </AlertDialogHeader>

                {/* <SubjectPaperMappingForm
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  isLoading={isFormSubmitting}
                  subjects={subjects}
                  affiliations={affiliations}
                  regulationTypes={regulationTypes}
                  subjectTypes={subjectTypes}
                  examComponents={examComponents}
                  academicYears={academicYears.map((ay) => ({
                    id: ay.id || 0,
                    year: ay.year,
                    isActive: ay.isActive,
                  }))}
                  programCourses={programCourses.map((course) => ({
                    id: course.id || 0,
                    name: course.name,
                    shortName: course.shortName,
                  }))}
                  classes={classes
                    .filter((cls) => cls.type === "SEMESTER")
                    .map((cls) => ({
                      id: cls.id || 0,
                      name: cls.name,
                      type: cls.type,
                    }))}
                  editData={selectedPaper as unknown as Paper}
                /> */}

                <AddPaperModal
                  dropdownData={{
                    subjectTypes,
                    subjects,
                    courses: courses,
                    affiliations,
                    regulationTypes,
                    examComponents,
                    academicYears,
                    programCourses,
                    classes,
                  }}
                  fetchData={fetchData}
                  onCancel={() => setIsFormOpen(false)}
                  isLoading={false}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-40 bg-background p-4 border-b flex flex-wrap items-center gap-2 mb-0 justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={filtersObj.affiliationId?.toString() ?? "all"}
                onValueChange={(value) =>
                  setFiltersObj((prev) => ({ ...prev, affiliationId: value === "all" ? null : Number(value) }))
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Affiliations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Affiliations</SelectItem>
                  {affiliations.map((a) => (
                    <SelectItem key={a.id!} value={a.id!.toString()}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filtersObj.academicYearId?.toString() ?? "all"}
                onValueChange={(value) =>
                  setFiltersObj((prev) => ({ ...prev, academicYearId: value === "all" ? null : Number(value) }))
                }
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All Academic Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map((ay) => (
                    <SelectItem key={ay.id!} value={ay.id!.toString()}>
                      {ay.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filtersObj.regulationTypeId?.toString() ?? "all"}
                onValueChange={(value) =>
                  setFiltersObj((prev) => ({ ...prev, regulationTypeId: value === "all" ? null : Number(value) }))
                }
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All Regulation Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regulation Types</SelectItem>
                  {regulationTypes.map((rt) => (
                    <SelectItem key={rt.id!} value={rt.id!.toString()}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filtersObj.subjectId?.toString() ?? "all"}
                onValueChange={(value) =>
                  setFiltersObj((prev) => ({ ...prev, subjectId: value === "all" ? null : Number(value) }))
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id!} value={s.id!.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" onClick={() => {}}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="relative z-50 bg-white" style={{ height: "600px" }}>
            <div className="overflow-y-auto text-[14px] overflow-x-auto h-full border rounded-md">
              {/* Fixed Header */}
              <div className="sticky top-0 z-50 text-gray-500 bg-gray-100 border-b" style={{ minWidth: "950px" }}>
                <div className="flex">
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "7%" }}
                  >
                    Sr. No.
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "14%" }}
                  >
                    Course
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "20%" }}
                  >
                    Paper Name
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "10%" }}
                  >
                    Paper Code
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "12%" }}
                  >
                    Subject Type
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "10%" }}
                  >
                    Semester
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "21%" }}
                  >
                    Exam Components
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 flex items-center justify-center"
                    style={{ width: "6%" }}
                  >
                    Actions
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="bg-white relative">
                {loading ? (
                  <div className="flex items-center justify-center p-4 text-center" style={{ minWidth: "950px" }}>
                    Loading...
                  </div>
                ) : error ? (
                  <div
                    className="flex items-center justify-center p-4 text-center text-red-500"
                    style={{ minWidth: "950px" }}
                  >
                    {error}
                  </div>
                ) : !Array.isArray(papers) || papers.length === 0 ? (
                  <div className="flex items-center justify-center p-4 text-center" style={{ minWidth: "950px" }}>
                    {!Array.isArray(papers) ? "Error loading data" : "No subject paper mappings found."}
                  </div>
                ) : (
                  papers.map((sp: Paper, idx: number) => (
                    <div key={sp.id} className="flex border-b hover:bg-gray-50 group" style={{ minWidth: "950px" }}>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "7%" }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-shrink-0 p-3 border-r flex items-center" style={{ width: "14%" }}>
                        {courses.find(
                          (crs) => crs.id === programCourses.find((ele) => ele.id == sp.programCourseId)?.courseId,
                        )?.name ?? "-"}
                      </div>
                      <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "20%" }}>
                        <p>
                          {sp.name ?? "-"}
                          {!sp.isOptional && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p>({subjects.find((s) => s.id === sp.subjectId)?.name ?? "-"})</p>
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "10%" }}
                      >
                        {sp.code ?? "-"}
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "12%" }}
                      >
                        {subjectTypes.find((st) => st.id === sp.subjectTypeId)?.code ?? "-"}
                      </div>
                      <div
                        className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                        style={{ width: "10%" }}
                      >
                        {classes.find((cls) => cls.id === sp.classId)?.name.split(" ")[1] ?? "-"}
                      </div>
                      <div className="flex-shrink-0 p-3 border-r" style={{ width: "21%" }}>
                        {/* Display exam component names */}
                        <div className="flex flex-wrap gap-1">
                          {sp.components && sp.components.length > 0 ? (
                            sp.components.map((component: PaperComponent, compIdx: number) => (
                              <Badge key={compIdx} variant="outline" className="text-xs">
                                {component.examComponent.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No components</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 p-3 flex items-center justify-center" style={{ width: "6%" }}>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsPaperEditModalOpen(true);
                              setSelectedPaperForEdit(sp);
                            }}
                            className="h-5 w-5 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
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
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
            {totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
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
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Paper Edit Modal */}
      {
        <PaperEditModal
          isOpen={isPaperEditModalOpen}
          onClose={() => {
            setIsPaperEditModalOpen(false);
            //   setSelectedPaperForEdit(null);
          }}
          onSubmit={handlePaperEditSubmit}
          isLoading={false}
          givenPaper={selectedPaperForEdit!}
          subjects={subjects}
          affiliations={affiliations}
          regulationTypes={regulationTypes}
          subjectTypes={subjectTypes}
          examComponents={examComponents}
          academicYears={academicYears}
          programCourses={programCourses}
          courses={courses}
          courseTypes={courseTypes}
          classes={classes}
          paperId={selectedPaperForEdit?.id}
        />
      }
    </div>
  );
};

export default SubjectPaperMappingPage;
