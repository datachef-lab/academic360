import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Upload, PlusCircle, ClipboardList, Edit, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getAllExamTypes,
  createExamType,
  updateExamType,
  deleteExamType,
  type ExamTypeT,
} from "@/services/exam-type.service";

type ExamTypeFormValues = {
  name: string;
  shortName?: string;
  legacyExamTypeId?: number;
  isActive: boolean;
};

type ExamTypeFormProps = {
  initialData?: ExamTypeT;
  onSubmit: (data: ExamTypeFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function ExamTypeForm({ initialData, onSubmit, onCancel, isSubmitting = false }: ExamTypeFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [shortName, setShortName] = useState(initialData?.shortName ?? "");
  const [legacyExamTypeId, setLegacyExamTypeId] = useState<number | undefined>(
    initialData?.legacyExamTypeId ?? undefined,
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setShortName(initialData.shortName ?? "");
      setLegacyExamTypeId(initialData.legacyExamTypeId ?? undefined);
      setIsActive(initialData.isActive ?? true);
    } else {
      setName("");
      setShortName("");
      setLegacyExamTypeId(undefined);
      setIsActive(true);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Exam type name is required");
      return;
    }

    onSubmit({
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      legacyExamTypeId,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-name">Exam Type Name *</Label>
          <Input
            id="exam-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter exam type name"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-short-name">Short Name</Label>
          <Input
            id="exam-short-name"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="Enter optional short name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="legacy-id">Legacy Exam Type ID</Label>
          <Input
            id="legacy-id"
            type="number"
            value={legacyExamTypeId ?? ""}
            onChange={(e) => setLegacyExamTypeId(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Enter legacy id (optional)"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="is-active">Active</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-none"
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function TestTypePage() {
  const [examTypes, setExamTypes] = useState<ExamTypeT[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState<ExamTypeT | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadExamTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllExamTypes();
      if (response.httpStatus === "SUCCESS" && response.payload) {
        setExamTypes(response.payload);
      } else {
        toast.error("Failed to load exam types", {
          description: response.message || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error fetching exam types:", error);
      toast.error("Failed to load exam types", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExamTypes();
  }, [loadExamTypes]);

  const filteredExamTypes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return examTypes;
    return examTypes.filter((examType) => {
      const candidates = [
        examType.id?.toString() ?? "",
        examType.name ?? "",
        examType.shortName ?? "",
        examType.legacyExamTypeId?.toString() ?? "",
      ];
      return candidates.some((value) => value.toLowerCase().includes(query));
    });
  }, [examTypes, searchText]);

  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return "—";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this exam type?")) return;

    try {
      setDeletingId(id);
      const response = await deleteExamType(id);
      if (response.httpStatus === "DELETED" || response.httpStatus === "SUCCESS") {
        toast.success("Exam type deleted successfully");
        setExamTypes((prev) => prev.filter((examType) => examType.id !== id));
      } else {
        toast.error("Failed to delete exam type", {
          description: response.message || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting exam type:", error);
      toast.error("Failed to delete exam type", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (form: ExamTypeFormValues) => {
    try {
      setIsSubmitting(true);
      const payload: Partial<ExamTypeT> = {
        name: form.name,
        shortName: form.shortName,
        legacyExamTypeId: form.legacyExamTypeId,
        isActive: form.isActive,
      };

      if (selectedExamType) {
        const response = await updateExamType(selectedExamType.id!, payload);
        if (response.httpStatus === "UPDATED" || response.httpStatus === "SUCCESS") {
          toast.success("Exam type updated successfully");
          await loadExamTypes();
          setIsFormOpen(false);
          setSelectedExamType(null);
        } else {
          toast.error("Failed to update exam type", {
            description: response.message || "An error occurred",
          });
        }
      } else {
        const response = await createExamType(payload);
        if (response.httpStatus === "SUCCESS") {
          toast.success("Exam type created successfully");
          await loadExamTypes();
          setIsFormOpen(false);
        } else {
          toast.error("Failed to create exam type", {
            description: response.message || "An error occurred",
          });
        }
      }
    } catch (error) {
      console.error("Error saving exam type:", error);
      toast.error(selectedExamType ? "Failed to update exam type" : "Failed to create exam type", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <ClipboardList className="mr-1 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Exam Types
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Maintain the catalogue of exam types and keep them in sync with the legacy system.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="shadow-none border-slate-200">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button variant="outline" className="shadow-none border-slate-200">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-none"
                  onClick={() => {
                    setSelectedExamType(null);
                    setIsFormOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Exam Type
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedExamType ? "Edit Exam Type" : "Add Exam Type"}</AlertDialogTitle>
                </AlertDialogHeader>
                <ExamTypeForm
                  initialData={selectedExamType ?? undefined}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setSelectedExamType(null);
                  }}
                  isSubmitting={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="bg-background p-4 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Search by name, short name, or legacy id..."
              className="w-full md:w-80"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2 border-slate-200 shadow-none">
              <Download className="h-4 w-4" />
              Export List
            </Button>
          </div>

          <div className="overflow-x-auto flex-1" style={{ minHeight: "480px" }}>
            <div className="rounded-md border border-slate-300 h-full max-h-[520px] overflow-y-auto min-w-full">
              <div className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                <div className="flex text-xs font-semibold uppercase text-slate-600 border-b border-slate-300 min-w-full">
                  <div className="flex-shrink-0 basis-[6%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    #
                  </div>
                  <div className="flex-shrink-0 basis-[26%] px-3 py-2 border-r border-slate-300 flex items-center">
                    Name
                  </div>
                  <div className="flex-shrink-0 basis-[16%] px-3 py-2 border-r border-slate-300 flex items-center">
                    Short Name
                  </div>
                  <div className="flex-shrink-0 basis-[14%] px-3 py-2 border-r border-slate-300 flex items-center">
                    Legacy ID
                  </div>
                  <div className="flex-shrink-0 basis-[16%] px-3 py-2 border-r border-slate-300 flex items-center">
                    Updated On
                  </div>
                  <div className="flex-shrink-0 basis-[10%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Status
                  </div>
                  <div className="flex-shrink-0 basis-[12%] px-3 py-2 flex items-center justify-center">Actions</div>
                </div>
              </div>

              <div className="bg-white min-w-full">
                {loading ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading exam types...
                  </div>
                ) : filteredExamTypes.length === 0 ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200">
                    No exam types match your search.
                  </div>
                ) : (
                  filteredExamTypes.map((examType, index) => (
                    <div
                      key={examType.id ?? `${examType.name}-${index}`}
                      className="flex border-b border-slate-200 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-shrink-0 basis-[6%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-shrink-0 basis-[26%] px-3 py-3 border-r border-slate-200 flex flex-col">
                        <span className="font-medium text-slate-800 truncate" title={examType.name ?? undefined}>
                          {examType.name}
                        </span>
                        <span className="text-xs text-muted-foreground">ID: {examType.id ?? "—"}</span>
                      </div>
                      <div className="flex-shrink-0 basis-[16%] px-3 py-3 border-r border-slate-200 flex items-center">
                        {examType.shortName ?? <span className="text-slate-400">—</span>}
                      </div>
                      <div className="flex-shrink-0 basis-[14%] px-3 py-3 border-r border-slate-200 flex items-center">
                        {examType.legacyExamTypeId ?? <span className="text-slate-400">—</span>}
                      </div>
                      <div className="flex-shrink-0 basis-[16%] px-3 py-3 border-r border-slate-200 flex items-center">
                        {formatDate(examType.updatedAt ?? examType.createdAt)}
                      </div>
                      <div className="flex-shrink-0 basis-[10%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            examType.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {examType.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex-shrink-0 basis-[12%] px-3 py-3 flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="border border-blue-200 text-blue-700 hover:bg-blue-50 shadow-none"
                          onClick={() => {
                            setSelectedExamType(examType);
                            setIsFormOpen(true);
                          }}
                          disabled={deletingId === examType.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="shadow-none"
                          onClick={() => handleDelete(examType.id!)}
                          disabled={deletingId === examType.id}
                        >
                          {deletingId === examType.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
