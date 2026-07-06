"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
