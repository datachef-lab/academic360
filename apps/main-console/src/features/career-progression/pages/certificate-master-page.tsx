import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, PlusCircle, ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CertificateNameBadge } from "@/features/career-progression/components/certificate-name-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CertificateMaster = {
  id: number;
  name: string;
  description: string;
  color: string | null;
  bgColor: string | null;
  sequence: number;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  sequence: 0,
  isActive: true,
};

export default function CertificateMasterPage() {
  const [rows, setRows] = useState<CertificateMaster[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateMaster | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<{ payload: CertificateMaster[] }>(
        "/api/academics/certificate-masters",
      );
      setRows(Array.isArray(data.payload) ? data.payload : []);
    } catch {
      toast.error("Failed to load certificate masters");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        String(r.sequence).includes(q),
    );
  }, [rows, searchText]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: CertificateMaster) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description,
      sequence: row.sequence,
      isActive: row.isActive,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Name and description are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        sequence: Number(form.sequence) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await axiosInstance.put(`/api/academics/certificate-masters/${editing.id}`, body);
        toast.success("Certificate master updated");
      } else {
        await axiosInstance.post("/api/academics/certificate-masters", body);
        toast.success("Certificate master created");
      }
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await axiosInstance.delete(`/api/academics/certificate-masters/${deleteId}`);
      toast.success("Deleted");
      setDeleteId(null);
      await load();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error("Cannot delete: still in use");
      } else {
        toast.error("Delete failed");
      }
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">Loading certificate masters…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <ScrollText className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0 text-violet-700" />
              <span className="truncate text-violet-900">Certificate master</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Define certificate types used in career progression forms.
            </div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <Button
              type="button"
              onClick={openCreate}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add certificate</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </CardHeader>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit certificate master" : "New certificate master"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="cm-name">Name</Label>
                <Input
                  id="cm-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cm-desc">Description</Label>
                <Textarea
                  id="cm-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-2 max-w-xs">
                <Label htmlFor="cm-seq">Sequence</Label>
                <Input
                  id="cm-seq"
                  type="number"
                  value={form.sequence}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sequence: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Checkbox
                  id="cm-active"
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: Boolean(c) }))}
                />
                <Label htmlFor="cm-active" className="font-normal cursor-pointer text-sm">
                  Active
                </Label>
              </div>
              <div className="flex w-full sm:w-auto gap-2 justify-end order-1 sm:order-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void save()}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[720px]" style={{ tableLayout: "fixed" }}>
                <TableHeader
                  style={{ position: "sticky", top: 0, zIndex: 30, background: "#f3f4f6" }}
                >
                  <TableRow>
                    <TableHead style={{ width: 48 }}>Seq</TableHead>
                    <TableHead className="min-w-0" style={{ width: "28%", maxWidth: 280 }}>
                      Name
                    </TableHead>
                    <TableHead className="min-w-0">Description</TableHead>
                    <TableHead style={{ width: 88 }}>Status</TableHead>
                    <TableHead style={{ width: 88 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {rows.length === 0
                          ? "No certificate masters yet."
                          : "No certificate masters match your search."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((r) => (
                      <TableRow key={r.id} className="group">
                        <TableCell>{r.sequence}</TableCell>
                        <TableCell className="min-w-0 align-middle">
                          <CertificateNameBadge name={r.name} color={r.color} bgColor={r.bgColor} />
                        </TableCell>
                        <TableCell className="min-w-0">
                          <div
                            className="text-sm text-muted-foreground line-clamp-2"
                            title={r.description}
                          >
                            {r.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(r)}
                              className="h-8 w-8 p-0"
                              aria-label="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteId(r.id)}
                              className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                              aria-label="Delete"
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

      <AlertDialog open={deleteId != null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete certificate master?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone if no student data references it. If it is in use, delete will
              be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
