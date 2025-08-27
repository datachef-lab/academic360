"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Course } from "@/db/schema";
import { handleCourseSubmit } from "./actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

interface CourseDialogProps {
  mode: "add" | "edit";
  course?: Course;
  children?: React.ReactNode;
}

export function CourseDialog({ mode, course, children }: CourseDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await handleCourseSubmit(formData);
      
      if (result.success) {
        toast({
          title: mode === "add" ? "Course created" : "Course updated",
          description: mode === "add" 
            ? "The course has been created successfully."
            : "The course has been updated successfully.",
        });
        setOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            {mode === "add" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add Course" : "Edit Course"}</DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? "Add a new course to the system."
                : "Make changes to the course details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {course?.id && <input type="hidden" name="id" value={course.id} />}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={course?.name ?? ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shortName" className="text-right">
                Short Name
              </Label>
              <Input
                id="shortName"
                name="shortName"
                defaultValue={course?.shortName ?? ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codePrefix" className="text-right">
                Code Prefix
              </Label>
              <Input
                id="codePrefix"
                name="codePrefix"
                defaultValue={course?.codePrefix ?? ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="universityCode" className="text-right">
                University Code
              </Label>
              <Input
                id="universityCode"
                name="universityCode"
                defaultValue={course?.universityCode ?? ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={course?.amount ?? ""}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "add" ? "Creating..." : "Updating..."}
                </>
              ) : (
                mode === "add" ? "Create Course" : "Update Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 