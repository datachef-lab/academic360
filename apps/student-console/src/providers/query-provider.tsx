"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
// QueryClient is re-exported by @tanstack/react-query v4 via `export * from
// "@tanstack/query-core"`, but Next's `moduleResolution: "bundler"` doesn't
// follow that cross-package re-export, so import it from query-core directly
// (react-query's own pinned dependency — the same 4.36.1 instance).
import { QueryClient } from "@tanstack/query-core";
import { BRANDING_QUERY_KEY } from "@/features/settings/constants/query-keys";
import { fetchBranding } from "@/features/settings/services/branding-service";
import { readBrandingFromCookies } from "@/features/settings/utils/branding-cookies";

function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });

  const cachedBranding = readBrandingFromCookies();
  void queryClient.prefetchQuery({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: fetchBranding,
    staleTime: 30 * 60 * 1000,
    initialData: cachedBranding ?? undefined,
  });

  return queryClient;
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(getQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
