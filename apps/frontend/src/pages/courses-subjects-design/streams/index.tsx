import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Layers, Download, Upload, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Stream } from "@/types/course-design";
import { getAllStreams, createStream, updateStream, bulkUploadStreams, BulkUploadResult } from "@/services/stream.api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { StreamForm } from "./stream-form";
import { Label } from "@/components/ui/label";

const StreamsPage = () => {
  const [streams, setStreams] = React.useState<Stream[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedStream, setSelectedStream] = React.useState<Stream | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    getAllStreams()
      .then(res => {
        const streamsData = Array.isArray(res) ? res : [];
        setStreams(streamsData);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching streams:', error);
        setError("Failed to fetch streams");
        setStreams([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (stream: Stream) => {
    setSelectedStream(stream);
    setIsFormOpen(true);
  };

  // const handleDelete = async (id: number) => {
  //   try {
  //     await deleteStream(id);
  //     setStreams(prev => prev.filter(s => s.id !== id));
  //     toast.success("Stream deleted successfully");
  //   } catch (error) {
  //     toast.error("Failed to delete stream");
  //   }
  // };

  const handleSubmit = async (data: { name: string; code: string; shortName?: string | null; sequence?: number | null; disabled: boolean }) => {
    setIsSubmitting(true);
    try {
      const streamData: Omit<Stream, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        code: data.code,
        shortName: data.shortName || null,
        sequence: data.sequence || null,
        disabled: data.disabled,
      };
      
      if (selectedStream?.id) {
        // Update
        await updateStream(Number(String(selectedStream.id).split(':')[0]), streamData);
        toast.success("Stream updated successfully");
      } else {
        // Create
        await createStream(streamData);
        toast.success("Stream created successfully");
      }
      // Always re-fetch after add/edit
      const freshStreams = await getAllStreams();
      setStreams(Array.isArray(freshStreams) ? freshStreams : []);
      setIsFormOpen(false);
    } catch (error) {
      toast.error(`Failed to save stream: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedStream(null);
    setIsFormOpen(true);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    
    setIsBulkUploading(true);
    try {
      const result = await bulkUploadStreams(bulkFile);
      setBulkUploadResult(result);
      
      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} streams`);
        // Re-fetch the list to show new data
        const freshStreams = await getAllStreams();
        setStreams(Array.isArray(freshStreams) ? freshStreams : []);
      }
      
      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} streams failed to upload`);
      }
      
    } catch (error: unknown) {
      toast.error(`Bulk upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        Name: "Science",
        Code: "SCI",
        "Short Name": "Sci",
        Sequence: 1,
        Status: "Active"
      },
      {
        Name: "Commerce", 
        Code: "COM",
        "Short Name": "Comm",
        Sequence: 2,
        Status: "Active"
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Streams Template");
    XLSX.writeFile(wb, "stream-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getAllStreams();
      const data = res.map(stream => ({
        ID: stream.id,
        Name: stream.name,
        Code: stream.code || "-",
        "Short Name": stream.shortName || "-",
        Sequence: stream.sequence || "-",
        Status: stream.disabled ? "Inactive" : "Active",
        "Created At": stream.createdAt,
        "Updated At": stream.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Streams");
      XLSX.writeFile(wb, "streams.xlsx");
    } catch {
      toast.error("Failed to download streams");
    }
  };

  const handleCloseBulkUpload = () => {
    setIsBulkUploadOpen(false);
    setBulkFile(null);
    setBulkUploadResult(null);
  };

  const handleDownloadFailedData = () => {
    if (!bulkUploadResult || bulkUploadResult.errors.length === 0) {
      toast.error("No failed data to download");
      return;
    }

    try {
      // Create failed data with error details
      const failedData = bulkUploadResult.errors.map((error) => {
        const errorData = error.data as Record<string, unknown>;
        return {
          "Row Number": error.row,
          "Error Message": error.error,
          "Original Data": JSON.stringify(error.data),
          "Name": (errorData.Name as string) || "",
          "Code": (errorData.Code as string) || "",
          "Short Name": (errorData["Short Name"] as string) || "",
          "Sequence": (errorData.Sequence as string) || "",
          "Status": (errorData.Status as string) || ""
        };
      });

      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed Streams");
      XLSX.writeFile(wb, "failed-streams-upload.xlsx");
      
      toast.success("Failed data downloaded successfully");
    } catch {
      toast.error("Failed to download error data");
    }
  };

  const filteredStreams = (Array.isArray(streams) ? streams : []).filter((stream) =>
    (stream.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (stream.code ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (stream.shortName ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (stream.sequence?.toString() ?? '').includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Layers className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Streams
            </CardTitle>
            <div className="text-muted-foreground">A list of all available streams.</div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button> 
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Streams</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Download the template to see the required format
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bulk-upload-file" className="text-sm font-medium">Upload Excel File</Label>
                    <Input
                      id="bulk-upload-file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={e => setBulkFile(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                  </div>

                  {bulkUploadResult && (
                    <Card className="border rounded-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Upload Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="font-semibold text-gray-900">Total</div>
                            <div className="text-2xl font-bold text-blue-600">{bulkUploadResult.summary.total}</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="font-semibold text-green-900">Successful</div>
                            <div className="text-2xl font-bold text-green-600">{bulkUploadResult.summary.successful}</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="font-semibold text-red-900">Failed</div>
                            <div className="text-2xl font-bold text-red-600">{bulkUploadResult.summary.failed}</div>
                          </div>
                        </div>
                        
                        {bulkUploadResult.errors.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-red-600">Errors:</h5>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleDownloadFailedData}
                                className="text-xs"
                              >
                                <Download className="mr-1 h-3 w-3" />
                                Download Failed Data
                              </Button>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                              {bulkUploadResult.errors.map((error, index) => (
                                <div key={index} className="text-xs p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <span className="font-medium text-red-800">Row {error.row}:</span> 
                                  <span className="text-red-700 ml-1">{error.error}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkUpload} 
                      disabled={!bulkFile || isBulkUploading}
                      className="flex-1"
                    >
                      {isBulkUploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button variant="outline" onClick={handleCloseBulkUpload}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Stream
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedStream ? "Edit Stream" : "Add New Stream"}</AlertDialogTitle>
                </AlertDialogHeader>
                <StreamForm
                  initialData={selectedStream}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input placeholder="Search..." className="w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <div className="relative" style={{ height: '600px' }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[700px]" style={{ tableLayout: 'fixed' }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: '#f3f4f6' }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: '#f3f4f6', color: '#374151' }}>ID</TableHead>
                    <TableHead style={{ width: 200, background: '#f3f4f6', color: '#374151' }}>Name</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Code</TableHead>
                    <TableHead style={{ width: 150, background: '#f3f4f6', color: '#374151' }}>Short Name</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Sequence</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Status</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-red-500">{error}</TableCell>
                    </TableRow>
                  ) : filteredStreams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No streams found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredStreams.map((stream) => (
                      <TableRow key={stream.id} className="group">
                        <TableCell style={{ width: 60 }}>{stream.id}</TableCell>
                        <TableCell style={{ width: 200 }}>{stream.name}</TableCell>
                        <TableCell style={{ width: 120 }}>{stream.code || "-"}</TableCell>
                        <TableCell style={{ width: 150 }}>{stream.shortName || "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>{stream.sequence || "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {stream.disabled ? (
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
                              onClick={() => handleEdit(stream)}
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

export default StreamsPage;
