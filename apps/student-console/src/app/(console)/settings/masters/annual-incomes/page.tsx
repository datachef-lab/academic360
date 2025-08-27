"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import Table components
import { Plus, Upload, Download, Loader2, FileText, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { AnnualIncome } from "@/db/schema";
import { AnnualIncomeDialog } from "./annual-income-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx'; // Import xlsx

const ITEMS_PER_PAGE = 10;
const REQUIRED_HEADERS = ['range']; // Define required headers for template

export default function AnnualIncomesPage() {
  const [data, setData] = useState<AnnualIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);

  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const fetchAnnualIncomes = async () => {
    setLoading(true);
    try {
      // Assuming your API supports pagination, modify the fetch call
      const response = await fetch(`/api/annual-incomes?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      const result = await response.json();
      setData(result);
      setTotalCount(result.length);
     
    } catch (error) {
      console.error("Error fetching annual incomes:", error);
      setData([]);
      setTotalCount(0);
      toast({
        title: "Failed to fetch annual incomes",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnualIncomes();
  }, [currentPage]); // Add currentPage as dependency

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleEdit = (annualIncome: AnnualIncome) => {
    // The edit functionality is handled by the AnnualIncomeDialog component
    // which receives the annualIncome data through its props
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/annual-incomes?id=${id}`, {
        method: 'PATCH',
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Status Updated",
          description: "Annual income status has been updated successfully.",
        });
        fetchAnnualIncomes();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update annual income status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating annual income status:", error);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    // Create a sample row with empty values
    const sampleData = [
      REQUIRED_HEADERS,
      [''], // Empty row for example
      ['50000 - 100000'], // Example row
    ];

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Annual Income Template');

    // Generate Excel file
    XLSX.writeFile(wb, 'annual_income_template.xlsx');
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

          if (jsonData.length > 1) {
            setNumberOfEntries(jsonData.length - 1);
          } else {
            setNumberOfEntries(0);
          }

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

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const isValid = await validateFile(selectedFile);
    if (!isValid) {
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    startUploadTransition(async () => {
      try {
        const response = await fetch('/api/annual-incomes/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (result.success) {
          toast({
            title: "Upload Successful",
            description: "Annual incomes have been uploaded successfully",
          });
          setSelectedFile(null);
          setNumberOfEntries(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          fetchAnnualIncomes();
        } else {
          toast({
            title: "Upload Failed",
            description: result.error || "An error occurred during upload.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Upload Failed",
          description: "An unexpected error occurred during upload.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDownloadClick = () => {
    startDownloadTransition(async () => {
      try {
        const response = await fetch('/api/annual-incomes/download');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annual_incomes.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: "Your download should begin shortly.",
        });
      } catch (error) {
        console.error("Error downloading file:", error);
        toast({
          title: "Download Failed",
          description: "An error occurred during download.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Annual Income Ranges</h1>
        <div className="flex flex-wrap justify-between items-center gap-3">
          {/* Upload/Download Template Group */}
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <Input
              id="annual-income-upload"
              type="file"
              name="file"
              accept=".csv, .xlsx"
              className="hidden"
              onChange={handleFileSelect}
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
            <Button type="button" size="sm" onClick={handleUploadSubmit} disabled={!selectedFile || isPendingUpload}
              className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
            >
              {isPendingUpload ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />Upload File</>
              )}
            </Button>
            {/* Download Template Button */}
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
          </div>

          {/* Add/Download Annual Incomes Group */}
          <div className="flex items-center gap-2">
            {/* Add Annual Income Dialog Trigger */}
            <AnnualIncomeDialog onSuccess={fetchAnnualIncomes}>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Annual Income Range
              </Button>
            </AnnualIncomeDialog>
            {/* Download Annual Incomes Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadClick}
              disabled={isPendingDownload}
              className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
            >
              {isPendingDownload ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Downloading...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" />Download Annual Incomes</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container matching Courses page style */}
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[80px] font-semibold text-gray-700">Sr. No</TableHead>
                <TableHead className="font-semibold text-gray-700">Income Range</TableHead>
                <TableHead className="text-gray-700">Status</TableHead>
                <TableHead className="text-gray-700">Created At</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">No annual income ranges found.</TableCell>
                </TableRow>
              ) : (
                paginatedData.map((annualIncome, index) => (
                  <TableRow key={`annual-income-${annualIncome.id}-${index}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-600">{startIndex + index + 1}</TableCell>
                    <TableCell className="text-gray-700">{annualIncome.range}</TableCell>
                    <TableCell className="text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs ${annualIncome.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {annualIncome.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700">{annualIncome.createdAt ? new Date(annualIncome.createdAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         {/* Edit Button */}
                         <AnnualIncomeDialog annualIncome={annualIncome} onSuccess={fetchAnnualIncomes}>
                           <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                             <Pencil className="h-4 w-4 text-blue-500" />
                           </Button>
                         </AnnualIncomeDialog>
                         {/* Delete Button */}
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="hover:bg-gray-100"
                           onClick={() => annualIncome.id && handleToggleStatus(annualIncome.id)}
                         >
                           <Trash2 className="h-4 w-4 text-red-500" />
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="flex items-center gap-1"
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
            disabled={currentPage === totalPages || loading}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
