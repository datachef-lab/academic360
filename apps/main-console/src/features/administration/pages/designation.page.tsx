import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Edit, PlusCircle, Trash2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DesignationPayload } from "../services/designation.service";
import {
  createDesignation,
  deleteDesignation,
  getAllDesignations,
  updateDesignation,
} from "../services/designation.service";
import type { DesignationT } from "@repo/db/schemas";
import * as XLSX from "xlsx";

const designationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((value) => value.trim()),
  code: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : "")),
  description: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : "")),
  color: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : null)),
  bgColor: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : null)),
  isActive: z.boolean().default(true),
});

type DesignationFormValues = z.infer<typeof designationSchema>;

interface DesignationFormProps {
  initialData: DesignationT | null;
  onSubmit: (payload: DesignationPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function DesignationForm({ initialData, onSubmit, onCancel, isSubmitting }: DesignationFormProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      color: initialData?.color ?? "",
      bgColor: initialData?.bgColor ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      color: initialData?.color ?? "",
      bgColor: initialData?.bgColor ?? "",
      isActive: initialData?.isActive ?? true,
    });
  }, [initialData, reset]);

  const submit = async (values: DesignationFormValues) => {
    await onSubmit({
      name: values.name,
      code: values.code || null,
      description: values.description || null,
      color: values.color || null,
      bgColor: values.bgColor || null,
      isActive: values.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" {...register("code")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" className="min-h-[80px] resize-y" {...register("description")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" type="text" placeholder="#059669" {...register("color")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bgColor">Background Color</Label>
          <Input id="bgColor" type="text" placeholder="#d1fae5" {...register("bgColor")} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default function DesignationPage() {
  const [items, setItems] = useState<DesignationT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<DesignationT | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DesignationT | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllDesignations();
      const payload = Array.isArray(response.payload) ? response.payload : [];
      setItems(payload);
      setError(null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError("Failed to load designations");
      toast.error("Failed to load designations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(s) ||
        item.code?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s),
    );
  }, [items, search]);

  const onSave = async (payload: DesignationPayload) => {
    setIsSubmitting(true);
    try {
      if (selected?.id) {
        await updateDesignation(selected.id, payload);
        toast.success("Designation updated");
      } else {
        await createDesignation(payload);
        toast.success("Designation created");
      }
      setIsDialogOpen(false);
      setSelected(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Save failed", { description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await deleteDesignation(deleteTarget.id);
      toast.success("Designation deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed", { description: "Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    const rows = filteredItems.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      isActive: item.isActive ? "Active" : "Inactive",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Designations");
    XLSX.writeFile(workbook, "designations.xlsx");
  };

  const handleAddClick = () => {
    setSelected(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-4 min-h-[calc(100vh-140px)] overflow-x-hidden">
      <Card className="border-none">
        <CardHeader className="flex flex-col gap-4 border rounded-md p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-black" />
                <span className="text-lg font-semibold">Designation Management</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Manage staff designations, codes, descriptions, and status.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    onClick={handleAddClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {selected ? "Edit Designation" : "Add New Designation"}
                    </AlertDialogTitle>
                  </AlertDialogHeader>
                  <DesignationForm
                    initialData={selected}
                    onSubmit={onSave}
                    onCancel={() => setIsDialogOpen(false)}
                    isSubmitting={isSubmitting}
                  />
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 overflow-x-hidden">
          <div className="bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search by name, code, or description..."
              className="w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant="outline"
              className="flex items-center gap-2 flex-shrink-0"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>

          {/* Mobile: card layout */}
          <div className="md:hidden space-y-2 p-2 sm:p-4 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No designations found.</div>
            ) : (
              filteredItems.map((item, idx) => (
                <Card key={item.id ?? idx} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800 truncate">{item.name}</span>
                        {item.code && (
                          <Badge
                            className="flex-shrink-0 text-xs"
                            style={{
                              backgroundColor: item.bgColor ?? "#f1f5f9",
                              color: item.color ?? "#64748b",
                              borderColor: item.color ?? "#64748b",
                            }}
                          >
                            {item.code}
                          </Badge>
                        )}
                        <Badge
                          variant={item.isActive ? "default" : "secondary"}
                          className={
                            item.isActive
                              ? "bg-green-500 text-white hover:bg-green-600 flex-shrink-0"
                              : "flex-shrink-0"
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelected(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={deleteTarget?.id === item.id}
                        onOpenChange={(open) => setDeleteTarget(open ? item : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw]">
                          <DialogHeader>
                            <DialogTitle>Delete designation?</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">
                            This will permanently remove <strong>{item.name}</strong>.
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setDeleteTarget(null)}
                              disabled={isDeleting}
                            >
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto h-full overflow-x-hidden">
              <table
                className="w-full caption-bottom text-sm border rounded-md"
                style={{ tableLayout: "fixed" }}
              >
                <TableHeader>
                  <TableRow className="sticky top-0 z-30 bg-[#f3f4f6] [&>th]:border-b hover:bg-[#f3f4f6]">
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 80 }}
                    >
                      #
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 200 }}
                    >
                      Name
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 140 }}
                    >
                      Code
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 280 }}
                    >
                      Description
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 120 }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                      style={{ width: 140 }}
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
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No designations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <TableRow key={item.id ?? idx}>
                        <TableCell style={{ width: 80 }}>{idx + 1}.</TableCell>
                        <TableCell style={{ width: 200 }}>
                          <span className="font-medium">{item.name}</span>
                        </TableCell>
                        <TableCell style={{ width: 140 }}>
                          {item.code ? (
                            <Badge
                              className="w-fit font-medium border text-xs"
                              style={{
                                backgroundColor: item.bgColor ?? "#f1f5f9",
                                color: item.color ?? "#64748b",
                                borderColor: item.color ?? "#64748b",
                              }}
                            >
                              {item.code}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell style={{ width: 280 }}>{item.description ?? "—"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {item.isActive ? (
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
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelected(item);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog
                              open={deleteTarget?.id === item.id}
                              onOpenChange={(open) => setDeleteTarget(open ? item : null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Delete designation?</DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground">
                                  This will permanently remove <strong>{item.name}</strong>.
                                </p>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isDeleting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={onDelete}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
