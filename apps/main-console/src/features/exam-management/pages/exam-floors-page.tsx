import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
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
import { toast } from "sonner";
import { getAllFloors, createFloor, updateFloor, deleteFloor, type FloorT } from "@/services/floor.service";

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

  const filteredFloors = floors.filter((f) =>
    [f.id?.toString() || "", f.name || ""].some((v) => v.toLowerCase().includes(searchText.toLowerCase())),
  );

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

  const handleSubmit = async (form: {
    id: number;
    name: string;
    shortName?: string;
    sequence?: number;
    isActive?: boolean;
  }) => {
    try {
      setIsSubmitting(true);

      if (selectedFloor) {
        // Update existing floor
        const response = await updateFloor(selectedFloor.id!, {
          name: form.name,
          shortName: form.shortName,
          sequence: form.sequence,
          isActive: form.isActive ?? true,
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
          isActive: form.isActive ?? true,
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
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60 }}>ID</TableHead>
                    <TableHead style={{ width: 180 }}>Floor Name</TableHead>
                    <TableHead style={{ width: 120 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading floors...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredFloors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFloors.map((floor) => (
                      <TableRow key={floor.id} className="group">
                        <TableCell style={{ width: 60 }}>{floor.id}</TableCell>
                        <TableCell style={{ width: 180 }}>{floor.name}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(floor)}
                              className="h-5 w-5 p-0"
                              disabled={deletingId === floor.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(floor.id!)}
                              className="h-5 w-5 p-0"
                              disabled={deletingId === floor.id}
                            >
                              {deletingId === floor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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
    </div>
  );
}

type FloorFormProps = {
  initialData?: FloorT;
  onSubmit: (data: { id: number; name: string; shortName?: string; sequence?: number; isActive?: boolean }) => void;
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
      id: initialData?.id ?? 0,
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      sequence: sequence,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-2 gap-4">
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor-active">Active</Label>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="floor-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="floor-active" className="cursor-pointer">
              {isActive ? "Active" : "Inactive"}
            </Label>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-purple-600 hover:bg-purple-700 text-white"
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
