"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { addBloodGroup, type AddBloodGroupResult } from './actions';
import { useToast } from "@/hooks/use-toast";

// --- Add/Edit Blood Group Dialog ---
interface AddBloodGroupDialogProps {
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    id: number;
    type: string;
  };
}

export function BloodGroupDialog({ onSuccess, open, onOpenChange, initialData }: AddBloodGroupDialogProps) {
  const [type, setType] = useState(initialData?.type || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('type', type);

      const result: AddBloodGroupResult = await addBloodGroup(formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Blood group saved successfully.",
        });
        setType('');
        onSuccess();
        if (onOpenChange) {
          onOpenChange(false);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save blood group.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={!initialData}>
        {!initialData && <Button>Add Blood Group</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Blood Group' : 'Add New Blood Group'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Edit the blood group details here.' : "Add a new blood group here. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 