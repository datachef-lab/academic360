import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorProvider } from "./providers/ErrorProvider";
import { Toaster } from "sonner";
import { Toaster as AppToaster } from "@/components/ui/toaster";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BRANDING_QUERY_KEY } from "./features/settings/constants/query-keys";
import { fetchBranding } from "./features/settings/services/branding-service";
import { readBrandingFromCookies } from "./features/settings/utils/branding-cookies";
import { Provider } from "react-redux";
import { store } from "./store/store";

// Create a client
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

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
          <App />
          <AppToaster />
        </ErrorProvider>
        <Toaster />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
