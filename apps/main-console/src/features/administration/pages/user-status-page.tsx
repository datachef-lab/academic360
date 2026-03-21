import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Edit, PlusCircle, Trash2, UserCheck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserStatusMasterDto, UserStatusPayload } from "../services/user-status.service";
import {
  createUserStatusMaster,
  deleteUserStatusMaster,
  getAllUserStatusMasters,
  updateUserStatusMaster,
} from "../services/user-status.service";
import * as XLSX from "xlsx";

const userStatusSchema = z.object({
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
  parentUserStatusMasterId: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) =>
      v === "" || v === undefined || v === null || v === "__none__" ? null : Number(v),
    ),
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

type UserStatusFormValues = z.infer<typeof userStatusSchema>;

interface UserStatusFormProps {
  initialData: UserStatusMasterDto | null;
  primaryUserStatuses: UserStatusMasterDto[];
  isPrimary?: boolean;
  onSubmit: (payload: UserStatusPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function UserStatusForm({
  initialData,
  primaryUserStatuses,
  isPrimary = false,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserStatusFormProps) {
  const parentId = initialData?.parentUserStatusMaster?.id ?? null;

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<UserStatusFormValues>({
    resolver: zodResolver(userStatusSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      parentUserStatusMasterId: parentId,
      color: initialData?.color ?? "",
      bgColor: initialData?.bgColor ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    const parentId = initialData?.parentUserStatusMaster?.id ?? null;
    reset({
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      parentUserStatusMasterId: parentId,
      color: initialData?.color ?? "",
      bgColor: initialData?.bgColor ?? "",
      isActive: initialData?.isActive ?? true,
    });
  }, [initialData, reset]);

  const submit = async (values: UserStatusFormValues) => {
    await onSubmit({
      name: values.name,
      code: values.code || null,
      description: values.description || null,
      parentUserStatusMasterId: isPrimary ? null : (values.parentUserStatusMasterId ?? null),
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
      {!isPrimary && (
        <div className="space-y-2">
          <Label htmlFor="parentUserStatusMasterId">Applies to status</Label>
          <Controller
            name="parentUserStatusMasterId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value != null ? String(field.value) : "__none__"}
                onValueChange={(v) => field.onChange(v === "__none__" ? null : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select base user status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (primary status)</SelectItem>
                  {primaryUserStatuses.map((p) => (
                    <SelectItem key={p.id} value={String(p.id!)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

type TabValue = "user-statuses" | "reasons";

export default function UserStatusPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("user-statuses");
  const [items, setItems] = useState<UserStatusMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [parentFilterId, setParentFilterId] = useState<number | "__all__">("__all__");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<UserStatusMasterDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserStatusMasterDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPrimaryTab = activeTab === "user-statuses";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllUserStatusMasters();
      setItems(Array.isArray(response.payload) ? response.payload : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError("Failed to load user statuses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const primaryUserStatuses = useMemo(
    () => items.filter((item) => !item.parentUserStatusMaster),
    [items],
  );

  const subUserStatuses = useMemo(
    () => items.filter((item) => item.parentUserStatusMaster != null),
    [items],
  );

  const parentUserStatusMap = useMemo(() => {
    const map = new Map<number, UserStatusMasterDto>();
    for (const item of items) {
      if (item.id != null) map.set(item.id, item);
      if (item.parentUserStatusMaster?.id != null)
        map.set(item.parentUserStatusMaster.id, item.parentUserStatusMaster as UserStatusMasterDto);
    }
    return map;
  }, [items]);

  const getParent = (item: UserStatusMasterDto) => {
    if (item.parentUserStatusMaster) return item.parentUserStatusMaster as UserStatusMasterDto;
    return null;
  };

  const filteredPrimary = useMemo(() => {
    if (!search) return primaryUserStatuses;
    const s = search.toLowerCase();
    return primaryUserStatuses.filter(
      (item) =>
        item.name?.toLowerCase().includes(s) ||
        item.code?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s),
    );
  }, [primaryUserStatuses, search]);

  const filteredReasons = useMemo(() => {
    let result = subUserStatuses;
    if (parentFilterId !== "__all__") {
      result = result.filter((item) => item.parentUserStatusMaster?.id === parentFilterId);
    }
    if (!search) return result;
    const s = search.toLowerCase();
    return result.filter((item) => {
      const parent = getParent(item);
      return (
        item.name?.toLowerCase().includes(s) ||
        item.code?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s) ||
        parent?.name?.toLowerCase().includes(s)
      );
    });
  }, [subUserStatuses, search, parentFilterId, parentUserStatusMap]);

  const onSave = async (payload: UserStatusPayload) => {
    setIsSubmitting(true);
    try {
      if (selected?.id) {
        await updateUserStatusMaster(selected.id, payload);
        toast.success("User status updated");
      } else {
        await createUserStatusMaster(payload);
        toast.success("User status created");
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
      await deleteUserStatusMaster(deleteTarget.id);
      toast.success("User status deleted");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed", { description: "Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPrimary = () => {
    const rows = primaryUserStatuses.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      isActive: item.isActive ? "Active" : "Inactive",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UserStatuses");
    XLSX.writeFile(workbook, "user_statuses.xlsx");
  };

  const handleDownloadReasons = () => {
    const rows = subUserStatuses.map((item) => {
      const parent = getParent(item);
      return {
        id: item.id,
        name: item.name,
        base: parent?.name ?? "—",
        code: item.code,
        description: item.description,
        isActive: item.isActive ? "Active" : "Inactive",
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reasons");
    XLSX.writeFile(workbook, "user_status_reasons.xlsx");
  };

  const handleAddClick = () => {
    setSelected(null);
    setIsDialogOpen(true);
  };

  const renderTableRow = (item: UserStatusMasterDto, idx: number) => {
    const parent = getParent(item);
    const parentColor = parent?.color ?? "#64748b";
    const parentBg = parent?.bgColor ?? "#f1f5f9";
    const codeColor = item.color ?? parent?.color ?? "#64748b";
    const codeBg = item.bgColor ?? parent?.bgColor ?? "#f1f5f9";

    return (
      <TableRow key={item.id ?? idx}>
        <TableCell style={{ width: 80 }}>{idx + 1}.</TableCell>
        <TableCell style={{ width: 280 }}>
          <div className="flex flex-col gap-1.5">
            <span className="font-medium">{item.name}</span>
            {parent && (
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
            )}
          </div>
        </TableCell>
        <TableCell style={{ width: 180 }}>
          {item.code ? (
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
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell style={{ width: 260 }}>{item.description ?? "—"}</TableCell>
        <TableCell style={{ width: 120 }}>
          {item.isActive ? (
            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
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
                  <DialogTitle>Delete {isPrimaryTab ? "user status" : "reason"}?</DialogTitle>
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
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-4 min-h-[calc(100vh-140px)]">
      <Card className="border-none">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <CardHeader className="flex flex-col gap-4 border rounded-md p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 shrink-0 text-black" />
                  <TabsList className="inline-flex h-9 w-auto p-0.5">
                    <TabsTrigger value="user-statuses" className="px-2.5 py-1 text-base">
                      User Statuses
                    </TabsTrigger>
                    <TabsTrigger value="reasons" className="px-2.5 py-1 text-base">
                      Reasons
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Manage base statuses (Active, Inactive, etc.) and their sub-reasons for session
                  and access mapping.
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
                        {selected
                          ? `Edit ${isPrimaryTab ? "User Status" : "Reason"}`
                          : `Add New ${isPrimaryTab ? "User Status" : "Reason"}`}
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <UserStatusForm
                      initialData={selected}
                      primaryUserStatuses={primaryUserStatuses}
                      isPrimary={selected ? !selected.parentUserStatusMaster : isPrimaryTab}
                      onSubmit={onSave}
                      onCancel={() => setIsDialogOpen(false)}
                      isSubmitting={isSubmitting}
                    />
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
              {activeTab === "reasons" && (
                <Select
                  value={parentFilterId === "__all__" ? "__all__" : String(parentFilterId)}
                  onValueChange={(v) => setParentFilterId(v === "__all__" ? "__all__" : Number(v))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by base status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All base statuses</SelectItem>
                    {primaryUserStatuses.map((p) => (
                      <SelectItem key={p.id} value={String(p.id!)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2 flex-shrink-0"
                onClick={isPrimaryTab ? handleDownloadPrimary : handleDownloadReasons}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>

            <TabsContent value="user-statuses" className="mt-0">
              <div className="relative" style={{ height: "600px" }}>
                <div className="overflow-y-auto overflow-x-auto h-full">
                  <table
                    className="w-full caption-bottom text-sm border rounded-md min-w-[900px]"
                    style={{ tableLayout: "fixed" }}
                  >
                    <TableHeader>
                      <TableRow className="sticky top-0 z-30 bg-[#f3f4f6] [&>th]:border-b hover:bg-[#f3f4f6]">
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 80 }}
                        >
                          ID
                        </TableHead>
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 280 }}
                        >
                          User Status
                        </TableHead>
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 180 }}
                        >
                          Code
                        </TableHead>
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 260 }}
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
                          style={{ width: 120 }}
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
                      ) : filteredPrimary.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No user statuses found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPrimary.map((item, idx) => (
                          <TableRow key={item.id ?? idx}>
                            <TableCell style={{ width: 80 }}>{idx + 1}.</TableCell>
                            <TableCell style={{ width: 280 }}>
                              <span className="font-medium">{item.name}</span>
                            </TableCell>
                            <TableCell style={{ width: 180 }}>
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
                                      <DialogTitle>Delete user status?</DialogTitle>
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
            </TabsContent>

            <TabsContent value="reasons" className="mt-0">
              <div className="relative" style={{ height: "600px" }}>
                <div className="overflow-y-auto overflow-x-auto h-full">
                  <table
                    className="w-full caption-bottom text-sm border rounded-md min-w-[900px]"
                    style={{ tableLayout: "fixed" }}
                  >
                    <TableHeader>
                      <TableRow className="sticky top-0 z-30 bg-[#f3f4f6] [&>th]:border-b hover:bg-[#f3f4f6]">
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 80 }}
                        >
                          ID
                        </TableHead>
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 280 }}
                        >
                          User Status
                        </TableHead>
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 180 }}
                        >
                          Code
                        </TableHead>
                        <TableHead
                          className="sticky top-0 z-30 bg-[#f3f4f6] text-[#374151]"
                          style={{ width: 260 }}
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
                          style={{ width: 120 }}
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
                      ) : filteredReasons.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No reasons found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReasons.map((item, idx) => renderTableRow(item, idx))
                      )}
                    </TableBody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
