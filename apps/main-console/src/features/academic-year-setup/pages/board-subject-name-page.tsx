import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Download, Edit, Trash2, BookText } from "lucide-react";
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
import type { BoardSubjectName } from "@repo/db";

// Mock data for demonstration
const mockBoardSubjectNames: BoardSubjectName[] = [
  {
    id: 1,
    name: "Mathematics",
    code: "MATH",
    sequence: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Physics",
    code: "PHY",
    sequence: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Chemistry",
    code: "CHEM",
    sequence: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Biology",
    code: "BIO",
    sequence: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "English",
    code: "ENG",
    sequence: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: "History",
    code: "HIST",
    sequence: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 7,
    name: "Geography",
    code: "GEO",
    sequence: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 8,
    name: "Computer Science",
    code: "CS",
    sequence: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 9,
    name: "Economics",
    code: "ECO",
    sequence: 9,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 10,
    name: "Political Science",
    code: "PS",
    sequence: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 11,
    name: "Sociology",
    code: "SOC",
    sequence: 11,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 12,
    name: "Psychology",
    code: "PSY",
    sequence: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 13,
    name: "Hindi",
    code: "HIN",
    sequence: 13,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 14,
    name: "Environmental Science",
    code: "EVS",
    sequence: 14,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const BoardSubjectNameForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData: BoardSubjectName | null;
  onSubmit: (data: any) => void;
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
      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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
  const [subjectNames, setSubjectNames] = React.useState<BoardSubjectName[]>(mockBoardSubjectNames);
  const [loading] = React.useState<boolean>(false);
  const [error] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedSubjectName, setSelectedSubjectName] = React.useState<BoardSubjectName | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleEdit = (subjectName: BoardSubjectName) => {
    setSelectedSubjectName(subjectName);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (selectedSubjectName?.id) {
        setSubjectNames((prev) =>
          prev.map((sn) =>
            sn.id === selectedSubjectName.id ? { ...sn, ...data, updatedAt: new Date().toISOString() } : sn,
          ),
        );
        toast.success("Subject name updated successfully");
      } else {
        const nextId = Math.max(...subjectNames.map((s) => s.id || 0)) + 1;
        setSubjectNames((prev) => [
          ...prev,
          { id: nextId, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ]);
        toast.success("Subject name created successfully");
      }
      setIsFormOpen(false);
    } catch (e) {
      toast.error("Failed to save subject name");
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

  const onDelete = async (id: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubjectNames((prev) => prev.filter((sn) => sn.id !== id));
      toast.success("Subject name deleted successfully");
    } catch {
      toast.error("Failed to delete subject name");
    }
  };

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
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <BookText className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Subjects
            </CardTitle>
            <div className="text-muted-foreground">Manage master list of subjects.</div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Subjects
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-2xl">
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
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search by name, code, or sequence..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap" }}>
                      ID
                    </TableHead>
                    <TableHead style={{ width: 250, background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap" }}>
                      Subject Name
                    </TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap" }}>
                      Code
                    </TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap" }}>
                      Sequence
                    </TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap" }}>
                      Status
                    </TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151", whiteSpace: "nowrap" }}>
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
                        <TableCell style={{ width: 60 }}>{index + 1}</TableCell>
                        <TableCell style={{ width: 250 }}>{sn.name}</TableCell>
                        <TableCell style={{ width: 140 }}>{sn.code || "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>{sn.sequence ?? "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {sn.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 140 }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(sn)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(sn.id!)}
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
