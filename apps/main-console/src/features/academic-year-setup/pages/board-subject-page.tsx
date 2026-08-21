import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, GraduationCap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { boardSubjectService, type BoardSubjectDto } from "@/services/board-subject.service";
import { boardService, type BoardDto } from "@/services/board.service";
import {
  boardSubjectNameService,
  type BoardSubjectNameDto,
} from "@/services/board-subject-name.service";
import { degreeService, type DegreeDto } from "@/services/degree.service";

// ----------------- Board Subject Form -------------------
const BoardSubjectForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  boardOptions,
  boardSubjectNameOptions,
  existingMappings,
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
  /** Current page of mappings, used to warn before hitting the unique constraint. */
  existingMappings: BoardSubjectDto[];
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

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        boardId: initialData.boardId,
        boardSubjectNameId: initialData.boardSubjectNameId,
        fullMarksTheory: initialData.fullMarksTheory ?? "",
        passingMarksTheory: initialData.passingMarksTheory ?? "",
        fullMarksPractical: initialData.fullMarksPractical ?? "",
        passingMarksPractical: initialData.passingMarksPractical ?? "",
        isActive: initialData.isActive,
      });
    } else {
      setFormData({
        boardId: 0,
        boardSubjectNameId: 0,
        fullMarksTheory: "",
        passingMarksTheory: "",
        fullMarksPractical: "",
        passingMarksPractical: "",
        isActive: true,
      });
    }
  }, [initialData]);

  /**
   * (board, subject) is unique in the database now. Catch it here so the user
   * gets a clear message instead of a raw constraint violation.
   */
  const duplicateOf = React.useMemo(() => {
    if (!formData.boardId || !formData.boardSubjectNameId) return null;
    return (
      existingMappings.find(
        (m) =>
          m.board?.id === formData.boardId &&
          m.boardSubjectName?.id === formData.boardSubjectNameId &&
          m.id !== initialData?.id,
      ) ?? null
    );
  }, [formData.boardId, formData.boardSubjectNameId, existingMappings, initialData?.id]);

  // Passing marks can never exceed full marks (per component).
  const theoryMarksInvalid =
    formData.fullMarksTheory !== "" &&
    formData.passingMarksTheory !== "" &&
    Number(formData.passingMarksTheory) > Number(formData.fullMarksTheory);
  const practicalMarksInvalid =
    formData.fullMarksPractical !== "" &&
    formData.passingMarksPractical !== "" &&
    Number(formData.passingMarksPractical) > Number(formData.fullMarksPractical);
  const marksInvalid = theoryMarksInvalid || practicalMarksInvalid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateOf || marksInvalid) return;
    onSubmit({
      boardId: formData.boardId,
      boardSubjectNameId: formData.boardSubjectNameId,
      fullMarksTheory: formData.fullMarksTheory === "" ? null : Number(formData.fullMarksTheory),
      passingMarksTheory:
        formData.passingMarksTheory === "" ? null : Number(formData.passingMarksTheory),
      fullMarksPractical:
        formData.fullMarksPractical === "" ? null : Number(formData.fullMarksPractical),
      passingMarksPractical:
        formData.passingMarksPractical === "" ? null : Number(formData.passingMarksPractical),
      isActive: formData.isActive,
    });
  };

  // Selected board's passing % (from the boards master), shown beside the Board label.
  const selectedBoardPassing =
    formData.boardId > 0
      ? (boardOptions.find((b) => b.id === formData.boardId)?.passingMarks ?? null)
      : null;

  // Marks inputs sit flush in table cells: no border/ring of their own (the cell
  // borders form the grid), and no number spinners.
  const marksInputClass =
    "h-10 w-full rounded-none !border-0 bg-transparent px-3 shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      {/* Scrollable body — header and footer stay pinned. */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="boardId">
              Board <span className="text-red-500">*</span>
              {selectedBoardPassing != null && (
                <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                  (Passing: {selectedBoardPassing}%)
                </span>
              )}
            </Label>
            {/*
              Combobox, not Select: this form lives inside an AlertDialog
              (z-[100]) and SelectContent is z-50, so its list rendered UNDERNEATH
              the dialog. The shared Combobox popover is z-[120], already tuned to
              sit above dialogs — and it brings typeahead, which matters with 66
              boards.
            */}
            <Combobox
              dataArr={boardOptions.map((b) => ({ value: b.id.toString(), label: b.name }))}
              value={formData.boardId > 0 ? formData.boardId.toString() : ""}
              onChange={(v) => setFormData({ ...formData, boardId: parseInt(v) })}
              placeholder="Select Board"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boardSubjectNameId">
              Subject Name <span className="text-red-500">*</span>
            </Label>
            <Combobox
              dataArr={boardSubjectNameOptions.map((n) => ({
                value: n.id.toString(),
                label: n.name,
              }))}
              value={formData.boardSubjectNameId > 0 ? formData.boardSubjectNameId.toString() : ""}
              onChange={(v) => setFormData({ ...formData, boardSubjectNameId: parseInt(v) })}
              placeholder="Select Subject Name"
            />
          </div>
        </div>

        {duplicateOf && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This board and subject are already mapped. Edit that row instead — a board can only map
            a subject once.
          </p>
        )}

        <div className="space-y-2">
          <Label>Marks</Label>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="border-b border-r px-3 py-2 font-medium">Component</th>
                  <th className="border-b border-r px-3 py-2 font-medium">Full Marks</th>
                  <th className="border-b px-3 py-2 font-medium">Passing Marks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-r px-3 py-2 font-medium">Theory</td>
                  <td className="border-b border-r p-0">
                    <Input
                      id="fullMarksTheory"
                      type="number"
                      className={marksInputClass}
                      value={formData.fullMarksTheory}
                      onChange={(e) =>
                        setFormData({ ...formData, fullMarksTheory: e.target.value })
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="border-b p-0">
                    <Input
                      id="passingMarksTheory"
                      type="number"
                      className={marksInputClass}
                      value={formData.passingMarksTheory}
                      onChange={(e) =>
                        setFormData({ ...formData, passingMarksTheory: e.target.value })
                      }
                      placeholder="0"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border-r px-3 py-2 font-medium">Practical</td>
                  <td className="border-r p-0">
                    <Input
                      id="fullMarksPractical"
                      type="number"
                      className={marksInputClass}
                      value={formData.fullMarksPractical}
                      onChange={(e) =>
                        setFormData({ ...formData, fullMarksPractical: e.target.value })
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0">
                    <Input
                      id="passingMarksPractical"
                      type="number"
                      className={marksInputClass}
                      value={formData.passingMarksPractical}
                      onChange={(e) =>
                        setFormData({ ...formData, passingMarksPractical: e.target.value })
                      }
                      placeholder="0"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {marksInvalid && (
            <p className="text-sm text-red-600">
              Passing marks cannot be greater than full marks
              {theoryMarksInvalid ? " (Theory)" : ""}
              {theoryMarksInvalid && practicalMarksInvalid ? " and" : ""}
              {practicalMarksInvalid ? " (Practical)" : ""}.
            </p>
          )}
        </div>
      </div>

      {/* Pinned footer: Active toggle on the left, actions on the right. */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t px-6 py-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !!duplicateOf || marksInvalid}>
            {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </div>
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
  const [selectedBoardSubject, setSelectedBoardSubject] = React.useState<BoardSubjectDto | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [allBoards, setAllBoards] = React.useState<BoardDto[]>([]);
  /**
   * Only ACTIVE boards are selectable. The legacy DB holds several board rows
   * sharing a name (e.g. CBSE ids 1 and 9) with different legacy ids, one of
   * each pair retired — the importer reproduces both, so the raw list shows
   * duplicates. The retired ones carry zero admissions and zero subjects.
   */
  const boardOptions = React.useMemo(
    () => allBoards.filter((b) => b.isActive !== false),
    [allBoards],
  );
  // Board-level passing % (from the boards master) keyed by board id, for the table column.
  const boardPassingMap = React.useMemo(
    () => new Map(allBoards.map((b) => [b.id, b.passingMarks])),
    [allBoards],
  );
  const [allBoardSubjectNames, setAllBoardSubjectNames] = React.useState<BoardSubjectNameDto[]>([]);

  /** Retired subject names stay in the DB for historical rows but are not offered. */
  const boardSubjectNameOptions = React.useMemo(
    () => allBoardSubjectNames.filter((n) => (n as { isActive?: boolean }).isActive !== false),
    [allBoardSubjectNames],
  );
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

  const loadDropdownOptions = React.useCallback(async () => {
    try {
      const [boardsResult, subjectNames, degrees] = await Promise.all([
        boardService.getAllBoards(1, 10000), // Get all boards for dropdown
        boardSubjectNameService.getAll(),
        degreeService.getAll(),
      ]);
      setAllBoards(boardsResult.data);
      setAllBoardSubjectNames(subjectNames);
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
  }, []);

  // Load dropdowns on component mount only
  React.useEffect(() => {
    loadDropdownOptions();
  }, [loadDropdownOptions]);

  // Load board subjects when dependencies change
  React.useEffect(() => {
    let isMounted = true;

    const loadBoardSubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        // Board filtering is server-side. It used to be applied to the returned
        // page of 10 rows, so choosing a board that did not happen to appear on
        // that page showed nothing and the total was wrong too.
        const result = await boardSubjectService.getAll(
          currentPage,
          pageSize,
          searchText,
          selectedDegreeId,
          selectedBoardId,
        );

        if (!isMounted) return; // Prevent state updates if component unmounted

        setBoardSubjects(result.data);
        setTotalItems(result.total);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load board subjects");
        toast.error("Failed to load board subjects");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBoardSubjects();

    return () => {
      isMounted = false;
    };
  }, [currentPage, pageSize, searchText, selectedDegreeId, selectedBoardId]);

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
        setBoardSubjects((prev) =>
          prev.map((bs) => (bs.id === selectedBoardSubject.id ? updatedBoardSubject : bs)),
        );
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
      console.log("Getting total count for download with filters:", {
        searchText,
        selectedDegreeId,
        selectedBoardId,
      });
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
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center mb-3 gap-4 sm:gap-0 sm:justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <GraduationCap className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400" />
              Board Subject Mappings
            </CardTitle>
            <div className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage board subject mappings configuration.
            </div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Mapping</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[85vh] overflow-hidden !flex flex-col !gap-0 !p-0">
                <AlertDialogHeader className="shrink-0 border-b px-6 py-4">
                  <AlertDialogTitle className="text-lg sm:text-xl">
                    {selectedBoardSubject
                      ? "Edit Board Subject Mapping"
                      : "Add New Board Subject Mapping"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <BoardSubjectForm
                  boardOptions={boardOptions}
                  existingMappings={boardSubjects}
                  boardSubjectNameOptions={boardSubjectNameOptions}
                  initialData={selectedBoardSubject}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
            <div className="relative flex-shrink-0">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleDownloadAll}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isDownloading ? `Downloading... ${Math.round(downloadProgress)}%` : "Download"}
                </span>
                <span className="sm:hidden">
                  {isDownloading ? `${Math.round(downloadProgress)}%` : ""}
                </span>
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
          <div className="sticky top-[72px] sm:top-[88px] z-20 bg-background p-4 border-b flex flex-col sm:flex-row sm:items-center gap-4 mb-0 sm:justify-between">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
              <Input
                placeholder="Search by board name, subject name, or degree..."
                className="w-full sm:w-64"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Combobox
                className="w-full sm:w-64"
                dataArr={[
                  { value: "all", label: "All Degrees" },
                  ...degreeOptions.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={selectedDegreeId?.toString() || "all"}
                onChange={(value) => {
                  setSelectedDegreeId(value === "all" ? undefined : parseInt(value));
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                placeholder="Filter by Degree"
              />
              <Combobox
                className="w-full sm:w-64"
                dataArr={[
                  { value: "all", label: "All Boards" },
                  ...boardOptions.map((b) => ({ value: b.id.toString(), label: b.name })),
                ]}
                value={selectedBoardId?.toString() || "all"}
                onChange={(value) => {
                  setSelectedBoardId(value === "all" ? undefined : parseInt(value));
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                placeholder="Filter by Board"
              />
            </div>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table
                containerClassName="overflow-visible"
                className="border rounded-md w-full min-w-[720px]"
                style={{ tableLayout: "auto" }}
              >
                <TableHeader
                  className="sticky top-0 z-10"
                  style={{ background: "#f3f4f6", borderRight: "1px solid #e5e7eb" }}
                >
                  <TableRow className="py-3">
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        width: "56px",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      ID
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        width: "90px",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Code
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        width: "300px",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Subject
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "normal",
                        width: "160px",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Degree
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        width: "110px",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing %
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        width: "140px",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Theory
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        width: "140px",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Practical
                    </TableHead>
                    <TableHead
                      style={{
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        width: "72px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "12px 8px",
                      }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : boardSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No board subject mappings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    boardSubjects.map((bs, index) => (
                      <TableRow key={bs.id} className="group">
                        <TableCell
                          style={{
                            padding: "12px 8px",
                            width: "56px",
                            borderRight: "1px solid #e5e7eb",
                          }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}
                        >
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
                        <TableCell
                          style={{
                            padding: "12px 8px",
                            width: "300px",
                            maxWidth: "300px",
                            borderRight: "1px solid #e5e7eb",
                          }}
                        >
                          <div
                            className="truncate"
                            title={`${bs.boardSubjectName.name}${bs.boardSubjectName.code && bs.boardSubjectName.code !== "-" ? ` (${bs.boardSubjectName.code})` : ""}`}
                          >
                            {bs.boardSubjectName.name ? (
                              <span className="text-sm">
                                {bs.boardSubjectName.name}
                                {bs.boardSubjectName.code && bs.boardSubjectName.code !== "-" && (
                                  <span className="text-muted-foreground ml-1">
                                    ({bs.boardSubjectName.code})
                                  </span>
                                )}
                                {bs.isActive && (
                                  <span
                                    className="ml-0.5 text-red-500"
                                    title="Active"
                                    aria-label="Active"
                                  >
                                    *
                                  </span>
                                )}
                              </span>
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          style={{
                            padding: "12px 8px",
                            width: "160px",
                            borderRight: "1px solid #e5e7eb",
                          }}
                        >
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
                        <TableCell
                          style={{
                            padding: "12px 8px",
                            width: "110px",
                            textAlign: "center",
                            borderRight: "1px solid #e5e7eb",
                          }}
                        >
                          {boardPassingMap.get(bs.boardId) != null ? (
                            <span className="text-sm font-medium tabular-nums text-green-600 dark:text-green-400">
                              {boardPassingMap.get(bs.boardId)}%
                            </span>
                          ) : (
                            <span className="text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell
                          style={{
                            padding: "12px 8px",
                            width: "140px",
                            textAlign: "center",
                            borderRight: "1px solid #e5e7eb",
                          }}
                        >
                          <span className="text-sm tabular-nums">
                            {bs.passingMarksTheory ?? "-"} / {bs.fullMarksTheory ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell
                          style={{
                            padding: "12px 8px",
                            width: "140px",
                            textAlign: "center",
                            borderRight: "1px solid #e5e7eb",
                          }}
                        >
                          <span className="text-sm tabular-nums">
                            {bs.passingMarksPractical ?? "-"} / {bs.fullMarksPractical ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell style={{ padding: "12px 8px", width: "72px" }}>
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(bs)}
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

          {/* Pagination Controls */}
          {!loading && !error && totalItems > 0 && (
            <div className="mt-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="hidden sm:inline">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
                </span>
                <span className="sm:hidden">
                  Page {currentPage} of {Math.ceil(totalItems / pageSize)} ({totalItems} total)
                </span>
              </div>
              <div className="flex items-center gap-2 flex-nowrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {Array.from({ length: Math.min(5, Math.ceil(totalItems / pageSize)) }, (_, i) => {
                    const pageNum =
                      Math.max(1, Math.min(Math.ceil(totalItems / pageSize) - 4, currentPage - 2)) +
                      i;
                    if (pageNum > Math.ceil(totalItems / pageSize)) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0 flex-shrink-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(Math.ceil(totalItems / pageSize), prev + 1))
                  }
                  disabled={currentPage === Math.ceil(totalItems / pageSize)}
                  className="flex-shrink-0"
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
