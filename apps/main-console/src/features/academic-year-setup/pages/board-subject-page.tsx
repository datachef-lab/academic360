import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, GraduationCap } from "lucide-react";
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
import { boardSubjectService, type BoardSubjectDto } from "@/services/board-subject.service";
import { boardService, type BoardDto } from "@/services/board.service";
import { boardSubjectNameService, type BoardSubjectNameDto } from "@/services/board-subject-name.service";

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

  // Load data on component mount
  React.useEffect(() => {
    loadBoardSubjects();
    loadDropdownOptions();
  }, []);

  const loadBoardSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardSubjectService.getAll();
      setBoardSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board subjects");
      toast.error("Failed to load board subjects");
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const [boards, subjectNames] = await Promise.all([boardService.getAllBoards(), boardSubjectNameService.getAll()]);
      setBoardOptions(boards);
      setBoardSubjectNameOptions(subjectNames);
    } catch (e) {
      console.warn("Failed loading dropdown options", e);
    }
  };

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

  const handleDownloadAll = () => {
    try {
      const data = boardSubjects.map((bs, index) => ({
        "S.No": index + 1,
        "Board Name": bs.board.name,
        "Board Code": bs.board.code || "-",
        "Subject Name": bs.boardSubjectName.name,
        "Subject Code": bs.boardSubjectName.code || "-",
        "Full Marks Theory": bs.fullMarksTheory ?? "-",
        "Passing Marks Theory": bs.passingMarksTheory ?? "-",
        "Full Marks Practical": bs.fullMarksPractical ?? "-",
        "Passing Marks Practical": bs.passingMarksPractical ?? "-",
        Degree: bs.board.degree?.name || "-",
        Status: bs.isActive ? "Active" : "Inactive",
      }));
      console.log("Download data:", data);
      toast.success("Download functionality would be implemented here");
    } catch {
      toast.error("Failed to download board subjects");
    }
  };

  const filtered = boardSubjects.filter(
    (bs) =>
      bs.board.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (bs.board.code ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      bs.boardSubjectName.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (bs.boardSubjectName.code ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (bs.board.degree?.name ?? "").toLowerCase().includes(searchText.toLowerCase()),
  );

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
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search by board name, subject name, or degree..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[1400px]" style={{ tableLayout: "fixed" }}>
                <TableHeader
                  className="sticky top-0 z-10"
                  style={{ background: "#f3f4f6", borderRight: "1px solid #e5e7eb" }}
                >
                  <TableRow>
                    <TableHead
                      style={{
                        width: 60,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      ID
                    </TableHead>
                    <TableHead
                      style={{
                        width: 200,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Name
                    </TableHead>
                    <TableHead
                      style={{
                        width: 120,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Board Code
                    </TableHead>
                    <TableHead
                      style={{
                        width: 150,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Subject Name
                    </TableHead>
                    <TableHead
                      style={{
                        width: 100,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Subject Code
                    </TableHead>
                    <TableHead
                      style={{
                        width: 100,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Full Marks Theory
                    </TableHead>
                    <TableHead
                      style={{
                        width: 120,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Marks Theory
                    </TableHead>
                    <TableHead
                      style={{
                        width: 100,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Full Marks Practical
                    </TableHead>
                    <TableHead
                      style={{
                        width: 120,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Passing Marks Practical
                    </TableHead>
                    <TableHead
                      style={{
                        width: 120,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Degree
                    </TableHead>
                    <TableHead
                      style={{
                        width: 100,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                        padding: "8px 4px",
                        borderRight: "1px solid #e5e7eb",
                      }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      style={{
                        width: 130,
                        background: "#f3f4f6",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
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
                      <TableCell colSpan={12} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">
                        No board subject mappings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((bs, index) => (
                      <TableRow key={bs.id} className="group">
                        <TableCell style={{ width: 60, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell style={{ width: 200, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.board.name ? <Badge variant="secondary">{bs.board.name}</Badge> : "-"}
                        </TableCell>
                        <TableCell style={{ width: 120, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.board.code ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 150, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.boardSubjectName.name ? <Badge variant="outline">{bs.boardSubjectName.name}</Badge> : "-"}
                        </TableCell>
                        <TableCell style={{ width: 100, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.boardSubjectName.code ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 100, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.fullMarksTheory ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 120, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.passingMarksTheory ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 100, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.fullMarksPractical ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 120, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.passingMarksPractical ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 120, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {bs.board.degree?.name ? <Badge variant="outline">{bs.board.degree.name}</Badge> : "-"}
                        </TableCell>
                        <TableCell style={{ width: 100, borderRight: "1px solid #e5e7eb" }}>
                          {bs.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 130, padding: "8px 4px" }}>
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
        </CardContent>
      </Card>
    </div>
  );
}
