"use client";

import { useEffect, useState } from "react";
import { fetchAllSettings, getSettingFileUrl } from "@/services/settings.service";
import type { SettingDto } from "@/services/settings.service";

export interface CollegeSettings {
  /** Full college name (setting "College Name"). */
  collegeName: string;
  /** Short code (setting "College Abbreviation"). */
  abbreviation: string;
  logoUrl: string;
  /** Login hero / illustration (setting "Login Screen Image"). */
  loginIllustrationUrl: string;
  isLoading: boolean;
  error: string | null;
}

function findSetting(settings: SettingDto[], canonicalName: string): SettingDto | undefined {
  const n = canonicalName.toLowerCase();
  return settings.find((s) => (s.name || "").trim().toLowerCase() === n);
}

/**
 * College branding from the same `/api/v1/settings` source as main-console.
 */
export const useCollegeSettings = (): CollegeSettings => {
  const [collegeName, setCollegeName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loginIllustrationUrl, setLoginIllustrationUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const settings = await fetchAllSettings();

        if (cancelled) return;

        const nameRow = findSetting(settings, "College Name");
        setCollegeName(String(nameRow?.value ?? "").trim());

        const abbrevRow = findSetting(settings, "College Abbreviation");
        setAbbreviation(String(abbrevRow?.value ?? "").trim());

        const logoRow = findSetting(settings, "College Logo Image");
        setLogoUrl(logoRow?.id != null ? getSettingFileUrl(logoRow.id, logoRow.updatedAt) : "");

        const loginImg = findSetting(settings, "Login Screen Image");
        setLoginIllustrationUrl(
          loginImg?.id != null ? getSettingFileUrl(loginImg.id, loginImg.updatedAt) : "",
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load college settings");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    collegeName,
    abbreviation,
    logoUrl,
    loginIllustrationUrl,
    isLoading,
    error,
  };
};
