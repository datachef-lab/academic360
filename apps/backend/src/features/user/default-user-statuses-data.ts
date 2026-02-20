import { UserStatusMasterDto } from "@repo/db/dtos";

export const defaultUserStatusesMastersDtos: UserStatusMasterDto[] = [
  {
    tag: "Regular",
    description:
      "The regular tag is general, as it applies to student, admin and staff as well.",
    enrollmentStatus: "Enrolled",
    coexistence:
      "A student can not be a regular student of multiple semester at a time.",
    status: "ACTIVE",
    remarks: "Active Enrollment",
    isAcademicRecordsAccessible: true,
    hasFeePaymentEligibility: true,
    isExamInclusive: true,
    isFormFillupInclusive: true,
    levels: [{ userStatusMasterId: 0, level: "SYSTEM" }],
    domains: [
      { userStatusMasterId: 0, domain: "ADMIN" },
      { userStatusMasterId: 0, domain: "STAFF" },
      { userStatusMasterId: 0, domain: "STUDENT" },
    ],
    frequencies: [
      { userStatusMasterId: 0, frequency: "ALWAYS_NEW_ENTRY" },
      { userStatusMasterId: 0, frequency: "PER_SEMESTER" },
      { userStatusMasterId: 0, frequency: "ONLY_ONCE" },
    ],
  },
  {
    tag: "Suspended",
    description:
      "This tag represents that the user/staff is temporarily suspended and is not allowed to participate in academic activities during the suspension period.",
    enrollmentStatus: "On Hold",
    coexistence: "",
    status: "IN_ACTIVE",
    remarks: "Enrollment Hold",
    isAcademicRecordsAccessible: false,
    hasFeePaymentEligibility: false,
    isExamInclusive: true,
    isFormFillupInclusive: true,
    levels: [{ userStatusMasterId: 0, level: "SYSTEM" }],
    domains: [
      { userStatusMasterId: 0, domain: "ADMIN" },
      { userStatusMasterId: 0, domain: "STAFF" },
      { userStatusMasterId: 0, domain: "STUDENT" },
    ],
    frequencies: [{ userStatusMasterId: 0, frequency: "ALWAYS_NEW_ENTRY" }],
  },
  {
    tag: "Dropped Out",
    description:
      "This tag represents that the student has discontinued their studies without completing the program.",
    enrollmentStatus: "Withdrawn",
    coexistence: "Student has not taken TC and not continuing with studies.",
    status: "IN_ACTIVE",
    remarks: "Archived/Inactive",
    isAcademicRecordsAccessible: true,
    hasFeePaymentEligibility: false,
    isExamInclusive: false,
    isFormFillupInclusive: false,
    levels: [{ userStatusMasterId: 0, level: "SYSTEM" }],
    domains: [
      { userStatusMasterId: 0, domain: "ADMIN" },
      { userStatusMasterId: 0, domain: "STAFF" },
      { userStatusMasterId: 0, domain: "STUDENT" },
    ],
    frequencies: [{ userStatusMasterId: 0, frequency: "ALWAYS_NEW_ENTRY" }],
  },
  {
    tag: "Alumni",
    description:
      "This tag represents that the student has successfully completed the program and has formally left the institution.",
    enrollmentStatus: "Complete",
    coexistence: "Not Applicable",
    status: "IN_ACTIVE",
    remarks:
      "If a student is already tagged as Cancelled Admission, Alumni or has Taken Transfer Certificate (TC), no further tags can be added to the student.",
    isAcademicRecordsAccessible: false,
    hasFeePaymentEligibility: false,
    isExamInclusive: false,
    isFormFillupInclusive: false,
    levels: [{ userStatusMasterId: 0, level: "ACADEMIC" }],
    domains: [{ userStatusMasterId: 0, domain: "STUDENT" }],
    frequencies: [{ userStatusMasterId: 0, frequency: "ONLY_ONCE" }],
  },
  {
    tag: "Taken Transfer Certificate (TC)",
    description:
      "This tag represents that the student has officially collected the Transfer Certificate and is no longer associated with the institution.",
    enrollmentStatus: "Exited",
    coexistence: "",
    status: "IN_ACTIVE",
    remarks:
      "If a student is already tagged as Cancelled Admission, Alumni or has Taken Transfer Certificate (TC), no further tags can be added to the student.",
    isAcademicRecordsAccessible: false,
    hasFeePaymentEligibility: false,
    isExamInclusive: false,
    isFormFillupInclusive: false,
    levels: [{ userStatusMasterId: 0, level: "ACADEMIC" }],
    domains: [{ userStatusMasterId: 0, domain: "STUDENT" }],
    frequencies: [{ userStatusMasterId: 0, frequency: "ONLY_ONCE" }],
  },
  {
    tag: "Cancelled Admission",
    description:
      "This tag represents that the student’s admission has been cancelled and the student is no longer considered part of the academic program.",
    enrollmentStatus: "Cancelled",
    coexistence: "Admission is void; no academic record created or maintained.",
    status: "IN_ACTIVE",
    remarks:
      "If a student is already tagged as Cancelled Admission, Alumni or has Taken Transfer Certificate (TC), no further tags can be added to the student.",
    isAcademicRecordsAccessible: false,
    hasFeePaymentEligibility: false,
    isExamInclusive: false,
    isFormFillupInclusive: false,
    levels: [{ userStatusMasterId: 0, level: "ACADEMIC" }],
    domains: [{ userStatusMasterId: 0, domain: "STUDENT" }],
    frequencies: [{ userStatusMasterId: 0, frequency: "ONLY_ONCE" }],
  },
  {
    tag: "Casual",
    description:
      "This tag indicates that the student has a backlog for the semester.",
    enrollmentStatus: "Backlog",
    coexistence:
      "A student can be a casual student of multiple semesters at a time. There can be instance where a student is not a regular student of any Semester but casual of one or more.",
    status: "ACTIVE",
    remarks: "Backlog/Inactive",
    isAcademicRecordsAccessible: true,
    hasFeePaymentEligibility: true,
    isExamInclusive: true,
    isFormFillupInclusive: true,
    levels: [{ userStatusMasterId: 0, level: "ACADEMIC" }],
    domains: [{ userStatusMasterId: 0, domain: "STUDENT" }],
    frequencies: [
      { userStatusMasterId: 0, frequency: "ALWAYS_NEW_ENTRY" },
      { userStatusMasterId: 0, frequency: "PER_SEMESTER" },
      { userStatusMasterId: 0, frequency: "ONLY_ONCE" },
    ],
  },
];
