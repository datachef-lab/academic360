import { useState, useEffect } from "react";
import type { ProfileInfo } from "@repo/db/dtos/user";
import { useAuth } from "./use-auth";

import { ingaxiosInstance as axiosInstance } from "@/lib/utils";

export function useProfile() {
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get(`/api/users/${user.id}/profile`);

        const data = await response.data;
        setProfileInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch profile");
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const refetch = () => {
    if (user?.id) {
      setLoading(true);
      setError(null);

      fetch(`/api/users/${user.id}/profile`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch profile: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          setProfileInfo(data);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to fetch profile");
          console.error("Profile fetch error:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return {
    profileInfo,
    loading,
    error,
    refetch,
  };
}
