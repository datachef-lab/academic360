// import React, { useState } from 'react';
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { PlusCircle, FileText, Download, Upload, Edit } from "lucide-react";
// import * as XLSX from 'xlsx';
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// // import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { SubjectPaperMappingForm } from "./subject-paper-mapping-form";
// import { PaperEditModal } from "./paper-edit-modal";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { toast } from "sonner";
// import {
//   getSubjects,
//   getAffiliations,
//   getRegulationTypes,
//   getExamComponents,
//   getSubjectTypes,
//   bulkUploadSubjectPapers,
//   getAcademicYears,
//   getCourses,
//   getPapers,
//   updatePaperWithComponents,
//   BulkUploadRow,
//   BulkUploadError,
//   ExamComponent as ApiExamComponent,
//   AcademicYear as ApiAcademicYear,
// } from '@/services/course-design.api';
// import { getAllClasses } from '@/services/classes.service';
// import { useAuth } from '@/hooks/useAuth';
// import type {
//   Subject,
//   Affiliation,
//   RegulationType,
//   SubjectType,
//   Course,
//   // ExamComponent,
//   Paper,
//   } from '@/types/course-design';
// import { Class } from '@/types/academics/class';
// import { AxiosError } from 'axios';
// // import { AcademicYear } from '@/types/academics/academic-year';

// // Define proper types for the paper data (no longer using subject paper concept)
// interface PaperWithDetails {
//   id: number;
//   subjectId: number;
//   affiliationId: number;
//   regulationTypeId: number;
//   academicYearId: number;
//   subjectTypeId: number;
//   courseId: number;
//   classId: number;
//   name: string;
//   code: string;
//   isOptional: boolean;
//   sequence: number;
//   disabled: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   subjectName?: string;
//   subjectTypeName?: string;
//   subjectTypeCode?: string;
//   courseName?: string;
//   className?: string;
//   paperComponents: PaperComponent[];
// }

// interface PaperComponent {
//   examComponentId: number;
//   fullMarks: number;
//   credit: number;
//   examComponentName: string;
//   examComponentCode: string;
// }

// const SubjectPaperMappingPage = () => {
//   const { accessToken, user } = useAuth();
//   const [searchText, setSearchText] = React.useState("");
//   const [isFormOpen, setIsFormOpen] = React.useState(false);
//   const [selectedPaper, setSelectedPaper] = React.useState<PaperWithDetails | null>(null);
//   const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
//   const [bulkFile, setBulkFile] = React.useState<File | null>(null);
//   const [isPaperEditModalOpen, setIsPaperEditModalOpen] = React.useState(false);
//   const [selectedPaperForEdit, setSelectedPaperForEdit] = React.useState<PaperWithDetails | null>(null);
//   const [subjectFilter, setSubjectFilter] = React.useState<string>("all");
//   const [affiliationFilter, setAffiliationFilter] = React.useState<string>("all");
//   const [regulationTypeFilter, setRegulationTypeFilter] = React.useState<string>("all");
//   const [academicYearFilter, setAcademicYearFilter] = React.useState<string>("all");
//   // State for dropdowns and table
//   const [subjects, setSubjects] = React.useState<Subject[]>([]);
//   const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
//   const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);
//   const [subjectTypes, setSubjectTypes] = React.useState<SubjectType[]>([]);
//   const [papers, setPapers] = React.useState<PaperWithDetails[]>([]);
//   const [academicYears, setAcademicYears] = React.useState<ApiAcademicYear[]>([]);
//   const [examComponents, setExamComponents] = React.useState<ApiExamComponent[]>([]);
//   const [courses, setCourses] = React.useState<Course[]>([]);
//   const [
//     classes, 
//     setClasses] = React.useState<Class[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   // const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);
//   const [currentPage, setCurrentPage] = React.useState(1);
//   const [totalPages, setTotalPages] = React.useState(1);
//   const [totalItems, setTotalItems] = React.useState(0);
//   const [itemsPerPage] = React.useState(10);

//   const testAPIEndpoints = async () => {
//     console.log('Testing individual API endpoints...');

//     try {
//       console.log('Testing subjects API...');
//       const subjectsTest = await getSubjects();
//       console.log('Subjects API response:', subjectsTest);
//     } catch (error) {
//       console.error('Subjects API error:', error);
//     }

//     try {
//       console.log('Testing affiliations API...');
//       const affiliationsTest = await getAffiliations();
//       console.log('Affiliations API response:', affiliationsTest);
//     } catch (error) {
//       console.error('Affiliations API error:', error);
//     }

//     try {
//       console.log('Testing regulation types API...');
//       const regulationTypesTest = await getRegulationTypes();
//       console.log('Regulation types API response:', regulationTypesTest);
//     } catch (error) {
//       console.error('Regulation types API error:', error);
//     }

//     try {
//       console.log('Testing subject types API...');
//       const subjectTypesTest = await getSubjectTypes();
//       console.log('Subject types API response:', subjectTypesTest);
//     } catch (error) {
//       console.error('Subject types API error:', error);
//     }

//     try {
//       console.log('Testing academic years API...');
//       const academicYearsTest = await getAcademicYears();
//       console.log('Academic years API response:', academicYearsTest);
//     } catch (error) {
//       console.error('Academic years API error:', error);
//     }

//     try {
//       console.log('Testing classes API...');
//       const classesTest = await getAllClasses();
//       console.log('Classes API response:', classesTest);
//     } catch (error) {
//       console.error('Classes API error:', error);
//     }
//   };

//   React.useEffect(() => {
//     console.log('Auth state:', { accessToken: !!accessToken, user: !!user });
//     if (accessToken && user) {
//       testAPIEndpoints(); // Test individual endpoints first
//       fetchData();
//     } else {
//       console.log('User not authenticated');
//       setError('Please log in to access this page');
//       setLoading(false);
//       // Initialize papers as empty array when not authenticated
//       setPapers([]);
//     }
//   }, [accessToken, user]);

//   // Fetch filtered data when filters change
//   React.useEffect(() => {
//     if (accessToken && user && subjects.length > 0) {
//       fetchFilteredData();
//     }
//   }, [subjectFilter, affiliationFilter, regulationTypeFilter, academicYearFilter, searchText, currentPage, itemsPerPage]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       console.log('Starting API calls with token:', !!accessToken);
      
//       // Check if we have a valid token
//       if (!accessToken) {
//         throw new Error('No access token available');
//       }

//       const [
//         subjectsRes,
//         affiliationsRes,
//         regulationTypesRes,
//         subjectTypesRes,
//         examComponentsRes,
//         academicYearsRes,
//         coursesRes,
//         classesRes
//       ] = await Promise.all([
//         getSubjects(),
//         getAffiliations(),
//         getRegulationTypes(),
//         getSubjectTypes(),
//         getExamComponents(),
//         getAcademicYears(),
//         getCourses(),
//         getAllClasses(),
//       ]);

//       console.log('API Responses:', {
//         subjects: subjectsRes,
//         affiliations: affiliationsRes,
//         regulationTypes: regulationTypesRes,
//         subjectTypes: subjectTypesRes,
//         examComponents: examComponentsRes,
//         academicYears: academicYearsRes,
//         courses: coursesRes,
//         classes: classesRes,
//       });

//       console.log('SubjectTypes response details:', {
//         isArray: Array.isArray(subjectTypesRes),
//         length: Array.isArray(subjectTypesRes) ? subjectTypesRes.length : 'not array',
//         data: subjectTypesRes,
//       });

//       // Handle different response structures
//       setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
//       setAffiliations(Array.isArray(affiliationsRes) ? affiliationsRes : []);
//       setRegulationTypes(Array.isArray(regulationTypesRes) ? regulationTypesRes : []);
//       setSubjectTypes(Array.isArray(subjectTypesRes) ? subjectTypesRes : []);
//       setExamComponents(Array.isArray(examComponentsRes) ? examComponentsRes : []);
//       setAcademicYears(Array.isArray(academicYearsRes) ? academicYearsRes : []);
//       setCourses(Array.isArray(coursesRes) ? coursesRes : []);
//       setClasses(Array.isArray(classesRes) ? classesRes : (classesRes as unknown as { payload: Class[] })?.payload || []);
//       console.log('Classes data set:', Array.isArray(classesRes) ? classesRes : (classesRes as unknown as { payload: Class[] })?.payload || []);
//       console.log('Filtered SEMESTER classes:', Array.isArray(classesRes) ? classesRes.filter((cls: Class) => cls.type === 'SEMESTER') : (classesRes as unknown as { payload: Class[] })?.payload?.filter((cls: Class) => cls.type === 'SEMESTER') || []);

//       // Fetch filtered data
//       await fetchFilteredData();

//       setError(null);
//     } catch (err: unknown) {
//       console.error('Error fetching data:', err);
      
//       // Check for authentication error
//       if (err instanceof AxiosError && err.response?.status === 401) {
//         const errorMessage = 'Authentication failed. Please log in again.';
//         setError(errorMessage);
//         toast.error(errorMessage);
//       } else {
//         const errorMessage = err instanceof Error ? err.message : "Failed to load data";
//         setError(errorMessage);
//         toast.error("Failed to load data");
//       }

//       // Log more details about the error
//       if (err instanceof Error) {
//         console.error('Error name:', err.name);
//         console.error('Error message:', err.message);
//         console.error('Error stack:', err.stack);
//       }
      
//       // Set empty arrays on error to prevent map errors
//       setPapers([]);
//       setSubjects([]);
//       setAffiliations([]);
//       setRegulationTypes([]);
//       setSubjectTypes([]);
//       setExamComponents([]);
//       setAcademicYears([]);
//       setCourses([]);
//       setClasses([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchFilteredData = async () => {
//     try {
//       // Check if we have a valid token
//       if (!accessToken) {
//         throw new Error('No access token available');
//       }
      
//       const filters = {
//         subjectId: subjectFilter !== "all" ? Number(subjectFilter) : undefined,
//         affiliationId: affiliationFilter !== "all" ? Number(affiliationFilter) : undefined,
//         regulationTypeId: regulationTypeFilter !== "all" ? Number(regulationTypeFilter) : undefined,
//         academicYearId: academicYearFilter !== "all" ? Number(academicYearFilter) : undefined,
//         searchText: searchText || undefined,
//         page: currentPage,
//         limit: itemsPerPage,
//       };

//       console.log('Fetching filtered data with filters:', filters);
//       const result = await getPapers();
//       console.log('API Response:', result);

//       // Handle null/undefined response
//       if (!result) {
//         console.error('API returned null/undefined result');
//         setPapers([]);
//         setTotalPages(1);
//         setTotalItems(0);
//         toast.error('No data received from server');
//         return;
//       }

//       // Ensure result is an array before setting it
//       if (Array.isArray(result)) {
//         setPapers(result as unknown as PaperWithDetails[]);
//         setTotalPages(1); // For now, set to 1 since we're not paginating
//         setTotalItems(result.length);
        
//         console.log('Set papers:', result);
//         console.log('Total pages:', 1);
//         console.log('Total items:', result.length);
//       } else {
//         console.error('API returned non-array result:', result);
//         setPapers([]);
//         setTotalPages(1);
//         setTotalItems(0);
//         toast.error('Invalid data format received from server');
//       }
//     } catch (error: unknown) {
//       console.error('Error fetching filtered data:', error);
      
//       // Check for authentication error
//       if (error instanceof AxiosError && error.response?.status === 401) {
//         toast.error('Authentication failed. Please log in again.');
//         setError('Authentication failed. Please log in again.');
//       } else {
//         toast.error('Failed to fetch filtered data');
//       }
      
//       // Set empty array on error to prevent map error
//       setPapers([]);
//       setTotalPages(1);
//       setTotalItems(0);
//     }
//   };

//   const handleEdit = (paper: PaperWithDetails): void => {
//     setSelectedPaperForEdit(paper);
//     setIsPaperEditModalOpen(true);
//   };

//   const handlePaperEditSubmit = async (data: PaperWithDetails) => {
//     console.log('Paper edit submitted with data:', data);
//     console.log('Selected paper for edit:', selectedPaperForEdit);
//     try {
//       if (!selectedPaperForEdit?.id) {
//         toast.error('Paper ID not found');
//         return;
//       }
      
//       console.log('Calling updatePaperWithComponents with:', {
//         paperId: selectedPaperForEdit.id,
//         data: data
//       });
      
//       // await updatePaperWithComponents(selectedPaperForEdit.id, data as unknown as Paper);
//       toast.success('Paper updated successfully!');
//       setIsPaperEditModalOpen(false);
//       setSelectedPaperForEdit(null);
//       fetchFilteredData(); // Refresh the data
//     } catch (error: unknown) {
//       const errorMessage = error instanceof Error ? error.message : "Failed to update paper";
//       toast.error(`Failed to update paper: ${errorMessage}`);
//       console.error('Full error object:', error);
//     }
//   };

//   // const handleDelete = async (id: number | undefined) => {
//   //   if (!id) return;
//   //   try {
//   //     await deleteSubjectPaper(id);
//   //     toast.success("Subject paper mapping deleted successfully");
//   //     fetchData();
//   //   } catch (error: unknown) {
//   //     const errorMessage = error instanceof Error ? error.message : "Failed to delete subject paper mapping";
//   //     toast.error(`Failed to delete subject paper mapping: ${errorMessage}`);
//   //   }
//   // };

//   const handleAddNew = () => {
//     setSelectedPaper(null);
//     setIsFormOpen(true);
//   };

//   // const handleFormSubmit = async (data: PaperWithDetails) => {
//   //   console.log('Form submitted with data:', data);
//   //   setIsFormSubmitting(true);
//   //   try {
//   //     // The form component already handles the API call and success/error messages
//   //     // We just need to refresh the data and close the form
//   //     setIsFormOpen(false);
//   //     fetchData(); // Refresh the data to show the new mapping
//   //   } catch (error: unknown) {
//   //     const errorMessage = error instanceof Error ? error.message : "Failed to save subject paper mapping";
//   //     toast.error(`Failed to create subject paper mapping: ${errorMessage}`);
//   //   } finally {
//   //     setIsFormSubmitting(false);
//   //   }
//   // };

//   // const handleFormCancel = () => {
//   //   setIsFormOpen(false);
//   //   setSelectedPaper(null);
//   // };

//   // const handleDownloadTemplate = () => {
//   //   // Create template data with headers
//   //   const templateData = [
//   //     {
//   //       'Subject': '',
//   //       'Subject Type': '',
//   //       'Applicable Courses': '',
//   //       'Affiliation': '',
//   //       'Regulation': '',
//   //       'Academic Year': '',
//   //       'Paper Code': '',
//   //       'Paper Name': '',
//   //       'Is Optional': '',
//   //       ...examComponents.reduce((acc, component) => {
//   //         acc[`Full Marks ${component.code}`] = '';
//   //         acc[`Credit ${component.code}`] = '';
//   //         return acc;
//   //       }, {} as Record<string, string>)
//   //     }
//   //   ];

//     // Create workbook and worksheet
//   //   const wb = XLSX.utils.book_new();
//   //   const ws = XLSX.utils.json_to_sheet(templateData);

//   //   // Set column widths
//   //   const colWidths = [
//   //     { wch: 20 }, // Subject
//   //     { wch: 15 }, // Subject Type
//   //     { wch: 25 }, // Applicable Courses
//   //     { wch: 20 }, // Affiliation
//   //     { wch: 15 }, // Regulation
//   //     { wch: 15 }, // Academic Year
//   //     { wch: 15 }, // Paper Code
//   //     { wch: 25 }, // Paper Name
//   //     { wch: 12 }, // Is Optional
//   //     ...examComponents.flatMap(() => [
//   //       { wch: 15 }, // Full Marks
//   //       { wch: 12 }  // Credit
//   //     ])
//   //   ];
//   //   ws['!cols'] = colWidths;

//   //   // Add worksheet to workbook
//   //   XLSX.utils.book_append_sheet(wb, ws, 'Subject Paper Mapping Template');

//   //   // Download the file
//   //   XLSX.writeFile(wb, 'subject-paper-mapping-template.xlsx');
//   // };

//   // const validateBulkUploadData = (data: BulkUploadRow[]) => {
//   //   const errors: BulkUploadError[] = [];
//   //   const unprocessedData: BulkUploadRow[] = [];
//   //   const paperCodes = new Set<string>();

//   //   data.forEach((row, index) => {
//   //     const rowNumber = index + 2; // Excel rows start from 1, and we have header at row 1
//   //     const rowErrors: string[] = [];

//   //     // Check if subject exists
//   //     const subject = subjects.find(s => s.name.toLowerCase() === (row.Subject as string || '').toLowerCase());
//   //     if (!subject) {
//   //       rowErrors.push('Subject not found');
//   //     }

//   //     // Check if subject type exists
//   //     const subjectType = subjectTypes.find(st => st.name.toLowerCase() === (row['Subject Type'] as string || '').toLowerCase());
//   //     if (!subjectType) {
//   //       rowErrors.push('Subject Type not found');
//   //     }

//   //     // Check if affiliation exists
//   //     const affiliation = affiliations.find(a => a.name.toLowerCase() === (row.Affiliation as string || '').toLowerCase());
//   //     if (!affiliation) {
//   //       rowErrors.push('Affiliation not found');
//   //     }

//   //     // Check if regulation type exists
//   //     const regulationType = regulationTypes.find(rt => rt.name.toLowerCase() === (row.Regulation as string || '').toLowerCase());
//   //     if (!regulationType) {
//   //       rowErrors.push('Regulation not found');
//   //     }

//   //     // Check if academic year exists (if provided)
//   //     let academicYear = null;
//   //     if (row['Academic Year']) {
//   //       academicYear = academicYears.find(ay => ay.year.toLowerCase() === (row['Academic Year'] as string || '').toLowerCase());
//   //       if (!academicYear) {
//   //         rowErrors.push('Academic Year not found');
//   //       }
//   //     }

//   //     // Check if paper code is unique
//   //     const paperCode = (row['Paper Code'] as string)?.toString().trim();
//   //     if (paperCode) {
//   //       if (paperCodes.has(paperCode)) {
//   //         rowErrors.push('Paper Code must be unique');
//   //       } else {
//   //         paperCodes.add(paperCode);
//   //       }
//   //     } else {
//   //       rowErrors.push('Paper Code is required');
//   //     }

//   //     // Check if all exam components are present and valid
//   //     examComponents.forEach(component => {
//   //       const fullMarksField = `Full Marks ${component.code}`;
//   //       const creditField = `Credit ${component.code}`;

//   //       if (!row[fullMarksField] && row[fullMarksField] !== 0) {
//   //         rowErrors.push(`${fullMarksField} is required`);
//   //       }

//   //       if (!row[creditField] && row[creditField] !== 0) {
//   //         rowErrors.push(`${creditField} is required`);
//   //       }

//   //       // Validate that full marks and credit are numbers
//   //       if (row[fullMarksField] && isNaN(Number(row[fullMarksField]))) {
//   //         rowErrors.push(`${fullMarksField} must be a number`);
//   //       }

//   //       if (row[creditField] && isNaN(Number(row[creditField]))) {
//   //         rowErrors.push(`${creditField} must be a number`);
//   //       }
//   //     });

//   //     if (rowErrors.length > 0) {
//   //       errors.push({
//   //         row: rowNumber,
//   //         data: row,
//   //         error: rowErrors.join(', ')
//   //       });
//   //     } else {
//   //       // If no validation errors, add to unprocessed data for backend processing
//   //       unprocessedData.push(row);
//   //     }
//   //   });

//   //   return { errors, unprocessedData };
//   // };

//   // const handleBulkUpload = async () => {
//   //   if (!bulkFile) return;

//   //   try {
//   //     const data = await new Promise<BulkUploadRow[]>((resolve, reject) => {
//   //       const reader = new FileReader();
//   //       reader.onload = (e) => {
//   //         try {
//   //           const workbook = XLSX.read(e.target?.result, { type: 'binary' });
//   //           const sheetName = workbook.SheetNames[0];
//   //           const worksheet = workbook.Sheets[sheetName];
//   //           const jsonData = XLSX.utils.sheet_to_json(worksheet);
//   //           resolve(jsonData as BulkUploadRow[]);
//   //         } catch (error) {
//   //           reject(error);
//   //         }
//   //       };
//   //       reader.readAsBinaryString(bulkFile);
//   //     });

//   //     // Validate the data
//   //     const { errors, unprocessedData } = validateBulkUploadData(data);

//   //     if (errors.length > 0) {
//   //       toast.error(`Validation failed: ${errors.length} rows have errors`);
//   //       // TODO: Show errors in a modal or download error file
//   //       return;
//   //     }

//   //     if (unprocessedData.length === 0) {
//   //       toast.error('No valid data to upload');
//   //       return;
//   //     }

//   //     // Call backend API for bulk upload
//   //     try {
//   //       const result = await bulkUploadSubjectPapers(bulkFile);
//   //       toast.success(`Bulk upload completed: ${result.summary.successful} successful, ${result.summary.failed} failed, ${result.summary.unprocessed} unprocessed`);

//   //       if (result.summary.successful > 0) {
//   //         fetchData(); // Refresh the data
//   //       }

//   //       setIsBulkUploadOpen(false);
//   //       setBulkFile(null);
//   //     } catch (error: unknown) {
//   //       const errorMessage = error instanceof Error ? error.message : "Bulk upload failed";
//   //       toast.error(`Bulk upload failed: ${errorMessage}`);
//   //     }

//   //   } catch {
//   //     toast.error('Failed to process file');
//   //   }
//   // };

//   // if (loading) {
//   //   return (
//   //     <div className="p-4">
//   //       <Card className="border-none">
//   //         <CardContent className="flex items-center justify-center h-64">
//   //           <div className="text-center">Loading subject paper mappings...</div>
//   //         </CardContent>
//   //       </Card>
//   //     </div>
//   //   );
//   // }

//   // if (error) {
//   //   return (
//   //     <div className="p-4">
//   //       <Card className="border-none">
//   //         <CardContent className="flex items-center justify-center h-64">
//   //           <div className="text-center text-red-600">Error: {error}</div>
//   //         </CardContent>
//   //       </Card>
//   //     </div>
//   //   );
//   // }

//   return (
//     <div className="p-4">
//       <Card className="border-none">
//         <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
//           <div>
//             <CardTitle className="flex items-center">
//               <FileText className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
//               Subject Paper Mapping
//             </CardTitle>
//             <div className="text-muted-foreground">Map subject papers to courses.</div>
//           </div>
//           <div className="flex items-center gap-2">
//             <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
//               <DialogTrigger asChild>
//                 <Button variant="outline">
//                   <Upload className="mr-2 h-4 w-4" />
//                   Bulk Upload
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Bulk Upload Subject Paper Mappings</DialogTitle>
//                 </DialogHeader>
//                 <div className="flex flex-col gap-4">
//                   <input
//                     type="file"
//                     accept=".xlsx,.xls,.csv"
//                     // onChange={e => setBulkFile(e.target.files?.[0] || null)}
//                   />
//                   {/* <Button onClick={handleBulkUpload} disabled={!bulkFile}>
//                     Upload
//                   </Button> */}
//                 </div>
//               </DialogContent>
//             </Dialog>
//             {/* <Button variant="outline" onClick={handleDownloadTemplate}>
//               <Download className="mr-2 h-4 w-4" />
//               Download Template
//             </Button> */}
//             <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
//               <AlertDialogTrigger asChild>
//                 <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
//                   <PlusCircle className="mr-2 h-4 w-4" />
//                   Add
//                 </Button>
//               </AlertDialogTrigger>
//               <AlertDialogContent className="min-w-[99vw] min-h-[98vh] overflow-auto flex flex-col">
//                 <AlertDialogHeader className='border-b pb-2'>
//                   <AlertDialogTitle>{selectedPaper ? "Edit Subject Paper Mapping" : "Add New Subject Paper Mapping"}</AlertDialogTitle>
//                 </AlertDialogHeader>
//                                  {/* <SubjectPaperMappingForm
//                    onSubmit={handleFormSubmit}
//                    onCancel={handleFormCancel}
//                    isLoading={isFormSubmitting}
//                    subjects={subjects}
//                    affiliations={affiliations}
//                    regulationTypes={regulationTypes}
//                    subjectTypes={subjectTypes}
//                    examComponents={examComponents}
//                    academicYears={academicYears.map(ay => ({
//                      id: ay.id || 0,
//                      year: ay.year,
//                      isActive: ay.isActive
//                    }))}
//                    courses={courses.map(course => ({
//                      id: course.id || 0,
//                      name: course.name,
//                      shortName: course.shortName,
//                    }))}
//                    classes={classes.filter(cls => cls.type === 'SEMESTER').map(cls => ({
//                      id: cls.id || 0,
//                      name: cls.name,
//                      type: cls.type,
//                    }))}
//                   //  editData={selectedPaper as unknown as PaperWithDetails}
//                  /> */}
//               </AlertDialogContent>
//             </AlertDialog>
//           </div>
//         </CardHeader>
//         <CardContent className="px-0">
//           <div className="sticky top-[72px] z-40 bg-background p-4 border-b flex flex-wrap items-center gap-2 mb-0 justify-between">
//             <div className="flex flex-wrap gap-2 items-center">
//               <Select value={affiliationFilter} onValueChange={setAffiliationFilter}>
//                 <SelectTrigger className="w-44">
//                   <SelectValue placeholder="All Affiliations" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Affiliations</SelectItem>
//                   {affiliations.map(a => (
//                     <SelectItem key={a.id!} value={a.id!.toString()}>{a.name}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
//                 <SelectTrigger className="w-52">
//                   <SelectValue placeholder="All Academic Years" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Academic Years</SelectItem>
//                   {academicYears.map(ay => (
//                     <SelectItem key={ay.id!} value={ay.id!.toString()}>{ay.year}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <Select value={regulationTypeFilter} onValueChange={setRegulationTypeFilter}>
//                 <SelectTrigger className="w-52">
//                   <SelectValue placeholder="All Regulation Types" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Regulation Types</SelectItem>
//                   {regulationTypes.map(rt => (
//                     <SelectItem key={rt.id!} value={rt.id!.toString()}>{rt.name}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <Select value={subjectFilter} onValueChange={setSubjectFilter}>
//                 <SelectTrigger className="w-44">
//                   <SelectValue placeholder="All Subjects" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Subjects</SelectItem>
//                   {subjects.map(s => (
//                     <SelectItem key={s.id!} value={s.id!.toString()}>{s.name}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <Input placeholder="Search..." className="w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
//             <Button variant="outline" onClick={() => { }}>
//               <Download className="h-4 w-4 mr-2" />
//               Download
//             </Button>
//           </div>
//           <div className="relative z-50 bg-white" style={{ height: '600px' }}>
//             <div className="overflow-y-auto overflow-x-auto h-full border rounded-md">
//               {/* Fixed Header */}
//               <div className="sticky top-0 z-50 text-gray-500 bg-gray-100 border-b" style={{ minWidth: '950px' }}>
//                 <div className="flex">
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center" style={{ width: '50px' }}>Sr. No.</div>
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center" style={{ width: '150px' }}>Course</div>
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center" style={{ width: '200px' }}>Paper Name</div>
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center" style={{ width: '80px' }}>Paper Code</div>
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center" style={{ width: '100px' }}>Subject Type</div>
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center" style={{ width: '80px' }}>Semester</div>
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 border-r flex items-center justify-center" style={{ width: '200px' }}>Exam Components</div>
//                   <div className="flex-shrink-0 text-gray-500 font-bold p-3 flex items-center justify-center" style={{ width: '100px' }}>Actions</div>
//                 </div>
//               </div>

//               {/* Table Body */}
//               <div className='bg-white relative'>
//                 {loading ? (
//                   <div className="flex items-center justify-center p-4 text-center" style={{ minWidth: '950px' }}>Loading...</div>
//                 ) : error ? (
//                   <div className="flex items-center justify-center p-4 text-center text-red-500" style={{ minWidth: '950px' }}>{error}</div>
//                 ) : !Array.isArray(papers) || papers.length === 0 ? (
//                   <div className="flex items-center justify-center p-4 text-center" style={{ minWidth: '950px' }}>
//                     {!Array.isArray(papers) ? 'Error loading data' : 'No subject paper mappings found.'}
//                   </div>
//                 ) : (
//                   papers.map((sp: PaperWithDetails, idx: number) => (
//                     <div key={sp.id} className="flex border-b hover:bg-gray-50 group" style={{ minWidth: '950px' }}>
//                       <div className="flex-shrink-0 p-3 border-r flex items-center justify-center" style={{ width: '50px' }}>{idx + 1}</div>
//                       <div className="flex-shrink-0 p-3 border-r flex items-center" style={{ width: '150px' }}>{sp.courseName ?? "-"}</div>
//                       <div className="flex-shrink-0 p-3 border-r flex items-center" style={{ width: '200px' }}>
//                         {sp.name ?? "-"}
//                         {!sp.isOptional && <span className="text-red-500 ml-1">*</span>}
//                       </div>
//                       <div className="flex-shrink-0 p-3 border-r flex items-center justify-center" style={{ width: '80px' }}>{sp.code ?? "-"}</div>
//                       <div className="flex-shrink-0 p-3 border-r flex items-center justify-center" style={{ width: '100px' }}>
//                         {sp.subjectTypeName ? (
//                           <div className="text-center">
//                             <div className="text-xs font-medium">
//                               {sp.subjectTypeCode || sp.subjectTypeName.split(' ').map((word: string) => word[0]).join('')}
//                             </div>
//                           </div>
//                         ) : "-"}
//                       </div>
//                       <div className="flex-shrink-0 p-3 border-r flex items-center justify-center" style={{ width: '80px' }}>
//                         {sp.className ? (
//                           <div className="text-center">
//                             {/* <div className="text-xs text-gray-500">{sp.className}</div> */}
//                             <div className="text-xs font-medium">
//                               {sp.className.includes('SEMESTER') ?
//                                 sp.className.match(/\d+/)?.[0] || sp.className :
//                                 sp.className}
//                             </div>
//                           </div>
//                         ) : "-"}
//                       </div>
//                       <div className="flex-shrink-0 p-3 border-r" style={{ width: '200px' }}>
//                         {/* Display exam component names */}
//                         <div className="flex flex-wrap gap-1">
//                           {sp.paperComponents && sp.paperComponents.length > 0 ? (
//                             sp.paperComponents.map((component: PaperComponent, compIdx: number) => (
//                               <Badge key={compIdx} variant="outline" className="text-xs">
//                                 {component.examComponentName}
//                               </Badge>
//                             ))
//                           ) : (
//                             <span className="text-muted-foreground text-xs">No components</span>
//                           )}
//                         </div>
//                       </div>
//                       <div className="flex-shrink-0 p-3 flex items-center justify-center" style={{ width: '100px' }}>
//                         <div className="flex space-x-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => handleEdit(sp)}
//                             className="h-5 w-5 p-0"
//                           >
//                             <Edit className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Pagination Controls */}
//       {!loading && !error && totalItems > 0 && (
//         <div className="mt-4 flex items-center justify-between">
//           <div className="text-sm text-gray-600">
//             Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//               disabled={currentPage === 1}
//             >
//               Previous
//             </Button>
//             <div className="flex items-center gap-1">
//               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                 const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
//                 if (pageNum > totalPages) return null;
//                 return (
//                   <Button
//                     key={pageNum}
//                     variant={currentPage === pageNum ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setCurrentPage(pageNum)}
//                     className="w-8 h-8 p-0"
//                   >
//                     {pageNum}
//                   </Button>
//                 );
//               })}
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//               disabled={currentPage === totalPages}
//             >
//               Next
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Paper Edit Modal */}
//       {/* <PaperEditModal
//         isOpen={isPaperEditModalOpen}
//         onClose={() => {
//           setIsPaperEditModalOpen(false);
//           setSelectedPaperForEdit(null);
//         }}
//         onSubmit={handlePaperEditSubmit}
//         isLoading={false}
//         subjects={subjects}
//         affiliations={affiliations}
//         regulationTypes={regulationTypes}
//         subjectTypes={subjectTypes}
//         examComponents={examComponents}
//         academicYears={academicYears.map(ay => ({
//           id: ay.id || 0,
//           year: ay.year,
//           isActive: ay.isActive
//         }))}
//         courses={courses.map(course => ({
//           id: course.id || 0,
//           name: course.name,
//           shortName: course.shortName,
//         }))}
//         classes={classes.filter(cls => cls.type === 'SEMESTER').map(cls => ({
//           id: cls.id || 0,
//           name: cls.name,
//           type: cls.type,
//         }))}
//                  paperId={selectedPaperForEdit?.id}
//       /> */}
//     </div>
//   );
// };

// export default SubjectPaperMappingPage;


export default function SubjectPaperMappingPage() {
  return (
    <div>SubjectPaperMappingPage</div>
  )
}

