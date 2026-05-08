import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookType, Download, Edit, Loader2, PlusCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createLibraryBinding,
  deleteLibraryBinding,
  getLibraryBindings,
  LibraryBinding,
  updateLibraryBinding,
} from "@/services/library-binding.service";

const DEFAULT_LIMIT = 10;

export default function BindingTypesPage() {
  const [rows, setRows] = useState<LibraryBinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LibraryBinding | null>(null);
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteRow, setDeleteRow] = useState<LibraryBinding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const activeFrom = useMemo(
    () => (total === 0 ? 0 : (page - 1) * limit + 1),
    [page, limit, total],
  );
  const activeTo = useMemo(() => Math.min(page * limit, total), [page, limit, total]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const response = await getLibraryBindings({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(response.payload.rows);
      setTotal(response.payload.total);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch binding types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchText.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    void fetchRows();
  }, [page, limit, debouncedSearch]);

  const resetForm = () => {
    setSelectedRow(null);
    setFormName("");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (row: LibraryBinding) => {
    setSelectedRow(row);
    setFormName(row.name);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const name = formName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { name };
      if (selectedRow) {
        await updateLibraryBinding(selectedRow.id, payload);
        toast.success("Binding type updated successfully");
      } else {
        await createLibraryBinding(payload);
        toast.success("Binding type created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      await fetchRows();
    } catch (error) {
      console.error(error);
      toast.error(selectedRow ? "Failed to update binding type" : "Failed to create binding type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      setIsDeleting(true);
      await deleteLibraryBinding(deleteRow.id);
      toast.success("Binding type deleted successfully");
      setDeleteRow(null);
      if (rows.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchRows();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete binding type");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    const headers = ["#", "Name", "Legacy Binding ID", "Created At", "Updated At"];
    const csvRows = rows.map((row, index) => [
      String((page - 1) * limit + index + 1),
      row.name,
      row.legacyBindingId === null ? "-" : String(row.legacyBindingId),
      new Date(row.createdAt).toLocaleString(),
      new Date(row.updatedAt).toLocaleString(),
    ]);

    const csv = [headers, ...csvRows]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "library-binding-types.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="sticky top-0 z-30 mb-3 flex flex-col items-start justify-between gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <BookType className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
              <span className="truncate">Binding Types</span>
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage library binding types used across records.
            </p>
          </div>

          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            <Button variant="outline" onClick={handleDownload} className="flex-shrink-0">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              className="bg-purple-600 text-white hover:bg-purple-700"
              onClick={openCreateDialog}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 mb-0 border-b bg-background p-2 sm:p-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search binding type..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="h-full overflow-y-auto overflow-x-auto">
              <Table className="min-w-[900px] rounded-md border" style={{ tableLayout: "fixed" }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 z-20 bg-slate-100" style={{ width: 70 }}>
                      #
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100" style={{ width: 260 }}>
                      Name
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100" style={{ width: 190 }}>
                      Updated At
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100" style={{ width: 130 }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading binding types...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No binding types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{new Date(row.updatedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditDialog(row)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-7 w-7 p-0"
                              onClick={() => setDeleteRow(row)}
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

          <div className="flex items-center justify-between border-t bg-background px-3 py-2 text-sm">
            <p className="text-slate-500">
              Showing {activeFrom}-{activeTo} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRow ? "Edit Binding Type" : "Add Binding Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="binding-name">Name</Label>
              <Input
                id="binding-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter binding type name"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} type="button">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Binding Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove{" "}
              <span className="font-medium text-slate-700">{deleteRow?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
