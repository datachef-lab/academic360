import type { ProfileInfo } from "@repo/db/dtos/user";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export function useProfile() {
  const { user } = useAuth();
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/api/users/${user.id}/profile`);
      setProfileInfo(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profileInfo,
    loading,
    error,
    refetch: fetchProfile,
  };
}
