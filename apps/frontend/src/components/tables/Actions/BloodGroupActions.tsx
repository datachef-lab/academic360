import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBloodGroup } from "@/services/blood-group";
import { BloodGroup } from "@/types/resources/blood-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useState } from "react";

export const BloodGroupActions = ({ bloodGroup }: { bloodGroup: BloodGroup }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedType, setEditedType] = useState(bloodGroup.type);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!editedType.trim()) {
      alert("Blood group type cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateBloodGroup({
        id: Number(bloodGroup.id),
        type: editedType,
      });

      console.log("Updated blood group:", response);

      setIsDialogOpen(false); // Close the dialog after saving
    } catch (error) {
      console.error("Failed to update blood group:", error);
      alert("Failed to update blood group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)} aria-label="Edit blood group type">
        <Eye className="h-4 w-4 mr-2" />
        Edit
      </Button>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditedType(bloodGroup.type); // Reset to original value if dialog is closed
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Blood Group Type</DialogTitle>
            <DialogDescription>Update the blood group type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={editedType} onChange={(e) => setEditedType(e.target.value)} />
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};