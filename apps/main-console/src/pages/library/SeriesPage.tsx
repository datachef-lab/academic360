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
import { Download, Edit, Loader2, PlusCircle, Search, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import {
  createLibrarySeries,
  deleteLibrarySeries,
  getLibrarySeries,
  LibrarySeries,
  updateLibrarySeries,
} from "@/services/library-series.service";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

const DEFAULT_LIMIT = 10;

export default function SeriesPage() {
  const [rows, setRows] = useState<LibrarySeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LibrarySeries | null>(null);
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteRow, setDeleteRow] = useState<LibrarySeries | null>(null);
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
      const response = await getLibrarySeries({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(response.payload.rows);
      setTotal(response.payload.total);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch series");
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

  const openEditDialog = (row: LibrarySeries) => {
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
        await updateLibrarySeries(selectedRow.id, payload);
        toast.success("Series updated successfully");
      } else {
        await createLibrarySeries(payload);
        toast.success("Series created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      await fetchRows();
    } catch (error) {
      console.error(error);
      toast.error(selectedRow ? "Failed to update series" : "Failed to create series");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    try {
      setIsDeleting(true);
      await deleteLibrarySeries(deleteRow.id);
      toast.success("Series deleted successfully");
      setDeleteRow(null);
      if (rows.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchRows();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete series");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    const headers = ["#", "Name", "Updated At"];
    const csvRows = rows.map((row, index) => [
      String((page - 1) * limit + index + 1),
      row.name,
      new Date(row.updatedAt).toLocaleString(),
    ]);
    const csv = [headers, ...csvRows]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "library-series.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={Workflow}
        title="Series"
        subtitle="Book series master data (e.g. Harry Potter, LOTR)."
        actions={
          <>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
            <Button onClick={openCreateDialog}>
              <PlusCircle className="mr-1 h-4 w-4" />
              Add
            </Button>
          </>
        }
      />
      <Card className="min-w-0 border-none">
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 mb-0 border-b bg-background p-2 sm:p-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search series..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="h-full overflow-y-auto overflow-x-auto">
              <Table className="min-w-[900px] rounded-md border" style={{ tableLayout: "fixed" }}>
                <TableHeader className={STICKY_THEAD_CLASS}>
                  <TableRow>
                    <TableHead
                      className={cn(STICKY_TH_LEFT, "sticky top-0 z-20 bg-slate-100")}
                      style={{ width: 70 }}
                    >
                      #
                    </TableHead>
                    <TableHead
                      className={cn(STICKY_TH_BASE, "sticky top-0 z-20 bg-slate-100")}
                      style={{ width: 540 }}
                    >
                      Name
                    </TableHead>
                    <TableHead
                      className={cn(STICKY_TH_BASE, "sticky top-0 z-20 bg-slate-100")}
                      style={{ width: 220 }}
                    >
                      Updated At
                    </TableHead>
                    <TableHead
                      className={cn(STICKY_TH_RIGHT, "sticky top-0 z-20 bg-slate-100")}
                      style={{ width: 130 }}
                    >
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
                          Loading series...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No series found.
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
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditDialog(row)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
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
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRow ? "Edit Series" : "Add Series"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="series-name">Name</Label>
              <Input
                id="series-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter series name"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Series?</AlertDialogTitle>
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
