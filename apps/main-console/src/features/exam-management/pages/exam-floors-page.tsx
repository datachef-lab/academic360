import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Upload, PlusCircle, DoorOpen, Edit, Trash2, Loader2 } from "lucide-react";
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  getAllFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  type FloorT,
} from "@/services/floor.service";

type FloorFormValues = {
  name: string;
  shortName?: string;
  sequence?: number;
  isActive: boolean;
};

export default function ExamFloorsPage() {
  const [floors, setFloors] = React.useState<FloorT[]>([]);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedFloor, setSelectedFloor] = React.useState<FloorT | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // Fetch floors on component mount
  React.useEffect(() => {
    const fetchFloors = async () => {
      try {
        setLoading(true);
        const response = await getAllFloors();
        if (response.httpStatus === "SUCCESS" && response.payload) {
          setFloors(response.payload);
        } else {
          toast.error("Failed to load floors", {
            description: response.message || "An error occurred",
          });
        }
      } catch (error) {
        console.error("Error fetching floors:", error);
        toast.error("Failed to load floors", {
          description: error instanceof Error ? error.message : "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFloors();
  }, []);

  const filteredFloors = floors.filter((f) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    return [f.id?.toString() || "", f.name || "", f.shortName || ""].some((v) =>
      v.toLowerCase().includes(query),
    );
  });

  const handleAddNew = () => {
    setSelectedFloor(null);
  };

  const handleEdit = (floor: FloorT) => {
    setSelectedFloor(floor);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this floor?")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await deleteFloor(id);
      if (response.httpStatus === "DELETED" || response.httpStatus === "SUCCESS") {
        toast.success("Floor deleted successfully");
        setFloors((prev) => prev.filter((f) => f.id !== id));
      } else {
        toast.error("Failed to delete floor", {
          description: response.message || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting floor:", error);
      toast.error("Failed to delete floor", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (form: FloorFormValues) => {
    try {
      setIsSubmitting(true);

      if (selectedFloor) {
        // Update existing floor
        const response = await updateFloor(selectedFloor.id!, {
          name: form.name,
          shortName: form.shortName,
          sequence: form.sequence,
          isActive: form.isActive,
        });

        if (response.httpStatus === "UPDATED" || response.httpStatus === "SUCCESS") {
          toast.success("Floor updated successfully");
          // Refresh floors list
          const refreshResponse = await getAllFloors();
          if (refreshResponse.httpStatus === "SUCCESS" && refreshResponse.payload) {
            setFloors(refreshResponse.payload);
          }
          setIsFormOpen(false);
        } else {
          toast.error("Failed to update floor", {
            description: response.message || "An error occurred",
          });
        }
      } else {
        // Create new floor
        const response = await createFloor({
          name: form.name,
          shortName: form.shortName,
          sequence: form.sequence,
          isActive: form.isActive,
        });

        if (response.httpStatus === "SUCCESS") {
          toast.success("Floor created successfully");
          // Refresh floors list
          const refreshResponse = await getAllFloors();
          if (refreshResponse.httpStatus === "SUCCESS" && refreshResponse.payload) {
            setFloors(refreshResponse.payload);
          }
          setIsFormOpen(false);
        } else {
          toast.error("Failed to create floor", {
            description: response.message || "An error occurred",
          });
        }
      }
    } catch (error) {
      console.error("Error saving floor:", error);
      toast.error(selectedFloor ? "Failed to update floor" : "Failed to create floor", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 w-full max-w-full p-2 sm:p-4">
      <Card className="flex min-w-0 flex-col overflow-hidden border-none">
        <CardHeader className="mb-0 flex-shrink-0 flex-col items-start justify-between gap-3 rounded-md border bg-background p-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <CardTitle className="flex items-center">
              <DoorOpen className="mr-2 h-8 w-8 flex-shrink-0 rounded-md border border-slate-400 p-1" />
              Floors
            </CardTitle>
            <div className="text-muted-foreground">A list of all the Floors.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedFloor ? "Edit Floor" : "Add New Floor"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <FloorForm
                  initialData={selectedFloor ?? undefined}
                  onSubmit={(data) => handleSubmit(data)}
                  onCancel={() => setIsFormOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col px-0 pb-0">
          <div className="relative z-20 mb-0 flex-shrink-0 border-b bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Input
                placeholder="Search..."
                className="w-full max-w-xs"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="relative z-10 min-w-0 flex-shrink-0 overflow-hidden border-x border-t border-slate-300 bg-slate-100 [scrollbar-gutter:stable]">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[8%]" />
                  <col className="w-[32%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-300 text-xs font-semibold uppercase text-slate-600">
                    <th className="border-r border-slate-300 bg-slate-100 px-3 py-2 text-center">
                      #
                    </th>
                    <th className="border-r border-slate-300 bg-slate-100 px-3 py-2 text-left">
                      Name
                    </th>
                    <th className="border-r border-slate-300 bg-slate-100 px-3 py-2 text-left">
                      Short Name
                    </th>
                    <th className="border-r border-slate-300 bg-slate-100 px-3 py-2 text-center">
                      Sequence
                    </th>
                    <th className="border-r border-slate-300 bg-slate-100 px-3 py-2 text-center">
                      Status
                    </th>
                    <th className="bg-slate-100 px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="max-h-[480px] min-h-[320px] min-w-0 flex-1 overflow-auto rounded-b-md border-x border-b border-slate-300 [scrollbar-gutter:stable]">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[8%]" />
                  <col className="w-[32%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <tbody className="bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-b border-slate-200 px-3 py-12 text-center text-muted-foreground"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading floors...
                        </div>
                      </td>
                    </tr>
                  ) : filteredFloors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-b border-slate-200 px-3 py-12 text-center text-muted-foreground"
                      >
                        No floors match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredFloors.map((floor, index) => (
                      <tr
                        key={floor.id ?? `${floor.name}-${index}`}
                        className="border-b border-slate-200 hover:bg-muted/40 transition-colors"
                      >
                        <td className="border-r border-slate-200 px-3 py-3 text-center align-top">
                          {index + 1}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-3 align-top">
                          <span
                            className="block font-medium text-slate-800 whitespace-normal break-words"
                            title={floor.name ?? undefined}
                          >
                            {floor.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ID: {floor.id ?? "—"}
                          </span>
                        </td>
                        <td className="border-r border-slate-200 px-3 py-3 align-top whitespace-normal break-words">
                          {floor.shortName ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-3 text-center align-top">
                          {floor.sequence ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-3 text-center align-top">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              floor.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {floor.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center align-top">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="border border-blue-200 text-blue-700 hover:bg-blue-50 shadow-none"
                              onClick={() => handleEdit(floor)}
                              disabled={deletingId === floor.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="shadow-none"
                              onClick={() => handleDelete(floor.id!)}
                              disabled={deletingId === floor.id}
                            >
                              {deletingId === floor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type FloorFormProps = {
  initialData?: FloorT;
  onSubmit: (data: FloorFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function FloorForm({ initialData, onSubmit, onCancel, isSubmitting = false }: FloorFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [shortName, setShortName] = React.useState(initialData?.shortName ?? "");
  const [sequence, setSequence] = React.useState<number | undefined>(
    initialData?.sequence ?? undefined,
  );
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? true);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setShortName(initialData.shortName ?? "");
      setSequence(initialData.sequence ?? undefined);
      setIsActive(initialData.isActive ?? true);
    } else {
      setName("");
      setShortName("");
      setSequence(undefined);
      setIsActive(true);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Floor name is required");
      return;
    }
    onSubmit({
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      sequence,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor-name">Floor Name *</Label>
          <Input
            id="floor-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter floor name"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor-short-name">Short Name</Label>
          <Input
            id="floor-short-name"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="Enter short name (optional)"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor-sequence">Sequence</Label>
          <Input
            id="floor-sequence"
            type="number"
            value={sequence ?? ""}
            onChange={(e) => setSequence(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Enter sequence (optional)"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Switch id="floor-active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="floor-active">Active</Label>
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
