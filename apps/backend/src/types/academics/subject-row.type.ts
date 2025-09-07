export interface SubjectRow {
  Stream: string;
  Course: "HONOURS" | "GENERAL" | undefined;
  Semester: number;
  Specialization: string | null;
  "Subject Type as per Marksheet": string;
  "Subject Type as per IRP": string;
  "Subject Name as per Marksheet (also in IRP)": string;
  "Subject Code as per Marksheet": string;
  "Subject Code as per IRP": string | null;
  "Total Credit": number;
  "Theory Credit": number;
  "Practical Credit": number;
  "Internal Credit": number;
  "Project Credit": number;
  "Viva Credit": number;
  "Full Marks": number | null;
  "Full Marks Theory": number | null;
  "Full Marks Practical": number | null;
  "Full Marks Internal": number | null;
  "Full Marks Project": number | null;
  "Full Marks Viva": number | null;

  Category: string | null;
  Framework: "CCF" | "CBCS";

  "Is Optional?": boolean;
}
