export interface SubjectRow {
    "Stream": string;
    "Course": "HONOURS" | "GENERAL";
    "Semester": number;
    "Specialization": string | null;
    "Subject Type": string;
    "Subject Name": string;
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