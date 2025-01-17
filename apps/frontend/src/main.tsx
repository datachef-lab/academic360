import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/providers/ThemeProvider.tsx";
import { ErrorProvider } from "./providers/ErrorProvider.tsx";
import { Toaster } from "sonner";

// Import your Publishable Key
// const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// if (!PUBLISHABLE_KEY) {
//   throw new Error("Missing Publishable Key");
// }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorProvider>
        <App />
      </ErrorProvider>
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
);
