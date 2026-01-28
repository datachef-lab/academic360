"use client";

import { useEffect, useState } from "react";
import { fetchAllSettings, getSettingFileUrl } from "@/services/settings.service";

export interface CollegeSettings {
  name: string;
  logoUrl: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage college settings
 * Fetches college name and logo URL dynamically
 */
export const useCollegeSettings = (): CollegeSettings => {
  const [name, setName] = useState<string>("Student Console");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCollegeSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all settings
        const settings = await fetchAllSettings();
        console.log("[useCollegeSettings] All settings:", settings);

        // Find college abbreviation setting - try multiple possible names
        const collegeAbbrevSetting = settings.find(
          (s) =>
            s.name?.toLowerCase() === "college abbreviation" ||
            s.name?.toLowerCase() === "college-abbreviation" ||
            s.name?.toLowerCase() === "collegeabbreviation" ||
            s.name?.toLowerCase() === "college_abbreviation",
        );

        if (collegeAbbrevSetting) {
          console.log("[useCollegeSettings] Found college abbreviation setting:", collegeAbbrevSetting);
          setName(collegeAbbrevSetting.value || "Student Console");
        } else {
          console.warn(
            "[useCollegeSettings] College abbreviation setting not found. Available settings:",
            settings.map((s) => s.name),
          );
        }

        // Find college logo setting - try multiple possible names
        const collegeLogoSetting = settings.find(
          (s) =>
            s.name?.toLowerCase() === "college logo image" ||
            s.name?.toLowerCase() === "college-logo" ||
            s.name?.toLowerCase() === "collegelogo" ||
            s.name?.toLowerCase() === "college_logo",
        );

        if (collegeLogoSetting) {
          console.log("[useCollegeSettings] Found college logo setting:", collegeLogoSetting);
          const logoId = collegeLogoSetting.id;
          const logoUrl = getSettingFileUrl(String(logoId));
          console.log("[useCollegeSettings] Constructed logo URL:", logoUrl);
          setLogoUrl(logoUrl);
        } else {
          console.warn("[useCollegeSettings] College logo setting not found");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load college settings";
        setError(errorMessage);
        console.error("[useCollegeSettings] Error loading college settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollegeSettings();
  }, []);

  return {
    name,
    logoUrl,
    isLoading,
    error,
  };
};
