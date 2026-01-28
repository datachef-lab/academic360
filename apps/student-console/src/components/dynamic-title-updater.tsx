"use client";

import { useEffect } from "react";
import { useCollegeSettings } from "@/hooks/use-college-settings";

/**
 * Component to dynamically update the document title based on college settings
 */
export function DynamicTitleUpdater() {
  const { name: collegeName } = useCollegeSettings();

  useEffect(() => {
    if (collegeName && collegeName !== "Student Console") {
      document.title = `${collegeName} | Student Console`;
    }
  }, [collegeName]);

  return null; // This component doesn't render anything
}
