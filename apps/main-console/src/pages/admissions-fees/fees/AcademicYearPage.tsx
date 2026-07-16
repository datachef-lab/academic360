import React, { useState, useEffect } from "react";
import { Calendar, PlusCircle, Download, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AcademicYear } from "@/types/academics/academic-year";
import { getAllAcademicYears, updateAcademicYearById } from "@/services/academic-year-api";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import AddAcademicYearDialog from "./AddAcademicYearDialog";
import { useResourceRoom } from "@/features/academic-year-setup/general/useResourceRoom";

const AcademicYearPage: React.FC = () => {
  const [data, setData] = useState<AcademicYear[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [editForm, setEditForm] = useState<{ year: string; isCurrentYear: boolean }>({
    year: "",
    isCurrentYear: false,
  });

  const { setAvailableYears, setCurrentYear } = useAcademicYear();

  const fetchAcademicYears = async () => {
    try {
      const res = await getAllAcademicYears();
      const payload = res.payload ?? [];
      setData(
        payload.map((item) => ({
          id: item.id,
          year: item.year,
          isCurrentYear: item.isCurrentYear,
        })),
      );
      // Keep the redux academic-year slice (sidebar, selectors used app-wide) in sync.
      setAvailableYears(payload);
      const active = payload.find((y) => y.isCurrentYear);
      if (active) setCurrentYear(active);
    } catch (error) {
      console.error("Failed to fetch academic years", error);
      toast.error("Failed to fetch academic years");
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useResourceRoom("v1/academics", () => fetchAcademicYears());

  const filteredData = data.filter((y) => y.year.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleExport = () => {
    const csvContent = [
      ["ID", "Year", "Status"],
      ...filteredData.map((y) => [y.id, y.year, y.isCurrentYear ? "active" : "inactive"]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "academic_years.csv";
    a.click();
  };

  const handleEdit = (item: AcademicYear) => {
    setEditingItem(item);
    setEditForm({ year: item.year, isCurrentYear: Boolean(item.isCurrentYear) });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    setData((prev) => prev.filter((y) => y.id !== id));
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;
    try {
      await updateAcademicYearById(editingItem.id!, {
        year: editForm.year,
        isCurrentYear: editForm.isCurrentYear,
      });
      toast.success("Academic year updated");
      setEditingItem(null);
      await fetchAcademicYears();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update academic year");
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start justify-between gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Calendar className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
              <span className="truncate">Academic Year</span>
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage academic year settings and periods.
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            <Button variant="outline" onClick={handleExport} className="flex-shrink-0">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              className="flex-shrink-0 bg-purple-600 text-white hover:bg-purple-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 border-b bg-background p-2 sm:p-4">
            <Input
              placeholder="Search academic years..."
              className="w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="h-full overflow-x-auto overflow-y-auto">
              <Table className="min-w-[640px] border rounded-md" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 80, background: "#f3f4f6", color: "#374151" }}>
                      #
                    </TableHead>
                    <TableHead style={{ width: 260, background: "#f3f4f6", color: "#374151" }}>
                      Academic Year
                    </TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>
                      Status
                    </TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length ? (
                    filteredData.map((item, index) => (
                      <TableRow key={item.id} className="group">
                        <TableCell style={{ width: 80 }}>{index + 1}</TableCell>
                        <TableCell style={{ width: 260 }} className="font-medium">
                          {item.year}
                        </TableCell>
                        <TableCell style={{ width: 140 }}>
                          {item.isCurrentYear ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 140 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id!)}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No academic years found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add (copy-forward) dialog */}
      <AddAcademicYearDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={fetchAcademicYears}
      />

      {/* Edit dialog (year + active flag) */}
      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>Update the year label and active status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                value={editForm.year}
                onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
                placeholder="e.g. 2025-26"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="edit-active">Active (current) year</Label>
              <Switch
                id="edit-active"
                checked={editForm.isCurrentYear}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, isCurrentYear: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} className="bg-purple-600 hover:bg-purple-700">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicYearPage;
