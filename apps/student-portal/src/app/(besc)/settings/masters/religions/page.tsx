'use client';

import React, { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Upload, Download, Loader2, FileText, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { AddReligionDialog, DeleteReligionDialog } from './religion-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { uploadReligionsFromFile } from './actions';
import { ReligionService, type ApiResponse } from '@/services/religion.service';
import { type Religion } from "@/db/schema";

const ITEMS_PER_PAGE = 10;
const REQUIRED_HEADERS = ['name', 'sequence'];

export default function ReligionPage() {
  const [data, setData] = useState<Religion[]>([]);
  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingReligion, setEditingReligion] = useState<Religion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const fetchReligions = useCallback(async () => {
    setLoading(true);
    const response = await ReligionService.getAllReligions();
    if (response.success && response.data) {
      setData(response.data);
      setTotalCount(response.data.length);
    } else {
      toast({
        title: "Error fetching religions",
        description: response.message || "An error occurred while fetching data.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchReligions();
  }, [fetchReligions]);

  const downloadTemplate = () => {
    const sampleData = [
      REQUIRED_HEADERS,
      ['Sample Religion', 1],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    XLSX.utils.book_append_sheet(wb, ws, 'Religion Template');

    XLSX.writeFile(wb, 'religion_template.xlsx');
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

  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      const result = await uploadReligionsFromFile(formData);
      if (!result.success) {
        toast({
          title: "Upload Failed",
          description: result.error || "An error occurred during upload.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Successful",
          description: "Religions have been uploaded successfully",
        });
        setSelectedFile(null);
        setNumberOfEntries(0);
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchReligions();
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownloadClick = () => {
    startDownloadTransition(async () => {
      const response = await ReligionService.getAllReligions();

      if (response.success && response.data) {
        try {
          const ws = XLSX.utils.json_to_sheet(response.data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Religions");
          XLSX.writeFile(wb, "all_religions.xlsx");
        } catch (error) {
          toast({
            title: "Download Failed",
            description: "Could not generate Excel file.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Download Failed",
          description: response.message || "Failed to fetch religions for download.",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddSuccess = () => {
    fetchReligions();
  };

  const handleEdit = (religion: Religion) => {
    setEditingReligion(religion);
  };

  const handleEditSuccess = () => {
    setEditingReligion(null);
    fetchReligions();
  };

  const handleDeleteSuccess = () => {
    fetchReligions();
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    
    if (confirm("Are you sure you want to delete this religion?")) {
      setLoading(true);
      const response = await ReligionService.deleteReligion(id);
      if (response.success) {
        toast({
          title: "Religion deleted",
          description: "The religion has been successfully deleted.",
        });
        fetchReligions();
      } else {
        toast({
          title: "Deletion failed",
          description: response.message || "An error occurred while deleting.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Religions Management</h1>
        <div className="flex flex-wrap justify-between items-center gap-3">
           <div className="flex items-center gap-2">
             <form onSubmit={handleUploadSubmit} className="flex items-center gap-2">
                <Input
                  id="religion-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
                >
                  <Upload size={20} />
                  Choose File
                </Button>
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
             </form>
           </div>
           <div className="flex items-center gap-2">
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
             <AddReligionDialog onSuccess={handleAddSuccess} />
           </div>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-gray-700">ID</TableHead>
                <TableHead className="text-gray-700">Name</TableHead>
                <TableHead className="text-gray-700">Sequence</TableHead>
                <TableHead className="text-gray-700">Created At</TableHead>
                <TableHead className="text-gray-700">Updated At</TableHead>
                <TableHead className="text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">No religions found.</TableCell>
                </TableRow>
              ) : (
                paginatedData.map((religion) => (
                  <TableRow key={religion.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-700">{religion.id}</TableCell>
                    <TableCell className="text-gray-700">{religion.name}</TableCell>
                    <TableCell className="text-gray-700">{religion.sequence ?? 'N/A'}</TableCell>
                    <TableCell className="text-gray-700">{religion.createdAt ? new Date(religion.createdAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-gray-700">{religion.updatedAt ? new Date(religion.updatedAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100" onClick={() => handleEdit(religion)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        {/* <DeleteReligionDialog religionId={religion.id as number} onSuccess={handleDeleteSuccess} /> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex justify-center items-center space-x-2 mt-4">
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Previous
        </Button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="flex items-center gap-1"
        >
          Next <ChevronRight size={16} />
        </Button>
      </div>

      {editingReligion && (
        <AddReligionDialog
          open={!!editingReligion}
          onOpenChange={(open: boolean) => {!open && setEditingReligion(null)}}
          onSuccess={handleEditSuccess}
          initialData={{
            id: editingReligion.id || 0,
            name: editingReligion.name,
            sequence: editingReligion.sequence
          }}
        />
      )}
    </div>
  );
}
