"use client";
"use client";
import React, { useState } from "react";
import Instructions from "./components/instructions";
import SubjectSelectionForm from "./components/subject-selection-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info } from "lucide-react";

export default function SubjectSelection() {
  const [openMobileNotes, setOpenMobileNotes] = useState(false);

  return (
    <div className="py-2 flex gap-6 h-[calc(100vh-3.5rem)] overflow-hidden relative">
      {/* Left: Form */}
      <div className="w-[70%] h-full overflow-hidden">
        <SubjectSelectionForm />
      </div>
      {/* Right: Notes (desktop only) */}
      <div className="w-[30%] h-full border hidden lg:block overflow-y-auto">
        <Instructions />
      </div>

      {/* Mobile floating notes button */}
      <button
        type="button"
        onClick={() => setOpenMobileNotes(true)}
        className="lg:hidden fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-blue-600 text-white"
        aria-label="View notes"
      >
        <Info className="w-4 h-4" /> Notes
      </button>

      {/* Mobile notes modal */}
      <Dialog open={openMobileNotes} onOpenChange={setOpenMobileNotes}>
        <DialogContent className="max-w-[95vw] p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Important Notes & Guide</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-y-auto px-4 pb-4">
            <Instructions />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
