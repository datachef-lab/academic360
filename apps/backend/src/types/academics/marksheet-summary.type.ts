import { Class } from "@repo/db/schemas/models/academics";

export interface MarksheetSummary {
  id: number;
  uid: string;
  class: Class;
  year1: number; // Year of appearance
  year2: number | null; // Year of passing
  sgpa: string | null;
  cgpa: string | null;
  credits: number;
  totalCredits: number;
  result: "PASSED" | "FAILED";
  percentage: number;
  classification: string | null;
  remarks: string | null;

}
