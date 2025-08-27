"use client";

import React, {
  useState,
  useTransition,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
// import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Upload,
  Download,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { AddNationalityDialog } from "./nationality-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { uploadNationalitiesFromFile } from "./actions"; // Keep upload for now
import {
  NationalityService,
  type ApiResponse,
} from "@/services/nationality.service";

interface Nationality {
  id: number; // Changed to number based on schema
  name: string;
  sequence?: number | null; // Added optional sequence and code
  code?: number | null;
  createdAt: string; // Assuming string format from API
  updatedAt: string; // Assuming string format from API
}

const ITEMS_PER_PAGE = 10;
const REQUIRED_HEADERS = ["name", "sequence", "code"]; // Updated required headers

export default function NationalitiesPage() {
  const [data, setData] = useState<Nationality[]>([]);
  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDownload, startDownloadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numberOfEntries, setNumberOfEntries] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingNationality, setEditingNationality] =
    useState<Nationality | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const fetchNationalities = useCallback(async () => {
    setLoading(true);
    const response = await NationalityService.getAllNationalities();
    if (response.success && response.data) {
      // Ensure data has required properties and convert string dates to Date objects if needed later
      setData(response.data as Nationality[]);
      setTotalCount(response.data.length);
    } else {
      toast({
        title: "Error fetching nationalities",
        description:
          response.message || "An error occurred while fetching data.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchNationalities();
  }, [fetchNationalities]);

  const downloadTemplate = () => {
    const sampleData = [REQUIRED_HEADERS, ["Sample Nationality", 1, 101]];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    XLSX.utils.book_append_sheet(wb, ws, "Nationality Template");

    XLSX.writeFile(wb, "nationality_template.xlsx");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
          }) as any[][];

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
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
          }) as any[][];
          const headers = (jsonData[0] as string[]).map((h) => h.trim());

          const missingHeaders = REQUIRED_HEADERS.filter(
            (h) => !headers.includes(h)
          );

          if (missingHeaders.length > 0) {
            toast({
              title: "Invalid File Format",
              description: `Missing required headers: ${missingHeaders.join(
                ", "
              )}`,
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

  const handleUploadSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
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

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const nationalities = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });

        console.log("Parsed nationalities:", nationalities);

        console.log("Starting upload transition...");
        startUploadTransition(async () => {
          for (const nationality of nationalities) {
            const response = await fetch("/api/nationalities", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(nationality),
            });
            const data = await response.json();
            console.log(data);

            if (!response.ok) {
              const error = await response.json();
              console.error("Upload error:", error);
              toast({
                title: "Upload Failed",
                description:
                  error.message || "An error occurred during upload.",
                variant: "destructive",
              });
              return;
            }
          }

          console.log("All nationalities uploaded successfully");
          toast({
            title: "Upload Successful",
            description: "Nationalities have been uploaded successfully",
          });

          setSelectedFile(null);
          setNumberOfEntries(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          fetchNationalities(); // Refresh data after upload
        });
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Processing Error",
          description: "Failed to read the Excel file",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownloadClick = () => {
    startDownloadTransition(async () => {
      console.log("Download button clicked, fetching data for download...");
      const response = await NationalityService.getAllNationalities();

      if (response.success && response.data) {
        try {
          console.log("Received data, generating XLSX...");
          const ws = XLSX.utils.json_to_sheet(response.data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Nationalities");
          XLSX.writeFile(wb, "all_nationalities.xlsx");
          console.log("XLSX file generated and download triggered.");
        } catch (error) {
          console.error("Error generating or downloading XLSX:", error);
          toast({
            title: "Download Failed",
            description: "Could not generate Excel file.",
            variant: "destructive",
          });
        }
      } else if (!response.success) {
        console.error(
          "Download failed with error from service:",
          response.error
        );
        toast({
          title: "Download Failed",
          description:
            response.message || "Failed to fetch nationalities for download.",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddSuccess = () => {
    fetchNationalities(); // Refresh data after adding
  };

  const handleEdit = (nationality: Nationality) => {
    setEditingNationality(nationality);
  };

  const handleEditSuccess = () => {
    setEditingNationality(null);
    fetchNationalities(); // Refresh data after editing
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this nationality?")) {
      setLoading(true);
      const response = await NationalityService.deleteNationality(id);
      if (response.success) {
        toast({
          title: "Nationality deleted",
          description: "The nationality has been successfully deleted.",
        });
        fetchNationalities(); // Refresh data after deleting
      } else {
        toast({
          title: "Deletion failed",
          description: response.message || "An error occurred while deleting.",
          variant: "destructive",
        });
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Nationalities Management
        </h1>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <form
              onSubmit={handleUploadSubmit}
              className="flex items-center gap-2"
            >
              <Label
                htmlFor="upload-file"
                className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 flex items-center gap-2"
              >
                <Upload size={20} />
                Select File
              </Label>
              <Input
                id="upload-file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                className="hidden"
                ref={fileInputRef}
              />
              {selectedFile && (
                <span className="text-gray-700 text-sm">
                  {selectedFile.name} ({numberOfEntries} entries)
                </span>
              )}
              <Button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                disabled={!selectedFile || isPendingUpload}
              >
                {isPendingUpload ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Upload size={20} />
                )}
                Upload
              </Button>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
              onClick={handleDownloadClick}
              disabled={isPendingDownload || data.length === 0}
            >
              {isPendingDownload ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Download size={20} />
              )}
              Download All
            </Button>
            <Button
              className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
              onClick={downloadTemplate}
            >
              <FileText size={20} />
              Download Template
            </Button>
            {/* Add Nationality Dialog Trigger */}
            <AddNationalityDialog onSuccess={handleAddSuccess} />
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
                <TableHead className="text-gray-700">Code</TableHead>
                <TableHead className="text-gray-700">Created At</TableHead>
                <TableHead className="text-gray-700">Updated At</TableHead>
                <TableHead className="text-gray-700 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No nationalities found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((nationality) => (
                  <TableRow key={nationality.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-700">
                      {nationality.id}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {nationality.name}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {nationality.sequence ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {nationality.code ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {new Date(nationality.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {new Date(nationality.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100"
                          onClick={() => handleEdit(nationality)}
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
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

      {/* Edit Nationality Dialog */}
      {editingNationality && (
        <AddNationalityDialog
          open={!!editingNationality}
          onOpenChange={(open) => {
            !open && setEditingNationality(null);
          }}
          onSuccess={handleEditSuccess}
          initialData={editingNationality}
        />
      )}
    </div>
  );
}
