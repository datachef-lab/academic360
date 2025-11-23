import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, BookText } from "lucide-react";
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
import { boardSubjectNameService, type BoardSubjectNameDto } from "@/services/board-subject-name.service";

// Mock data removed - now using real API

const BoardSubjectNameForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData: BoardSubjectNameDto | null;
  onSubmit: (data: { name: string; code?: string | null; sequence?: number | null; isActive: boolean }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    sequence: initialData?.sequence ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      code: formData.code || null,
      sequence: formData.sequence === "" ? null : Number(formData.sequence),
      isActive: formData.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Subject Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter Subject Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Enter Code"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sequence">Sequence</Label>
          <Input
            id="sequence"
            type="number"
            value={formData.sequence}
            onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
            placeholder="Enter Sequence"
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
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

export default function BoardSubjectNamePage() {
  const [subjectNames, setSubjectNames] = React.useState<BoardSubjectNameDto[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedSubjectName, setSelectedSubjectName] = React.useState<BoardSubjectNameDto | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load subject names on component mount
  React.useEffect(() => {
    loadSubjectNames();
  }, []);

  const loadSubjectNames = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardSubjectNameService.getAll();
      setSubjectNames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subject names");
      toast.error("Failed to load subject names");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subjectName: BoardSubjectNameDto) => {
    setSelectedSubjectName(subjectName);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: {
    name: string;
    code?: string | null;
    sequence?: number | null;
    isActive: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (selectedSubjectName?.id) {
        // Update existing subject name
        const updatedSubjectName = await boardSubjectNameService.update(selectedSubjectName.id, data);
        setSubjectNames((prev) => prev.map((sn) => (sn.id === selectedSubjectName.id ? updatedSubjectName : sn)));
        toast.success("Subject name updated successfully");
      } else {
        // Create new subject name
        const newSubjectName = await boardSubjectNameService.create(data);
        setSubjectNames((prev) => [...prev, newSubjectName]);
        toast.success("Subject name created successfully");
      }
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save subject name");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedSubjectName(null);
  };

  const handleAddNew = () => {
    setSelectedSubjectName(null);
    setIsFormOpen(true);
  };

  // Delete functionality removed per requirements

  const handleDownloadAll = () => {
    try {
      const data = subjectNames.map((sn, index) => ({
        "S.No": index + 1,
        Name: sn.name,
        Code: sn.code || "-",
        Sequence: sn.sequence ?? "-",
        Status: sn.isActive ? "Active" : "Inactive",
        "Created At": sn.createdAt,
        "Updated At": sn.updatedAt,
      }));
      console.log("Download data:", data);
      toast.success("Download functionality would be implemented here");
    } catch {
      toast.error("Failed to download subject names");
    }
  };

  const filtered = subjectNames.filter(
    (sn) =>
      sn.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (sn.code ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (sn.sequence?.toString() ?? "").includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center mb-3 gap-4 sm:gap-0 sm:justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <BookText className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400" />
              Subjects
            </CardTitle>
            <div className="text-sm sm:text-base text-muted-foreground mt-1">Manage master list of subjects.</div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Subjects</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedSubjectName ? "Edit Subject" : "Add New Subject"}</AlertDialogTitle>
                </AlertDialogHeader>
                <BoardSubjectNameForm
                  initialData={selectedSubjectName}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" className="flex items-center gap-2 flex-shrink-0" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] sm:top-[88px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search by name, code, or sequence..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-max" style={{ tableLayout: "auto" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead
                      style={{ background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap", padding: "12px 8px" }}
                    >
                      ID
                    </TableHead>
                    <TableHead
                      style={{ background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap", padding: "12px 8px" }}
                    >
                      Subject Name
                    </TableHead>
                    <TableHead
                      style={{ background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap", padding: "12px 8px" }}
                    >
                      Code
                    </TableHead>
                    <TableHead
                      style={{ background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap", padding: "12px 8px" }}
                    >
                      Sequence
                    </TableHead>
                    <TableHead
                      style={{ background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap", padding: "12px 8px" }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      style={{ background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap", padding: "12px 8px" }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No subject names found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((sn, index) => (
                      <TableRow key={sn.id} className="group">
                        <TableCell style={{ padding: "12px 8px" }}>{index + 1}</TableCell>
                        <TableCell style={{ padding: "12px 8px" }}>{sn.name}</TableCell>
                        <TableCell style={{ padding: "12px 8px" }}>{sn.code || "-"}</TableCell>
                        <TableCell style={{ padding: "12px 8px" }}>{sn.sequence ?? "-"}</TableCell>
                        <TableCell style={{ padding: "12px 8px" }}>
                          {sn.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ padding: "12px 8px" }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(sn)} className="h-5 w-5 p-0">
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
