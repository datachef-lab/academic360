import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Upload, PlusCircle, DoorOpen, Edit, Trash2 } from "lucide-react";
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

type Room = {
  id: number;
  roomNo: string;
  shortName: string;
  strength: number;
  examCapacity: number;
  benches: number;
  allocateRoom: boolean;
};

export default function ExamRoomsPage() {
  const initialRooms: Room[] = [
    { id: 1, roomNo: "101", shortName: "R101", strength: 40, examCapacity: 36, benches: 18, allocateRoom: true },
    { id: 2, roomNo: "102", shortName: "R102", strength: 30, examCapacity: 28, benches: 14, allocateRoom: false },
    { id: 3, roomNo: "201", shortName: "R201", strength: 50, examCapacity: 45, benches: 25, allocateRoom: true },
    { id: 4, roomNo: "202", shortName: "R202", strength: 24, examCapacity: 22, benches: 12, allocateRoom: true },
    { id: 5, roomNo: "Lab-1", shortName: "LAB1", strength: 60, examCapacity: 40, benches: 20, allocateRoom: false },
  ];
  const [rooms, setRooms] = React.useState<Room[]>(initialRooms);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);

  const filteredRooms = rooms.filter((r) =>
    [r.id.toString(), r.roomNo, r.shortName].some((v) => v.toLowerCase().includes(searchText.toLowerCase())),
  );

  const handleAddNew = () => {
    setSelectedRoom(null);
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (form: Room) => {
    const providedId = Number(form.id);
    if (selectedRoom) {
      setRooms((prev) => prev.map((r) => (r.id === selectedRoom.id ? { ...form, id: providedId } : r)));
    } else {
      const nextId = rooms.length ? Math.max(...rooms.map((r) => r.id)) + 1 : 1;
      const finalId = providedId && !Number.isNaN(providedId) ? providedId : nextId;
      setRooms((prev) => [...prev, { ...form, id: finalId }]);
    }
    setIsFormOpen(false);
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
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
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
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
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>ID</TableHead>
                    <TableHead style={{ width: 180, background: "#f3f4f6", color: "#374151" }}>Room No</TableHead>
                    <TableHead style={{ width: 160, background: "#f3f4f6", color: "#374151" }}>Short Name</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Strength</TableHead>
                    <TableHead style={{ width: 160, background: "#f3f4f6", color: "#374151" }}>Exam Capacity</TableHead>
                    <TableHead style={{ width: 160, background: "#f3f4f6", color: "#374151" }}>
                      No. of Benches
                    </TableHead>
                    <TableHead style={{ width: 160, background: "#f3f4f6", color: "#374151" }}>Allocate Room</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRooms.map((room) => (
                      <TableRow key={room.id} className="group">
                        <TableCell style={{ width: 60 }}>{room.id}</TableCell>
                        <TableCell style={{ width: 180 }}>{room.roomNo}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.shortName}</TableCell>
                        <TableCell style={{ width: 140 }}>{room.strength}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.examCapacity}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.benches}</TableCell>
                        <TableCell style={{ width: 160 }}>{room.allocateRoom ? "Yes" : "No"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(room)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(room.id)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
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
  initialData?: Room;
  onSubmit: (data: Room) => void;
  onCancel: () => void;
};

function RoomForm({ initialData, onSubmit, onCancel }: RoomFormProps) {
  const [id, setId] = React.useState<number>(initialData?.id ?? 0);
  const [roomNo, setRoomNo] = React.useState(initialData?.roomNo ?? "");
  const [shortName, setShortName] = React.useState(initialData?.shortName ?? "");
  const [strength, setStrength] = React.useState<number>(initialData?.strength ?? 0);
  const [examCapacity, setExamCapacity] = React.useState<number>(initialData?.examCapacity ?? 0);
  const [benches, setBenches] = React.useState<number>(initialData?.benches ?? 0);
  const [allocateRoom, setAllocateRoom] = React.useState<boolean>(initialData?.allocateRoom ?? false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="room-id">ID</Label>
          <Input id="room-id" type="number" value={id} onChange={(e) => setId(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="room-no">Room No</Label>
          <Input id="room-no" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="short-name">Short Name</Label>
          <Input id="short-name" value={shortName} onChange={(e) => setShortName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="strength">Strength</Label>
          <Input id="strength" type="number" value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exam-capacity">Exam Capacity</Label>
          <Input
            id="exam-capacity"
            type="number"
            value={examCapacity}
            onChange={(e) => setExamCapacity(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="benches">No. of Benches in Room</Label>
          <Input id="benches" type="number" value={benches} onChange={(e) => setBenches(Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch id="allocate-room" checked={allocateRoom} onCheckedChange={setAllocateRoom} />
          <Label htmlFor="allocate-room">Allocate Room</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit({ id, roomNo, shortName, strength, examCapacity, benches, allocateRoom })}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
