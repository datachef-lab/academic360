"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { addBoardUniversity, type AddBoardUniversityResult } from "./actions";

export function BoardUniversityDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    // Add state for other fields if needed, e.g., const [code, setCode] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        const result: AddBoardUniversityResult = await addBoardUniversity(formData);
        
        if (result && result.success) {
            setIsOpen(false); // Close modal on success
            setName(''); // Clear input
            // Clear other input states if added
            console.log("Success:", result.message);
        } else {
            console.error("Error:", result && result.error ? result.error : "An unknown error occurred.");
        }
    };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Board University</DialogTitle>
          <DialogDescription>
            Enter the details for the new board university.
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
                name="name" 
                className="col-span-3" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {/* Add other input fields here based on your schema */}
            {/* Example for code:
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input 
                id="code" 
                name="code" 
                className="col-span-3" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            */}
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 