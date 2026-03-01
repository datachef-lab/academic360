import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Edit, Filter, X } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// import { PaperEditModal } from "./paper-edit-modal";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// import { toast } from "sonner";
// import {
//   getSubjects,
//   getAffiliations,
//   getRegulationTypes,
//   getExamComponents,
//   getSubjectTypes,
// //   bulkUploadSubjectPapers,
//   getProgramCourses,
//   getPapersPaginated,
//   //   BulkUploadRow,
//   //   BulkUploadError,
// //   updatePaperWithComponents,
//   getCourses,
//   getCourseTypes,
//   //   createPaper,
// //   PaginatedResponse,
// } from "@/services/course-design.api";
// import { getAllClasses } from "@/services/classes.service";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type {
  //   Subject,
  //   Affiliation,
  //   RegulationType,
  //   SubjectType,

  // ExamComponent,
  //   PaperDto,
  //   ExamComponent,
  // //   PaperComponentDto,
  //   ProgramCourse,
  //   Course,
  //   CourseType,
  ExamGroupDto,
} from "@repo/db/index";
// import { Class } from "@/types/academics/class";
// import { AxiosError } from "axios";
// import AddPaperModal from "@/components/subject-paper-mapping/AddPaperModal";
// import { useAcademicYear } from "@/hooks/useAcademicYear";
// import { PaperEditModal } from "@/pages/courses-subjects-design/subject-paper-mapping/paper-edit-modal";
import { fetchExamGroups, type ExamFilters } from "@/services/exam.service";
import { getAllExamTypes, type ExamTypeT } from "@/services/exam-type.service";
import { getAllClasses } from "@/services/classes.service";
import { getAffiliations, getRegulationTypes } from "@/services/course-design.api";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Class } from "@/types/academics/class";
import { Affiliation, RegulationType } from "@repo/db/index";
import { Link } from "react-router-dom";

const ExamsPage = () => {
  const { accessToken, displayFlag, user } = useAuth();
  const { currentAcademicYear, availableAcademicYears } = useAcademicYear();

  const [isFilterDialogOpen, setIsFilterDialogOpen] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Filter state
  const [filters, setFilters] = React.useState<ExamFilters>({
    examTypeId: null,
    classId: null,
    academicYearId: null,
    affiliationId: null,
    regulationTypeId: null,
    dateFrom: null,
    dateTo: null,
    status: null,
  });

  // Options for filters
  const [examTypes, setExamTypes] = React.useState<ExamTypeT[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);

  //   const setIsFormOpen = React.useState(false)[1];
  //   const  setSelectedPaper = React.useState<PaperDto | null>(null)[1];
  //   const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  //   const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  //   const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  //   const [bulkUploadResult, setBulkUploadResult] = React.useState<{
  //     summary: {
  //       total: number;
  //       successful: number;
  //       failed: number;
  //     };
  //     errors: Array<{
  //       row: number;
  //       error: string;
  //     }>;
  //   } | null>(null);
  //   const setIsPaperEditModalOpen = React.useState(false)[1];
  //   const [selectedPaperForEdit, setSelectedPaperForEdit] = React.useState<PaperDto | null>(null);

  //   const [filtersObj, setFiltersObj] = useState({
  //     subjectId: null as number | null,
  //     affiliationId: null as number | null,
  //     regulationTypeId: null as number | null,
  //     academicYearId: null as number | null,
  //     classId: null as number | null,
  //     programCourseId: null as number | null,
  //     subjectTypeId: null as number | null,
  //     isOptional: null as boolean | null,
  //     autoAssign: null as boolean | null,
  //     searchText: "",
  //     page: 1,
  //     limit: 10,
  //   });
  //   const [subjectFilter, setSubjectFilter] = React.useState<Subject | null>(null);
  //   const [affiliationFilter, setAffiliationFilter] = React.useState<Affiliation | null>(null);
  //   const [regulationTypeFilter, setRegulationTypeFilter] = React.useState<RegulationType | null>(null);
  //   const [academicYearFilter, setAcademicYearsFilter] = React.useState<AcademicYear | null>();

  // State for dropdowns and table
  //   const [subjects, setSubjects] = React.useState<Subject[]>([]);
  //   const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  //   const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);
  //   const [subjectTypes, setSubjectTypes] = React.useState<SubjectType[]>([]);
  //   // Academic years now come from Redux state via useAcademicYear hook
  //   const setExamComponents = React.useState<ExamComponent[]>([])[1];
  //   const [programCourses, setProgramCourses] = React.useState<ProgramCourse[]>([]);
  //   const setCourses = React.useState<Course[]>([])[1];
  //   const setCourseTypes = React.useState<CourseType[]>([])[1];
  //   const [classes, setClasses] = React.useState<Class[]>([]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [itemsPerPage] = React.useState(10);
  //   const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  //   const setIsDownloading = React.useState(false)[1];
  //   const setDownloadProgress = React.useState(0)[1];
  const [examGroups, setExamGroups] = useState<ExamGroupDto[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  //   const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);

  //   const [papers, setPapers] = React.useState<PaperDto[]>([]);
  //   const [examComponents, setExamComponents] = React.useState<ExamComponent[]>([]);

  //   const [programCourses, setProgramCourses] = React.useState<Course[]>([]);
  //   const [classes, setClasses] = React.useState<Class[]>([]);

  // Track if component has been initialized to prevent re-fetching on tab switch
  const hasInitialized = React.useRef(false);

  //   const fetchFilteredData = React.useCallback(async () => {
  //     console.log("Fetching papers data");
  //     try {
  //       // Server-side pagination and filtering
  //       const paged = await getPapersPaginated(currentPage, itemsPerPage, {
  //         subjectId: filtersObj.subjectId,
  //         affiliationId: filtersObj.affiliationId,
  //         regulationTypeId: filtersObj.regulationTypeId,
  //         academicYearId: filtersObj.academicYearId,
  //         subjectTypeId: filtersObj.subjectTypeId,
  //         programCourseId: filtersObj.programCourseId,
  //         classId: filtersObj.classId,
  //         isOptional: filtersObj.isOptional,
  //         autoAssign: filtersObj.autoAssign,
  //         searchText: searchText || null,
  //       });
  //       if (!paged) {
  //         setPapers([]);
  //         setTotalPages(1);
  //         setTotalItems(0);
  //         toast.error("No data received from server");
  //         return;
  //       }

  //       setPapers((paged.content as unknown as PaperDto[]) || []);
  //       setTotalPages(paged.totalPages || 1);
  //       setTotalItems(paged.totalElements || 0);
  //     } catch (error: unknown) {
  //       console.error("Error fetching filtered data:", error);

  //       if (error instanceof AxiosError && error.response?.status === 401) {
  //         toast.error("Authentication failed. Please log in again.");
  //         setError("Authentication failed. Please log in again.");
  //       } else {
  //         toast.error("Failed to fetch filtered data");
  //       }

  //       setPapers([]);
  //       setTotalPages(1);
  //       setTotalItems(0);
  //     }
  //   }, [currentPage, itemsPerPage, filtersObj, searchText]);

  // Fetch filtered data when filters change
  //   useEffect(() => {
  //     fetchFilteredData();
  //   }, [
  //     searchText,
  //     currentPage,
  //     itemsPerPage,
  //     filtersObj.subjectId,
  //     filtersObj.affiliationId,
  //     filtersObj.regulationTypeId,
  //     filtersObj.academicYearId,
  //     filtersObj.classId,
  //     filtersObj.programCourseId,
  //     filtersObj.subjectTypeId,
  //     filtersObj.isOptional,
  //     fetchFilteredData,
  //   ]);

  //   const fetchData = useCallback(
  //     async (preserveFilters = false) => {
  //       // Always fetch fresh data (no caching)
  //       console.log("Fetching fresh data", { preserveFilters });
  //       setLoading(true);
  //       try {
  //         const [
  //           subjectsRes,
  //           affiliationsRes,
  //           regulationTypesRes,
  //           subjectTypesRes,
  //           examComponentsRes,
  //           programCourseRes,
  //           classesRes,
  //           courseRes,
  //           courseTypesRes,
  //         ] = await Promise.all([
  //           getSubjects(),
  //           getAffiliations(),
  //           getRegulationTypes(),
  //           getSubjectTypes(),
  //           getExamComponents(),
  //           getProgramCourses(),
  //           getAllClasses(),
  //           getCourses(),
  //           getCourseTypes(),
  //         ]);

  //         //   console.log("API Responses:", {
  //         //     subjects: subjectsRes,
  //         //     affiliations: affiliationsRes,
  //         //     regulationTypes: regulationTypesRes,
  //         //     subjectTypes: subjectTypesRes,
  //         //     examComponents: examComponentsRes,
  //         //     academicYears: academicYearsRes,
  //         //     programCourses: programCourseRes,
  //         //     classes: classesRes,
  //         //     sessions: academicYearRes,
  //         //   });

  //         console.log("SubjectTypes response details:", {
  //           isArray: Array.isArray(subjectTypesRes),
  //           length: Array.isArray(subjectTypesRes) ? subjectTypesRes.length : "not array",
  //           data: subjectTypesRes,
  //         });

  //         // Handle different response structures
  //         setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
  //         setAffiliations(Array.isArray(affiliationsRes) ? affiliationsRes : []);
  //         setRegulationTypes(Array.isArray(regulationTypesRes) ? regulationTypesRes : []);
  //         setSubjectTypes(Array.isArray(subjectTypesRes) ? subjectTypesRes : []);
  //         setExamComponents(Array.isArray(examComponentsRes) ? examComponentsRes : []);
  //         // Academic years now come from Redux state
  //         setProgramCourses(Array.isArray(programCourseRes) ? programCourseRes : []);
  //         setCourses(Array.isArray(courseRes) ? courseRes : []);
  //         setCourseTypes(Array.isArray(courseTypesRes) ? courseTypesRes : []);
  //         setClasses(
  //           Array.isArray(classesRes) ? classesRes : (classesRes as unknown as { payload: Class[] })?.payload || [],
  //         );

  //         console.log(
  //           "Classes data set:",
  //           Array.isArray(classesRes) ? classesRes : (classesRes as unknown as { payload: Class[] })?.payload || [],
  //         );
  //         console.log(
  //           "Filtered SEMESTER classes:",
  //           Array.isArray(classesRes)
  //             ? classesRes.filter((cls: Class) => cls.type === "SEMESTER")
  //             : (classesRes as unknown as { payload: Class[] })?.payload?.filter(
  //                 (cls: Class) => cls.type === "SEMESTER",
  //               ) || [],
  //         );

  //         // Only set filters on initial load, preserve them otherwise
  //         if (!preserveFilters) {
  //           setFiltersObj({
  //             subjectId: null,
  //             affiliationId: null,
  //             regulationTypeId: null,
  //             academicYearId: currentAcademicYear?.id || null, // Default to current academic year
  //             classId: null,
  //             programCourseId: null,
  //             subjectTypeId: null,
  //             isOptional: null,
  //             autoAssign: null,
  //             searchText: "",
  //             page: 1,
  //             limit: 10,
  //           });
  //         }

  //         // Fetch all data initially
  //         await fetchFilteredData();

  //         setError(null);
  //       } catch (err: unknown) {
  //         console.error("Error fetching data:", err);

  //         // Check for authentication error
  //         if (err instanceof AxiosError && err.response?.status === 401) {
  //           const errorMessage = "Authentication failed. Please log in again.";
  //           setError(errorMessage);
  //           toast.error(errorMessage);
  //         } else {
  //           const errorMessage = err instanceof Error ? err.message : "Failed to load data";
  //           setError(errorMessage);
  //           toast.error("Failed to load data");
  //         }

  //         // Log more details about the error
  //         if (err instanceof Error) {
  //           console.error("Error name:", err.name);
  //           console.error("Error message:", err.message);
  //           console.error("Error stack:", err.stack);
  //         }

  //         // Set empty arrays on error to prevent map errors
  //         setPapers([]);
  //         setSubjects([]);
  //         setAffiliations([]);
  //         setRegulationTypes([]);
  //         setSubjectTypes([]);
  //         setExamComponents([]);
  //         // Academic years come from Redux state, don't reset them
  //         setProgramCourses([]);
  //         setClasses([]);
  //       } finally {
  //         setLoading(false);
  //       }
  //     },
  //     [fetchFilteredData, currentAcademicYear],
  //   );

  // Setup socket connection for real-time exam updates
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({
    userId,
  });

  // Fetch filter options on mount
  React.useEffect(() => {
    Promise.all([getAllExamTypes(), getAllClasses(), getAffiliations(), getRegulationTypes()]).then(
      ([examTypesRes, classesData, affiliationsData, regulationTypesData]) => {
        setExamTypes(examTypesRes.payload || []);
        setClasses(classesData || []);
        setAffiliations(affiliationsData || []);
        setRegulationTypes(regulationTypesData || []);
      },
    );
  }, []);

  // Set default filters after data loads
  React.useEffect(() => {
    if (!isInitialized && currentAcademicYear && examGroups.length > 0) {
      // Determine smart default status
      const now = new Date();
      let hasRecent = false;
      let hasUpcoming = false;

      examGroups.forEach((examGroup) => {
        examGroup.exams.forEach((exam) => {
          if (!exam.examSubjects || exam.examSubjects.length === 0) return;

          const dates = exam.examSubjects
            .map((sub) => ({
              start: new Date(sub.startTime),
              end: new Date(sub.endTime),
            }))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

          const firstStart = dates[0]?.start;
          const lastEnd = dates[dates.length - 1]?.end;

          if (firstStart && lastEnd) {
            // Check if recent (ongoing or ended within 7 days)
            if (firstStart <= now && lastEnd >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
              hasRecent = true;
            }
            // Check if upcoming
            if (firstStart > now) {
              hasUpcoming = true;
            }
          }
        });
      });

      const defaultStatus = hasRecent ? "recent" : hasUpcoming ? "upcoming" : "previous";

      setFilters((prev) => ({
        ...prev,
        academicYearId: currentAcademicYear.id!,
        status: defaultStatus,
      }));
      setIsInitialized(true);
    }
  }, [currentAcademicYear, examGroups, isInitialized]);

  // Memoize fetch function to avoid recreating on every render
  const refetchExams = React.useCallback(() => {
    fetchExamGroups(currentPage, itemsPerPage, filters).then((data) => {
      setExamGroups(data.content);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalElements);
    });
  }, [currentPage, itemsPerPage, filters]);

  // Listen for exam management updates (broadcast to staff/admin only; toast shows who did the action)
  React.useEffect(() => {
    if (!socket || !isConnected || (user?.type !== "ADMIN" && user?.type !== "STAFF")) return;

    const handleExamManagementUpdate = (data: {
      entity: string;
      action: string;
      entityId?: number;
      userName?: string;
      performedByUserId?: number | null;
      message?: string;
    }) => {
      if (data.entity !== "exam" && data.entity !== "exam_group") return;
      // Do not show toast to the user who performed the action (compare with type coercion)
      const currentId = user?.id != null ? Number(user.id) : null;
      const performerId = data.performedByUserId != null ? Number(data.performedByUserId) : null;
      const isSelf = currentId != null && performerId != null && currentId === performerId;
      const displayName = isSelf ? "You" : data.userName || "Someone";
      const actionText =
        data.action === "created"
          ? "created a new exam"
          : data.action === "updated"
            ? "updated an exam"
            : data.action === "deleted"
              ? "deleted an exam"
              : "made changes to exams";
      if (!isSelf) {
        toast.info(`${displayName} ${actionText}. Refreshing...`, {
          duration: 3000,
        });
      }
      refetchExams();
    };

    socket.on("exam_management_update", handleExamManagementUpdate);

    return () => {
      socket.off("exam_management_update", handleExamManagementUpdate);
    };
  }, [socket, isConnected, user?.type, user?.id, refetchExams]);

  useEffect(() => {
    // Only fetch data when authentication is ready, and only on initial mount
    if (displayFlag && accessToken && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchExamGroups(currentPage, itemsPerPage, filters).then((data) => {
        setExamGroups(data.content);
        setTotalItems(data.totalElements);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayFlag, accessToken, currentPage, filters]);

  // Refetch when filters change (after initialization)
  useEffect(() => {
    if (hasInitialized.current && displayFlag && accessToken) {
      fetchExamGroups(currentPage, itemsPerPage, filters).then((data) => {
        setExamGroups(data.content);
        setTotalItems(data.totalElements);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  //   const handlePaperEditSubmit = async (data: PaperDto) => {
  //     console.log("Paper edit submitted with data:", data);
  //     console.log("Selected paper for edit:", selectedPaperForEdit);
  //     try {
  //       if (!selectedPaperForEdit?.id) {
  //         toast.error("Paper ID not found");
  //         return;
  //       }

  //       console.log("Calling updatePaperWithComponents with:", {
  //         paperId: selectedPaperForEdit.id,
  //         data: data,
  //       });

  //       // Transform the data to match the API expected format
  //       const updateData: PaperDto = {
  //         classId: data.classId,
  //         name: data.name,
  //         subjectId: data.subjectId,
  //         affiliationId: data.affiliationId,
  //         regulationTypeId: data.regulationTypeId,
  //         academicYearId: data.academicYearId,
  //         programCourseId: data.programCourseId,
  //         subjectTypeId: data.subjectTypeId,
  //         code: data.code,
  //         topics: data.topics,
  //         isOptional: data.isOptional,
  //         autoAssign: (data as unknown as { autoAssign?: boolean }).autoAssign ?? false,
  //         isActive: data.isActive,
  //         components:
  //           data.components
  //             ?.filter(
  //               (comp: PaperComponentDto) => comp.examComponent?.id && comp.fullMarks !== null && comp.credit !== null,
  //             )
  //             .map((comp: PaperComponentDto) => ({
  //               paperId: comp.paperId!,
  //               examComponent: comp.examComponent!,
  //               fullMarks: comp.fullMarks ?? 0,
  //               credit: comp.credit ?? 0,
  //             })) || [],
  //       };

  //       await updatePaperWithComponents(selectedPaperForEdit.id, updateData);
  //       toast.success("Paper updated successfully!");
  //       setIsPaperEditModalOpen(false);
  //       setSelectedPaperForEdit(null);
  //       fetchFilteredData(); // Refresh the data
  //     } catch (error: unknown) {
  //       const errorMessage = error instanceof Error ? error.message : "Failed to update paper";
  //       toast.error(`Failed to update paper: ${errorMessage}`);
  //       console.error("Full error object:", error);
  //     }
  //   };

  //   const handleAddNew = () => {
  //     setSelectedPaper(null);
  //     setIsFormOpen(true);
  //   };

  //   const handleDownload = async () => {
  //     setIsDownloading(true);
  //     setDownloadProgress(0);
  //     toast.info("Preparing download...");

  //     try {
  //       // First, get total count to calculate progress
  //       console.log("Getting total count for download with filters:", filtersObj);
  //       setDownloadProgress(5);
  //       toast.info("Calculating total records...");

  //       // Use larger page size for initial count to reduce API calls
  //       const firstPage = await getPapersPaginated(1, 100, {
  //         subjectId: filtersObj.subjectId,
  //         affiliationId: filtersObj.affiliationId,
  //         regulationTypeId: filtersObj.regulationTypeId,
  //         academicYearId: filtersObj.academicYearId,
  //         subjectTypeId: filtersObj.subjectTypeId,
  //         programCourseId: filtersObj.programCourseId,
  //         classId: filtersObj.classId,
  //         isOptional: filtersObj.isOptional,
  //         searchText: searchText || undefined,
  //       });

  //       const totalRecords = firstPage.totalElements;
  //       const totalPages = firstPage.totalPages;
  //       const pageSize = 100; // Larger page size for download (10x faster)

  //       console.log(`Total records to download: ${totalRecords} across ${totalPages} pages`);
  //       toast.info(`Found ${totalRecords} records across ${totalPages} pages. Starting download...`);

  //       // Collect all data with parallel fetching for maximum speed
  //       const allData: PaperDto[] = [];

  //       // Process pages in batches of 5 for parallel fetching
  //       const batchSize = 5;
  //       const totalBatches = Math.ceil(totalPages / batchSize);

  //       for (let batch = 0; batch < totalBatches; batch++) {
  //         const startPage = batch * batchSize + 1;
  //         const endPage = Math.min(startPage + batchSize - 1, totalPages);

  //         const batchProgress = Math.round((batch / totalBatches) * 80) + 5; // 5-85% for data fetching
  //         setDownloadProgress(batchProgress);

  //         console.log(`Fetching batch ${batch + 1}/${totalBatches} (pages ${startPage}-${endPage})...`);
  //         toast.info(`Fetching batch ${batch + 1}/${totalBatches} (${allData.length}/${totalRecords} records)`);

  //         // Fetch multiple pages in parallel
  //         const pagePromises: Promise<PaginatedResponse<PaperDto>>[] = [];
  //         for (let page = startPage; page <= endPage; page++) {
  //           pagePromises.push(
  //             getPapersPaginated(page, pageSize, {
  //               subjectId: filtersObj.subjectId,
  //               affiliationId: filtersObj.affiliationId,
  //               regulationTypeId: filtersObj.regulationTypeId,
  //               academicYearId: filtersObj.academicYearId,
  //               subjectTypeId: filtersObj.subjectTypeId,
  //               programCourseId: filtersObj.programCourseId,
  //               classId: filtersObj.classId,
  //               isOptional: filtersObj.isOptional,
  //               searchText: searchText || undefined,
  //             }),
  //           );
  //         }

  //         // Wait for all pages in this batch to complete
  //         const batchResults = await Promise.all(pagePromises);

  //         // Add all results to our data array
  //         for (const pageData of batchResults) {
  //           allData.push(...pageData.content);
  //         }

  //         // Small delay between batches to prevent overwhelming the server
  //         if (batch < totalBatches - 1) {
  //           await new Promise((resolve) => setTimeout(resolve, 100));
  //         }
  //       }

  //       console.log(`Fetched all data for download: ${allData.length} papers`);
  //       setDownloadProgress(85);
  //       toast.info(`Fetched ${allData.length} records, preparing Excel...`);

  //       // Simulate progress based on actual data processing
  //       const progressInterval = setInterval(() => {
  //         setDownloadProgress((prev) => {
  //           if (prev >= 95) return prev;
  //           return prev + Math.random() * 5;
  //         });
  //       }, 100);

  //       // Prepare Excel data from ALL fetched data
  //       const excelData = allData.map((paper, index) => {
  //         // Find related data from the already loaded dropdowns
  //         const subject = subjects.find((s) => s.id === paper.subjectId);
  //         const affiliation = affiliations.find((a) => a.id === paper.affiliationId);
  //         const regulationType = regulationTypes.find((rt) => rt.id === paper.regulationTypeId);
  //         const academicYear = availableAcademicYears.find((ay) => ay.id === paper.academicYearId);
  //         const subjectType = subjectTypes.find((st) => st.id === paper.subjectTypeId);
  //         const programCourse = programCourses.find((pc) => pc.id === paper.programCourseId);
  //         const classInfo = classes.find((c) => c.id === paper.classId);

  //         return {
  //           "Sr. No.": index + 1,
  //           "Program Course": programCourse?.name || "-",
  //           "Subject & Paper": paper.name || "-",
  //           "Subject Name": subject?.name || "-",
  //           "Paper Code": paper.code || "-",
  //           "Subject Category": subjectType?.code || "-",
  //           "Subject Category Name": subjectType?.name || "-",
  //           Semester: classInfo?.name?.split(" ")[1] || "-",
  //           "Is Optional": paper.isOptional ? "No" : "Yes",
  //           Affiliation: affiliation?.name || "-",
  //           "Regulation Type": regulationType?.name || "-",
  //           "Academic Year": academicYear?.year || "-",
  //           "Exam Components": paper.components?.map((comp) => comp.examComponent?.name).join(", ") || "No components",
  //         };
  //       });

  //       console.log("Excel data prepared:", excelData.length, "rows");

  //       // Create Excel file using XLSX library
  //       const wb = XLSX.utils.book_new();
  //       const ws = XLSX.utils.json_to_sheet(excelData);

  //       // Set column widths
  //       const colWidths = [
  //         { wch: 8 }, // Sr. No.
  //         { wch: 30 }, // Program Course
  //         { wch: 25 }, // Subject & Paper
  //         { wch: 25 }, // Subject Name
  //         { wch: 15 }, // Paper Code
  //         { wch: 15 }, // Subject Category
  //         { wch: 20 }, // Subject Category Name
  //         { wch: 10 }, // Semester
  //         { wch: 12 }, // Is Optional
  //         { wch: 20 }, // Affiliation
  //         { wch: 15 }, // Regulation Type
  //         { wch: 15 }, // Academic Year
  //         { wch: 30 }, // Exam Components
  //       ];
  //       ws["!cols"] = colWidths;

  //       XLSX.utils.book_append_sheet(wb, ws, "Subject Paper Mapping");

  //       // Generate buffer
  //       console.log("Generating Excel buffer...");
  //       const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  //       clearInterval(progressInterval);
  //       setDownloadProgress(100);

  //       // Create blob from buffer
  //       const blob = new Blob([buffer], {
  //         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //       });

  //       console.log("Blob created, size:", blob.size);

  //       // Create download link
  //       const url = window.URL.createObjectURL(blob);
  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.download = `subject-paper-mapping-${new Date().toISOString().split("T")[0]}.xlsx`;
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
  //       window.URL.revokeObjectURL(url);

  //       toast.success(`Download completed! ${allData.length} records exported.`);
  //     } catch (error: unknown) {
  //       console.error("Download failed:", error);
  //       toast.error(`Download failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  //     } finally {
  //       setTimeout(() => {
  //         setIsDownloading(false);
  //         setDownloadProgress(0);
  //       }, 1000);
  //     }
  //   };

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

  //   const handleBulkUpload = async () => {
  //     if (!bulkFile) return;

  //     setIsBulkUploading(true);
  //     try {
  //       const result = await bulkUploadSubjectPapers(bulkFile);
  //       setBulkUploadResult(result);

  //       if (result.summary.successful > 0) {
  //         toast.success(`Successfully uploaded ${result.summary.successful} papers`);
  //         // Re-fetch the data to show new papers
  //         // You might want to add a fetch function here
  //       }

  //       if (result.summary.failed > 0) {
  //         toast.error(`${result.summary.failed} papers failed to upload`);
  //       }
  //     } catch (error: unknown) {
  //       const errorMessage = error instanceof Error ? error.message : "Unknown error";
  //       toast.error(`Bulk upload failed: ${errorMessage}`);
  //     } finally {
  //       setIsBulkUploading(false);
  //     }
  //   };

  //   const handleDownloadTemplate = () => {
  //     // Create template data with headers
  //     const templateData = [
  //       {
  //         Subject: "",
  //         "Subject Type": "",
  //         "Applicable programCourses": "",
  //         Affiliation: "",
  //         Regulation: "",
  //         "Academic Year": "",
  //         "Course Type": "",
  //         Class: "",
  //         "Paper Code": "",
  //         "Paper Name": "",
  //         "Is Optional": "",
  //         ...examComponents.reduce(
  //           (acc, component) => {
  //             acc[`Full Marks ${component.code}`] = "";
  //             acc[`Credit ${component.code}`] = "";
  //             return acc;
  //           },
  //           {} as Record<string, string>,
  //         ),
  //       },
  //     ];

  //     // Create workbook and worksheet
  //     const wb = XLSX.utils.book_new();
  //     const ws = XLSX.utils.json_to_sheet(templateData);

  //     // Set column widths
  //     const colWidths = [
  //       { wch: 20 }, // Subject
  //       { wch: 15 }, // Subject Type
  //       { wch: 25 }, // Applicable programCourses
  //       { wch: 20 }, // Affiliation
  //       { wch: 15 }, // Regulation
  //       { wch: 15 }, // Academic Year
  //       { wch: 15 }, // Paper Code
  //       { wch: 25 }, // Paper Name
  //       { wch: 12 }, // Is Optional
  //       ...examComponents.flatMap(() => [
  //         { wch: 15 }, // Full Marks
  //         { wch: 12 }, // Credit
  //       ]),
  //     ];
  //     ws["!cols"] = colWidths;

  //     // Add worksheet to workbook
  //     XLSX.utils.book_append_sheet(wb, ws, "Subject Paper Mapping Template");

  //     // Download the file
  //     XLSX.writeFile(wb, "subject-paper-mapping-template.xlsx");
  //   };

  //   useEffect(() => {

  //   }, []);

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
      <div className="p-2 sm:p-4">
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
      <div className="p-2 sm:p-4">
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
        <CardHeader className="flex flex-col items-start mb-3 gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0 w-full">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <FileText className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Exams</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">List of exams got scheduled.</div>
          </div>
          {/* <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
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
            </Dialog> */}
          {/* <Button variant="outline" onClick={handleDownloadTemplate} className="flex-shrink-0">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </Button> */}
          {/* <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 hidden md:flex"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full min-w-[95vw] sm:min-w-[80vw] min-h-[98vh] overflow-auto flex flex-col">
                <AlertDialogHeader className="border-b pb-2">
                  <AlertDialogTitle>
                    {selectedPaper ? "Edit Subject Paper Mapping" : "Add New Subject Paper Mapping"}
                  </AlertDialogTitle>
                </AlertDialogHeader>

                

                <AddPaperModal
                  dropdownData={{
                    subjectTypes,
                    courseTypes,
                    subjects,
                    courses: courses,
                    affiliations,
                    regulationTypes,
                    examComponents,
                    academicYears: availableAcademicYears,
                    programCourses,
                    classes,
                  }}
                  fetchData={fetchData}
                  onCancel={() => setIsFormOpen(false)}
                  isLoading={false}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div> */}
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-40 bg-background p-2 sm:p-4 border-b flex flex-col items-start gap-3 mb-0">
            <div className="flex flex-wrap gap-2 items-center w-full">
              {/* <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Filters</Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Filter Subject Papers</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 overflow-y-auto flex-1 min-h-0">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Affiliation</div>
                      <Select
                        value={filtersObj.affiliationId?.toString() ?? "all"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({ ...prev, affiliationId: value === "all" ? null : Number(value) }))
                        }
                      >
                        <SelectTrigger className="w-full">
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
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Academic Year</div>
                      <Select
                        value={filtersObj.academicYearId?.toString() ?? "all"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({ ...prev, academicYearId: value === "all" ? null : Number(value) }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Academic Years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Academic Years</SelectItem>
                          {availableAcademicYears.map((ay) => (
                            <SelectItem key={ay.id!} value={ay.id!.toString()}>
                              {ay.year}
                              {ay.isCurrentYear === true && (
                                <span className="ml-2 px-1 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                  Current
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Regulation Type</div>
                      <Select
                        value={filtersObj.regulationTypeId?.toString() ?? "all"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({
                            ...prev,
                            regulationTypeId: value === "all" ? null : Number(value),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
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
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Subject</div>
                      <Select
                        value={filtersObj.subjectId?.toString() ?? "all"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({ ...prev, subjectId: value === "all" ? null : Number(value) }))
                        }
                      >
                        <SelectTrigger className="w-full">
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
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Semester</div>
                      <Select
                        value={filtersObj.classId?.toString() ?? "all"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({ ...prev, classId: value === "all" ? null : Number(value) }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Semesters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Semesters</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id!} value={cls.id!.toString()}>
                              {cls.name.split(" ")[1] || cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Program Course</div>
                      <Select
                        value={filtersObj.programCourseId?.toString() ?? "all"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({
                            ...prev,
                            programCourseId: value === "all" ? null : Number(value),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Program Courses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Program Courses</SelectItem>
                          {programCourses.map((pc) => (
                            <SelectItem key={pc.id!} value={pc.id!.toString()}>
                              {pc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Subject Type</div>
                      <Select
                        value={filtersObj.subjectTypeId?.toString() ?? "all"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({ ...prev, subjectTypeId: value === "all" ? null : Number(value) }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Subject Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subject Types</SelectItem>
                          {subjectTypes.map((st) => (
                            <SelectItem key={st.id!} value={st.id!.toString()}>
                              {st.code ?? ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Is Optional</div>
                      <Select
                        value={filtersObj.isOptional === null ? "all" : filtersObj.isOptional ? "true" : "false"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({
                            ...prev,
                            isOptional: value === "all" ? null : value === "true",
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Papers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Papers</SelectItem>
                          <SelectItem value="true">Optional Papers</SelectItem>
                          <SelectItem value="false">Non-Optional Papers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Auto Assigned</div>
                      <Select
                        value={filtersObj.autoAssign === null ? "all" : filtersObj.autoAssign ? "true" : "false"}
                        onValueChange={(value) =>
                          setFiltersObj((prev) => ({
                            ...prev,
                            autoAssign: value === "all" ? null : value === "true",
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="true">Auto Assigned</SelectItem>
                          <SelectItem value="false">Manually Assigned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t flex-shrink-0 mt-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFiltersObj((prev) => ({
                          ...prev,
                          subjectId: null,
                          affiliationId: null,
                          regulationTypeId: null,
                          academicYearId: null,
                          classId: null,
                          programCourseId: null,
                          subjectTypeId: null,
                          isOptional: null,
                          searchText: "",
                          page: 1,
                          limit: itemsPerPage,
                        }));
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentPage(1);
                        setIsFilterOpen(false);
                        fetchFilteredData();
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog> */}

              {/* Active Filters Badges */}
              {/* <div className="flex flex-wrap items-center gap-2 ml-2">
                {filtersObj.affiliationId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-purple-300 text-purple-700 bg-purple-50 flex items-center gap-1"
                  >
                    {affiliations.find((a) => a.id === filtersObj.affiliationId)?.name || "Affiliation"}
                    <button
                      aria-label="Clear affiliation filter"
                      className="ml-1 hover:text-purple-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, affiliationId: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.academicYearId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-300 text-slate-700 bg-slate-50 flex items-center gap-1"
                  >
                    {availableAcademicYears.find((ay) => ay.id === filtersObj.academicYearId)?.year || "Year"}
                    <button
                      aria-label="Clear academic year filter"
                      className="ml-1 hover:text-slate-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, academicYearId: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.regulationTypeId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-teal-300 text-teal-700 bg-teal-50 flex items-center gap-1"
                  >
                    {regulationTypes.find((rt) => rt.id === filtersObj.regulationTypeId)?.name || "Regulation"}
                    <button
                      aria-label="Clear regulation filter"
                      className="ml-1 hover:text-teal-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, regulationTypeId: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.subjectId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50 flex items-center gap-1"
                  >
                    {subjects.find((s) => s.id === filtersObj.subjectId)?.name || "Subject"}
                    <button
                      aria-label="Clear subject filter"
                      className="ml-1 hover:text-indigo-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, subjectId: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.classId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-orange-300 text-orange-700 bg-orange-50 flex items-center gap-1"
                  >
                    {classes.find((c) => c.id === filtersObj.classId)?.name || "Semester"}
                    <button
                      aria-label="Clear semester filter"
                      className="ml-1 hover:text-orange-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, classId: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.programCourseId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-300 text-blue-700 bg-blue-50 flex items-center gap-1"
                  >
                    {programCourses.find((pc) => pc.id === filtersObj.programCourseId)?.name || "Program Course"}
                    <button
                      aria-label="Clear program course filter"
                      className="ml-1 hover:text-blue-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, programCourseId: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.subjectTypeId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50 flex items-center gap-1"
                  >
                    {subjectTypes.find((st) => st.id === filtersObj.subjectTypeId)?.code || "Subject Type"}
                    <button
                      aria-label="Clear subject type filter"
                      className="ml-1 hover:text-emerald-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, subjectTypeId: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.isOptional !== null && (
                  <Badge
                    variant="outline"
                    className="text-xs border-rose-300 text-rose-700 bg-rose-50 flex items-center gap-1"
                  >
                    {filtersObj.isOptional ? "Optional Papers" : "Non-Optional Papers"}
                    <button
                      aria-label="Clear is optional filter"
                      className="ml-1 hover:text-rose-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, isOptional: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filtersObj.autoAssign !== null && (
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-300 text-blue-700 bg-blue-50 flex items-center gap-1"
                  >
                    {filtersObj.autoAssign ? "Auto Assigned" : "Manual"}
                    <button
                      aria-label="Clear auto-assigned filter"
                      className="ml-1 hover:text-blue-900"
                      onClick={() => {
                        setFiltersObj((prev) => ({ ...prev, autoAssign: null }));
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div> */}
            </div>

            {/* Filter Button and Active Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 justify-start">
              {/* Filter Dialog Trigger */}
              <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {Object.values(filters).filter((v) => v !== null && v !== undefined).length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {Object.values(filters).filter((v) => v !== null && v !== undefined).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Filter Exams</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Grid layout for main filters - 2 rows x 3 columns */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Academic Year Filter */}
                      <div className="grid gap-2">
                        <Label htmlFor="academic-year">Academic Year</Label>
                        <Select
                          value={filters.academicYearId?.toString() || "all"}
                          onValueChange={(value) =>
                            setFilters({ ...filters, academicYearId: value === "all" ? null : Number(value) })
                          }
                        >
                          <SelectTrigger id="academic-year">
                            <SelectValue placeholder="All Academic Years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Academic Years</SelectItem>
                            {availableAcademicYears.map((year) => (
                              <SelectItem key={year.id} value={year.id!.toString()}>
                                {year.year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Exam Type Filter */}
                      <div className="grid gap-2">
                        <Label htmlFor="exam-type">Exam Type</Label>
                        <Select
                          value={filters.examTypeId?.toString() || "all"}
                          onValueChange={(value) =>
                            setFilters({ ...filters, examTypeId: value === "all" ? null : Number(value) })
                          }
                        >
                          <SelectTrigger id="exam-type">
                            <SelectValue placeholder="All Exam Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Exam Types</SelectItem>
                            {examTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id!.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Semester Filter */}
                      <div className="grid gap-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select
                          value={filters.classId?.toString() || "all"}
                          onValueChange={(value) =>
                            setFilters({ ...filters, classId: value === "all" ? null : Number(value) })
                          }
                        >
                          <SelectTrigger id="semester">
                            <SelectValue placeholder="All Semesters" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            {classes
                              .filter((c) => c.type === "SEMESTER")
                              .map((cls) => (
                                <SelectItem key={cls.id} value={cls.id!.toString()}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Affiliation Filter */}
                      <div className="grid gap-2">
                        <Label htmlFor="affiliation">Affiliation</Label>
                        <Select
                          value={filters.affiliationId?.toString() || "all"}
                          onValueChange={(value) =>
                            setFilters({ ...filters, affiliationId: value === "all" ? null : Number(value) })
                          }
                        >
                          <SelectTrigger id="affiliation">
                            <SelectValue placeholder="All Affiliations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Affiliations</SelectItem>
                            {affiliations.map((affiliation) => (
                              <SelectItem key={affiliation.id} value={affiliation.id!.toString()}>
                                {affiliation.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Regulation Type Filter */}
                      <div className="grid gap-2">
                        <Label htmlFor="regulation">Regulation</Label>
                        <Select
                          value={filters.regulationTypeId?.toString() || "all"}
                          onValueChange={(value) =>
                            setFilters({ ...filters, regulationTypeId: value === "all" ? null : Number(value) })
                          }
                        >
                          <SelectTrigger id="regulation">
                            <SelectValue placeholder="All Regulations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regulations</SelectItem>
                            {regulationTypes.map((regulation) => (
                              <SelectItem key={regulation.id} value={regulation.id!.toString()}>
                                {regulation.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={filters.status || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              status: value === "all" ? null : (value as "upcoming" | "recent" | "previous"),
                            })
                          }
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="recent">Recent</SelectItem>
                            <SelectItem value="previous">Previous</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date Range Filter - Full Width */}
                    <div className="grid gap-2">
                      <Label>Date Range (Admit Card Window)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                            From
                          </Label>
                          <Input
                            id="date-from"
                            type="date"
                            value={filters.dateFrom || ""}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                            To
                          </Label>
                          <Input
                            id="date-to"
                            type="date"
                            value={filters.dateTo || ""}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const defaultAcademicYearId = currentAcademicYear?.id || null;
                        setFilters({
                          examTypeId: null,
                          classId: null,
                          academicYearId: defaultAcademicYearId,
                          affiliationId: null,
                          regulationTypeId: null,
                          dateFrom: null,
                          dateTo: null,
                          status: null,
                        });
                        setCurrentPage(1);
                      }}
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentPage(1);
                        setIsFilterDialogOpen(false);
                        refetchExams();
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Active Filter Badges */}
              <div className="flex flex-wrap items-center gap-2 ml-2">
                {filters.academicYearId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-300 text-slate-700 bg-slate-50 flex items-center gap-1"
                  >
                    {availableAcademicYears.find((y) => y.id === filters.academicYearId)?.year || "Academic Year"}
                    <button
                      aria-label="Clear academic year filter"
                      className="ml-1 hover:text-slate-900"
                      onClick={() => {
                        setFilters({ ...filters, academicYearId: null });
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.examTypeId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50 flex items-center gap-1"
                  >
                    {examTypes.find((t) => t.id === filters.examTypeId)?.name || "Exam Type"}
                    <button
                      aria-label="Clear exam type filter"
                      className="ml-1 hover:text-indigo-900"
                      onClick={() => {
                        setFilters({ ...filters, examTypeId: null });
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.classId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-orange-300 text-orange-700 bg-orange-50 flex items-center gap-1"
                  >
                    {classes.find((c) => c.id === filters.classId)?.name || "Semester"}
                    <button
                      aria-label="Clear semester filter"
                      className="ml-1 hover:text-orange-900"
                      onClick={() => {
                        setFilters({ ...filters, classId: null });
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.affiliationId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-purple-300 text-purple-700 bg-purple-50 flex items-center gap-1"
                  >
                    {affiliations.find((a) => a.id === filters.affiliationId)?.name || "Affiliation"}
                    <button
                      aria-label="Clear affiliation filter"
                      className="ml-1 hover:text-purple-900"
                      onClick={() => {
                        setFilters({ ...filters, affiliationId: null });
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.regulationTypeId && (
                  <Badge
                    variant="outline"
                    className="text-xs border-teal-300 text-teal-700 bg-teal-50 flex items-center gap-1"
                  >
                    {regulationTypes.find((r) => r.id === filters.regulationTypeId)?.name || "Regulation"}
                    <button
                      aria-label="Clear regulation filter"
                      className="ml-1 hover:text-teal-900"
                      onClick={() => {
                        setFilters({ ...filters, regulationTypeId: null });
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-300 text-blue-700 bg-blue-50 flex items-center gap-1"
                  >
                    {filters.dateFrom && filters.dateTo
                      ? `${filters.dateFrom} to ${filters.dateTo}`
                      : filters.dateFrom
                        ? `From ${filters.dateFrom}`
                        : `To ${filters.dateTo}`}
                    <button
                      aria-label="Clear date range filter"
                      className="ml-1 hover:text-blue-900"
                      onClick={() => {
                        setFilters({ ...filters, dateFrom: null, dateTo: null });
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.status && (
                  <Badge
                    variant="outline"
                    className="text-xs border-rose-300 text-rose-700 bg-rose-50 flex items-center gap-1"
                  >
                    {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                    <button
                      aria-label="Clear status filter"
                      className="ml-1 hover:text-rose-900"
                      onClick={() => {
                        setFilters({ ...filters, status: null });
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
            {/* <div className="relative flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => handleDownload()}
                disabled={isDownloading}
                className="w-full sm:w-auto"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">
                  {isDownloading ? `Downloading... ${Math.round(downloadProgress)}%` : "Download All"}
                </span>
                <span className="sm:hidden">{isDownloading ? `${Math.round(downloadProgress)}%` : "Download"}</span>
              </Button>
              {isDownloading && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}
            </div> */}
          </div>
          <div className="relative z-50 bg-white" style={{ height: "600px" }}>
            <div className="overflow-y-auto text-[14px] overflow-x-auto h-full border rounded-md">
              {/* Fixed Header */}
              <div className="sticky top-0 z-50 text-gray-500 bg-gray-100 border-b" style={{ minWidth: "950px" }}>
                <div className="flex">
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "6%" }}
                  >
                    Sr. No.
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "11%" }}
                  >
                    Exam Type
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "16%" }}
                  >
                    Exam Group Name
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "16%" }}
                  >
                    Program Courses
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "11%" }}
                  >
                    Subjects
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "11%" }}
                  >
                    Shift(s)
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "11%" }}
                  >
                    Subject Category
                  </div>
                  <div
                    className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center"
                    style={{ width: "11%" }}
                  >
                    Semester
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
                  <div className="flex items-center justify-center p-4 text-center" style={{ minWidth: "1050px" }}>
                    Loading...
                  </div>
                ) : (
                  examGroups.map((examGroup: ExamGroupDto, groupIdx: number) => {
                    // Extract all distinct exam types from the group
                    const distinctExamTypeMap = new Map<number, (typeof examGroup.exams)[0]["examType"]>();
                    examGroup.exams.forEach((exam) => {
                      distinctExamTypeMap.set(exam.examType.id, exam.examType);
                    });
                    const distinctExamTypes = Array.from(distinctExamTypeMap.values());

                    // Extract all distinct program courses from the group
                    const distinctPCMap = new Map<
                      number | undefined,
                      (typeof examGroup.exams)[0]["examProgramCourses"][0]
                    >();
                    examGroup.exams.forEach((exam) => {
                      exam.examProgramCourses.forEach((pc) => {
                        if (pc.programCourse.id !== undefined) {
                          distinctPCMap.set(pc.programCourse.id, pc);
                        }
                      });
                    });
                    const distinctProgramCourses = Array.from(distinctPCMap.values());

                    // Extract all distinct subjects from the group
                    const distinctSubjectMap = new Map<
                      number | undefined,
                      (typeof examGroup.exams)[0]["examSubjects"][0]
                    >();
                    examGroup.exams.forEach((exam) => {
                      exam.examSubjects.forEach((es) => {
                        if (es.subject?.id !== undefined) {
                          distinctSubjectMap.set(es.subject.id, es);
                        }
                      });
                    });
                    const distinctSubjects = Array.from(distinctSubjectMap.values());

                    // Extract all distinct shifts from the group
                    const distinctShiftMap = new Map<
                      number | undefined,
                      (typeof examGroup.exams)[0]["examShifts"][0]
                    >();
                    examGroup.exams.forEach((exam) => {
                      exam.examShifts.forEach((esh) => {
                        if (esh.shift.id !== undefined) {
                          distinctShiftMap.set(esh.shift.id, esh);
                        }
                      });
                    });
                    const distinctShifts = Array.from(distinctShiftMap.values());

                    // Extract all distinct subject types from the group
                    const distinctSTMap = new Map<
                      number | undefined,
                      (typeof examGroup.exams)[0]["examSubjectTypes"][0]
                    >();
                    examGroup.exams.forEach((exam) => {
                      exam.examSubjectTypes.forEach((est) => {
                        if (est.subjectType?.id !== undefined) {
                          distinctSTMap.set(est.subjectType.id, est);
                        }
                      });
                    });
                    const distinctSubjectTypes = Array.from(distinctSTMap.values());

                    return (
                      <div
                        key={examGroup.id}
                        className="flex border-b hover:bg-gray-50 group"
                        style={{ minWidth: "1050px" }}
                      >
                        <div
                          className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                          style={{ width: "6%" }}
                        >
                          {(currentPage - 1) * itemsPerPage + groupIdx + 1}
                        </div>
                        <div
                          className="flex-shrink-0 p-3 border-r items-center gap-2 flex flex-col"
                          style={{ width: "11%" }}
                        >
                          {/* Display exam types and exam group commencement date */}
                          <div className="flex flex-col gap-1 items-center w-full">
                            {distinctExamTypes.map((examType) => (
                              <Badge
                                key={examType.id}
                                variant="outline"
                                className="text-xs border-red-300 text-red-700 bg-red-50"
                              >
                                {examType.name}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-center text-xs text-gray-600">
                            {examGroup.examCommencementDate
                              ? new Date(examGroup.examCommencementDate).toLocaleDateString()
                              : "-"}
                          </p>
                        </div>
                        <div
                          className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                          style={{ width: "16%" }}
                        >
                          <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                            {examGroup.name}
                          </Badge>
                        </div>
                        <div
                          className="flex-shrink-0 p-3 border-r flex gap-1 flex-col items-center"
                          style={{ width: "16%" }}
                        >
                          {distinctProgramCourses.map((pc) => (
                            <Badge
                              key={pc.id}
                              variant="outline"
                              className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                            >
                              {pc.programCourse.name}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex-shrink-0 p-3 border-r flex flex-col" style={{ width: "11%" }}>
                          <div className="mt-1 flex flex-col gap-1">
                            {distinctSubjects.map((es, subjectIndex) => (
                              <Badge
                                key={`subject-${es.subject?.id}-${subjectIndex}`}
                                variant="outline"
                                className="text-xs border-indigo-300 text-indigo-700 bg-indigo-50"
                              >
                                {es.subject?.name ?? "-"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div
                          className="flex-shrink-0 p-3 border-r flex flex-col gap-1 items-center justify-center text-sm font-medium"
                          style={{ width: "11%" }}
                        >
                          {distinctShifts.map((esh) => (
                            <Badge
                              key={esh.id}
                              variant="outline"
                              className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                            >
                              {esh.shift.name}
                            </Badge>
                          ))}
                        </div>
                        <div
                          className="flex-shrink-0 p-3 border-r flex gap-1 flex-col items-center justify-center"
                          style={{ width: "11%" }}
                        >
                          {distinctSubjectTypes.map((est) => (
                            <Badge
                              key={est.id}
                              variant="outline"
                              className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                            >
                              {est.subjectType?.code ?? "-"}
                            </Badge>
                          ))}
                        </div>
                        <div
                          className="flex-shrink-0 p-3 border-r flex items-center justify-center"
                          style={{ width: "11%" }}
                        >
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                            {examGroup.exams[0]?.class.name.split(" ")[1] || "-"}
                          </Badge>
                        </div>

                        <div className="flex-shrink-0 p-3 flex items-center justify-center" style={{ width: "6%" }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                //   setIsPaperEditModalOpen(true);
                                //   setSelectedPaperForEdit(sp);
                              }}
                              className="h-5 w-5 p-0"
                            >
                              <Link to={`${examGroup.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {!loading && !error && totalItems > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-0">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
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

      {/* Paper Edit Modal */}
      {/* {
        <PaperEditModal
          isOpen={isPaperEditModalOpen}
          onClose={() => {
            setIsPaperEditModalOpen(false);
            //   setSelectedPaperForEdit(null);
          }}
          onSubmit={(data: PaperDto) => handlePaperEditSubmit(data)}
          isLoading={false}
          givenPaper={selectedPaperForEdit as PaperDto}
          subjects={subjects}
          affiliations={affiliations}
          regulationTypes={regulationTypes}
          subjectTypes={subjectTypes}
          examComponents={examComponents}
          academicYears={availableAcademicYears}
          programCourses={programCourses}
          courses={courses}
          courseTypes={courseTypes}
          classes={classes}
          paperId={selectedPaperForEdit?.id}
        />
      } */}
    </div>
  );
};

export default ExamsPage;
