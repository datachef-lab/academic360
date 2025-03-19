import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Nationality } from "@/types/resources/nationality";
import { Button } from "@/components/ui/button"; // Button component
import { Eye } from "lucide-react"; // Edit icon
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // shadcn/ui Dialog components
import { Input } from "@/components/ui/input"; // Input for editing
import { updateNationality } from "@/services/nationality";

export const nationalityColumns: ColumnDef<Nationality>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <EditNationalityDialog nationality={row.original} />,
  },
];

const EditNationalityDialog = ({ nationality }: { nationality: Nationality }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to manage dialog visibility
  const [editedName, setEditedName] = useState(nationality.name); // State to manage edited name
  const [editedCode, setEditedCode] = useState(nationality.code ?? ""); // State to manage edited code
  const [isLoading, setIsLoading] = useState(false); // State to manage loading state

  const handleSave = async () => {
    if (!editedName.trim()) {
      alert("Nationality cannot be empty");
      return;
    }

    setIsLoading(true); // Start loading
    try {
      // Call the API to update the Nationality
      const response = await updateNationality({
        id: Number(nationality.id),
        name: editedName,
        code: Number(editedCode),
      });

      console.log("Updated Nationality:", response);

      // Close the dialog after saving
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to update Nationality:", error);
      alert("Failed to update Nationality. Please try again.");
    } finally {
      setIsLoading(false); // Stop loading
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
          if (!open) {
            setEditedName(nationality.name); // Reset to original value if dialog is closed
            setEditedCode(nationality.code ?? "");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nationality</DialogTitle>
            <DialogDescription>Update the name and code for this nationality.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Input for Name */}
            <div className="space-y-2">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)} // Update the edited name
              />
            </div>

            {/* Input for Code */}
            <div className="space-y-2">
              <label htmlFor="code">Code</label>
              <Input
                id="code"
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)} // Update the edited code
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};


