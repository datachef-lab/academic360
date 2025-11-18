import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Upload, PlusCircle, DoorOpen, Edit, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { getAllRooms, createRoom, updateRoom, deleteRoom, type RoomT } from "@/services/room.service";
import { getAllFloors, type FloorT } from "@/services/floor.service";

type RoomFormValues = {
  name: string;
  shortName?: string;
  numberOfBenches: number;
  maxStudentsPerBench: number;
  floorId?: number;
  isActive: boolean;
};

type RoomFormProps = {
  initialData?: RoomT;
  onSubmit: (data: RoomFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  floors: FloorT[];
};

function RoomForm({ initialData, onSubmit, onCancel, isSubmitting = false, floors }: RoomFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [shortName, setShortName] = useState(initialData?.shortName ?? "");
  const [numberOfBenches, setNumberOfBenches] = useState<number>(initialData?.numberOfBenches ?? 0);
  const [maxStudentsPerBench, setMaxStudentsPerBench] = useState<number>(initialData?.maxStudentsPerBench ?? 0);
  const [floorId, setFloorId] = useState<number | undefined>(initialData?.floorId ?? undefined);
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setShortName(initialData.shortName ?? "");
      setNumberOfBenches(initialData.numberOfBenches ?? 0);
      setMaxStudentsPerBench(initialData.maxStudentsPerBench ?? 0);
      setFloorId(initialData.floorId ?? undefined);
      setIsActive(initialData.isActive ?? true);
    } else {
      setName("");
      setShortName("");
      setNumberOfBenches(0);
      setMaxStudentsPerBench(0);
      setFloorId(undefined);
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
      numberOfBenches,
      maxStudentsPerBench,
      floorId,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Label htmlFor="benches">No. of Benches</Label>
          <Input
            id="benches"
            type="number"
            value={Number.isNaN(numberOfBenches) ? "" : numberOfBenches}
            onChange={(e) => setNumberOfBenches(e.target.value ? Number(e.target.value) : 0)}
            min="0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="max-students">Max Students Per Bench</Label>
          <Input
            id="max-students"
            type="number"
            value={Number.isNaN(maxStudentsPerBench) ? "" : maxStudentsPerBench}
            onChange={(e) => setMaxStudentsPerBench(e.target.value ? Number(e.target.value) : 0)}
            min="0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor">Floor</Label>
          <Combobox
            dataArr={floors
              .filter((floor) => floor.id != null)
              .map((floor) => ({
                value: floor.id!.toString(),
                label: floor.name ?? "Unnamed Floor",
              }))}
            value={floorId?.toString() ?? ""}
            onChange={(value) => setFloorId(value === "" ? undefined : Number(value))}
            placeholder="Select floor"
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

export default function ExamRoomsPage() {
  const [rooms, setRooms] = useState<RoomT[]>([]);
  const [floors, setFloors] = useState<FloorT[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomT | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const floorLookup = useMemo(() => {
    const map = new Map<number, string>();
    floors.forEach((floor) => {
      if (floor.id != null) {
        map.set(floor.id, floor.name ?? "-");
      }
    });
    return map;
  }, [floors]);

  const filteredRooms = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter((room) => {
      const candidates = [
        room.id?.toString() ?? "",
        room.name ?? "",
        room.shortName ?? "",
        floorLookup.get(room.floorId ?? -1) ?? "",
      ];
      return candidates.some((value) => value.toLowerCase().includes(query));
    });
  }, [rooms, searchText, floorLookup]);

  const handleAddNew = () => {
    setSelectedRoom(null);
    setIsFormOpen(true);
  };

  const handleEdit = (room: RoomT) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this room?");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const response = await deleteRoom(id);
      if (response.httpStatus === "DELETED" || response.httpStatus === "SUCCESS") {
        toast.success("Room deleted successfully");
        setRooms((prev) => prev.filter((room) => room.id !== id));
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

  const handleSubmit = async (form: RoomFormValues) => {
    try {
      setIsSubmitting(true);
      const payload: Partial<RoomT> = {
        name: form.name,
        shortName: form.shortName,
        numberOfBenches: form.numberOfBenches,
        maxStudentsPerBench: form.maxStudentsPerBench,
        floorId: form.floorId,
        isActive: form.isActive,
      };

      if (selectedRoom) {
        const response = await updateRoom(selectedRoom.id!, payload);
        if (response.httpStatus === "UPDATED" || response.httpStatus === "SUCCESS") {
          toast.success("Room updated successfully");
          await loadData();
          setIsFormOpen(false);
          setSelectedRoom(null);
        } else {
          toast.error("Failed to update room", {
            description: response.message || "An error occurred",
          });
        }
      } else {
        const response = await createRoom(payload);
        if (response.httpStatus === "SUCCESS") {
          toast.success("Room created successfully");
          await loadData();
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
        <CardHeader className="flex flex-row items-center justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <DoorOpen className="mr-1 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Room Management
            </CardTitle>
            <p className="text-muted-foreground text-sm">Manage exam rooms, assign floors, and toggle availability.</p>
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
                  onClick={handleAddNew}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Room
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedRoom ? "Edit Room" : "Add Room"}</AlertDialogTitle>
                </AlertDialogHeader>
                <RoomForm
                  initialData={selectedRoom ?? undefined}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setSelectedRoom(null);
                  }}
                  isSubmitting={isSubmitting}
                  floors={floors}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="bg-background p-4 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Search by name, short name, or floor..."
              className="w-full md:w-72"
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
                  <div className="flex-shrink-0 basis-[5%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    #
                  </div>
                  <div className="flex-shrink-0 basis-[20%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Name
                  </div>
                  <div className="flex-shrink-0 basis-[14%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Short Name
                  </div>
                  <div className="flex-shrink-0 basis-[14%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Floor
                  </div>
                  <div className="flex-shrink-0 basis-[12%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Benches
                  </div>
                  <div className="flex-shrink-0 basis-[12%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Max Students Per Bench
                  </div>
                  <div className="flex-shrink-0 basis-[10%] px-3 py-2 border-r border-slate-300 flex items-center justify-center">
                    Status
                  </div>
                  <div className="flex-shrink-0 basis-[13%] px-3 py-2 flex items-center justify-center">Actions</div>
                </div>
              </div>

              <div className="bg-white min-w-full">
                {loading ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading rooms...
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="flex items-center justify-center h-52 text-muted-foreground border-b border-slate-200">
                    No rooms match your search.
                  </div>
                ) : (
                  filteredRooms.map((room, index) => {
                    const floorName = room.floorId ? (floorLookup.get(room.floorId) ?? "-") : "-";
                    return (
                      <div
                        key={room.id ?? `${room.name}-${index}`}
                        className="flex border-b border-slate-200 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-shrink-0 basis-[5%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="flex-shrink-0 basis-[20%] px-3 py-3 border-r border-slate-200 flex items-center">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 truncate" title={room.name ?? undefined}>
                              {room.name}
                            </span>
                            {room.legacyRoomId && (
                              <span className="text-xs text-muted-foreground">Legacy ID: {room.legacyRoomId}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 basis-[14%] px-3 py-3 border-r border-slate-200 flex items-center">
                          {room.shortName ?? <span className="text-slate-400">—</span>}
                        </div>
                        <div className="flex-shrink-0 basis-[14%] px-3 py-3 border-r border-slate-200 flex items-center">
                          {floorName}
                        </div>
                        <div className="flex-shrink-0 basis-[12%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                          {room.numberOfBenches ?? 0}
                        </div>
                        <div className="flex-shrink-0 basis-[12%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                          {room.maxStudentsPerBench ?? 0}
                        </div>
                        <div className="flex-shrink-0 basis-[10%] px-3 py-3 border-r border-slate-200 flex items-center justify-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              room.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {room.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex-shrink-0 basis-[12%] px-3 py-3 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="border border-blue-200 text-blue-700 hover:bg-blue-50 shadow-none"
                            onClick={() => handleEdit(room)}
                            disabled={deletingId === room.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="shadow-none"
                            onClick={() => handleDelete(room.id!)}
                            disabled={deletingId === room.id}
                          >
                            {deletingId === room.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
    </div>
  );
}
