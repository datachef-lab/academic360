import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ErrorProvider } from "./providers/ErrorProvider.jsx";
import { Toaster } from "sonner";
import { Provider } from "react-redux";
import { store } from "@/app/store.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </ErrorProvider>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
