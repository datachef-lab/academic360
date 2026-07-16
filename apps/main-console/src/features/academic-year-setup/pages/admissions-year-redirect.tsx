import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentAcademicYear } from "@/store/slices/academicYearSlice";

/**
 * /admissions has no content of its own — redirect to the year-scoped hub
 * (/admissions/<year>) based on the globally-selected academic year.
 */
export default function AdmissionsYearRedirect() {
  const currentYear = useAppSelector(selectCurrentAcademicYear);
  const match = String(currentYear?.year ?? "").match(/\d{4}/);
  const year = match ? match[0] : String(new Date().getFullYear());
  return <Navigate to={year} replace />;
}
