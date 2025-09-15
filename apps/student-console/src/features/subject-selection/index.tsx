"use client";
"use client";
import React, { useState } from "react";
import Instructions from "./components/instructions";
import SubjectSelectionForm from "./components/subject-selection-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Info } from "lucide-react";

export default function SubjectSelection() {
  const [openMobileNotes, setOpenMobileNotes] = useState(false);

  return (
    <div className="py-2 flex justify-center h-[calc(100vh-3.5rem)] overflow-hidden relative">
      <div className="flex gap-6 w-full max-w-screen ">
        {/* Left: Form */}
        <div className="w-full md:w-[75%] h-full overflow-hidden">
          <SubjectSelectionForm openNotes={() => setOpenMobileNotes(true)} />
        </div>
        {/* Right: Notes (desktop only) */}
        <div className="w-[25%] h-full border hidden lg:block overflow-y-auto">
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

        {/* Mobile notes modal - fallback custom overlay for reliable scroll/close on small devices */}
        {openMobileNotes && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpenMobileNotes(false)} />
            <div className="relative bg-white w-[95vw] max-w-[95vw] max-h-[85vh] rounded-lg shadow-xl border overflow-hidden z-10">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-semibold">Important Notes & Guide</h3>
                <button
                  aria-label="Close"
                  onClick={() => setOpenMobileNotes(false)}
                  className="px-2 py-1 text-sm rounded-md border hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
              <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: "calc(85vh - 48px)" }}>
                <Instructions />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
