import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Edit, PlusCircle } from "lucide-react";
import type { Department } from "@repo/db";

import {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  type DepartmentPayload,
} from "../services/department.service";
import { socketService, type Notification } from "@/services/socketService";

const ITEMS_PER_PAGE = 10;

const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((value) => value.trim()),
  code: z
    .string()
    .min(1, "Code is required")
    .transform((value) => value.trim()),
  description: z
    .string()
    .min(1, "Description is required")
    .transform((value) => value.trim()),
  isActive: z.boolean().default(true),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  initialData: Department | null;
  onSubmit: (payload: DepartmentPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function DepartmentForm({ initialData, onSubmit, onCancel, isSubmitting }: DepartmentFormProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
    });
  }, [initialData, reset]);

  const handleFormSubmit = async (values: DepartmentFormValues) => {
    const payload: DepartmentPayload = {
      name: values.name,
      code: values.code,
      description: values.description,
      isActive: values.isActive,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Department Name</Label>
        <Input id="name" placeholder="Enter name" {...register("name")} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" placeholder="Enter code" {...register("code")} />
        {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="Enter description" {...register("description")} />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllDepartments();
      const payload = Array.isArray(response.payload) ? response.payload : [];
      setDepartments(payload);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch departments");
      setDepartments([]);
      toast({
        title: "Failed to fetch departments",
        description: "Unable to load department data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    const handleRealtimeUpdate = (notification: Notification) => {
      const entity = notification.meta?.entity ?? notification.meta?.resource;
      if (
        entity === "department" ||
        entity === "departments" ||
        notification.message?.toLowerCase().includes("department")
      ) {
        void loadDepartments();
      }
    };

    const unsubscribe = socketService.addNotificationListener(handleRealtimeUpdate);
    return () => {
      unsubscribe();
    };
  }, [loadDepartments]);

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    const normalizedSearch = searchTerm.toLowerCase();
    return departments.filter((dept) => {
      return (
        dept.name?.toLowerCase().includes(normalizedSearch) ||
        dept.code?.toLowerCase().includes(normalizedSearch) ||
        dept.description?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [departments, searchTerm]);

  const totalItems = filteredDepartments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDepartments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDepartments, currentPage]);

  const handleCreateOrUpdate = async (payload: DepartmentPayload) => {
    setIsSubmitting(true);
    try {
      if (selectedDepartment) {
        await updateDepartment(selectedDepartment.id!, payload);
        toast({
          title: "Department updated",
          description: "The department details have been updated successfully.",
        });
      } else {
        await createDepartment(payload);
        toast({
          title: "Department created",
          description: "A new department has been added successfully.",
        });
      }
      setIsDialogOpen(false);
      setSelectedDepartment(null);
      await loadDepartments();
    } catch (err) {
      console.error(err);
      toast({
        title: "Save failed",
        description: "We couldn't save the department. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 flex flex-col min-h-[calc(100vh-140px)] gap-4">
      <Card className="border-none flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between border rounded-md p-4 sticky top-0 z-20 bg-background">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Building2 className="h-8 w-8 border rounded-md p-1 border-slate-400" />
              Department Management
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Manage academic departments, update details, and maintain status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setSelectedDepartment(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-none"
                  onClick={() => {
                    setSelectedDepartment(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{selectedDepartment ? "Edit Department" : "Add Department"}</DialogTitle>
                </DialogHeader>
                <DepartmentForm
                  initialData={selectedDepartment}
                  onSubmit={handleCreateOrUpdate}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setSelectedDepartment(null);
                  }}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="w-full md:w-72">
              <Input
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {totalItems} of {departments.length} departments
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <div className="rounded-md border border-slate-300 h-full max-h-[480px] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-muted/70 backdrop-blur" style={{ minWidth: "780px" }}>
                <div className="flex text-xs font-semibold uppercase text-slate-600 border-b border-slate-300">
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center justify-center"
                    style={{ width: "8%" }}
                  >
                    #
                  </div>
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center"
                    style={{ width: "22%" }}
                  >
                    Name
                  </div>
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center"
                    style={{ width: "15%" }}
                  >
                    Code
                  </div>
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center"
                    style={{ width: "35%" }}
                  >
                    Description
                  </div>
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center justify-center"
                    style={{ width: "12%" }}
                  >
                    Status
                  </div>
                  <div className="flex-shrink-0 px-3 py-2 flex items-center justify-center" style={{ width: "8%" }}>
                    Actions
                  </div>
                </div>
              </div>

              <div className="bg-white" style={{ minWidth: "780px" }}>
                {loading ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200">
                    Loading departments...
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-52 text-red-600 border-b border-slate-200">
                    {error}
                  </div>
                ) : totalItems === 0 ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200">
                    No departments found. Try adjusting your search.
                  </div>
                ) : (
                  paginatedDepartments.map((department, index) => {
                    const displayIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <div
                        key={department.id ?? displayIndex}
                        className="flex border-b border-slate-200 hover:bg-muted/40 transition-colors"
                      >
                        <div
                          className="flex-shrink-0 px-3 py-3 border-r border-slate-200 flex items-center justify-center"
                          style={{ width: "8%" }}
                        >
                          {displayIndex}
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 border-r border-slate-200 flex items-center"
                          style={{ width: "22%" }}
                        >
                          <span className="font-medium text-slate-800 truncate">{department.name}</span>
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 border-r border-slate-200 flex items-center"
                          style={{ width: "15%" }}
                        >
                          <span className="text-slate-700">{department.code}</span>
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 border-r border-slate-200 flex items-center"
                          style={{ width: "35%" }}
                        >
                          <span className="text-slate-600 truncate" title={department.description || undefined}>
                            {department.description}
                          </span>
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 border-r border-slate-200 flex items-center justify-center"
                          style={{ width: "12%" }}
                        >
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              department.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {department.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 flex items-center justify-center"
                          style={{ width: "8%" }}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className="border border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedDepartment(department);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && !error && (
        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            {totalItems === 0
              ? "Showing 0 results"
              : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  totalItems,
                )} of ${totalItems} results`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || totalItems === 0}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 p-0 ${
                      currentPage === pageNum
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border border-blue-200 text-blue-700 hover:bg-blue-50"
                    }`}
                    disabled={totalItems === 0}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalItems === 0}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
