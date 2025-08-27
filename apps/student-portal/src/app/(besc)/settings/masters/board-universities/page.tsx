"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Upload, Download, Loader2, FileText, ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { BoardUniversityDialog } from "./board-university-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; // Assuming useToast is available
import * as XLSX from 'xlsx'; // Assuming xlsx is installed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

// Import placeholder actions for upload/download (assuming they exist in ./actions)
import { uploadBoardUniversitiesFromFile, downloadBoardUniversities, getDegrees } from './actions';

// Assuming a type definition for BoardUniversity exists in your schema file
import { AcademicSubject, Degree, type BoardUniversity } from "@/db/schema";
import { BoardUniversityDto } from "@/types/admissions";

// Extend the BoardUniversity type to include subjects
interface ExtendedBoardUniversity extends BoardUniversity {
  subjects?: Array<{
    name: string;
    passingMarks: number;
  }>;
}

// Define the expected return type for the placeholder downloadBoardUniversities action
interface DownloadBoardUniversitiesResult {
  success: boolean;
  data?: { boardUniversities: ExtendedBoardUniversity[] };
  error?: string;
}

interface BoardUniversityRow {
  name: string;
  code: string | null;
  board_sequence: number | null;
  subject: string;
  passing_marks: number | null;
}

// Define items per page (placeholder for now)
const ITEMS_PER_PAGE = 10;

// Placeholder required headers for board university template (adjust as needed)
const REQUIRED_HEADERS = ['name', 'code', 'board_sequence', 'subject', 'passing_marks'];

export default function BoardUniversitiesPage() {
  // Update the state type
  const [data, setData] = useState<BoardUniversityDto[]>([]);

  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1); // State for current page (placeholder)
  const [totalCount, setTotalCount] = useState(0); // Placeholder total count
  const [loading, setLoading] = useState(true); // Add loading state

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast(); // Assuming useToast is available

  const [editingBoardUniversity, setEditingBoardUniversity] = useState<BoardUniversityDto | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedCode, setEditedCode] = useState<string | null>("");
  const [editedSequence, setEditedSequence] = useState<number | null>(null);
  const [selectedDegreeId, setSelectedDegreeId] = useState<number | null>(null);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [editedSubjects, setEditedSubjects] = useState<AcademicSubject[]>([]);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");

  // Placeholder total pages calculation
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Function to fetch degrees
  const fetchDegrees = async () => {
   const tmpDegree = await getDegrees();
   console.log("degrees:", degrees);
   setDegrees(tmpDegree);
  };

  // Fetch degrees on component mount
  useEffect(() => {
    fetchDegrees();
  }, []);

  // Function to fetch paginated board universities from the API
  const fetchBoardUniversities = async (page: number, limit: number) => {
    setLoading(true);
    try {
      // Assuming your API endpoint for board universities is /api/board-universities and supports pagination via query params
      const response = await fetch(`/api/board-universities?page=${page}&limit=${limit}`);
      const result = await response.json();
console.log("in fetchBoardUniversities(),", result);
setData(result); // Assuming the API returns board universities in a 'boardUniversities' field
setTotalCount(result.length); // Assuming the API returns total count in a 'totalCount' field
      if (result.success) {

      } else {
        toast({
          title: "Failed to fetch board universities",
          description: result.error || "An error occurred while fetching data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching board universities:", error);
      toast({
        title: "Failed to fetch board universities",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when currentPage changes
  useEffect(() => {
    fetchBoardUniversities(currentPage, ITEMS_PER_PAGE);
  }, [currentPage]); // Dependency on currentPage for pagination

  const downloadTemplate = () => {
    // Create a sample row with empty values
    const sampleData = [
      REQUIRED_HEADERS,
      ['', '', '', '', ''], // Empty row for example
      ['Sample University', 'SUN', '1', 'Mathematics', '40'], // Example row with all fields
    ];

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'BoardUniversity Template');

    // Generate Excel file
    XLSX.writeFile(wb, 'board_university_template.xlsx');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          
          if (jsonData.length > 1) { // Subtract 1 for header row
            setNumberOfEntries(jsonData.length - 1);
          } else {
            setNumberOfEntries(0);
          }
          
          // We'll still do full validation on submit
        } catch (error) {
          console.error("Error reading file for entry count:", error);
          setSelectedFile(null);
          setNumberOfEntries(0);
          toast({
            title: "Error Reading File",
            description: "Could not read the selected file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setSelectedFile(null);
      setNumberOfEntries(0);
    }
  };

  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          const headers = (jsonData[0] as string[]).map(h => h.trim());
          
          const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            toast({
              title: "Invalid File Format",
              description: `Missing required headers: ${missingHeaders.join(', ')}`,
              variant: "destructive",
            });
            resolve(false);
          } else {
            resolve(true);
          }
        } catch (error) {
          toast({
            title: "Invalid File Format",
            description: "Please upload a valid Excel file",
            variant: "destructive",
          });
          resolve(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Upload button clicked");
    if (!selectedFile) {
      console.log("No file selected");
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    console.log("File selected, validating...");

    // Validate file format first
    const isValid = await validateFile(selectedFile);
    if (!isValid) return;

    // Read the Excel file data
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as BoardUniversityRow[];

        // Validate data
        const validationErrors: string[] = [];
        jsonData.forEach((row, index) => {
          if (!row.name) validationErrors.push(`Row ${index + 1}: Name is required`);
          if (!row.subject) validationErrors.push(`Row ${index + 1}: Subject is required`);
          if (row.passing_marks !== null && (isNaN(row.passing_marks) || row.passing_marks < 0)) {
            validationErrors.push(`Row ${index + 1}: Passing marks must be a positive number`);
          }
        });

        if (validationErrors.length > 0) {
          toast({
            title: "Validation Errors",
            description: validationErrors.join('\n'),
            variant: "destructive",
          });
          return;
        }

        console.log("Starting upload transition...");
        // Loop over the array
        const doneBoards: string[] = [];
        for (let i = 0; i < jsonData.length; i++) {
          if (doneBoards.includes(jsonData[i].name.trim())) continue;

          const tmpArr = jsonData.filter(ele => ele.name === jsonData[i].name);

          const obj: BoardUniversityDto = {
            name: tmpArr[0].name,
            code: tmpArr[0].code,
            sequence: tmpArr[0].board_sequence,
            subjects: tmpArr.map(sbj => ({
              boardUniversityId: 0,
              name: sbj.subject,
              passingMarks: sbj.passing_marks,
              disabled: false, // Default to not disabled on upload
            }))
          }

          try {
            // Call the server action to insert the data
            const response = await fetch('/api/board-universities', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(obj),
            });

            if (!response.ok) {
              throw new Error(`Failed to insert board university: ${obj.name}`);
            }

            doneBoards.push(jsonData[i].name.trim()); // Marked as done
          } catch (error) {
            console.error(`Error inserting board university ${obj.name}:`, error);
            toast({
              title: "Upload Error",
              description: `Failed to insert board university: ${obj.name}`,
              variant: "destructive",
            });
          }
        }

        // Refresh the data after successful upload
        fetchBoardUniversities(currentPage, ITEMS_PER_PAGE);
        
        toast({
          title: "Upload Complete",
          description: `Successfully processed ${doneBoards.length} board universities`,
          variant: "default",
        });

        // Reset the form
        setSelectedFile(null);
        setNumberOfEntries(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Error Processing File",
          description: "An error occurred while processing the file",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handlePageChange = (newPage: number) => {
    // This is a placeholder. Implement actual pagination fetching here.
    console.log("Page change requested:", newPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownloadClick = () => {
    startDownloadTransition(async () => {
      console.log("Download button clicked, calling downloadBoardUniversities server action...");


      const formatedArr: unknown[] = [];
      let srno: number = 0;
      for (const ele of data) {
        for (const sbj of ele.subjects) {
          const {subjects, ...base} = ele;
          const { id, boardUniversityId, ...sbjBase} = sbj;
          formatedArr.push({
            srno: ++srno,
            board: base.name,
            degree: base.degreeName,
            board_status: base.disabled ? "Inactive" : "Active",
            board_updated_at: base.updatedAt,
            subject: sbjBase.name,
            passing_marks: sbjBase.passingMarks,
            subject_status: sbjBase.disabled ? "Inactive" : "Active",
            subject_updated_at: sbjBase.updatedAt
          });
        }
      }
        try {
          console.log("Received data, generating XLSX...");
          // Assuming the downloadBoardUniversities action returns an object with a 'boardUniversities' key
          const ws = XLSX.utils.json_to_sheet(formatedArr);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "BoardUniversities");
          XLSX.writeFile(wb, "all_board_universities.xlsx");
          console.log("XLSX file generated and download triggered.");
        } catch (error) {
          console.error("Error generating or downloading XLSX:", error);
          toast({
            title: "Download Failed",
            description: "Could not generate Excel file.",
            variant: "destructive",
          });
        }
     
    });
  };

  // Placeholder for handleAddSuccess
  const handleAddSuccess = () => {
    fetchBoardUniversities(currentPage, ITEMS_PER_PAGE);
  };

  const handleEdit = (boardUniversity: BoardUniversityDto) => {
    setEditingBoardUniversity(boardUniversity);
    setEditedName(boardUniversity.name);
    setEditedCode(boardUniversity.code ?? '');
    setEditedSequence(boardUniversity.sequence ?? null);
    setSelectedDegreeId(boardUniversity.degreeId ?? null);
    setEditedSubjects(boardUniversity.subjects?.map(s => ({
      id: s.id, 
      boardUniversityId: s.boardUniversityId ?? boardUniversity.id!, // Ensure boardUniversityId is a number
      name: s.name,
      passingMarks: s.passingMarks ?? null,
      disabled: s.disabled ?? false,
      createdAt: s.createdAt ?? null, 
      updatedAt: s.updatedAt ?? null
    })) || []);
    setIsEditDialogOpen(true);
  };

  const handleDisable = async (id: number | undefined, currentDisabled: boolean | null | undefined) => {
    if (id === undefined) return;
    
    try {
      const response = await fetch(`/api/board-universities/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update board university status');
      }

      toast({
        title: "Success",
        description: `Board university ${currentDisabled ? 'enabled' : 'disabled'} successfully`,
        variant: "default",
      });

      // Refresh the data
      fetchBoardUniversities(currentPage, ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error updating board university status:', error);
      toast({
        title: "Error",
        description: "Failed to update board university status",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!editingBoardUniversity) return;

    try {
      const response = await fetch(`/api/board-universities/${editingBoardUniversity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName,
          code: editedCode,
          sequence: editedSequence,
          degreeId: selectedDegreeId,
          subjects: editedSubjects.map(s => ({
            name: s.name,
            passingMarks: s.passingMarks ?? 0, // Ensure passingMarks is a number for the DTO
            disabled: s.disabled, // Include disabled status
            boardUniversityId: s.boardUniversityId // Ensure boardUniversityId is included
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update board university');
      }

      toast({
        title: "Success",
        description: "Board university updated successfully",
        variant: "default",
      });

      setIsEditDialogOpen(false);
      fetchBoardUniversities(currentPage, ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error updating board university:', error);
      toast({
        title: "Error",
        description: "Failed to update board university",
        variant: "destructive",
      });
    }
  };

  const filteredSubjects = editedSubjects.filter(subject => subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()));

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Board / Universities Management</h1> {/* Updated title */}
        <div className="flex flex-wrap justify-between items-center gap-3"> {/* Container for both button groups */}
           
           {/* Upload/Download Template Group */}
           <div className="flex items-center gap-2"> {/* Group for upload and template */}
             {/* Upload Section */}
             <form onSubmit={handleUploadSubmit} className="flex items-center gap-2"> {/* Changed to onSubmit */}
              {/* Hidden file input */}
              <Input
                id="board-university-upload"
                type="file"
                name="file"
                accept=".csv, .xlsx"
                className="hidden"
                onChange={handleFileSelect} // Added onChange
                ref={fileInputRef}
              />
              {/* Choose File Button */}
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
              >
                <Upload size={20} />
                Choose File
              </Button>

              {/* Display selected file info */}
              {selectedFile && (
                <span className="text-sm text-gray-600">
                  {selectedFile.name} ({numberOfEntries} entries)
                </span>
              )}
              
              {/* Upload File Button */}
              <Button type="submit" size="sm" disabled={!selectedFile || isPendingUpload}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
              >
              {isPendingUpload ? (
                  <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
              ) : (
                  <>
                <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
            </form>
            {/* Download Template Button */}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate} // Added onClick
              className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
            >
              <FileText size={20} />
              Download Template
            </Button>
           </div>

           {/* Add/Download Board Universities Group */}
           <div className="flex items-center gap-2"> {/* Group for add and download, adjusted gap */}
             {/* Add Board University Dialog Trigger */}
             <BoardUniversityDialog />
             {/* Download Board Universities Button */}
             <Button 
              type="button" // Changed to type button
              variant="outline" 
              size="sm" 
              onClick={handleDownloadClick} // Added onClick
              disabled={isPendingDownload} // Added disabled state
              className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
             >
              {isPendingDownload ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                <Download className="mr-2 h-4 w-4" />
                </>
              )}
            </Button>
           </div>
        </div>
      </div>
      
      {/* Table Container matching Courses page style */}
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-50 z-10"> {/* Made header sticky */}
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[80px] font-semibold text-center text-gray-700">Sr. No</TableHead>
              <TableHead className="font-semibold text-center text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-center text-gray-700">Degree</TableHead>
              <TableHead className="font-semibold text-center text-gray-700">Code</TableHead>
              <TableHead className="font-semibold text-center text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-center text-gray-700">Sequence</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">Subjects</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Loading board universities...</TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">No board universities found.</TableCell>
              </TableRow>
            ) : (
              data.map((boardUniversity, index) => (
                <TableRow key={`board-university-${boardUniversity.id}-${index}`} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-center text-gray-600">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell className="text-gray-700 ">{boardUniversity.name}</TableCell>
                  <TableCell className="text-gray-700 text-center">{boardUniversity.degreeName}</TableCell>
                  <TableCell className="text-gray-700 text-center">{boardUniversity.code}</TableCell>
                  <TableCell className="text-gray-700 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${boardUniversity.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {boardUniversity.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 text-center">{boardUniversity.sequence ?? "-"}</TableCell>
                  <TableCell className="text-gray-700 text-center">{boardUniversity.subjects?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Edit Button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-gray-100" 
                        onClick={() => handleEdit(boardUniversity)}
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      {/* Disable Button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-gray-100" 
                        onClick={() => handleDisable(boardUniversity.id, boardUniversity.disabled)}
                      >
                        <Ban className={`h-4 w-4 ${boardUniversity.disabled ? 'text-green-500' : 'text-red-500'}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-6 bg-white rounded-lg shadow-2xl border border-gray-100"> {/* Increased max-width */}
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">Edit Board University</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-6 py-4 overflow-hidden"> 
            <div className="flex flex-col space-y-4 pr-4 border-r border-gray-200 md:w-[300px]"> {/* Left part: Inputs, set fixed width */}
              <div>
                <Label htmlFor="editName" className="text-sm font-medium text-gray-700">Board University Name</Label>
                <Input
                  id="editName"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="editCode" className="text-sm font-medium text-gray-700">Code</Label>
                <Input
                  id="editCode"
                  value={editedCode || ''}
                  onChange={(e) => setEditedCode(e.target.value)}
                  placeholder="Enter code"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="editSequence" className="text-sm font-medium text-gray-700">Sequence</Label>
                <Input
                  id="editSequence"
                  type="text" // Changed to text
                  value={editedSequence !== null ? String(editedSequence) : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[0-9]*$/.test(value)) { // Numeric validation
                      setEditedSequence(value === '' ? null : Number(value));
                    }
                  }}
                  placeholder="Enter sequence"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="editDegree" className="text-sm font-medium text-gray-700">Degree</Label>
                <Select
                  value={selectedDegreeId !== null ? String(selectedDegreeId) : ''}
                  onValueChange={(value) => setSelectedDegreeId(Number(value))}
                >
                  <SelectTrigger className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <SelectValue placeholder="Select a degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((degree) => (
                      <SelectItem key={degree.id} value={String(degree.id)}>
                        {degree.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col space-y-3 min-h-0 pl-4 flex-1 min-w-0"> {/* Right part: Subjects Table, take remaining width */}
              <div className="flex justify-between items-center mb-2"> {/* Adjusted margin */}
                <Label className="text-base font-medium text-gray-700">Subjects ({editedSubjects.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditedSubjects([{ id: 0, boardUniversityId: editingBoardUniversity?.id || 0, name: '', passingMarks: null, disabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...editedSubjects])} // Prepend new subject
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
                >
                  <Pencil className="h-4 w-4" /> Add Subject
                </Button>
              </div>
              {/* Search Input for Subjects */}
              <div className="mb-4">
                <Input
                  placeholder="Search subjects..."
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                />
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col min-h-0"> 
                <div className="overflow-y-auto relative max-h-[400px]"> 
                  <Table className="w-full">
                    <TableHeader className="sticky top-0 bg-gray-100 z-10 border-b border-gray-200"> 
                      <TableRow className="hover:bg-gray-100"> 
                      <TableHead className="w-[4%] py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sr. No.</TableHead> 
                        <TableHead className="w-[57%] py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject Name</TableHead> 
                        <TableHead className="w-[23%] py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Passing Marks</TableHead>
                        <TableHead className="w-[16%] py-3 px-1 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</TableHead> 
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.length > 0 ? ( 
                        filteredSubjects.map((subject, index) => (
                          <TableRow key={index} className="border-b border-gray-100 last:border-b-0 hover:bg-transparent"> 
                          <TableCell className="py-3 px-1">
                              <span>{index + 1}</span>
                            </TableCell>
                            <TableCell className="py-3 px-1">
                              <Input
                                value={subject.name}
                                onChange={(e) => {
                                  const newSubjects = [...editedSubjects];
                                  const originalIndex = editedSubjects.indexOf(subject);
                                  if (originalIndex > -1) newSubjects[originalIndex].name = e.target.value; 
                                  setEditedSubjects(newSubjects);
                                }}
                                placeholder="Enter subject name"
                                className="w-full text-sm py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 ease-in-out"
                              />
                            </TableCell>
                            <TableCell className="py-3 px-1">
                              <Input
                                type="text" 
                                value={subject.passingMarks !== null ? String(subject.passingMarks) : ''} 
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^[0-9]*$/.test(value)) {
                                    const newSubjects = [...editedSubjects];
                                    const originalIndex = editedSubjects.indexOf(subject);
                                    if (originalIndex > -1) newSubjects[originalIndex].passingMarks = value === '' ? null : Number(value);
                                    setEditedSubjects(newSubjects);
                                  }
                                }}
                                placeholder="e.g., 35"
                                className="w-full text-sm py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 ease-in-out"
                              />
                            </TableCell>
                            <TableCell className="flex items-center justify-center"> {/* Removed padding, added flex to center content */}
                                <Checkbox
                                  checked={!subject.disabled}
                                  onCheckedChange={(checked) => {
                                    const newSubjects = [...editedSubjects];
                                    const originalIndex = editedSubjects.indexOf(subject);
                                    if (originalIndex > -1) newSubjects[originalIndex].disabled = !checked; 
                                    setEditedSubjects(newSubjects);
                                  }}
                                  id={`subject-${subject.name}-${index}-status`}
                                  className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="hover:bg-transparent"> 
                          <TableCell colSpan={3} className="text-center text-gray-500 py-4"> 
                            No subjects found matching your search criteria or none added. Click &quot;Add Subject&quot; to add one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setIsEditDialogOpen(false)}
              className="px-5 py-2 text-sm font-medium text-gray-600 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination Controls (Placeholder) */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-2 py-4"> {/* Added styling */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-700"> {/* Added styling */}
            Page {currentPage} of {totalPages} {/* Placeholder values */}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
