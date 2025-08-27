'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ReligionService, type ApiResponse } from '@/services/religion.service';
import { type Religion } from "@/db/schema";

// --- Add/Edit Religion Dialog ---
interface AddReligionDialogProps {
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    id: number;
    name: string;
    sequence?: number | null;
  };
}

export function AddReligionDialog({ onSuccess, open, onOpenChange, initialData }: AddReligionDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [sequence, setSequence] = useState<number | ''>(initialData?.sequence ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSequence(initialData.sequence ?? '');
    } else {
      setName('');
      setSequence('');
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a religion name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let response: ApiResponse<Religion>;

    const religionData: Omit<Religion, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      sequence: sequence === '' ? null : Number(sequence),
    };

    if (initialData) {
      response = await ReligionService.updateReligion({ ...religionData, id: initialData.id });
      if (response.success) {
        toast({
          title: "Religion updated",
          description: "The religion has been successfully updated.",
        });
        onSuccess();
        if (onOpenChange) onOpenChange(false);
      } else {
        toast({
          title: "Update failed",
          description: response.message || "An error occurred while updating the religion.",
          variant: "destructive",
        });
      }
    } else {
      response = await ReligionService.createReligion(religionData);
      if (response.success) {
        toast({
          title: "Religion added",
          description: "The religion has been successfully added.",
        });
        onSuccess();
        setName('');
        setSequence('');
        if (onOpenChange) onOpenChange(false);
      } else {
        toast({
          title: "Addition failed",
          description: response.message || "An error occurred while adding the religion.",
          variant: "destructive",
        });
      }
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={!initialData}>
        {!initialData && 
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Religion
        </Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Religion' : 'Add New Religion'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Edit the religion details here.' : "Add a new religion here. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sequence" className="text-right">
                Sequence
              </Label>
              <Input
                id="sequence"
                type="number"
                value={sequence}
                onChange={(e) => setSequence(Number(e.target.value))}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                initialData ? 'Save changes' : 'Add Religion'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        'Save changes'
      )}
    </Button>
  );
}

// --- Delete Religion Dialog ---
interface DeleteReligionDialogProps {
  religionId: number;
  onSuccess: () => void;
}

export function DeleteReligionDialog({ religionId, onSuccess }: DeleteReligionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setError(undefined);
    setIsDeleting(true);
    const response = await ReligionService.deleteReligion(religionId);
    if (!response.success) {
      setError(response.message);
      toast({
         title: "Deletion failed",
         description: response.message || "An error occurred while deleting.",
         variant: "destructive",
      });
    } else {
      toast({
         title: "Religion deleted",
         description: "The religion has been successfully deleted.",
      });
      setIsOpen(false);
      onSuccess();
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Religion</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to delete this religion?</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 