import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Edit, PlusCircle } from "lucide-react";
import type { Designation } from "@repo/db";

import {
  createDesignation,
  getAllDesignations,
  updateDesignation,
  type DesignationPayload,
} from "../services/designation.service";
import { socketService, type Notification } from "@/services/socketService";

const ITEMS_PER_PAGE = 10;

const designationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((value) => value.trim()),
  description: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : "")),
  isActive: z.boolean().default(true),
});

type DesignationFormValues = z.infer<typeof designationSchema>;

interface DesignationFormProps {
  initialData: Designation | null;
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
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
    });
  }, [initialData, reset]);

  const handleFormSubmit = async (values: DesignationFormValues) => {
    const payload: DesignationPayload = {
      name: values.name,
      description: values.description && values.description !== "" ? values.description : null,
      isActive: values.isActive,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="designation-name">Designation Name</Label>
        <Input id="designation-name" placeholder="Enter name" {...register("name")} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="designation-description">Description</Label>
        <Input id="designation-description" placeholder="Optional description" {...register("description")} />
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Checkbox id="designation-active" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="designation-active">Active</Label>
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

export default function DesignationPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadDesignations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllDesignations();
      const payload = Array.isArray(response.payload) ? response.payload : [];
      setDesignations(payload);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch designations");
      setDesignations([]);
      toast({
        title: "Failed to fetch designations",
        description: "Unable to load designation data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDesignations();
  }, [loadDesignations]);

  useEffect(() => {
    const handleRealtimeUpdate = (notification: Notification) => {
      const entity = notification.meta?.entity ?? notification.meta?.resource;
      if (
        entity === "designation" ||
        entity === "designations" ||
        notification.message?.toLowerCase().includes("designation")
      ) {
        void loadDesignations();
      }
    };

    const unsubscribe = socketService.addNotificationListener(handleRealtimeUpdate);
    return () => {
      unsubscribe();
    };
  }, [loadDesignations]);

  const filteredDesignations = useMemo(() => {
    if (!searchTerm) return designations;
    const normalized = searchTerm.toLowerCase();
    return designations.filter((designation) => {
      return (
        designation.name?.toLowerCase().includes(normalized) ||
        designation.description?.toLowerCase().includes(normalized)
      );
    });
  }, [designations, searchTerm]);

  const totalItems = filteredDesignations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedDesignations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDesignations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDesignations, currentPage]);

  const handleCreateOrUpdate = async (payload: DesignationPayload) => {
    setIsSubmitting(true);
    try {
      if (selectedDesignation) {
        await updateDesignation(selectedDesignation.id!, payload);
        toast({
          title: "Designation updated",
          description: "The designation details have been updated successfully.",
        });
      } else {
        await createDesignation(payload);
        toast({
          title: "Designation created",
          description: "A new designation has been added successfully.",
        });
      }
      setIsDialogOpen(false);
      setSelectedDesignation(null);
      await loadDesignations();
    } catch (err) {
      console.error(err);
      toast({
        title: "Save failed",
        description: "We couldn't save the designation. Please try again.",
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
              <ClipboardList className="h-8 w-8 border rounded-md p-1 border-slate-400" />
              Designation Management
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Manage staff designations, descriptions, and activation status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setSelectedDesignation(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-none"
                  onClick={() => {
                    setSelectedDesignation(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Designation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{selectedDesignation ? "Edit Designation" : "Add Designation"}</DialogTitle>
                </DialogHeader>
                <DesignationForm
                  initialData={selectedDesignation}
                  onSubmit={handleCreateOrUpdate}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setSelectedDesignation(null);
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
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {totalItems} of {designations.length} designations
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <div className="rounded-md border border-slate-300 h-full max-h-[480px] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-muted/70 backdrop-blur" style={{ minWidth: "720px" }}>
                <div className="flex text-xs font-semibold uppercase text-slate-600 border-b border-slate-300">
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center justify-center"
                    style={{ width: "8%" }}
                  >
                    #
                  </div>
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center"
                    style={{ width: "28%" }}
                  >
                    Name
                  </div>
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center"
                    style={{ width: "40%" }}
                  >
                    Description
                  </div>
                  <div
                    className="flex-shrink-0 px-3 py-2 border-r border-slate-300 flex items-center justify-center"
                    style={{ width: "14%" }}
                  >
                    Status
                  </div>
                  <div className="flex-shrink-0 px-3 py-2 flex items-center justify-center" style={{ width: "10%" }}>
                    Actions
                  </div>
                </div>
              </div>

              <div className="bg-white" style={{ minWidth: "720px" }}>
                {loading ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200">
                    Loading designations...
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-52 text-red-600 border-b border-slate-200">
                    {error}
                  </div>
                ) : totalItems === 0 ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200">
                    No designations found. Try adjusting your search.
                  </div>
                ) : (
                  paginatedDesignations.map((designation, index) => {
                    const displayIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <div
                        key={designation.id ?? displayIndex}
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
                          style={{ width: "28%" }}
                        >
                          <span className="font-medium text-slate-800 truncate">{designation.name}</span>
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 border-r border-slate-200 flex items-center"
                          style={{ width: "40%" }}
                        >
                          <span className="text-slate-600 truncate" title={designation.description || undefined}>
                            {designation.description ?? <span className="text-slate-400">No description</span>}
                          </span>
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 border-r border-slate-200 flex items-center justify-center"
                          style={{ width: "14%" }}
                        >
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              designation.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {designation.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div
                          className="flex-shrink-0 px-3 py-3 flex items-center justify-center"
                          style={{ width: "10%" }}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className="border border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedDesignation(designation);
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
