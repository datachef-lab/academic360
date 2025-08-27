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
import { Pencil, Upload, Download, Loader2, FileText, ChevronLeft, ChevronRight, Power } from "lucide-react";
import { BloodGroupDialog } from "./blood-group-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { uploadBloodGroupsFromFile, downloadBloodGroups } from './actions';
import { type BloodGroup } from "@/db/schema";

const ITEMS_PER_PAGE = 10;
const REQUIRED_HEADERS = ['type'];

export default function BloodGroup() {
  const [data, setData] = useState<BloodGroup[]>([]);
  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingBloodGroup, setEditingBloodGroup] = useState<BloodGroup | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const fetchBloodGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blood-groups');
      const result = await response.json();
      setData(result);
      setTotalCount(result.length);
      
    } catch (error) {
      console.error("Error fetching blood groups:", error);
      toast({
        title: "Failed to fetch blood groups",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodGroups();
  }, [currentPage]);

  const downloadTemplate = () => {
    const sampleData = [
      REQUIRED_HEADERS,
      ['A+'],
      ['B+'],
      ['O+'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Blood Group Template');
    XLSX.writeFile(wb, 'blood_group_template.xlsx');
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
    }
  };

  const handleUploadSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) return;

    startUploadTransition(async () => {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const result = await uploadBloodGroupsFromFile(formData);
        if (!result.success) {
          toast({
            title: "Upload Failed",
            description: result.error || "Failed to upload blood groups.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Upload Successful",
            description: "Blood groups have been uploaded successfully",
          });
          setSelectedFile(null);
          setNumberOfEntries(0);
          if(fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          fetchBloodGroups();
        }
      } catch (error) {
        console.error("Error uploading blood groups:", error);
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
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
      const result = await downloadBloodGroups();
      if (result.success) {
        try {
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "BloodGroups");
          XLSX.writeFile(wb, "all_blood_groups.xlsx");
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
          description: result.error || "Failed to fetch blood groups for download.",
          variant: "destructive",
        });
      }
    });
  };

  const handleEdit = (bloodGroup: BloodGroup) => {
    setEditingBloodGroup(bloodGroup);
  };

  const handleEditSuccess = () => {
    setEditingBloodGroup(null);
    fetchBloodGroups();
  };

  const handleAddSuccess = () => {
    fetchBloodGroups();
  };

  const handleToggleStatus = async (id: number | undefined) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/blood-groups?id=${id}`, {
        method: 'PATCH',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle blood group status');
      }
      
      toast({
        title: "Status Updated",
        description: `Blood group has been ${result.disabled ? 'disabled' : 'enabled'}.`,
      });
      fetchBloodGroups();
    } catch (error) {
      console.error("Error toggling blood group status:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Blood Group Management</h1>
        <div className="flex flex-wrap justify-between items-center gap-3">
           <div className="flex items-center gap-2">
             <form onSubmit={handleUploadSubmit} className="flex items-center gap-2">
                <Label htmlFor="upload-file" className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 flex items-center gap-2">
                    <Upload size={20} />
                    Select File
                </Label>
                <Input
                  id="upload-file"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                {selectedFile && (
                  <span className="text-gray-700 text-sm">{selectedFile.name} ({numberOfEntries} entries)</span>
                )}
                 <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2" disabled={!selectedFile || isPendingUpload}>
                  {isPendingUpload ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  Upload
                </Button>
             </form>
           </div>
           <div className="flex items-center gap-2">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2" onClick={handleDownloadClick} disabled={isPendingDownload || data.length === 0}>
                  {isPendingDownload ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                  Download All
              </Button>
             <Button className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2" onClick={downloadTemplate}>
                <FileText size={20} />
                Download Template
             </Button>
             <BloodGroupDialog onSuccess={handleAddSuccess} />
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
                <TableHead className="text-gray-700">Blood Group</TableHead>
                <TableHead className="text-gray-700">Status</TableHead>
                <TableHead className="text-gray-700">Created At</TableHead>
                <TableHead className="text-gray-700">Updated At</TableHead>
                <TableHead className="text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">No blood groups found.</TableCell>
                </TableRow>
              ) : (
                paginatedData.map((bloodGroup) => (
                  <TableRow key={bloodGroup.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-700">{bloodGroup.id}</TableCell>
                    <TableCell className="text-gray-700">{bloodGroup.type}</TableCell>
                    <TableCell className="text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs ${bloodGroup.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {bloodGroup.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700">{bloodGroup.createdAt ? new Date(bloodGroup.createdAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-gray-700">{bloodGroup.updatedAt ? new Date(bloodGroup.updatedAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100" onClick={() => handleEdit(bloodGroup)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`hover:bg-gray-100 ${bloodGroup.disabled ? 'text-green-500' : 'text-red-500'}`}
                          onClick={() => handleToggleStatus(bloodGroup.id)}
                        >
                          <Power className="h-4 w-4" />
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

      {editingBloodGroup && (
        <BloodGroupDialog
          open={!!editingBloodGroup}
          onOpenChange={(open: boolean) => {!open && setEditingBloodGroup(null)}}
          onSuccess={handleEditSuccess}
          initialData={{
            id: editingBloodGroup.id || 0,
            type: editingBloodGroup.type
          }}
        />
      )}
    </div>
  );
}
