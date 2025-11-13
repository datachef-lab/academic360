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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getAllRooms, createRoom, updateRoom, deleteRoom, type RoomT } from "@/services/room.service";
import { getAllFloors, type FloorT } from "@/services/floor.service";

export default function ExamRoomsPage() {
  const [rooms, setRooms] = React.useState<RoomT[]>([]);
  const [floors, setFloors] = React.useState<FloorT[]>([]);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<RoomT | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // Fetch rooms and floors on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsResponse, floorsResponse] = await Promise.all([getAllRooms(), getAllFloors()]);

        if (roomsResponse.httpStatus === "SUCCESS" && roomsResponse.payload) {
          setRooms(roomsResponse.payload);
        } else {
          toast.error("Failed to load rooms", {
            description: roomsResponse.message || "An error occurred",
          });
        }

        if (floorsResponse.httpStatus === "SUCCESS" && floorsResponse.payload) {
          setFloors(floorsResponse.payload);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data", {
          description: error instanceof Error ? error.message : "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRooms = rooms.filter((r) =>
    [r.id?.toString() || "", r.name || "", r.shortName || ""].some((v) =>
      v.toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  const handleAddNew = () => {
    setSelectedRoom(null);
  };

  const handleEdit = (room: RoomT) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this room?")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await deleteRoom(id);
      if (response.httpStatus === "DELETED" || response.httpStatus === "SUCCESS") {
        toast.success("Room deleted successfully");
        setRooms((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error("Failed to delete room", {
          description: response.message || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (form: {
    name: string;
    shortName?: string;
    strength: number;
    examCapacity: number;
    benches: number;
    floorId?: number;
    sequence?: number;
    isActive: boolean;
  }) => {
    try {
      setIsSubmitting(true);

      if (selectedRoom) {
        // Update existing room
        const response = await updateRoom(selectedRoom.id!, {
          name: form.name,
          shortName: form.shortName,
          strength: form.strength,
          examCapacity: form.examCapacity,
          benches: form.benches,
          floorId: form.floorId,
          sequence: form.sequence,
          isActive: form.isActive,
        });

        if (response.httpStatus === "UPDATED" || response.httpStatus === "SUCCESS") {
          toast.success("Room updated successfully");
          // Refresh rooms list
          const refreshResponse = await getAllRooms();
          if (refreshResponse.httpStatus === "SUCCESS" && refreshResponse.payload) {
            setRooms(refreshResponse.payload);
          }
          setIsFormOpen(false);
        } else {
          toast.error("Failed to update room", {
            description: response.message || "An error occurred",
          });
        }
      } else {
        // Create new room
        const response = await createRoom({
          name: form.name,
          shortName: form.shortName,
          strength: form.strength,
          examCapacity: form.examCapacity,
          benches: form.benches,
          floorId: form.floorId,
          sequence: form.sequence,
          isActive: form.isActive,
        });

        if (response.httpStatus === "SUCCESS") {
          toast.success("Room created successfully");
          // Refresh rooms list
          const refreshResponse = await getAllRooms();
          if (refreshResponse.httpStatus === "SUCCESS" && refreshResponse.payload) {
            setRooms(refreshResponse.payload);
          }
          setIsFormOpen(false);
        } else {
          toast.error("Failed to create room", {
            description: response.message || "An error occurred",
          });
        }
      }
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error(selectedRoom ? "Failed to update room" : "Failed to create room", {
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
              Rooms
            </CardTitle>
            <div className="text-muted-foreground">A list of all the Rooms.</div>
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
                  <AlertDialogTitle>{selectedRoom ? "Edit Room" : "Add New Room"}</AlertDialogTitle>
                </AlertDialogHeader>
                <RoomForm
                  initialData={selectedRoom ?? undefined}
                  onSubmit={(data) => handleSubmit(data)}
                  onCancel={() => setIsFormOpen(false)}
                  isSubmitting={isSubmitting}
                  floors={floors}
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
                    <TableHead style={{ width: 180 }}>Room Name</TableHead>
                    <TableHead style={{ width: 160 }}>Short Name</TableHead>
                    <TableHead style={{ width: 140 }}>Strength</TableHead>
                    <TableHead style={{ width: 160 }}>Exam Capacity</TableHead>
                    <TableHead style={{ width: 160 }}>No. of Benches</TableHead>
                    <TableHead style={{ width: 160 }}>Active</TableHead>
                    <TableHead style={{ width: 120 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading rooms...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRooms.map((room) => (
                      <TableRow key={room.id} className="group">
                        <TableCell style={{ width: 60 }}>{room.id}</TableCell>
                        <TableCell style={{ width: 180 }}>{room.name}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.shortName || "-"}</TableCell>
                        <TableCell style={{ width: 140 }}>{room.strength}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.examCapacity}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.benches}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.isActive ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(room)}
                              className="h-5 w-5 p-0"
                              disabled={deletingId === room.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(room.id!)}
                              className="h-5 w-5 p-0"
                              disabled={deletingId === room.id}
                            >
                              {deletingId === room.id ? (
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

type RoomFormProps = {
  initialData?: RoomT;
  onSubmit: (data: {
    name: string;
    shortName?: string;
    strength: number;
    examCapacity: number;
    benches: number;
    floorId?: number;
    sequence?: number;
    isActive: boolean;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  floors: FloorT[];
};

function RoomForm({ initialData, onSubmit, onCancel, isSubmitting = false, floors }: RoomFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [shortName, setShortName] = React.useState(initialData?.shortName ?? "");
  const [strength, setStrength] = React.useState<number>(initialData?.strength ?? 0);
  const [examCapacity, setExamCapacity] = React.useState<number>(initialData?.examCapacity ?? 0);
  const [benches, setBenches] = React.useState<number>(initialData?.benches ?? 0);
  const [floorId, setFloorId] = React.useState<number | undefined>(initialData?.floorId ?? undefined);
  const [sequence, setSequence] = React.useState<number | undefined>(initialData?.sequence ?? undefined);
  const [isActive, setIsActive] = React.useState<boolean>(initialData?.isActive ?? true);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setShortName(initialData.shortName ?? "");
      setStrength(initialData.strength ?? 0);
      setExamCapacity(initialData.examCapacity ?? 0);
      setBenches(initialData.benches ?? 0);
      setFloorId(initialData.floorId ?? undefined);
      setSequence(initialData.sequence ?? undefined);
      setIsActive(initialData.isActive ?? true);
    } else {
      setName("");
      setShortName("");
      setStrength(0);
      setExamCapacity(0);
      setBenches(0);
      setFloorId(undefined);
      setSequence(undefined);
      setIsActive(true);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Room name is required");
      return;
    }
    onSubmit({
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      strength,
      examCapacity,
      benches,
      floorId,
      sequence,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="room-name">Room Name *</Label>
          <Input
            id="room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter room name"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="short-name">Short Name</Label>
          <Input
            id="short-name"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="Enter short name (optional)"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="strength">Strength</Label>
          <Input
            id="strength"
            type="number"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            min="0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-capacity">Exam Capacity</Label>
          <Input
            id="exam-capacity"
            type="number"
            value={examCapacity}
            onChange={(e) => setExamCapacity(Number(e.target.value))}
            min="0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="benches">No. of Benches</Label>
          <Input
            id="benches"
            type="number"
            value={benches}
            onChange={(e) => setBenches(Number(e.target.value))}
            min="0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor">Floor</Label>
          <Select
            value={floorId?.toString() || "none"}
            onValueChange={(value) => setFloorId(value === "none" ? undefined : Number(value))}
          >
            <SelectTrigger id="floor">
              <SelectValue placeholder="Select floor (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {floors.map((floor) => (
                <SelectItem key={floor.id} value={floor.id ? floor.id.toString() : "none"}>
                  {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sequence">Sequence</Label>
          <Input
            id="sequence"
            type="number"
            value={sequence ?? ""}
            onChange={(e) => setSequence(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Enter sequence (optional)"
          />
        </div>
        <div className="flex items-center gap-2 mt-6">
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
