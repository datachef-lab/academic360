import { BookOpen, Database, GraduationCap, type LucideIcon } from "lucide-react";

export const AFFILIATIONS = [
  "Calcutta University",
  "Jadavpur University",
  "Presidency University",
  "WBUT",
];
export const REGULATIONS = ["Regulation 2019", "Regulation 2021", "Regulation 2023", "CBCS 2017"];
export const YEARS = ["2024-25", "2023-24", "2022-23", "2021-22"];
export const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export type BulkCategoryId = "reg_roll" | "form_fillup" | "result_upload";

export const CATEGORIES: {
  id: BulkCategoryId;
  label: string;
  full: string;
  icon: LucideIcon;
  color: string;
  light: string;
  border: string;
}[] = [
  {
    id: "reg_roll",
    label: "CU Reg & Roll Number",
    full: "CU Reg Number and Roll Number",
    icon: Database,
    color: "#4f46e5",
    light: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    id: "form_fillup",
    label: "Form Fill Up Data",
    full: "Form Fill Up Data",
    icon: BookOpen,
    color: "#0369a1",
    light: "#e0f2fe",
    border: "#bae6fd",
  },
  {
    id: "result_upload",
    label: "Result Upload",
    full: "Result Upload",
    icon: GraduationCap,
    color: "#047857",
    light: "#d1fae5",
    border: "#a7f3d0",
  },
];

export const COLUMNS: Record<BulkCategoryId, string[]> = {
  reg_roll: ["UID", "CU Reg Number", "CU Roll Number"],
  form_fillup: ["CU Reg Number", "CU Roll Number", "Appear Type", "Form Fill Up Status"],
  result_upload: ["CU Reg Number", "CU Roll Number", "Appear Type", "Result Status"],
};

export type SampleRow = Record<string, string | undefined> & {
  _s: "ok" | "err";
  _e?: string;
};

export const SAMPLE_CLEAN: Record<BulkCategoryId, SampleRow[]> = {
  reg_roll: [
    {
      UID: "STU001",
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      _s: "ok",
    },
    {
      UID: "STU002",
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      _s: "ok",
    },
    {
      UID: "STU003",
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      _s: "ok",
    },
    {
      UID: "STU004",
      "CU Reg Number": "2021-0004",
      "CU Roll Number": "10104",
      _s: "ok",
    },
    {
      UID: "STU005",
      "CU Reg Number": "2021-0005",
      "CU Roll Number": "10105",
      _s: "ok",
    },
  ],
  form_fillup: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Form Fill Up Status": "COMPLETED",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Form Fill Up Status": "PENDING",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      "Appear Type": "Regular",
      "Form Fill Up Status": "COMPLETED",
      _s: "ok",
    },
  ],
  result_upload: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Result Status": "Pass",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Result Status": "Fail",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      "Appear Type": "Regular",
      "Result Status": "Pass",
      _s: "ok",
    },
  ],
};

export const SAMPLE_ERRORS: Record<BulkCategoryId, SampleRow[]> = {
  reg_roll: [
    {
      UID: "STU001",
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      _s: "ok",
    },
    {
      UID: "STU002",
      "CU Reg Number": "",
      "CU Roll Number": "10102",
      _s: "err",
      _e: "CU Reg Number is missing",
    },
    {
      UID: "STU003",
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      _s: "ok",
    },
    {
      UID: "STU004",
      "CU Reg Number": "2021-0004",
      "CU Roll Number": "",
      _s: "err",
      _e: "CU Roll Number is missing",
    },
    {
      UID: "STU005",
      "CU Reg Number": "2021-0005",
      "CU Roll Number": "10105",
      _s: "ok",
    },
  ],
  form_fillup: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Form Fill Up Status": "COMPLETED",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Form Fill Up Status": "PENDING",
      _s: "err",
      _e: "Example validation message for demo",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "",
      "Appear Type": "Regular",
      "Form Fill Up Status": "",
      _s: "err",
      _e: "CU Roll Number and Form Fill Up Status missing",
    },
  ],
  result_upload: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Result Status": "Pass",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Result Status": "Fail",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      "Appear Type": "Regular",
      "Result Status": "",
      _s: "err",
      _e: "Result Status is missing",
    },
  ],
};
