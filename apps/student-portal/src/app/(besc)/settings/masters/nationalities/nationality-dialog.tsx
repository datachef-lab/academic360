'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { addNationality, deleteNationality, AddNationalityResult } from './actions';
import { useToast } from "@/hooks/use-toast";
import { NationalityService, type ApiResponse } from '@/services/nationality.service';

// --- Add/Edit Nationality Dialog ---
interface AddNationalityDialogProps {
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    id: number;
    name: string;
    sequence?: number | null;
    code?: number | null;
  };
}

export function AddNationalityDialog({ onSuccess, open, onOpenChange, initialData }: AddNationalityDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [sequence, setSequence] = useState<number | ''> (initialData?.sequence ?? '');
  const [code, setCode] = useState<number | ''> (initialData?.code ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens for adding or initial data changes for editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSequence(initialData.sequence ?? '');
      setCode(initialData.code ?? '');
    } else {
      setName('');
      setSequence('');
      setCode('');
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a nationality name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let response: ApiResponse<any>;

    const nationalityData = {
        name: name.trim(),
        sequence: sequence === '' ? undefined : Number(sequence),
        code: code === '' ? undefined : Number(code),
    };

    if (initialData) {
      // Update existing nationality
      response = await NationalityService.updateNationality({ ...nationalityData, id: initialData.id });
      if (response.success) {
        toast({
          title: "Nationality updated",
          description: "The nationality has been successfully updated.",
        });
        onSuccess();
        if (onOpenChange) onOpenChange(false);
      } else {
        toast({
          title: "Update failed",
          description: response.message || "An error occurred while updating the nationality.",
          variant: "destructive",
        });
      }
    } else {
      // Add new nationality
      response = await NationalityService.createNationality(nationalityData);
      if (response.success) {
        toast({
          title: "Nationality added",
          description: "The nationality has been successfully added.",
        });
        onSuccess();
        setName(''); // Clear form
        setSequence('');
        setCode('');
        if (onOpenChange) onOpenChange(false);
      } else {
        toast({
          title: "Addition failed",
          description: response.message || "An error occurred while adding the nationality.",
          variant: "destructive",
        });
      }
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={!initialData}>
        {!initialData && <Button>Add Nationality</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Nationality' : 'Add New Nationality'}</DialogTitle>
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
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                type="number"
                value={code}
                onChange={(e) => setCode(Number(e.target.value))}
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
                initialData ? 'Save changes' : 'Add Nationality'
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

// --- Delete Nationality Dialog ---
interface DeleteNationalityDialogProps {
  nationalityId: string;
}

export function DeleteNationalityDialog({ nationalityId }: DeleteNationalityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setError(undefined);
    setIsDeleting(true);
    const result = await deleteNationality(nationalityId);
    if (!result.success) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Nationality</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Are you sure you want to delete this nationality?</p>
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