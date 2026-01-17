import { DoorOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableRooms: string[];
  tempSelectedRooms: string[];
  tempOverrides: Record<string, string>;
  studentsPerBench: number;
  masterBenches: Record<string, number>;
  onToggleRoom: (room: string) => void;
  onSetOverride: (room: string, value: string) => void;
  onApply: () => void;
}

export function RoomsModal({
  isOpen,
  onClose,
  availableRooms = [],
  tempSelectedRooms = [],
  tempOverrides = {},
  studentsPerBench,
  masterBenches = {},
  onToggleRoom,
  onSetOverride,
  onApply,
}: RoomsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-white p-0">
        <DialogHeader className="p-5 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">Select Rooms</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Choose rooms and optionally override capacity
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-auto max-h-[50vh]">
          <Table>
            <TableHeader className="bg-purple-50 sticky top-0">
              <TableRow>
                <TableHead className="w-16 text-xs font-semibold text-gray-600 uppercase">Select</TableHead>
                <TableHead className="w-16 text-xs font-semibold text-gray-600 uppercase">Sr.</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Floor</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Room</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Benches</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Capacity</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Default/Bench</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 uppercase">Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableRooms.map((room, idx) => {
                const benches = masterBenches[room] ?? 0;
                const overrideVal = tempOverrides[room] ?? "";
                const perBench = Number(overrideVal) || studentsPerBench || 1;
                const capacity = benches * perBench;
                // Extract floor from format "Floor Name - Room Name"
                const floorMatch = room.match(/^([^-]+)\s*-\s*/);
                const floor = floorMatch?.[1]?.trim() ?? "—";
                const isSelected = tempSelectedRooms.includes(room);

                return (
                  <TableRow
                    key={room}
                    className={`transition-colors ${isSelected ? "bg-purple-50" : "hover:bg-purple-50"}`}
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleRoom(room)}
                        className="border-purple-200 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                    </TableCell>
                    <TableCell className="text-gray-600">{idx + 1}</TableCell>
                    <TableCell className="text-gray-900">{floor}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {room.includes(" - ") ? (room.split(" - ")[1] ?? room) : room}
                    </TableCell>
                    <TableCell className="text-gray-900">{benches}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-500 hover:bg-purple-100">
                        {capacity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{studentsPerBench}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={overrideVal}
                        onChange={(e) => onSetOverride(room, e.target.value)}
                        className="w-20 h-8 border-purple-200"
                        placeholder="—"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="flex items-center justify-between p-5 border-t border-purple-200 bg-purple-50">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{tempSelectedRooms.length}</span> room(s) selected
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="border-purple-200 text-gray-900 hover:bg-purple-50">
              Cancel
            </Button>
            <Button onClick={onApply} className="bg-purple-500 text-white hover:bg-purple-600">
              Apply Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
