export interface Student {
  id: number;
  name: string;
  uid: string;
  reg: string;
  semester: string;
  session: string;
  roll: string;
  photo: string | null;
  dob: string;
  course: string;
  category: string;
  region: string;
  status: "Active" | "Inactive";
}

export const mockStudents: Student[] = [
  {
    id: 1,
    name: "HARSHIT BAGARIA",
    uid: "010123491",
    semester: "4th Semester",
    session: "2025-26",
    reg: "017-1111-3074-23",
    roll: "ROLL98765",
    dob: "11/20/2005",
    course: "BCOM",
    category: "CCF",
    region: "NON-GUJARATI",
    status: "Inactive",
    photo: null,
  },
  {
    id: 2,
    name: "Swarna S",
    uid: "CU123456",
    semester: "4th Semester",
    session: "2025-26",
    reg: "REG20251234",
    roll: "ROLL98765",
    dob: "05/15/2004",
    course: "BBA",
    category: "General",
    region: "GUJARATI",
    status: "Active",
    photo: null,
  },
  {
    id: 3,
    name: "Rahul Kumar",
    uid: "CU123457",
    semester: "3rd Semester",
    session: "2025-26",
    reg: "REG20251235",
    roll: "ROLL98766",
    dob: "08/07/2004",
    course: "BCA",
    category: "General",
    region: "NON-GUJARATI",
    status: "Active",
    photo: null,
  },
  {
    id: 4,
    name: "Priya Singh",
    uid: "CU123458",
    semester: "2nd Semester",
    session: "2025-26",
    reg: "REG20251236",
    roll: "ROLL98767",
    dob: "01/15/2004",
    course: "BBA",
    category: "OBC",
    region: "GUJARATI",
    status: "Inactive",
    photo: null,
  },
  {
    id: 5,
    name: "Amit Sharma",
    uid: "CU123459",
    semester: "1st Semester",
    session: "2025-26",
    reg: "REG20251237",
    roll: "ROLL98768",
    dob: "12/30/2003",
    course: "BCom",
    category: "General",
    region: "NON-GUJARATI",
    status: "Active",
    photo: null,
  },
  {
    id: 6,
    name: "Neha Patel",
    uid: "CU123460",
    semester: "4th Semester",
    session: "2024-25",
    reg: "REG20251238",
    roll: "ROLL98769",
    dob: "03/11/2004",
    course: "BBA",
    category: "SC",
    region: "GUJARATI",
    status: "Inactive",
    photo: null,
  },
];
