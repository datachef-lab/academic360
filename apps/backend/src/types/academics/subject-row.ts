export interface SubjectRow {
    "Stream": string;
    "Course": "HONOURS" | "GENERAL";
    "Semester": number;
    "Specialization": string | null;
    "Subject Type as per Marksheet": string;
    "Subject Type as per IRP": string;
    "Subject Name as per Marksheet (also in IRP)": string;
    "Subject Code as per Marksheet": string;
    "Subject Code as per IRP": string;
    "Credit": number;
    "TH": number | null;
    "TU": number | null;
    "PR": number | null;
    "IN": number | null;
    "Full Marks": number | null;
    "Total Subjects": number | null;
    "Category": string | null;
    "Framework": "CCF" | "CBCS";
    "PROJ": number | null;
    "VIVA": number | null;
    "Optional": string | null;
}