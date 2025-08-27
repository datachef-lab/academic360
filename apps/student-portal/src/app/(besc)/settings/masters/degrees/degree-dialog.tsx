"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { addDegree, updateDegree } from "./actions";
import { degreeLevelType, Degree } from "@/db/schema";
import { useToast } from "@/hooks/use-toast";

interface DegreeDialogProps {
  mode: "add" | "edit";
  degree?: Degree | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export function DegreeDialog({ mode, degree, onSuccess, trigger, open, setOpen }: DegreeDialogProps) {
  const [isOpen, setIsOpenLocal] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [sequence, setSequence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (mode === "edit" && degree) {
      setName(degree.name || "");
      setLevel(degree.level || "");
      setSequence(degree.sequence?.toString() || "");
    } else {
      setName("");
      setLevel("");
      setSequence("");
    }
  }, [mode, degree, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    let result;
    if (mode === "edit" && degree) {
      result = await updateDegree(degree.id!, {
        name: formData.get("name"),
        level: formData.get("level"),
        sequence: formData.get("sequence") ? Number(formData.get("sequence")) : undefined,
      });
    } else {
      result = await addDegree(formData);
    }
    if (result && result.success) {
      toast({
        title: "Success",
        description: result.message || (mode === "edit" ? "Degree updated successfully" : "Degree added successfully"),
      });
      if (setOpen) setOpen(false);
      setIsOpenLocal(false);
      setName("");
      setLevel("");
      setSequence("");
      if (onSuccess) onSuccess();
    } else {
      toast({
        title: "Error",
        description: result?.error || "An error occurred",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = setOpen || setIsOpenLocal;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {mode === "add" ? <Plus className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
            {mode === "add" ? "Add Degree" : "Edit Degree"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Degree" : "Add New Degree"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Edit the details for the degree." : "Enter the details for the new degree."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input 
                id="name" 
                name="name" 
                className="col-span-3" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Enter degree name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">Level</Label>
              <select 
                id="level" 
                name="level" 
                className="col-span-3 border rounded px-2 py-1" 
                required 
                value={level} 
                onChange={e => setLevel(e.target.value)}
              >
                <option value="">Select Degree Level</option>
                {degreeLevelType.enumValues.map(degreeLevel => (
                  <option key={degreeLevel} value={degreeLevel}>
                    {degreeLevel.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sequence" className="text-right">Sequence</Label>
              <Input 
                id="sequence" 
                name="sequence" 
                type="number" 
                className="col-span-3" 
                value={sequence} 
                onChange={e => setSequence(e.target.value)}
                placeholder="Enter sequence number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Adding..."}
                </>
              ) : (
                mode === "edit" ? "Update Degree" : "Add Degree"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 