import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLanguageMedium } from "@/services/LanguageMedium";
import { LanguageMedium } from "@/types/resources/language-medium";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const LanguageMediumActions = ({ languageMedium }: { languageMedium: LanguageMedium }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(languageMedium.name);

  const handleSave = async () => {
    try {
      const response = await updateLanguageMedium({
        id: Number(languageMedium.id),
        name: editedName,
      });

      console.log("Language medium updated successfully:", response);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to update language medium:", error);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)}>
        <Eye className="h-4 w-4 mr-2" />
        Edit
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
            <DialogDescription>Update the name for this language medium.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} />
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
