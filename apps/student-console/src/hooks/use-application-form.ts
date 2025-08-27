import { useContext } from "react";
import { ApplicationFormContext } from "@/providers/adm-application-form-provider";

export function useApplicationForm() {
  const context = useContext(ApplicationFormContext);
  if (context === undefined) {
    throw new Error("useApplicationForm must be used within an ApplicationFormProvider");
  }
  return context;
} 