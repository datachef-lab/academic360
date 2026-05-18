export interface SettingDto {
  id: number;
  name: string;
  value: string;
  type: string;
  variant?: string;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

/**
 * Fetch all settings, optionally filtered by variant
 */
export const fetchAllSettings = async (variant?: string): Promise<SettingDto[]> => {
  try {
    const url = new URL(`${BASE_URL}/api/v1/settings`);
    if (variant) {
      url.searchParams.append("variant", variant);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    const data = await response.json();

    return data.payload || [];
  } catch (error) {
    console.error("[settings.service] Error fetching settings:", error);
    return [];
  }
};

/**
 * Fetch a specific setting by ID
 */
export const fetchSettingById = async (id: number): Promise<SettingDto | null> => {
  try {
    const url = `${BASE_URL}/api/v1/settings/${id}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch setting: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload || null;
  } catch (error) {
    console.error("Error fetching setting by ID:", error);
    return null;
  }
};

/**
 * Fetch a specific setting by name
 */
export const fetchSettingByName = async (name: string): Promise<SettingDto | null> => {
  try {
    const settings = await fetchAllSettings();
    return settings.find((s) => s.name === name) || null;
  } catch (error) {
    console.error("Error fetching setting by name:", error);
    return null;
  }
};

/**
 * Fetch college logo URL from settings
 */
export const fetchCollegeLogo = async (): Promise<string> => {
  try {
    const url = `${BASE_URL}/api/v1/settings/file/college-logo`;
    // This returns the image directly
    return url;
  } catch (error) {
    console.error("Error fetching college logo:", error);
    return ""; // Return empty string on error
  }
};

/**
 * Fetch college name from settings
 */
export const fetchCollegeName = async (): Promise<string> => {
  try {
    const setting = await fetchSettingByName("college-name");
    return setting?.value || "Student Console";
  } catch (error) {
    console.error("Error fetching college name:", error);
    return "Student Console";
  }
};

/**
 * Get public file URL for a persisted settings FILE row (`/api/v1/settings/file/:id`).
 * Optional `updatedAt` busts browser cache after uploads (same id, new bytes).
 */
export const getSettingFileUrl = (id: string | number, updatedAt?: string): string => {
  const base = `${BASE_URL}/api/v1/settings/file/${id}`;
  if (updatedAt) return `${base}?v=${encodeURIComponent(updatedAt)}`;
  return base;
};
