"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageMedium } from "@/db/schema";
import { useToast } from "@/hooks/use-toast";

interface LanguageMediumDialogProps {
  mode: "add" | "edit";
  languageMedium?: LanguageMedium | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}

export function LanguageMediumDialog({
  mode,
  languageMedium,
  open,
  setOpen,
  onSuccess,
}: LanguageMediumDialogProps) {
  const [name, setName] = useState(languageMedium?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = mode === "add" 
        ? "/api/language-mediums"
        : `/api/language-mediums?id=${languageMedium?.id}`;
      
      const method = mode === "add" ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: mode === "add" ? "Language Medium Added" : "Language Medium Updated",
          description: mode === "add" 
            ? "New language medium has been added successfully."
            : "Language medium has been updated successfully.",
        });
        setOpen(false);
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting language medium:", error);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Language Medium" : "Edit Language Medium"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new language medium to the system."
              : "Edit the selected language medium."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter language medium name"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">Saving...</span>
                </>
              ) : mode === "add" ? (
                "Add Language Medium"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 