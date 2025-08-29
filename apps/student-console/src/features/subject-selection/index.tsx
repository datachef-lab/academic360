"use client";
import React from "react";
import Instructions from "./components/instructions";
import SubjectSelectionForm from "./components/subject-selection-form";

export default function SubjectSelection() {
  return (
    <div className="py-2 flex gap-6 h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="w-[70%] h-full">
        <SubjectSelectionForm />
      </div>
      <div className="w-[30%] h-full border">
        <Instructions />
      </div>
    </div>
  );
}
