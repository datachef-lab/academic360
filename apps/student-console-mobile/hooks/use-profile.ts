import type { ProfileInfo } from "@repo/db/dtos/user";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

/** The profile is a heavy composite query, and several screens call useProfile()
 * more than once per mount (the CU registration screen calls it twice). Share one
 * request between concurrent callers and hold the result briefly, so a remount or
 * a second consumer doesn't hit the API again. */
const TTL_MS = 60_000;

const cache = new Map<number, { data: ProfileInfo; at: number }>();
const inflight = new Map<number, Promise<ProfileInfo>>();

function cached(userId: number): ProfileInfo | null {
  const hit = cache.get(userId);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(userId);
    return null;
  }
  return hit.data;
}

function loadProfile(userId: number, force: boolean): Promise<ProfileInfo> {
  if (!force) {
    const hit = cached(userId);
    if (hit) return Promise.resolve(hit);
    const pending = inflight.get(userId);
    if (pending) return pending;
  }
  const request = axiosInstance
    .get(`/api/users/${userId}/profile`)
    .then((response) => {
      const data = response.data as ProfileInfo;
      cache.set(userId, { data, at: Date.now() });
      return data;
    })
    .finally(() => inflight.delete(userId));
  inflight.set(userId, request);
  return request;
}

/** Drop the cached profile, e.g. after saving profile changes. */
export function invalidateProfile(userId?: number) {
  if (userId == null) cache.clear();
  else cache.delete(userId);
}

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(() =>
    userId ? cached(userId) : null,
  );
  const [loading, setLoading] = useState(() => !(userId && cached(userId)));
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(
    async (force = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        setProfileInfo(await loadProfile(userId, force));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch profile");
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const refetch = useCallback(() => fetchProfile(true), [fetchProfile]);

  return {
    profileInfo,
    loading,
    error,
    refetch,
  };
}
