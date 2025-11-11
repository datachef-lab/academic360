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
import { Label } from "@/components/ui/label";

type Floor = {
  id: number;
  floorName: string;
};

export default function ExamFloorsPage() {
  const initialFloors: Floor[] = [
    { id: 1, floorName: "First Floor" },
    { id: 2, floorName: "Second Floor" },
    { id: 3, floorName: "Third Floor" },
  ];
  const [floors, setFloors] = React.useState<Floor[]>(initialFloors);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedFloor, setSelectedFloor] = React.useState<Floor | null>(null);

  const filteredFloors = floors.filter((f) =>
    [f.id.toString(), f.floorName].some((v) => v.toLowerCase().includes(searchText.toLowerCase())),
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
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
                    <TableHead style={{ width: 180, background: "#f3f4f6", color: "#374151" }}>Floor Name</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFloors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFloors.map((floor) => (
                      <TableRow key={floor.id} className="group">
                        <TableCell style={{ width: 60 }}>{floor.id}</TableCell>
                        <TableCell style={{ width: 180 }}>{floor.floorName}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(floor)}
                              className="h-5 w-5 p-0"
                            >
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
        </CardContent>
      </Card>
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
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({ id, floorName })} className="bg-purple-600 hover:bg-purple-700 text-white">
          Save
        </Button>
      </div>
    </div>
  );
}
