"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download, Loader2, Upload } from "lucide-react";
import { SportsCategoryDialog } from "./sports-category-dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { Badge } from "@/components/ui/badge";

interface SportsCategory {
  id?: number;
  name: string;
  disabled?: boolean;
  createdAt?: string;
}

const ITEMS_PER_PAGE = 10;
const REQUIRED_HEADERS = ["name"];

export default function SportsCategoriesPage() {
  const [data, setData] = useState<SportsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);
  const [rowLoading, setRowLoading] = useState<{ [id: number]: boolean }>({});

  const fetchSportsCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sports-categories`);
      const result = await response.json();
      setData(result);
      setTotalCount(result.length);
    } catch (error) {
      setData([]);
      setTotalCount(0);
      toast({
        title: "Failed to fetch sports categories",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSportsCategories();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const downloadTemplate = () => {
    const sampleData = [
      ["name"],
      [""],
      ["Football"],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sports Category Template');
    XLSX.writeFile(wb, 'sports_category_template.xlsx');
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
    try {
      const response = await fetch('/api/sports-categories/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Upload Successful",
          description: "Sports categories have been uploaded successfully",
        });
        setSelectedFile(null);
        setNumberOfEntries(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchSportsCategories();
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "An error occurred during upload.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    }
  };

  const downloadAll = () => {
    const exportData = data.map(({ name, disabled, createdAt }) => ({ name, status: disabled ? 'Disabled' : 'Active', createdAt }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sports Categories');
    XLSX.writeFile(wb, 'sports_categories.xlsx');
  };

  const handleToggleStatus = async (id: number, disabled: boolean) => {
    setRowLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`/api/sports-categories?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !disabled }),
      });
      if (response.ok) {
        toast({
          title: 'Status Updated',
          description: `Category is now ${!disabled ? 'disabled' : 'active'}.`,
        });
        fetchSportsCategories();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update status.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setRowLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Sports Categories</h2>
      </div>
      <div className="flex justify-between gap-2 mb-6">
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
          <Button
            variant="default"
            onClick={handleUploadSubmit}
            disabled={!selectedFile}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
        <div className="flex gap-2">
          <SportsCategoryDialog onSuccess={fetchSportsCategories} />
          <Button variant="outline" onClick={downloadAll}>
            <Download className="mr-2 h-4 w-4" />
            Download Sports Categories
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto w-full border rounded bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No sports categories found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow key={row.id || idx}>
                  <TableCell>{startIndex + idx + 1}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    {row.disabled ? (
                      <Badge variant="outline" className="bg-red-100 text-red-700">Disabled</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <SportsCategoryDialog onSuccess={fetchSportsCategories} sportsCategory={row}>
                        <Button variant="ghost" size="icon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </Button>
                      </SportsCategoryDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(row.id!, row.disabled!)}
                        disabled={rowLoading[row.id!]}
                      >
                        {row.disabled ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
