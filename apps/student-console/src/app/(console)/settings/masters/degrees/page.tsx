"use client";

import React, { useEffect, useState, useRef } from "react";
import { columns } from "./columns";
import { DegreeDialog } from "./degree-dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function DegreePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedDegree, setSelectedDegree] = useState(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const fetchDegrees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/degrees");
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setData([]);
      toast({
        title: "Error",
        description: "Failed to fetch degrees",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDegrees();
  }, []);

  const handleDownloadTemplate = () => {
    // Download a sample Excel file
    const sampleData = [
      ["Name", "Level", "Sequence"],
      ["Bachelor of Science", "UNDER_GRADUATE", 1],
      ["Master of Arts", "POST_GRADUATE", 2],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "degree_template.xlsx");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch("/api/degrees/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: "Degrees have been uploaded successfully",
        });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await fetchDegrees();
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "An error occurred during upload",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadDegrees = async () => {
    try {
      const res = await fetch("/api/degrees/download");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "degrees.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download degrees",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (degree: any) => {
    setSelectedDegree(degree);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedDegree(null);
    setDialogMode("add");
    setDialogOpen(true);
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Degree Management</h2>
      </div>
      <div className="flex justify-between pr-6">
        <div className="flex gap-2 mb-4">
          <Input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
            accept=".xlsx,.xls"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Choose File
          </Button>
          {selectedFile && (
            <span className="text-sm text-gray-600">{selectedFile.name}</span>
          )}
          <Button 
            variant="default" 
            onClick={handleUploadFile} 
            disabled={!selectedFile || isUploading}
            className="relative"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
        <div className="flex justify-end gap-2 mb-2">
          <Button variant="default" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Degree
          </Button>
          <Button variant="secondary" onClick={handleDownloadDegrees}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <DegreeDialog
        mode={dialogMode}
        degree={selectedDegree}
        open={dialogOpen}
        setOpen={setDialogOpen}
        onSuccess={fetchDegrees}
      />
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading degrees...</span>
        </div>
      ) : (
        <DataTable columns={columns({ onEdit: handleEdit })} data={data} />
      )}
    </div>
  );
}
