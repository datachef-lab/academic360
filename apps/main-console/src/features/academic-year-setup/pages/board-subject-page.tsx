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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// ----------------- Mock Boards -------------------
const mockBoardsInit = [
  { id: 1, name: "CBSE", code: "CBSE", isActive: true },
  { id: 2, name: "ICSE", code: "ICSE", isActive: true },
  { id: 3, name: "State Board", code: "STATE", isActive: false },
];

// ----------------- Board Form -------------------
const BoardForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData: { name: string; isActive: boolean } | null;
  onSubmit: (data: { name: string; isActive: boolean }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Board Name *</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter board name"
          required
        />
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

// ----------------- Main Page -------------------
export default function BoardPage() {
  const [boards, setBoards] = React.useState(mockBoardsInit);
  const [loading] = React.useState(false);
  const [error] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedBoard, setSelectedBoard] = React.useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleEdit = (board: any) => {
    setSelectedBoard(board);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: { name: string; isActive: boolean }) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // fake API

      if (selectedBoard) {
        // Update
        setBoards((prev) => prev.map((b) => (b.id === selectedBoard.id ? { ...b, ...data } : b)));
        toast.success("Board updated successfully");
      } else {
        // Create
        const newBoard = {
          id: Math.max(...boards.map((b) => b.id)) + 1,
          code: data.name.toUpperCase().slice(0, 4),
          ...data,
        };
        setBoards((prev) => [...prev, newBoard]);
        toast.success("Board created successfully");
      }
      setIsFormOpen(false);
      setSelectedBoard(null);
    } catch (error) {
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
      await new Promise((resolve) => setTimeout(resolve, 500)); // fake API
      setBoards((prev) => prev.filter((b) => b.id !== id));
      toast.success("Board deleted successfully");
    } catch {
      toast.error("Failed to delete board");
    }
  };

  const handleDownloadAll = () => {
    const data = boards.map((board, index) => ({
      "S.No": index + 1,
      Board: board.name,
      Code: board.code,
      Status: board.isActive ? "Active" : "Inactive",
    }));
    console.log("Download data:", data);
    toast.success("Download functionality would be implemented here");
  };

  const filteredBoards = boards.filter((board) => board.name.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Boards
            </CardTitle>
            <div className="text-muted-foreground">Manage boards configuration.</div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Board
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedBoard ? "Edit Board" : "Add New Board"}</AlertDialogTitle>
                </AlertDialogHeader>
                <BoardForm
                  initialData={selectedBoard}
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
            <Input
              placeholder="Search by board name..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[600px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60 }}>ID</TableHead>
                    <TableHead style={{ width: 200 }}>Board Name</TableHead>
                    <TableHead style={{ width: 120 }}>Code</TableHead>
                    <TableHead style={{ width: 100 }}>Status</TableHead>
                    <TableHead style={{ width: 140 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredBoards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No boards found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBoards.map((board, index) => (
                      <TableRow key={board.id} className="group">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{board.name}</TableCell>
                        <TableCell>{board.code}</TableCell>
                        <TableCell>
                          {board.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ padding: "8px 4px" }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(board)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(board.id)}
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
