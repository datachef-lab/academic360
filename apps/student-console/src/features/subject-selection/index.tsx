"use client";
import React, { useState } from "react";
import Instructions from "./components/instructions";
import SubjectSelectionForm from "./components/subject-selection-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Info, AlertCircle } from "lucide-react";
import { useStudent } from "@/providers/student-provider";

export default function SubjectSelection() {
  const [openMobileNotes, setOpenMobileNotes] = useState(false);
  const { student } = useStudent();
  const [visibleCategories, setVisibleCategories] = useState<{
    minor?: boolean;
    idc?: boolean;
    aec?: boolean;
    cvac?: boolean;
  }>({});

  // Check if student's program course contains "BBA"
  const blocked = new Set(["BBA", "MA", "MCOM"]);

  const rawName = student?.programCourse?.course?.name ?? "";
  const key = rawName
    .normalize("NFKD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();

  const isBlockStudents = blocked.has(key);

  // If BBA student, show message instead of form
  if (isBlockStudents) {
    return (
      <div className="py-2 flex justify-center h-[calc(100vh-3.5rem)] relative overflow-hidden">
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Subject Selection Not Available</h2>
              <p className="text-gray-600 text-lg">
                Subject Selection is not applicable for {student?.programCourse?.course?.name?.trim()?.toUpperCase()}{" "}
                students.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 flex justify-center h-[calc(100vh-3.5rem)] relative overflow-hidden">
      <div className="flex gap-6 w-full max-w-screen h-full border borde-red-500 ">
        {/* Left: Form */}
        <div className="w-full md:w-[75%] h-full overflow-y-auto no-scrollbar">
          <SubjectSelectionForm
            openNotes={() => setOpenMobileNotes(true)}
            onVisibleCategoriesChange={setVisibleCategories}
          />
        </div>
        {/* Right: Notes (desktop only) */}
        <div className="w-[25%] h-full border hidden lg:block overflow-y-auto no-scrollbar">
          <Instructions student={student} visibleCategories={visibleCategories} />
        </div>

        {/* Mobile floating notes button */}
        <button
          type="button"
          onClick={() => setOpenMobileNotes(true)}
          className="lg:hidden fixed top-6 right-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-blue-600 text-white"
          aria-label="View notes"
        >
          <Info className="w-4 h-4" /> Notes
        </button>

        {/* Mobile notes modal - optimized for mobile scrolling */}
        {openMobileNotes && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpenMobileNotes(false)} />
            <div className="relative bg-white w-full max-w-md max-h-[95vh] sm:max-h-[90vh] rounded-lg shadow-xl border z-10 flex flex-col">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b bg-white rounded-t-lg flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-800">Important Notes & Guide</h3>
                <button
                  aria-label="Close"
                  onClick={() => setOpenMobileNotes(false)}
                  className="px-2 py-1 text-sm rounded-md border hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  Close
                </button>
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 mobile-modal-scroll">
                <Instructions compact={true} student={student} visibleCategories={visibleCategories} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
