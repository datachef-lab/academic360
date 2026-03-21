import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Edit, PlusCircle, Shapes, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserTypeT } from "@repo/db/schemas/models/administration";
import {
  createUserType,
  deleteUserType,
  getAllUserTypes,
  type UserTypePayload,
  updateUserType,
} from "../services/user-type.service";
import * as XLSX from "xlsx";

const userTypeSchema = z.object({
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
  parentUserTypeId: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) =>
      v === "" || v === undefined || v === null || v === "__none__" ? null : Number(v),
    ),
  isActive: z.boolean().default(true),
});

type UserTypeFormValues = z.infer<typeof userTypeSchema>;

interface UserTypeFormProps {
  initialData: UserTypeT | null;
  parentUserTypes: UserTypeT[];
  onSubmit: (payload: UserTypePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function UserTypeForm({
  initialData,
  parentUserTypes,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserTypeFormProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<UserTypeFormValues>({
    resolver: zodResolver(userTypeSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      parentUserTypeId: initialData?.parentUserTypeId ?? null,
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      parentUserTypeId: initialData?.parentUserTypeId ?? null,
      isActive: initialData?.isActive ?? true,
    });
  }, [initialData, reset]);

  const submit = async (values: UserTypeFormValues) => {
    await onSubmit({
      name: values.name,
      code: values.code || null,
      description: values.description || null,
      parentUserTypeId: values.parentUserTypeId ?? null,
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
      <div className="space-y-2">
        <Label htmlFor="parentUserTypeId">Base</Label>
        <Controller
          name="parentUserTypeId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value != null ? String(field.value) : "__none__"}
              onValueChange={(v) => field.onChange(v === "__none__" ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select base user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (primary user type)</SelectItem>
                {parentUserTypes.map((p) => (
                  <SelectItem key={p.id} value={String(p.id!)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default function UserTypePage() {
  const [items, setItems] = useState<UserTypeT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<UserTypeT | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserTypeT | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllUserTypes();
      setItems(Array.isArray(response.payload) ? response.payload : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError("Failed to load user types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const primaryUserTypes = useMemo(
    () => items.filter((item) => item.parentUserTypeId == null),
    [items],
  );

  const subUserTypes = useMemo(
    () => items.filter((item) => item.parentUserTypeId != null),
    [items],
  );

  const parentUserTypeMap = useMemo(() => {
    const map = new Map<number, (typeof items)[0]>();
    for (const item of items) {
      if (item.id != null) map.set(item.id, item);
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    if (!search) return subUserTypes;
    const s = search.toLowerCase();
    return subUserTypes.filter((item) => {
      const parent =
        item.parentUserTypeId != null ? parentUserTypeMap.get(item.parentUserTypeId) : null;
      return (
        item.name?.toLowerCase().includes(s) ||
        item.code?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s) ||
        parent?.name?.toLowerCase().includes(s)
      );
    });
  }, [subUserTypes, search, parentUserTypeMap]);

  const onSave = async (payload: UserTypePayload) => {
    setIsSubmitting(true);
    try {
      if (selected?.id) {
        await updateUserType(selected.id, payload);
        toast.success("User type updated");
      } else {
        await createUserType(payload);
        toast.success("User type created");
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
      await deleteUserType(deleteTarget.id);
      toast.success("User type deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed", { description: "Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAll = () => {
    const rows = subUserTypes.map((item) => {
      const parent =
        item.parentUserTypeId != null ? parentUserTypeMap.get(item.parentUserTypeId) : null;
      return {
        id: item.id,
        name: item.name,
        variant: parent?.name ?? "—",
        code: item.code,
        description: item.description,
        isActive: item.isActive ? "Active" : "Inactive",
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UserTypes");
    XLSX.writeFile(workbook, "user_types.xlsx");
  };

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-4 min-h-[calc(100vh-140px)]">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Shapes className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">User Types</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              A list of sub user types (Administrator, Teaching, College Student, etc.) for
              administration and access mapping.
            </div>
          </div>

          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={() => setSelected(null)}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selected ? "Edit User Type" : "Add New User Type"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <UserTypeForm
                  initialData={selected}
                  parentUserTypes={primaryUserTypes}
                  onSubmit={onSave}
                  onCancel={() => setIsDialogOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant="outline"
              className="flex items-center gap-2 flex-shrink-0"
              onClick={handleDownloadAll}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader
                  style={{ position: "sticky", top: 0, zIndex: 30, background: "#f3f4f6" }}
                >
                  <TableRow>
                    <TableHead style={{ width: 80, background: "#f3f4f6", color: "#374151" }}>
                      ID
                    </TableHead>
                    <TableHead style={{ width: 280, background: "#f3f4f6", color: "#374151" }}>
                      User Type
                    </TableHead>
                    <TableHead style={{ width: 180, background: "#f3f4f6", color: "#374151" }}>
                      Code
                    </TableHead>
                    <TableHead style={{ width: 260, background: "#f3f4f6", color: "#374151" }}>
                      Description
                    </TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>
                      Status
                    </TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>
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
                        No sub user types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item, idx) => (
                      <TableRow key={item.id ?? idx}>
                        <TableCell style={{ width: 80 }}>{idx + 1}.</TableCell>
                        <TableCell style={{ width: 280 }}>
                          <div className="flex flex-col gap-1.5">
                            <span className="font-medium">{item.name}</span>
                            {(() => {
                              const parent =
                                item.parentUserTypeId != null
                                  ? parentUserTypeMap.get(item.parentUserTypeId)
                                  : null;
                              if (!parent) return null;
                              // Fallback colors when DB lacks color/bgColor (e.g. pre-seed records)
                              const staffColor = "#6366f1";
                              const staffBg = "#e0e7ff";
                              const studentColor = "#059669";
                              const studentBg = "#d1fae5";
                              const parentColor =
                                parent.color ??
                                (parent.name?.toLowerCase() === "staff"
                                  ? staffColor
                                  : parent.name?.toLowerCase() === "student"
                                    ? studentColor
                                    : "#64748b");
                              const parentBg =
                                parent.bgColor ??
                                (parent.name?.toLowerCase() === "staff"
                                  ? staffBg
                                  : parent.name?.toLowerCase() === "student"
                                    ? studentBg
                                    : "#f1f5f9");
                              return (
                                <Badge
                                  className="w-fit font-medium border text-xs"
                                  style={{
                                    backgroundColor: parentBg,
                                    color: parentColor,
                                    borderColor: parentColor,
                                  }}
                                >
                                  {parent.name}
                                </Badge>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell style={{ width: 180 }}>
                          {item.code
                            ? (() => {
                                const parent =
                                  item.parentUserTypeId != null
                                    ? parentUserTypeMap.get(item.parentUserTypeId)
                                    : null;
                                const staffColor = "#6366f1";
                                const staffBg = "#e0e7ff";
                                const studentColor = "#059669";
                                const studentBg = "#d1fae5";
                                const codeColor =
                                  item.color ??
                                  parent?.color ??
                                  (parent?.name?.toLowerCase() === "staff"
                                    ? staffColor
                                    : parent?.name?.toLowerCase() === "student"
                                      ? studentColor
                                      : "#64748b");
                                const codeBg =
                                  item.bgColor ??
                                  parent?.bgColor ??
                                  (parent?.name?.toLowerCase() === "staff"
                                    ? staffBg
                                    : parent?.name?.toLowerCase() === "student"
                                      ? studentBg
                                      : "#f1f5f9");
                                return (
                                  <Badge
                                    className="w-fit font-medium border text-xs"
                                    style={{
                                      backgroundColor: codeBg,
                                      color: codeColor,
                                      borderColor: codeColor,
                                    }}
                                  >
                                    {item.code}
                                  </Badge>
                                );
                              })()
                            : "—"}
                        </TableCell>
                        <TableCell style={{ width: 260 }}>{item.description ?? "—"}</TableCell>
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
                                  <DialogTitle>Delete user type?</DialogTitle>
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
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
