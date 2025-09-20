import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, GraduationCap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { boardSubjectService, type BoardSubjectDto } from "@/services/board-subject.service";
import { boardService, type BoardDto } from "@/services/board.service";
import { boardSubjectNameService, type BoardSubjectNameDto } from "@/services/board-subject-name.service";
import { degreeService, type DegreeDto } from "@/services/degree.service";

// ----------------- Board Subject Form -------------------
const BoardSubjectForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  boardOptions,
  boardSubjectNameOptions,
}: {
  initialData: BoardSubjectDto | null;
  onSubmit: (data: {
    boardId: number;
    boardSubjectNameId: number;
    fullMarksTheory?: number | null;
    passingMarksTheory?: number | null;
    fullMarksPractical?: number | null;
    passingMarksPractical?: number | null;
    isActive: boolean;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
  boardOptions: BoardDto[];
  boardSubjectNameOptions: BoardSubjectNameDto[];
}) => {
  const [formData, setFormData] = React.useState({
    boardId: initialData?.boardId || 0,
    boardSubjectNameId: initialData?.boardSubjectNameId || 0,
    fullMarksTheory: initialData?.fullMarksTheory ?? "",
    passingMarksTheory: initialData?.passingMarksTheory ?? "",
    fullMarksPractical: initialData?.fullMarksPractical ?? "",
    passingMarksPractical: initialData?.passingMarksPractical ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      boardId: formData.boardId,
      boardSubjectNameId: formData.boardSubjectNameId,
      fullMarksTheory: formData.fullMarksTheory === "" ? null : Number(formData.fullMarksTheory),
      passingMarksTheory: formData.passingMarksTheory === "" ? null : Number(formData.passingMarksTheory),
      fullMarksPractical: formData.fullMarksPractical === "" ? null : Number(formData.fullMarksPractical),
      passingMarksPractical: formData.passingMarksPractical === "" ? null : Number(formData.passingMarksPractical),
      isActive: formData.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="boardId">Board *</Label>
          <Select
            value={formData.boardId.toString()}
            onValueChange={(v) => setFormData({ ...formData, boardId: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Board" />
            </SelectTrigger>
            <SelectContent>
              {boardOptions.map((board) => (
                <SelectItem key={board.id} value={board.id.toString()}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="boardSubjectNameId">Subject Name *</Label>
          <Select
            value={formData.boardSubjectNameId.toString()}
            onValueChange={(v) => setFormData({ ...formData, boardSubjectNameId: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Subject Name" />
            </SelectTrigger>
            <SelectContent>
              {boardSubjectNameOptions.map((subjectName) => (
                <SelectItem key={subjectName.id} value={subjectName.id.toString()}>
                  {subjectName.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullMarksTheory">Full Marks Theory</Label>
          <Input
            id="fullMarksTheory"
            type="number"
            value={formData.fullMarksTheory}
            onChange={(e) => setFormData({ ...formData, fullMarksTheory: e.target.value })}
            placeholder="Enter full marks for theory"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passingMarksTheory">Passing Marks Theory</Label>
          <Input
            id="passingMarksTheory"
            type="number"
            value={formData.passingMarksTheory}
            onChange={(e) => setFormData({ ...formData, passingMarksTheory: e.target.value })}
            placeholder="Enter passing marks for theory"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullMarksPractical">Full Marks Practical</Label>
          <Input
            id="fullMarksPractical"
            type="number"
            value={formData.fullMarksPractical}
            onChange={(e) => setFormData({ ...formData, fullMarksPractical: e.target.value })}
            placeholder="Enter full marks for practical"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passingMarksPractical">Passing Marks Practical</Label>
          <Input
            id="passingMarksPractical"
            type="number"
            value={formData.passingMarksPractical}
            onChange={(e) => setFormData({ ...formData, passingMarksPractical: e.target.value })}
            placeholder="Enter passing marks for practical"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
};

export default function BoardSubjectPage() {
  const [boardSubjects, setBoardSubjects] = React.useState<BoardSubjectDto[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedBoardSubject, setSelectedBoardSubject] = React.useState<BoardSubjectDto | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [boardOptions, setBoardOptions] = React.useState<BoardDto[]>([]);
  const [boardSubjectNameOptions, setBoardSubjectNameOptions] = React.useState<BoardSubjectNameDto[]>([]);
  const [degreeOptions, setDegreeOptions] = React.useState<DegreeDto[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  const [selectedDegreeId, setSelectedDegreeId] = React.useState<number | undefined>(undefined);
  const [selectedBoardId, setSelectedBoardId] = React.useState<number | undefined>(undefined);

  // Download state
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);

  // Load data on component mount
  React.useEffect(() => {
    loadBoardSubjects();
    loadDropdownOptions();
  }, []);

  const loadBoardSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await boardSubjectService.getAll(currentPage, pageSize, searchText, selectedDegreeId);

      // Filter by board on the frontend if board is selected
      let filteredData = result.data;
      if (selectedBoardId) {
        filteredData = result.data.filter((bs) => bs.boardId === selectedBoardId);
      }

      setBoardSubjects(filteredData);
      setTotalItems(selectedBoardId ? filteredData.length : result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board subjects");
      toast.error("Failed to load board subjects");
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const [boardsResult, subjectNames, degrees] = await Promise.all([
        boardService.getAllBoards(1, 10000), // Get all boards for dropdown
        boardSubjectNameService.getAll(),
        degreeService.getAll(),
      ]);
      setBoardOptions(boardsResult.data);
      setBoardSubjectNameOptions(subjectNames);
      // Map Degree[] to DegreeDto[] by converting disabled to isActive
      const degreeDtos: DegreeDto[] = degrees.map((degree) => ({
        id: degree.id!,
        name: degree.name,
        sequence: degree.sequence ?? null, // Convert undefined to null
        isActive: !degree.disabled, // Convert disabled to isActive
      }));
      setDegreeOptions(degreeDtos);
    } catch (e) {
      console.warn("Failed loading dropdown options", e);
    }
  };

  // Reload when filters change (except search which has its own debounced effect)
  React.useEffect(() => {
    loadBoardSubjects();
  }, [currentPage, pageSize, selectedDegreeId, selectedBoardId]);

  const handleEdit = (boardSubject: BoardSubjectDto) => {
    setSelectedBoardSubject(boardSubject);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: {
    boardId: number;
    boardSubjectNameId: number;
    fullMarksTheory?: number | null;
    passingMarksTheory?: number | null;
    fullMarksPractical?: number | null;
    passingMarksPractical?: number | null;
    isActive: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (selectedBoardSubject?.id) {
        // Update existing board subject
        const updatedBoardSubject = await boardSubjectService.update(selectedBoardSubject.id, data);
        setBoardSubjects((prev) => prev.map((bs) => (bs.id === selectedBoardSubject.id ? updatedBoardSubject : bs)));
        toast.success("Board subject mapping updated successfully");
      } else {
        // Create new board subject
        const newBoardSubject = await boardSubjectService.create(data);
        setBoardSubjects((prev) => [...prev, newBoardSubject]);
        toast.success("Board subject mapping created successfully");
      }
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save board subject mapping");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedBoardSubject(null);
  };

  const handleAddNew = () => {
    setSelectedBoardSubject(null);
    setIsFormOpen(true);
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    toast.info("Preparing download...");

    try {
      // First, get total count to calculate progress
      console.log("Getting total count for download with filters:", { searchText, selectedDegreeId, selectedBoardId });
      setDownloadProgress(5);
      toast.info("Calculating total records...");

      // Get all data with current filters but without pagination
      const result = await boardSubjectService.getAll(1, 10000, searchText, selectedDegreeId);

      // Filter by board on the frontend if board is selected
      let filteredData = result.data;
      if (selectedBoardId) {
        filteredData = result.data.filter((bs) => bs.boardId === selectedBoardId);
      }
      const totalRecords = filteredData.length;

      console.log(`Total records to download: ${totalRecords}`);
      toast.info(`Found ${totalRecords} records. Preparing Excel...`);

      setDownloadProgress(30);

      // Prepare Excel data
      const data = filteredData.map((bs, index) => ({
        "S.No": index + 1,
        "Board Code": bs.board.code || "-",
        "Board Name": bs.board.name || "-",
        Subject:
          bs.boardSubjectName.code && bs.boardSubjectName.code !== "-"
            ? `${bs.boardSubjectName.name} (${bs.boardSubjectName.code})`
            : bs.boardSubjectName.name,
        "Subject Code": bs.boardSubjectName.code || "-",
        "Full Marks Theory": bs.fullMarksTheory ?? "-",
        "Passing Marks Theory": bs.passingMarksTheory ?? "-",
        "Full Marks Practical": bs.fullMarksPractical ?? "-",
        "Passing Marks Practical": bs.passingMarksPractical ?? "-",
        Degree: bs.board.degree?.name || "-",
        Status: bs.isActive ? "Active" : "Inactive",
      }));

      setDownloadProgress(60);
      toast.info("Generating Excel file...");

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const colWidths = [
        { wch: 8 }, // S.No
        { wch: 15 }, // Board Code
        { wch: 30 }, // Board Name
        { wch: 25 }, // Subject
        { wch: 15 }, // Subject Code
        { wch: 12 }, // Full Marks Theory
        { wch: 15 }, // Passing Marks Theory
        { wch: 12 }, // Full Marks Practical
        { wch: 15 }, // Passing Marks Practical
        { wch: 15 }, // Degree
        { wch: 10 }, // Status
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Board Subject Mappings");

      setDownloadProgress(85);
      toast.info("Finalizing download...");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `board-subject-mappings-${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      setDownloadProgress(100);
      toast.success(`Downloaded ${totalRecords} board subject mappings successfully!`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download board subjects");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Search with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadBoardSubjects();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Board Subject Mappings
            </CardTitle>
            <div className="text-muted-foreground">Manage board subject mappings configuration.</div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Mapping
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-4xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedBoardSubject ? "Edit Board Subject Mapping" : "Add New Board Subject Mapping"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <BoardSubjectForm
                  boardOptions={boardOptions}
                  boardSubjectNameOptions={boardSubjectNameOptions}
                  initialData={selectedBoardSubject}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleDownloadAll}
                disabled={isDownloading}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isDownloading ? `Downloading... ${Math.round(downloadProgress)}%` : "Download"}
              </Button>
              {isDownloading && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-4 mb-0 justify-between">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search by board name, subject name, or degree..."
                className="w-64"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                value={selectedDegreeId?.toString() || "all"}
                onValueChange={(value) => {
                  setSelectedDegreeId(value === "all" ? undefined : parseInt(value));
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degrees</SelectItem>
                  {degreeOptions.map((degree) => (
                    <SelectItem key={degree.id} value={degree.id.toString()}>
                      {degree.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedBoardId?.toString() || "all"}
                onValueChange={(value) => {
                  setSelectedBoardId(value === "all" ? undefined : parseInt(value));
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Boards</SelectItem>
                  {boardOptions.map((board) => (
                    <SelectItem key={board.id} value={board.id.toString()}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Showing {boardSubjects.length} of {totalItems} results
            </div>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md w-full" style={{ tableLayout: "fixed" }}>
                <TableHeader
                  className="sticky top-0 z-10"
                  style={{ background: "#f3f4f6", borderRight: "1px solid #e5e7eb" }}
                >
                  <TableRow>
                    <TableHead
                      style={{
                        width: "5%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      ID
                    </TableHead>
                    <TableHead
                      style={{
                        width: "10%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Code
                    </TableHead>
                    <TableHead
                      style={{
                        width: "20%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Subject
                    </TableHead>
                    <TableHead
                      style={{
                        width: "8%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Full Marks Theory
                    </TableHead>
                    <TableHead
                      style={{
                        width: "10%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Marks Theory
                    </TableHead>
                    <TableHead
                      style={{
                        width: "8%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Full Marks Practical
                    </TableHead>
                    <TableHead
                      style={{
                        width: "10%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Marks Practical
                    </TableHead>
                    <TableHead
                      style={{
                        width: "10%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Degree
                    </TableHead>
                    <TableHead
                      style={{
                        width: "8%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      style={{
                        width: "10%",
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "8px 4px",
                      }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : boardSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No board subject mappings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    boardSubjects.map((bs, index) => (
                      <TableRow key={bs.id} className="group">
                        <TableCell style={{ width: "5%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell style={{ width: "10%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.board.code ? (
                            <Badge
                              variant="outline"
                              className="border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs"
                            >
                              {bs.board.code}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell style={{ width: "20%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          <div
                            className="truncate"
                            title={`${bs.boardSubjectName.name}${bs.boardSubjectName.code && bs.boardSubjectName.code !== "-" ? ` (${bs.boardSubjectName.code})` : ""}`}
                          >
                            {bs.boardSubjectName.name ? (
                              <span className="text-sm">
                                {bs.boardSubjectName.name}
                                {bs.boardSubjectName.code && bs.boardSubjectName.code !== "-" && (
                                  <span className="text-muted-foreground ml-1">({bs.boardSubjectName.code})</span>
                                )}
                              </span>
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                        <TableCell style={{ width: "8%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          <span className="text-sm">{bs.fullMarksTheory ?? "-"}</span>
                        </TableCell>
                        <TableCell style={{ width: "10%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          <span className="text-sm">{bs.passingMarksTheory ?? "-"}</span>
                        </TableCell>
                        <TableCell style={{ width: "8%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          <span className="text-sm">{bs.fullMarksPractical ?? "-"}</span>
                        </TableCell>
                        <TableCell style={{ width: "10%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          <span className="text-sm">{bs.passingMarksPractical ?? "-"}</span>
                        </TableCell>
                        <TableCell style={{ width: "10%", padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.board.degree?.name ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-red-500 text-red-700 bg-red-50 hover:bg-red-100"
                            >
                              {bs.board.degree.name}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell style={{ width: "7%", borderRight: "1px solid #e5e7eb" }}>
                          {bs.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "10%", padding: "8px 4px" }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(bs)} className="h-5 w-5 p-0">
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

          {/* Pagination Controls */}
          {!loading && !error && totalItems > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of{" "}
                {totalItems} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(totalItems / pageSize)) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(Math.ceil(totalItems / pageSize) - 4, currentPage - 2)) + i;
                    if (pageNum > Math.ceil(totalItems / pageSize)) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalItems / pageSize), prev + 1))}
                  disabled={currentPage === Math.ceil(totalItems / pageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
