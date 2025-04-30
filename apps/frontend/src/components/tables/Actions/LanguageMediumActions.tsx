import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLanguageMedium } from "@/services/LanguageMedium";
import { LanguageMedium } from "@/types/resources/language-medium";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const LanguageMediumActions = ({ languageMedium }: { languageMedium: LanguageMedium }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(languageMedium.name);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateLanguageMedium,
    onSuccess: () => {
      // Invalidate and refetch the language mediums query
      queryClient.invalidateQueries({ queryKey: ["Language Medium"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to update language medium:", error);
      alert("Failed to update language medium. Please try again.");
    },
  });

  const handleSave = async () => {
    if (!editedName.trim()) {
      alert("Language medium name cannot be empty");
      return;
    }

    updateMutation.mutate({
      id: Number(languageMedium.id),
      name: editedName,
    });
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)}>
        <Eye className="h-4 w-4 mr-2" />
        Edit
      </Button>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditedName(languageMedium.name); // Reset to original value if dialog is closed
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
            <DialogDescription>Update the name for this language medium.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} />
            <Button onClick={handleSave} disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
