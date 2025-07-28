import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, FileText, Download, Upload, Edit, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SubjectPaper } from "@/types/course-design";
import { SubjectPaperForm } from "./subject-paper-form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getSubjects,
  getAffiliations,
  getRegulationTypes,
  getSubjectPapersWithPapers,
  createSubjectPaper,
  updateSubjectPaper,
  deleteSubjectPaper,
  getExamComponents,
  getSubjectTypes,
  bulkUploadSubjectPapers,
  getAcademicYears,
  BulkUploadRow,
  BulkUploadError,
  ExamComponent as ApiExamComponent,
  AcademicYear as ApiAcademicYear,
} from '@/services/course-design.api';
import type {
  Subject,
  Affiliation,
  RegulationType,
  SubjectType,
  // ExamComponent,
} from '@/types/course-design';
// import { AcademicYear } from '@/types/academics/academic-year';

// Define proper types for the subject paper data
interface SubjectPaperWithDetails {
  id: number;
  subjectId: number;
  affiliationId: number;
  regulationTypeId: number;
  academicYearId: number;
  sequence: number;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  paperId?: number;
  paperName?: string;
  paperCode?: string;
  paperIsOptional?: boolean;
  subjectName?: string;
  subjectTypeName?: string;
  courseName?: string;
  className?: string;
  paperComponents: PaperComponent[];
}

interface PaperComponent {
  examComponentId: number;
  fullMarks: number;
  credit: number;
  examComponentName: string;
  examComponentCode: string;
}

const SubjectPaperMappingPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedSubjectPaper, setSelectedSubjectPaper] = React.useState<SubjectPaper | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [subjectFilter, setSubjectFilter] = React.useState<string>("all");
  const [affiliationFilter, setAffiliationFilter] = React.useState<string>("all");
  const [regulationTypeFilter, setRegulationTypeFilter] = React.useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = React.useState<string>("all");
  // State for dropdowns and table
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);
  const [subjectTypes, setSubjectTypes] = React.useState<SubjectType[]>([]);
  const [subjectPapers, setSubjectPapers] = React.useState<SubjectPaperWithDetails[]>([]);
  const [academicYears, setAcademicYears] = React.useState<ApiAcademicYear[]>([]);
  const [examComponents, setExamComponents] = React.useState<ApiExamComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, affiliationsRes, regulationTypesRes, subjectTypesRes, subjectPapersRes, examComponentsRes, academicYearsRes] = await Promise.all([
        getSubjects(),
        getAffiliations(),
        getRegulationTypes(),
        getSubjectTypes(),
        getSubjectPapersWithPapers(),
        getExamComponents(),
        getAcademicYears(),
      ]);
      
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
      setAffiliations(Array.isArray(affiliationsRes) ? affiliationsRes : []);
      setRegulationTypes(Array.isArray(regulationTypesRes) ? regulationTypesRes : []);
      setSubjectTypes(Array.isArray(subjectTypesRes) ? subjectTypesRes : []);
      setSubjectPapers(Array.isArray(subjectPapersRes) ? subjectPapersRes as SubjectPaperWithDetails[] : []);
      setExamComponents(Array.isArray(examComponentsRes) ? examComponentsRes : []);
      setAcademicYears(Array.isArray(academicYearsRes) ? academicYearsRes : []);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subjectPaper: SubjectPaperWithDetails): void => {
    setSelectedSubjectPaper(subjectPaper as SubjectPaper);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      await deleteSubjectPaper(id);
      toast.success("Subject paper mapping deleted successfully");
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete subject paper mapping";
      toast.error(`Failed to delete subject paper mapping: ${errorMessage}`);
    }
  };

  const handleAddNew = () => {
    setSelectedSubjectPaper(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<SubjectPaper, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsFormSubmitting(true);
    try {
      if (selectedSubjectPaper) {
        await updateSubjectPaper(selectedSubjectPaper.id!, data);
        toast.success("Subject paper mapping updated successfully");
      } else {
        await createSubjectPaper(data);
        toast.success("Subject paper mapping created successfully");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save subject paper mapping";
      toast.error(`Failed to ${selectedSubjectPaper ? 'update' : 'create'} subject paper mapping: ${errorMessage}`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedSubjectPaper(null);
  };

  const handleDownloadTemplate = () => {
    // Create template data with headers
    const templateData = [
      {
        'Subject': '',
        'Subject Type': '',
        'Applicable Courses': '',
        'Affiliation': '',
        'Regulation': '',
        'Academic Year': '',
        'Paper Code': '',
        'Paper Name': '',
        'Is Optional': '',
        ...examComponents.reduce((acc, component) => {
          acc[`Full Marks ${component.code}`] = '';
          acc[`Credit ${component.code}`] = '';
          return acc;
        }, {} as Record<string, string>)
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Subject
      { wch: 15 }, // Subject Type
      { wch: 25 }, // Applicable Courses
      { wch: 20 }, // Affiliation
      { wch: 15 }, // Regulation
      { wch: 15 }, // Academic Year
      { wch: 15 }, // Paper Code
      { wch: 25 }, // Paper Name
      { wch: 12 }, // Is Optional
      ...examComponents.flatMap(() => [
        { wch: 15 }, // Full Marks
        { wch: 12 }  // Credit
      ])
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Subject Paper Mapping Template');

    // Download the file
    XLSX.writeFile(wb, 'subject-paper-mapping-template.xlsx');
  };

  const validateBulkUploadData = (data: BulkUploadRow[]) => {
    const errors: BulkUploadError[] = [];
    const unprocessedData: BulkUploadRow[] = [];
    const paperCodes = new Set<string>();

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel rows start from 1, and we have header at row 1
      const rowErrors: string[] = [];

      // Check if subject exists
      const subject = subjects.find(s => s.name.toLowerCase() === (row.Subject as string || '').toLowerCase());
      if (!subject) {
        rowErrors.push('Subject not found');
      }

      // Check if subject type exists
      const subjectType = subjectTypes.find(st => st.name.toLowerCase() === (row['Subject Type'] as string || '').toLowerCase());
      if (!subjectType) {
        rowErrors.push('Subject Type not found');
      }

      // Check if affiliation exists
      const affiliation = affiliations.find(a => a.name.toLowerCase() === (row.Affiliation as string || '').toLowerCase());
      if (!affiliation) {
        rowErrors.push('Affiliation not found');
      }

      // Check if regulation type exists
      const regulationType = regulationTypes.find(rt => rt.name.toLowerCase() === (row.Regulation as string || '').toLowerCase());
      if (!regulationType) {
        rowErrors.push('Regulation not found');
      }

      // Check if academic year exists (if provided)
      let academicYear = null;
      if (row['Academic Year']) {
        academicYear = academicYears.find(ay => ay.year.toLowerCase() === (row['Academic Year'] as string || '').toLowerCase());
        if (!academicYear) {
          rowErrors.push('Academic Year not found');
        }
      }

      // Check if paper code is unique
      const paperCode = (row['Paper Code'] as string)?.toString().trim();
      if (paperCode) {
        if (paperCodes.has(paperCode)) {
          rowErrors.push('Paper Code must be unique');
        } else {
          paperCodes.add(paperCode);
        }
      } else {
        rowErrors.push('Paper Code is required');
      }

      // Check if all exam components are present and valid
      examComponents.forEach(component => {
        const fullMarksField = `Full Marks ${component.code}`;
        const creditField = `Credit ${component.code}`;
        
        if (!row[fullMarksField] && row[fullMarksField] !== 0) {
          rowErrors.push(`${fullMarksField} is required`);
        }
        
        if (!row[creditField] && row[creditField] !== 0) {
          rowErrors.push(`${creditField} is required`);
        }
        
        // Validate that full marks and credit are numbers
        if (row[fullMarksField] && isNaN(Number(row[fullMarksField]))) {
          rowErrors.push(`${fullMarksField} must be a number`);
        }
        
        if (row[creditField] && isNaN(Number(row[creditField]))) {
          rowErrors.push(`${creditField} must be a number`);
        }
      });

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          data: row,
          error: rowErrors.join(', ')
        });
      } else {
        // If no validation errors, add to unprocessed data for backend processing
        unprocessedData.push(row);
      }
    });

    return { errors, unprocessedData };
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;

    try {
      const data = await new Promise<BulkUploadRow[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target?.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData as BulkUploadRow[]);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsBinaryString(bulkFile);
      });

      // Validate the data
      const { errors, unprocessedData } = validateBulkUploadData(data);

      if (errors.length > 0) {
        toast.error(`Validation failed: ${errors.length} rows have errors`);
        // TODO: Show errors in a modal or download error file
        return;
      }

      if (unprocessedData.length === 0) {
        toast.error('No valid data to upload');
        return;
      }

      // Call backend API for bulk upload
      try {
        const result = await bulkUploadSubjectPapers(bulkFile);
        toast.success(`Bulk upload completed: ${result.summary.successful} successful, ${result.summary.failed} failed, ${result.summary.unprocessed} unprocessed`);
        
        if (result.summary.successful > 0) {
          fetchData(); // Refresh the data
        }
        
        setIsBulkUploadOpen(false);
        setBulkFile(null);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Bulk upload failed";
        toast.error(`Bulk upload failed: ${errorMessage}`);
      }

    } catch {
      toast.error('Failed to process file');
    }
  };

  const filteredSubjectPapers = subjectPapers.filter((sp: SubjectPaperWithDetails) =>
    Object.values({
      course: sp.courseName ?? "-",
      paperName: sp.paperName ?? "-",
      paperCode: sp.paperCode ?? "-",
      subjectType: sp.subjectTypeName ?? "-",
      semester: sp.className ?? "-",
    })
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase())
    && (subjectFilter === "all" || String(sp.subjectId) === subjectFilter)
    && (affiliationFilter === "all" || String(sp.affiliationId) === affiliationFilter)
    && (regulationTypeFilter === "all" || String(sp.regulationTypeId) === regulationTypeFilter)
    && (academicYearFilter === "all" || String(sp.academicYearId) === academicYearFilter)
  );

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
            <div className="text-muted-foreground">Map subject papers to courses.</div>
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
                    onChange={e => setBulkFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleBulkUpload} disabled={!bulkFile}>
                    Upload
                  </Button>
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
              <AlertDialogContent className="max-w-2xl w-full">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedSubjectPaper ? "Edit Subject Paper Mapping" : "Add New Subject Paper Mapping"}</AlertDialogTitle>
                </AlertDialogHeader>
                                 <SubjectPaperForm
                   initialData={selectedSubjectPaper}
                   onSubmit={handleFormSubmit}
                   onCancel={handleFormCancel}
                   isLoading={isFormSubmitting}
                   subjects={subjects}
                   affiliations={affiliations}
                   regulationTypes={regulationTypes}
                   academicYears={academicYears.map(ay => ({
                     id: ay.id || 0,
                     year: ay.year,
                     isActive: ay.isActive
                   }))}
                 />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex flex-wrap items-center gap-2 mb-0 justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id!} value={s.id!.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={affiliationFilter} onValueChange={setAffiliationFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Affiliations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Affiliations</SelectItem>
                  {affiliations.map(a => (
                    <SelectItem key={a.id!} value={a.id!.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={regulationTypeFilter} onValueChange={setRegulationTypeFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All Regulation Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regulation Types</SelectItem>
                  {regulationTypes.map(rt => (
                    <SelectItem key={rt.id!} value={rt.id!.toString()}>{rt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All Academic Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map(ay => (
                    <SelectItem key={ay.id!} value={ay.id!.toString()}>{ay.year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Search..." className="w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
            <Button variant="outline" onClick={() => {}}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="relative" style={{ height: '600px' }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[1200px]" style={{ tableLayout: 'fixed' }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: '#f3f4f6' }}>
                  <TableRow>
                    <TableHead className="font-bold" style={{ width: 50 }}>Sr. No.</TableHead>
                    <TableHead className="font-bold" style={{ width: 150 }}>Course</TableHead>
                    <TableHead className="font-bold" style={{ width: 200 }}>Paper Name</TableHead>
                    <TableHead className="font-bold" style={{ width: 120 }}>Paper Code</TableHead>
                    <TableHead className="font-bold" style={{ width: 120 }}>Subject Type</TableHead>
                    <TableHead className="font-bold" style={{ width: 100 }}>Semester</TableHead>
                    <TableHead className="font-bold" style={{ width: 100 }}>Is Mandatory</TableHead>
                    <TableHead className="font-bold" style={{ width: 200 }}>Exam Components</TableHead>
                    <TableHead className="font-bold" style={{ width: 100 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-red-500">{error}</TableCell>
                    </TableRow>
                  ) : filteredSubjectPapers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">No subject paper mappings found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredSubjectPapers.map((sp: SubjectPaperWithDetails, idx) => (
                      <TableRow key={sp.id} className="group">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{sp.courseName ?? "-"}</TableCell>
                        <TableCell>{sp.paperName ?? "-"}</TableCell>
                        <TableCell>{sp.paperCode ?? "-"}</TableCell>
                        <TableCell>{sp.subjectTypeName ?? "-"}</TableCell>
                        <TableCell>{sp.className ?? "-"}</TableCell>
                        <TableCell>
                          {sp.paperIsOptional ? (
                            <Badge variant="secondary">Optional</Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Mandatory</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Display actual exam components with full marks and credits */}
                          <div className="flex flex-wrap gap-1">
                            {sp.paperComponents && sp.paperComponents.length > 0 ? (
                              sp.paperComponents.map((component: PaperComponent, compIdx: number) => (
                                <Badge key={compIdx} variant="outline" className="text-xs">
                                  {component.examComponentCode}: {component.fullMarks}/{component.credit}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">No components</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(sp)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(sp.id)}
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

export default SubjectPaperMappingPage;
