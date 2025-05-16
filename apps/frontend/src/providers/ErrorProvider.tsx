import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { setupAxiosInterceptors } from "@/utils/api"; // Axios instance with retry logic
import { toast } from "sonner";

// Type definitions for error context
type ApiError = {
  id: number;
  statusCode: number;
  message?: string;
  retry?: () => Promise<void>; // Retry function for failed API calls
};

type CustomError = {
  id: number;
  message: string;
};

type Error = ApiError | CustomError;

interface ErrorContextType {
  showError: (error: Omit<Error, "id">) => void; // Function to show error
}

export const ErrorContext = createContext<ErrorContextType | undefined>(
  undefined,
);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const setErrors = useState<Error[]>([])[1];

  // Function to show an error (add to errors array)
  const showError = useCallback((error: Omit<Error, "id">) => {
    console.log("Show Error Fired");
    const newError = {
      ...error,
      id: Date.now(),
      statusCode: "statusCode" in error ? error.statusCode : 500,
      message: error.message || "An error occurred.",
    };
    setErrors((prevErrors) => [...prevErrors, newError]);

    // Show error as toast notification
    toast(`Error ${newError.statusCode || "Unknown"}`, {
      description: newError.message || "An error occurred.",
      action: {
        label: "Retry",
        onClick: () => console.log("Retry Logic!"),
      },
      position: "bottom-right",
      closeButton: true,
    });

    console.log(newError);

    // Auto-dismiss error after 5 seconds
    setTimeout(() => {
      setErrors((prevErrors) => prevErrors.filter((e) => e.id !== newError.id));
    }, 5000);
  }, [setErrors]);

  useEffect(() => {
    console.log("Error Provider Setup");
    setupAxiosInterceptors(showError); // Setup Axios interceptors on mount
  }, [showError]);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
    </ErrorContext.Provider>
  );
};
