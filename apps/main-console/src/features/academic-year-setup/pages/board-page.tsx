import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, Trash2, GraduationCap } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Board } from "@repo/db";

// Extend Board type locally to include optional marks fields from board-subject mappings
type BoardWithMarks = Board & {
  fullMarksTheory?: number | null;
  passingMarksTheory?: number | null;
  fullMarksPractical?: number | null;
  passingMarksPractical?: number | null;
  subjectName?: string | null;
  boardId?: number | null;
  boardSubjectNameId?: number | null;
};

// Mock data for demonstration
const mockBoards: BoardWithMarks[] = [
  {
    id: 1,
    name: "CBSE",
    code: "CBSE",
    degreeId: null,
    passingMarks: 33,
    addressId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subjectName: "Mathematics",
    fullMarksTheory: 100,
    passingMarksTheory: 33,
    fullMarksPractical: 30,
    passingMarksPractical: 10,
  },
  {
    id: 2,
    name: "ICSE",
    code: "ICSE",
    degreeId: null,
    passingMarks: 35,
    addressId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subjectName: "Physics",
    fullMarksTheory: 90,
    passingMarksTheory: 36,
    fullMarksPractical: 20,
    passingMarksPractical: 8,
  },
  {
    id: 3,
    name: "STATE",
    code: "STATE",
    degreeId: null,
    passingMarks: 33,
    addressId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subjectName: "Chemistry",
    fullMarksTheory: 80,
    passingMarksTheory: 32,
    fullMarksPractical: 25,
    passingMarksPractical: 10,
  },
];

// Options for form selects
const boardOptions = [
  { id: 1, name: "CBSE" },
  { id: 2, name: "ICSE" },
  { id: 3, name: "STATE" },
];

const subjectNameOptions = [
  { id: 1, name: "Mathematics" },
  { id: 2, name: "Physics" },
  { id: 3, name: "Chemistry" },
  { id: 4, name: "Biology" },
];

const BoardForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData: BoardWithMarks | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
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
          <Label htmlFor="boardId">Board Name *</Label>
          <Select
            value={formData.boardId.toString()}
            onValueChange={(v) => setFormData({ ...formData, boardId: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Board" />
            </SelectTrigger>
            <SelectContent>
              {boardOptions.map((b) => (
                <SelectItem key={b.id} value={b.id.toString()}>
                  {b.name}
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
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjectNameOptions.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
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
            placeholder="Enter full marks theory"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passingMarksTheory">Passing Marks Theory</Label>
          <Input
            id="passingMarksTheory"
            type="number"
            value={formData.passingMarksTheory}
            onChange={(e) => setFormData({ ...formData, passingMarksTheory: e.target.value })}
            placeholder="Enter passing marks theory"
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
            placeholder="Enter full marks practical"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passingMarksPractical">Passing Marks Practical</Label>
          <Input
            id="passingMarksPractical"
            type="number"
            value={formData.passingMarksPractical}
            onChange={(e) => setFormData({ ...formData, passingMarksPractical: e.target.value })}
            placeholder="Enter passing marks practical"
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

export default function BoardPage() {
  const [boards, setBoards] = React.useState<BoardWithMarks[]>(mockBoards);
  const [loading] = React.useState<boolean>(false);
  const [error] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedBoard, setSelectedBoard] = React.useState<Board | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleEdit = (board: BoardWithMarks) => {
    setSelectedBoard(board);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (selectedBoard?.id) {
        const boardName = boardOptions.find((b) => b.id === data.boardId)?.name || selectedBoard.name;
        const subjectName =
          subjectNameOptions.find((s) => s.id === data.boardSubjectNameId)?.name || selectedBoard.subjectName || null;
        setBoards((prev) =>
          prev.map((b) =>
            b.id === selectedBoard.id
              ? { ...b, ...data, name: boardName, subjectName, updatedAt: new Date().toISOString() }
              : b,
          ),
        );
        toast.success("Board updated successfully");
      } else {
        const nextId = Math.max(...boards.map((b) => b.id || 0)) + 1;
        const boardName = boardOptions.find((b) => b.id === data.boardId)?.name || "-";
        const subjectName = subjectNameOptions.find((s) => s.id === data.boardSubjectNameId)?.name || "-";
        setBoards((prev) => [
          ...prev,
          {
            id: nextId,
            ...data,
            name: boardName,
            subjectName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        toast.success("Board created successfully");
      }
      setIsFormOpen(false);
    } catch (e) {
      toast.error("Failed to save board");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedBoard(null);
  };

  const handleAddNew = () => {
    setSelectedBoard(null);
    setIsFormOpen(true);
  };

  const onDelete = async (id: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setBoards((prev) => prev.filter((b) => b.id !== id));
      toast.success("Board deleted successfully");
    } catch {
      toast.error("Failed to delete board");
    }
  };

  const handleDownloadAll = () => {
    try {
      const data = boards.map((b, index) => ({
        "S.No": index + 1,
        Name: b.name,
        Code: b.code || "-",
        Sequence: b.sequence ?? "-",
        "Passing Marks": b.passingMarks ?? "-",
        "Full Marks Theory": b.fullMarksTheory ?? "-",
        "Passing Marks Theory": b.passingMarksTheory ?? "-",
        "Full Marks Practical": b.fullMarksPractical ?? "-",
        "Passing Marks Practical": b.passingMarksPractical ?? "-",
        Status: b.isActive ? "Active" : "Inactive",
      }));
      console.log("Download data:", data);
      toast.success("Download functionality would be implemented here");
    } catch {
      toast.error("Failed to download boards");
    }
  };

  const filtered = boards.filter(
    (b) =>
      b.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (b.code ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (b.sequence?.toString() ?? "").includes(searchText.toLowerCase()),
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
            <div className="text-muted-foreground">Manage Boards Subject Mappings configuration.</div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedBoard ? "Edit Board" : "Add Board Subject Mappings"}</AlertDialogTitle>
                </AlertDialogHeader>
                <BoardForm
                  initialData={selectedBoard}
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
              placeholder="Search by board or subject..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[1250px]" style={{ tableLayout: "fixed" }}>
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
                        width: 180,
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
                        width: 220,
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
                        width: 140,
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
                        width: 140,
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
                        width: 150,
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
                        width: 150,
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
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No boards found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((b, index) => (
                      <TableRow key={b.id} className="group">
                        <TableCell style={{ width: 60, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell style={{ width: 180, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.name ? <Badge variant="secondary">{b.name}</Badge> : "-"}
                        </TableCell>
                        <TableCell style={{ width: 220, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.subjectName ? <Badge variant={"destructive"}>{b.subjectName}</Badge> : "-"}
                        </TableCell>
                        <TableCell style={{ width: 140, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.fullMarksTheory ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 140, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.passingMarksTheory ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 150, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.fullMarksPractical ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 150, padding: "8px 4px", borderRight: "1px solid #e5e7eb" }}>
                          {b.passingMarksPractical ?? "-"}
                        </TableCell>
                        <TableCell style={{ width: 100, borderRight: "1px solid #e5e7eb" }}>
                          {b.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 130, padding: "8px 4px" }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(b)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(b.id!)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
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
