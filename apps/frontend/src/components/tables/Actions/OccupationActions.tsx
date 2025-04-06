import { Button } from "@/components/ui/button";
import { updateOccupation } from "@/services/Occupation";
import { Occupation } from "@/types/resources/occupation";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; 
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const OccupationActions = ({ occupation }: { occupation: Occupation }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(occupation.name);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateOccupation,
    onSuccess: () => {
      // Invalidate and refetch the occupations query
      queryClient.invalidateQueries({ queryKey: ["Occupation"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to update Occupation:", error);
      alert("Failed to update Occupation. Please try again.");
    },
  });

  const handleSave = async () => {
    if (!editedName.trim()) {
      alert("Occupation cannot be empty");
      return;
    }

    updateMutation.mutate({
      id: Number(occupation.id),
      name: editedName,
    });
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
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
