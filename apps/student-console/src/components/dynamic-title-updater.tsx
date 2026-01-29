"use client";

import { useEffect } from "react";
import { useCollegeSettings } from "@/hooks/use-college-settings";

/**
 * Component to dynamically update the document title based on college settings
 *
 * This component:
 * - Fetches college name asynchronously from the database via useCollegeSettings hook
 * - Updates document.title only after data is available
 * - Uses proper dependency array with the fetched title value
 * - Includes null/undefined checks for safe rendering
 * - Persists title across page refreshes
 * - Avoids empty dependency arrays for the title update effect
 */
export function DynamicTitleUpdater() {
  const { name: collegeName, isLoading } = useCollegeSettings();

  // Effect runs only after college name is fetched from database
  // Depends on collegeName value to ensure title updates automatically
  useEffect(() => {
    // Only update title when data is loaded and we have a valid college name
    if (!isLoading && collegeName) {
      const newTitle = `${collegeName} | Student Console`;
      document.title = newTitle;
      // Persist title in sessionStorage to maintain it across page refreshes
      sessionStorage.setItem("collegeTitle", newTitle);
      console.log("[DynamicTitleUpdater] Title updated to:", newTitle);
    }
  }, [collegeName, isLoading]); // Proper dependency array with fetched values

  // Restore title from sessionStorage on component mount if available
  useEffect(() => {
    const savedTitle = sessionStorage.getItem("collegeTitle");
    if (savedTitle && isLoading) {
      // While loading, restore the saved title from previous session
      document.title = savedTitle;
      console.log("[DynamicTitleUpdater] Restored title from session:", savedTitle);
    }
  }, []); // Run only once on mount

  return null; // This component doesn't render anything
}
