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
} from "@/components/ui/table";
import { Plus, Upload, Download, Loader2, FileText, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { LanguageMedium } from "@/db/schema";
import { LanguageMediumDialog } from "./language-medium-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";

const ITEMS_PER_PAGE = 10;
const REQUIRED_HEADERS = ['name'];

export default function LanguageMediumPage() {
  const [data, setData] = useState<LanguageMedium[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedLanguageMedium, setSelectedLanguageMedium] = useState<LanguageMedium | null>(null);

  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const fetchLanguageMediums = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/language-mediums?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setTotalCount(result.data.length);
      } else {
        toast({
          title: "Failed to fetch language mediums",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching language mediums:", error);
      setData([]);
      setTotalCount(0);
      toast({
        title: "Failed to fetch language mediums",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguageMediums();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleEdit = (languageMedium: LanguageMedium) => {
    setSelectedLanguageMedium(languageMedium);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedLanguageMedium(null);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleToggleStatus = async (languageMedium: LanguageMedium) => {
    try {
      const response = await fetch(`/api/language-mediums?id=${languageMedium.id}`, {
        method: 'PATCH',
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Status Updated",
          description: "Language medium status has been updated successfully.",
        });
        fetchLanguageMediums();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update language medium status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling language medium status:", error);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const sampleData = [
      REQUIRED_HEADERS,
      ['English'],
      ['Hindi'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    XLSX.utils.book_append_sheet(wb, ws, 'Language Medium Template');
    XLSX.writeFile(wb, 'language_medium_template.xlsx');
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
        const response = await fetch('/api/language-mediums/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (result.success) {
          toast({
            title: "Upload Successful",
            description: "Language mediums have been uploaded successfully",
          });
          setSelectedFile(null);
          setNumberOfEntries(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          fetchLanguageMediums();
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

  const handleDownloadLanguageMediums = async () => {
    startDownloadTransition(async () => {
      try {
        const response = await fetch('/api/language-mediums/download');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'language_mediums.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({
          title: "Download Successful",
          description: "Language mediums downloaded successfully.",
        });
      } catch (error) {
        console.error("Error downloading language mediums:", error);
        toast({
          title: "Download Failed",
          description: "Failed to download language mediums.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Language Medium Management</h1>
        <div className="flex flex-wrap justify-between items-center gap-3">
          {/* Upload/Download Template Group */}
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <Input
              id="language-medium-upload"
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
            <Button 
              type="button" 
              size="sm" 
              onClick={handleUploadSubmit} 
              disabled={!selectedFile || isPendingUpload}
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
              size="sm" 
              onClick={downloadTemplate} 
              className="bg-gray-400 hover:bg-gray-500 text-white flex items-center gap-2"
            >
              <FileText size={20} />
              Download Template
            </Button>
          </div>

          {/* Add and Download Group */}
          <div className="flex justify-end gap-2">
            <Button 
              onClick={handleAdd}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Language Medium
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={handleDownloadLanguageMediums} 
              disabled={isPendingDownload}
              className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
            >
              {isPendingDownload ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Downloading...</>
              ) : (
                <><Download className="h-4 w-4" />Download Language Mediums</>
              )}
            </Button>
          </div>
        </div>

        {/* Data Table and Pagination */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading language mediums...</p>
          </div>
        ) : (
          <DataTable
            columns={columns({ onEdit: handleEdit, onToggleStatus: handleToggleStatus })}
            data={paginatedData}
          />
        )}

        <div className="flex justify-end space-x-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            variant="outline"
            size="sm"
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
      <LanguageMediumDialog
        mode={dialogMode}
        languageMedium={selectedLanguageMedium}
        open={dialogOpen}
        setOpen={setDialogOpen}
        onSuccess={fetchLanguageMediums}
      />
    </div>
  );
}
