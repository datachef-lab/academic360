'use client';

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
import { AddCategoryDialog, DeleteCategoryDialog } from './category-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { uploadCategoriesFromFile, downloadCategories, fetchCategories as getCategories } from './actions';
import { Category } from "@/db/schema";

// Define the expected return type for the placeholder downloadCategories action
interface DownloadCategoriesResult {
  success: boolean;
  data?: { categories: Category[] };
  error?: string;
}

// Define items per page (placeholder for now)
const ITEMS_PER_PAGE = 10;

// Placeholder required headers for category template (adjust as needed)
const REQUIRED_HEADERS = ['name', 'code', 'documentRequired'];

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  // Function to fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categories = await getCategories();
      setData(categories);
      setTotalCount(categories.length);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Failed to fetch categories",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchCategories();
  }, []); // Remove currentPage dependency since we're handling pagination client-side

  // Add a refresh function that can be called after adding a new category
  const refreshData = () => {
    fetchCategories();
  };

  // Get paginated data
  const getPaginatedData = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return data.slice(start, end);
  };

  const downloadTemplate = () => {
    // Create a sample row with empty values
    const sampleData = [
      REQUIRED_HEADERS,
      [''], // Empty row for example
      ['Sample Category'], // Example row
    ];

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Category Template');

    // Generate Excel file
    XLSX.writeFile(wb, 'category_template.xlsx');
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
      console.log("Inside upload transition, calling uploadCategoriesFromFile...");
      const result = await uploadCategoriesFromFile(formData); // Use category specific action
      console.log("uploadCategoriesFromFile result:", result);
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
          description: "Categories have been uploaded successfully",
        });
        setSelectedFile(null);
        setNumberOfEntries(0);
        // Clear the file input
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh data after upload
        fetchCategories();
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDownloadClick = () => {
    startDownloadTransition(async () => {
      console.log("Download button clicked, calling downloadCategories server action...");
      const result: DownloadCategoriesResult = await downloadCategories(); // Use category specific action and type assertion
      console.log("downloadCategories server action result:", result);

      if (result.success && result.data) {
        try {
          console.log("Received data, generating XLSX...");
          // Assuming the downloadCategories action returns an object with a 'categories' key
          const ws = XLSX.utils.json_to_sheet(result.data.categories);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Categories");
          XLSX.writeFile(wb, "all_categories.xlsx");
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
           description: result.error || "Failed to fetch categories for download.",
           variant: "destructive",
         });
      }
    });
  };

  // Placeholder for edit logic (replace with actual implementation)
  const handleEdit = (category: Category) => {
    console.log("Edit clicked for:", category);
    // You would typically open a dialog here with the category data
    // setSelectedCategory(category);
    // setIsDialogOpen(true);
  };

  // Placeholder for closing dialog (if you implement one)
  // const handleCloseDialog = () => {
  //   setIsDialogOpen(false);
  //   setSelectedCategory(null);
  //   // Refresh the current page after closing dialog
  //   handlePageChange(currentPage);
  // };


  return (
    <div className="container mx-auto pb-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".xlsx,.xls"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Choose File
          </Button>
          <Button
            onClick={() => {
              if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                startUploadTransition(async () => {
                  const result = await uploadCategoriesFromFile(formData);
                  if (result.success) {
                    toast({
                      title: "Success",
                      description: result.message,
                    });
                    setSelectedFile(null);
                    refreshData(); // Refresh after upload
                  } else {
                    toast({
                      title: "Error",
                      description: result.error || "An error occurred",
                      variant: "destructive",
                    });
                  }
                });
              }
            }}
            disabled={!selectedFile || isPendingUpload}
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
          <Button onClick={downloadTemplate}>
            <FileText className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
        <div className="flex gap-2">
          <AddCategoryDialog onSuccess={refreshData} />
          <Button onClick={handleDownloadClick} disabled={isPendingDownload}>
            {isPendingDownload ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Categories
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Document Required</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : getPaginatedData().length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              getPaginatedData().map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.code}</TableCell>
                  <TableCell>{category.documentRequired ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <AddCategoryDialog
                        initialData={category}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                        onSuccess={refreshData}
                      />
                      {category.id && (
                        <DeleteCategoryDialog 
                          categoryId={category.id.toString()} 
                          onSuccess={refreshData}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm">
          Page {currentPage} of {Math.max(1, totalPages)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
