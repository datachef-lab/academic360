import { CertificateMasterDto } from "@repo/db/dtos";

export const defaultCertificateMasterData: CertificateMasterDto[] = [
  {
    name: "Skills & Certifications",
    description:
      "Skill courses and certification programmes within or outside the institution.",
    color: "#1D4ED8",
    bgColor: "#DBEAFE",
    fields: [
      {
        certificateMasterId: 0,
        name: "Name",
        type: "TEXT",
        options: [],
        sequence: 1,
      },
      {
        certificateMasterId: 0,
        name: "Type",
        type: "SELECT",
        options: [
          { certificateFieldMasterId: 0, sequence: 1, name: "Skill Course" },
          { certificateFieldMasterId: 0, sequence: 2, name: "Certification" },
        ],
        sequence: 2,
      },
      {
        certificateMasterId: 0,
        name: "Offered By",
        type: "TEXT",
        options: [],
        sequence: 3,
      },
      {
        certificateMasterId: 0,
        name: "Status",
        type: "SELECT",
        options: [
          { certificateFieldMasterId: 0, sequence: 1, name: "Ongoing" },
          { certificateFieldMasterId: 0, sequence: 1, name: "Completed" },
          { certificateFieldMasterId: 0, sequence: 1, name: "Dropped Out" },
        ],
        sequence: 4,
      },
      {
        certificateMasterId: 0,
        name: "Year",
        type: "NUMBER",
        options: [],
        sequence: 5,
      },
    ],
    sequence: 1,
  },
  {
    name: "Professional / Competitive Exams",
    description:
      "Entrance, professional, or competitive exams being prepared for or appeared in",
    color: "#0F766E",
    bgColor: "#CCFBF1",
    fields: [
      {
        certificateMasterId: 0,
        name: "Exam Name",
        type: "TEXT",
        options: [],
        sequence: 1,
      },
      {
        certificateMasterId: 0,
        name: "Type",
        type: "SELECT",
        options: [
          {
            certificateFieldMasterId: 0,
            sequence: 1,
            name: "Professional Exam",
          },
          { certificateFieldMasterId: 0, sequence: 2, name: "Entrance Exam" },
          {
            certificateFieldMasterId: 0,
            sequence: 3,
            name: "Competitive Exam",
          },
        ],
        sequence: 2,
      },
      {
        certificateMasterId: 0,
        name: "Coaching / Mode",
        type: "TEXT",
        options: [],
        sequence: 3,
      },
      {
        certificateMasterId: 0,
        name: "Year / Attempt",
        type: "NUMBER",
        options: [],
        sequence: 4,
      },
    ],
    sequence: 2,
  },
  {
    name: "Work Experience / Internships",
    description:
      "Prior work, internship, volunteering, or family business experience",
    color: "#B45309",
    bgColor: "#FEF3C7",
    fields: [
      {
        certificateMasterId: 0,
        name: "In which semester are you planning to pursue your mandatory internship?",
        type: "SELECT",
        isQuestion: true,
        options: [
          { certificateFieldMasterId: 0, sequence: 1, name: "Semester 2" },
          { certificateFieldMasterId: 0, sequence: 2, name: "Semester 4" },
          { certificateFieldMasterId: 0, sequence: 3, name: "Semester 6" },
          { certificateFieldMasterId: 0, sequence: 4, name: "Not Applicable" },
        ],
        sequence: 1,
        isRequired: true,
      },
      {
        certificateMasterId: 0,
        name: "Organisation",
        type: "TEXT",
        options: [],
        sequence: 2,
      },
      {
        certificateMasterId: 0,
        name: "Role / Designation",
        type: "TEXT",
        options: [],
        sequence: 3,
      },
      {
        certificateMasterId: 0,
        name: "Type",
        type: "SELECT",
        options: [
          { certificateFieldMasterId: 0, sequence: 1, name: "Full-Time" },
          { certificateFieldMasterId: 0, sequence: 2, name: "Part-Time" },
          { certificateFieldMasterId: 0, sequence: 3, name: "Internship" },
          { certificateFieldMasterId: 0, sequence: 4, name: "Valunteering" },
          { certificateFieldMasterId: 0, sequence: 5, name: "Family Business" },
          { certificateFieldMasterId: 0, sequence: 5, name: "Other" },
        ],
        sequence: 4,
      },
      {
        certificateMasterId: 0,
        name: "Duration",
        type: "TEXT",
        options: [],
        sequence: 5,
      },
    ],
    sequence: 3,
  },
  {
    name: "Clubs / Committees",
    description:
      "Clubs, committees, or student bodies outside this institution aligned with career interests",
    color: "#6D28D9",
    bgColor: "#EDE9FE",
    fields: [
      {
        certificateMasterId: 0,
        name: "Club / Body Name",
        type: "TEXT",
        options: [],
        sequence: 1,
      },
      {
        certificateMasterId: 0,
        name: "Role / Position",
        type: "TEXT",
        options: [],
        sequence: 2,
      },
      {
        certificateMasterId: 0,
        name: "Active Since (Year)",
        type: "NUMBER",
        options: [],
        sequence: 3,
      },
    ],
    sequence: 4,
  },
];
