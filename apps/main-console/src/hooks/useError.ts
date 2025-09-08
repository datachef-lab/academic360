import { ErrorContext } from "@/providers/ErrorProvider";
import { useContext } from "react";

// Define the return type explicitly
type ErrorContextType = {
  showError: (error: { statusCode?: number; message?: string; retry?: () => Promise<void> }) => void;
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};
