import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Download, Upload, Library } from "lucide-react";
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import * as XLSX from "xlsx";
import { ClassForm } from "./class-form";
import { Class } from "@/types/academics/class";
import { getAllClasses } from "@/services/classes.service";
import { addClass, updateClass } from "@/services/class.service";

const ClassesPage = () => {
  const [Classs, setClasss] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setLoading(true);
    getAllClasses()
      .then((res) => {
        // Ensure we have an array, even if the API returns something unexpected
        const ClasssData = Array.isArray(res) ? res : [];
        setClasss(ClasssData);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching Classs:", error);
        setError("Failed to fetch Classs");
        setClasss([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredClasss = (Array.isArray(Classs) ? Classs : []).filter(
    (Class) =>
      (Class.name ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (Class.shortName ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (Class.sequence?.toString() ?? "").includes(searchText.toLowerCase()),
  );

  const handleEdit = (Class: Class) => {
    setSelectedClass(Class);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: Class) => {
    setIsSubmitting(true);
    try {
      if (selectedClass) {
        // Update
        await updateClass(selectedClass.id!, data);
        toast.success("Class updated successfully");
      } else {
        // Create
        await addClass(data);
        toast.success("Class created successfully");
      }
      // Always re-fetch after add/edit
      const freshClasss = await getAllClasses();
      setClasss(Array.isArray(freshClasss) ? freshClasss : []);
      setIsFormOpen(false);
    } catch {
      toast.error(`Failed to save Class`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedClass(null);
    setIsFormOpen(true);
  };

  const handleBulkUpload = () => {
    if (!bulkFile) return;
    // TODO: Implement actual upload logic
    toast.success("Bulk upload successful (mock)");
    setIsBulkUploadOpen(false);
    setBulkFile(null);
  };

  const handleDownloadTemplate = () => {
    // For now, just download a static file or trigger a download
    const link = document.createElement("a");
    link.href = "/templates/Class-bulk-upload-template.xlsx";
    link.download = "Class-bulk-upload-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getAllClasses();
      const data = res.map((classItem) => ({
        ID: classItem.id,
        Type: classItem.type,
        Name: classItem.name,
        "Short Name": classItem.shortName,
        Status: classItem.disabled ? "Inactive" : "Active",
        "Created At": classItem.createdAt,
        "Updated At": classItem.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Classs");
      XLSX.writeFile(wb, "Classs.xlsx");
    } catch {
      toast.error("Failed to download Classs");
    }
  };

  // const allSelected =
  //   filteredClasss.length > 0 &&
  //   filteredClasss.every((Class) => selectedRows.includes(Class.id ?? -1));

  // const toggleSelectAll = () => {
  //   if (allSelected) {
  //     setSelectedRows([]);
  //   } else {
  //     setSelectedRows(filteredClasss.map((c) => c.id ?? -1));
  //   }
  // };

  // const toggleSelectRow = (id: number) => {
  //   setSelectedRows((prev) =>
  //     prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
  //   );
  // };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Library className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Classes</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">A list of all the Classes offered.</div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Upload</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:w-full max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Classs</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleBulkUpload} disabled={!bulkFile}>
                    Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadTemplate} className="flex-shrink-0">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedClass ? "Edit Class" : "Add New Class"}</AlertDialogTitle>
                </AlertDialogHeader>
                <ClassForm
                  initialData={selectedClass as Class}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2 flex-shrink-0" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
          {/* Table View - Keep original table UI on all screens */}
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>ID</TableHead>
                    <TableHead style={{ width: 320, background: "#f3f4f6", color: "#374151" }}>Type</TableHead>
                    <TableHead style={{ width: 320, background: "#f3f4f6", color: "#374151" }}>Name</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Short Name</TableHead>
                    <TableHead style={{ width: 100, background: "#f3f4f6", color: "#374151" }}>Status</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredClasss.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        No Classs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClasss.map((Class) => (
                      <TableRow key={Class.id} className="group">
                        <TableCell style={{ width: 60 }}>{Class.id}</TableCell>
                        <TableCell style={{ width: 320 }}>{Class.type}</TableCell>
                        <TableCell style={{ width: 320 }}>{Class.name}</TableCell>
                        <TableCell style={{ width: 140 }}>{Class.shortName}</TableCell>
                        <TableCell style={{ width: 100 }}>
                          {Class.disabled === true ? (
                            <Badge variant="secondary">Inactive</Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(Class)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassesPage;
