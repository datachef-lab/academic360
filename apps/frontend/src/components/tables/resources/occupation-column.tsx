import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Occupation } from "@/types/resources/occupation";
import { Button } from "@/components/ui/button"; // Button component
import { Eye } from "lucide-react"; // Edit icon
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // shadcn/ui Dialog components
import { Input } from "@/components/ui/input"; // Input for editing
import { updateOccupation } from "@/services/Occupation";

export const occupationColumns: ColumnDef<Occupation>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <EditOccupation occupation={row.original} />,
  },
];

const EditOccupation = ({ occupation }: { occupation: Occupation }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(occupation.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editedName.trim()) {
      alert("Occupation cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateOccupation({
        id: Number(occupation.id),
        name: editedName,
      });

      console.log("Updated Occupation:", response);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to update Occupation:", error);
      alert("Failed to update Occupation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Edit Button */}
      <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)}>
        <Eye className="h-4 w-4 mr-2" />
        Edit
      </Button>

      {/* Dialog for Editing */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditedName(occupation.name);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Occupation Name</DialogTitle>
            <DialogDescription>Update the name for this occupation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} />
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

