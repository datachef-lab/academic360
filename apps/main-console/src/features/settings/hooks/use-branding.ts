import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranding } from "@/features/settings/services/branding-service";
import {
  readBrandingFromCookies,
  writeBrandingToCookies,
} from "@/features/settings/utils/branding-cookies";
import type { BrandingData } from "@/features/settings/types/branding.type";
import { BRANDING_QUERY_KEY } from "@/features/settings/constants/query-keys";

export { BRANDING_QUERY_KEY } from "@/features/settings/constants/query-keys";

const BRANDING_STALE_TIME_MS = 30 * 60 * 1000;

function preloadImage(url: string | null | undefined): void {
  if (!url) {
    return;
  }
  const img = new Image();
  img.src = url;
}

export function useBranding() {
  const cachedBranding = useMemo(() => readBrandingFromCookies(), []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: fetchBranding,
    staleTime: BRANDING_STALE_TIME_MS,
    cacheTime: 60 * 60 * 1000,
    placeholderData: cachedBranding ?? undefined,
    initialData: cachedBranding ?? undefined,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    writeBrandingToCookies(data);
    preloadImage(data.logoUrl);
    preloadImage(data.loginScreenUrl);
  }, [data]);

  const branding: BrandingData = data ?? {
    collegeName: "",
    abbreviation: "",
    logoUrl: null,
    loginScreenUrl: null,
  };

  const hasCachedData = Boolean(cachedBranding?.collegeName || cachedBranding?.abbreviation);

  return {
    ...branding,
    isLoading: isLoading && !hasCachedData && !data?.collegeName && !data?.abbreviation,
    isRefreshing: isFetching && Boolean(data),
  };
}
