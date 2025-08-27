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
import { Pencil, Upload, Download, Loader2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { CourseDialog } from "./course-dialog";
import { downloadCourses, handleCourseSubmit, uploadCoursesFromFile, fetchPaginatedCourses } from "./actions";
import { type Course } from "@/db/schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface CourseListProps {
  initialCourses: Course[];
  totalCount: number;
  limit: number;
}

const REQUIRED_HEADERS = ['name', 'shortName', 'codePrefix', 'universityCode', 'amount'];
const ITEMS_PER_PAGE = 10; // Define items per page

export function CourseList({ initialCourses, totalCount, limit }: CourseListProps) {
  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const totalPages = Math.ceil(totalCount / limit);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const downloadTemplate = () => {
    // Create a sample row with empty values
    const sampleData = [
      REQUIRED_HEADERS,
      ['', '', '', '', ''], // Empty row for example
      ['Bachelor of Computer Science', 'BCS', 'CS', 'UNI001', 10000], // Example row
    ];

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Course Template');

    // Generate Excel file
    XLSX.writeFile(wb, 'course_template.xlsx');
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
    const isValid = await validateFile(selectedFile);
    if (!isValid) {
      console.log("File validation failed");
      return;
    }

    console.log("File valid, preparing formData...");
    const formData = new FormData();
    formData.append('file', selectedFile);

    console.log("Starting upload transition...");
    startUploadTransition(async () => {
      console.log("Inside upload transition, calling uploadCoursesFromFile...");
      const result = await uploadCoursesFromFile(formData);
      console.log("uploadCoursesFromFile result:", result);
      if (!result.success) {
        console.error("Upload failed with error:", result.error);
        toast({
          title: "Upload Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        console.log("Upload successful");
        toast({
          title: "Upload Successful",
          description: "Courses have been uploaded successfully",
        });
        setSelectedFile(null);
        setNumberOfEntries(0);
        // Clear the file input
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const handlePageChange = async (newPage: number) => {
    setIsLoading(true);
    const result = await fetchPaginatedCourses(newPage, limit);
    if (result.success) {
      setCourses(result.data);
      setCurrentPage(newPage);
    } else {
      toast({
        title: "Error fetching courses",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleDownloadClick = () => {
    startDownloadTransition(async () => {
      console.log("Download button clicked, calling downloadCourses server action...");
      const result = await downloadCourses(); // Call the server action
      console.log("downloadCourses server action result:", result);

      if (result.success && result.data) {
        try {
          console.log("Received data, generating XLSX...");
          const ws = XLSX.utils.json_to_sheet(result.data.courses);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Courses");
          XLSX.writeFile(wb, "all_courses.xlsx");
          console.log("XLSX file generated and download triggered.");
        } catch (error) {
          console.error("Error generating or downloading XLSX:", error);
          toast({
            title: "Download Failed",
            description: "Could not generate Excel file.",
            variant: "destructive",
          });
        }
      } else if (!result.success) {
         console.error("Download failed with error from server action:", result.error);
         toast({
           title: "Download Failed",
           description: result.error || "Failed to fetch courses for download.",
           variant: "destructive",
         });
      }
    });
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCourse(null);
    // Refresh the current page after closing dialog (assuming changes might have been made)
    handlePageChange(currentPage);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <div className="flex flex-wrap justify-between items-center gap-3">
           <form onSubmit={handleUploadSubmit} className="flex items-center gap-2">
            
            <div className="flex items-center gap-2">
              <Input 
                id="course-upload" 
                type="file" 
                name="file" 
                accept=".xlsx" 
                className="hidden"
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
              <Button type="button" onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
              >
                <Upload size={20} />
                Choose File
              </Button>

              {selectedFile && (
                <span className="text-sm text-gray-600">
                  {selectedFile.name} ({numberOfEntries} entries)
                </span>
              )}
            </div>
            <Button type="submit" size="sm" disabled={!selectedFile || isPendingUpload}>
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
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate}
              className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
            >
              <FileText size={20} />
              Download Template
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <CourseDialog mode="add" />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadClick}
              disabled={isPendingDownload}
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
                  Download Courses
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[80px] font-semibold text-gray-700">Sr. No</TableHead>
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Short Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Code Prefix</TableHead>
              <TableHead className="font-semibold text-gray-700">University Code</TableHead>
              <TableHead className="font-semibold text-gray-700">Amount</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading courses...</TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No courses found.</TableCell>
              </TableRow>
            ) : (
              courses.map((course, index) => (
                <TableRow key={`course-${course.id}-${index}`} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-600">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell className="text-gray-700">{course.name}</TableCell>
                  <TableCell className="text-gray-700">{course.shortName}</TableCell>
                  <TableCell className="text-gray-700">{course.codePrefix}</TableCell>
                  <TableCell className="text-gray-700">{course.universityCode}</TableCell>
                  <TableCell className="text-gray-700">{course.amount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <CourseDialog mode="edit" course={course}>
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                      </CourseDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
} 