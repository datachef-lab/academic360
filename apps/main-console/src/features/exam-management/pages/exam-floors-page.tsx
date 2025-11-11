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
import { Label } from "@/components/ui/label";

type Floor = {
  id: number;
  floorName: string;
  shortName: string;
  status: "Active" | "Inactive";
};

export default function ExamFloorsPage() {
  const initialFloors: Floor[] = [
    { id: 1, floorName: "First Floor", shortName: "1F", status: "Active" },
    { id: 2, floorName: "Second Floor", shortName: "2F", status: "Inactive" },
    { id: 3, floorName: "Third Floor", shortName: "3F", status: "Active" },
  ];
  const [floors, setFloors] = React.useState<Floor[]>(initialFloors);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedFloor, setSelectedFloor] = React.useState<Floor | null>(null);

  const filteredFloors = floors.filter((f) =>
    [f.id.toString(), f.floorName, f.shortName, f.status].some((v) =>
      v.toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  const handleAddNew = () => {
    setSelectedFloor(null);
  };

  const handleEdit = (floor: Floor) => {
    setSelectedFloor(floor);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setFloors((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (form: Floor) => {
    const providedId = Number(form.id);
    if (selectedFloor) {
      setFloors((prev) => prev.map((f) => (f.id === selectedFloor.id ? { ...form, id: providedId } : f)));
    } else {
      const nextId = floors.length ? Math.max(...floors.map((f) => f.id)) + 1 : 1;
      const finalId = providedId && !Number.isNaN(providedId) ? providedId : nextId;
      setFloors((prev) => [...prev, { ...form, id: finalId }]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-4 p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-md">
              <DoorOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Floors</h1>
              <p className="text-gray-500 mt-1 text-sm">List of all the Floors.</p>
            </div>
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
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      <div className=" border rounded-md  flex flex-col gap-2">
        <div className="p-4  flex items-center gap-2 mb-0 justify-between">
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
        <div className="">
          <div className="overflow-y-auto overflow-x-auto h-full">
            <Table className="border rounded-md max-w-auto ">
              <TableHeader className="sticky top-0 z-10 bg-gray-100">
                <TableRow>
                  <TableHead className="w-[60px] bg-gray-100 text-gray-700">ID</TableHead>
                  <TableHead className="w-[220px] bg-gray-100 text-gray-700">Floor Name</TableHead>
                  <TableHead className="w-[180px] bg-gray-100 text-gray-700">Short Name</TableHead>
                  <TableHead className="w-[140px] bg-gray-100 text-gray-700">Status</TableHead>
                  <TableHead className="w-[140px] bg-gray-100 text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFloors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFloors.map((floor) => (
                    <TableRow key={floor.id} className="group">
                      <TableCell className="w-[60px]">{floor.id}</TableCell>
                      <TableCell className="w-[220px]">{floor.floorName}</TableCell>
                      <TableCell className="w-[180px]">{floor.shortName}</TableCell>
                      <TableCell className="w-[140px]">{floor.status === "Active" ? "Active" : "Inactive"}</TableCell>
                      <TableCell className="w-[140px]">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(floor)} className="h-5 w-5 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(floor.id)}
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
      </div>
    </div>
  );
}

type FloorFormProps = {
  initialData?: Floor;
  onSubmit: (data: Floor) => void;
  onCancel: () => void;
};

function FloorForm({ initialData, onSubmit, onCancel }: FloorFormProps) {
  const [id, setId] = React.useState<number>(initialData?.id ?? 0);
  const [floorName, setFloorName] = React.useState(initialData?.floorName ?? "");
  const [shortName, setShortName] = React.useState(initialData?.shortName ?? "");
  const [status, setStatus] = React.useState<"Active" | "Inactive">(initialData?.status ?? "Active");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor-id">ID</Label>
          <Input id="floor-id" type="number" value={id} onChange={(e) => setId(Number(e.target.value))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="floor-name">Floor Name</Label>
          <Input id="floor-name" value={floorName} onChange={(e) => setFloorName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="short-name">Short Name</Label>
          <Input id="short-name" value={shortName} onChange={(e) => setShortName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit({ id, floorName, shortName, status })}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
