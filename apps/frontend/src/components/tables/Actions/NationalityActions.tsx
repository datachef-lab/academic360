import { Button } from "@/components/ui/button";
import { updateNationality } from "@/services/nationality";
import { Nationality } from "@/types/resources/nationality";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const NationalityActions = ({ nationality }: { nationality: Nationality }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(nationality.name);
  const [editedCode, setEditedCode] = useState(nationality.code ?? "");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateNationality,
    onSuccess: () => {
      // Invalidate and refetch the nationalities query
      queryClient.invalidateQueries({ queryKey: ["Nationality"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to update Nationality:", error);
      alert("Failed to update Nationality. Please try again.");
    },
  });

  const handleSave = async () => {
    if (!editedName.trim()) {
      alert("Nationality cannot be empty");
      return;
    }

    updateMutation.mutate({
      id: Number(nationality.id),
      name: editedName,
      code: Number(editedCode),
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
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
