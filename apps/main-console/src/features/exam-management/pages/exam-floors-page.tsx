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
import { getAllFloors, createFloor, updateFloor, deleteFloor, type FloorT } from "@/services/floor.service";

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
    return [f.id?.toString() || "", f.name || "", f.shortName || ""].some((v) => v.toLowerCase().includes(query));
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
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <DoorOpen className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Floors
            </CardTitle>
            <div className="text-muted-foreground">A list of all the Floors.</div>
          </div>
          <div className="flex items-center gap-2">
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
                  <AlertDialogTitle>{selectedFloor ? "Edit Floor" : "Add New Floor"}</AlertDialogTitle>
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
        <CardContent className="px-0">
          <div className="bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <div className="overflow-x-auto flex-1" style={{ minHeight: "420px" }}>
            <div className="rounded-md border border-slate-300 h-full max-h-[480px] overflow-y-auto min-w-full">
              <div className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
                <div className="flex text-xs font-semibold uppercase text-slate-600 border-b border-slate-300 min-w-full">
                  <div className="flex-shrink-0 basis-[10%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    #
                  </div>
                  <div className="flex-shrink-0 basis-[32%] px-3 py-2 border-r border-slate-300 flex items-center">
                    Name
                  </div>
                  <div className="flex-shrink-0 basis-[20%] px-3 py-2 border-r border-slate-300 flex items-center">
                    Short Name
                  </div>
                  <div className="flex-shrink-0 basis-[16%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Sequence
                  </div>
                  <div className="flex-shrink-0 basis-[12%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Status
                  </div>
                  <div className="flex-shrink-0 basis-[10%] px-3 py-2 flex items-center justify-center">Actions</div>
                </div>
              </div>

              <div className="bg-white min-w-full">
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground border-b border-slate-200 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading floors...
                  </div>
                ) : filteredFloors.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground border-b border-slate-200">
                    No floors match your search.
                  </div>
                ) : (
                  filteredFloors.map((floor, index) => (
                    <div
                      key={floor.id ?? `${floor.name}-${index}`}
                      className="flex border-b border-slate-200 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-shrink-0 basis-[10%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-shrink-0 basis-[32%] px-3 py-3 border-r border-slate-200 flex flex-col">
                        <span className="font-medium text-slate-800 truncate" title={floor.name ?? undefined}>
                          {floor.name}
                        </span>
                        <span className="text-xs text-muted-foreground">ID: {floor.id ?? "—"}</span>
                      </div>
                      <div className="flex-shrink-0 basis-[20%] px-3 py-3 border-r border-slate-200 flex items-center">
                        {floor.shortName ?? <span className="text-slate-400">—</span>}
                      </div>
                      <div className="flex-shrink-0 basis-[16%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                        {floor.sequence ?? <span className="text-slate-400">—</span>}
                      </div>
                      <div className="flex-shrink-0 basis-[12%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            floor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {floor.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex-shrink-0 basis-[10%] px-3 py-3 flex items-center justify-center gap-2">
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

type FloorFormProps = {
  initialData?: FloorT;
  onSubmit: (data: FloorFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function FloorForm({ initialData, onSubmit, onCancel, isSubmitting = false }: FloorFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [shortName, setShortName] = React.useState(initialData?.shortName ?? "");
  const [sequence, setSequence] = React.useState<number | undefined>(initialData?.sequence ?? undefined);
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
