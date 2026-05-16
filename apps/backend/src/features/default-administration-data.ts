import { AppModuleDto, UserStatusMasterDto, UserTypeDto } from "@repo/db/dtos";
import { UserStatusMasterT, UserTypeT } from "@repo/db/schemas";

// --------------------------------- User Types ---------------------------------
const PRIMARY_USER_TYPE = {
  Staff: "Staff",
  Student: "Student",
};

const defaultPrimaryUserTypes: UserTypeT[] = [
  {
    name: PRIMARY_USER_TYPE.Staff,
    code: "STAFF",
    description:
      "An institutional staff member with administrative or academic responsibilities.",
    color: "#6366f1",
    bgColor: "#e0e7ff",
    allowedDesignationFiltering: true,
    allowedModuleTypeFiltering: false,
  },
  {
    name: PRIMARY_USER_TYPE.Student,
    code: "STD",
    description:
      "A registered student enrolled in one or more academic programs at the institution.",
    color: "#059669",
    bgColor: "#d1fae5",
    allowedDesignationFiltering: false,
    allowedModuleTypeFiltering: true,
  },
];

const defaultSubUserTypes: UserTypeDto[] = [
  // Staff sub-types
  {
    name: "Administrator",
    code: "ADMIN",
    description:
      "A staff member with elevated administrative access for managing institutional processes.",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    allowedDesignationFiltering: true,
    allowedModuleTypeFiltering: true,
    parentUserType: defaultPrimaryUserTypes.find(
      (p) => p.name === PRIMARY_USER_TYPE.Staff,
    )!,
  },
  {
    name: "Teaching",
    code: "TCH",
    description:
      "A faculty member responsible for delivering academic instruction and course content.",
    color: "#b45309",
    bgColor: "#fef3c7",
    allowedDesignationFiltering: true,
    allowedModuleTypeFiltering: true,
    parentUserType: defaultPrimaryUserTypes.find(
      (p) => p.name === PRIMARY_USER_TYPE.Staff,
    )!,
  },
  {
    name: "Non-Teaching",
    code: "NTCH",
    description:
      "A staff member supporting institutional operations in a non-academic capacity.",
    color: "#64748b",
    bgColor: "#f1f5f9",
    allowedDesignationFiltering: true,
    allowedModuleTypeFiltering: true,
    parentUserType: defaultPrimaryUserTypes.find(
      (p) => p.name === PRIMARY_USER_TYPE.Staff,
    )!,
  },

  // Student sub-types
  {
    name: "College Student",
    code: "CSTD",
    description:
      "An actively enrolled student pursuing a degree or diploma program at the college.",
    color: "#0891b2",
    bgColor: "#cffafe",
    allowedDesignationFiltering: false,
    allowedModuleTypeFiltering: true,
    parentUserType: defaultPrimaryUserTypes.find(
      (p) => p.name === PRIMARY_USER_TYPE.Student,
    )!,
  },
  {
    name: "Applicant",
    code: "APPL",
    description:
      "A prospective student who has initiated or submitted an application for admission.",
    color: "#0284c7",
    bgColor: "#e0f2fe",
    allowedDesignationFiltering: false,
    allowedModuleTypeFiltering: false,
    parentUserType: defaultPrimaryUserTypes.find(
      (p) => p.name === PRIMARY_USER_TYPE.Student,
    )!,
  },
];

export const userTypeData = { defaultPrimaryUserTypes, defaultSubUserTypes };

// --------------------------------- User Status ---------------------------------
const PRIMARY_USER_STATUS = {
  Active: "Active",
  Inactive: "Inactive",
  Suspended: "Suspended",
  Applicant: "Applicant",
};

const defaultPrimaryUserStatuses: UserStatusMasterT[] = [
  {
    name: PRIMARY_USER_STATUS.Active,
    code: "ACTIVE",
    color: "#059669",
    bgColor: "#d1fae5",
    description:
      "User account is active and has full access to permitted modules.",
  },
  {
    name: PRIMARY_USER_STATUS.Inactive,
    code: "INACTIVE",
    color: "#dc2626",
    bgColor: "#fee2e2",
    description: "User account is inactive and cannot access the system.",
  },
  {
    name: PRIMARY_USER_STATUS.Suspended,
    code: "SUSPENDED",
    color: "#ca8a04",
    bgColor: "#fef9c3",
    description:
      "User account has been temporarily suspended due to a policy violation or administrative action.",
  },
  {
    name: PRIMARY_USER_STATUS.Applicant,
    code: "APPLICANT",
    color: "#0284c7",
    bgColor: "#e0f2fe",
    description: "Prospective student in the admission process.",
  },
];

const defaultSubUserStatuses: UserStatusMasterDto[] = [
  {
    name: "Active (Default)",
    code: "ACTIVE",
    color: "#059669",
    bgColor: "#d1fae5",
    description:
      "User account is active and has full access to permitted modules.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "ACTIVE",
    )!,
  },
  // ── INACTIVE ──────────────────────────────────────────────────────
  {
    name: "Leave of Absence",
    code: "INACT_LOA",
    color: "#6366f1",
    bgColor: "#e0e7ff",
    description:
      "User is temporarily inactive due to an approved leave of absence.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "INACTIVE",
    )!,
  },
  {
    name: "Medical Leave",
    code: "INACT_MED",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    description:
      "User is temporarily inactive due to a medical condition or health-related leave.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "INACTIVE",
    )!,
  },
  {
    name: "Semester Break",
    code: "INACT_SEM",
    color: "#57534e",
    bgColor: "#fafaf9",
    description: "User is inactive during an inter-semester break period.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "INACTIVE",
    )!,
  },
  {
    name: "Result Awaited",
    code: "INACT_RES",
    color: "#d97706",
    bgColor: "#fef3c7",
    description:
      "User's status is pending until examination results are declared.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "INACTIVE",
    )!,
  },

  // ── SUSPENDED ─────────────────────────────────────────────────────
  {
    name: "Disciplinary Suspension",
    code: "SUSP_DISC",
    color: "#b91c1c",
    bgColor: "#fee2e2",
    description:
      "User has been suspended due to a breach of institutional code of conduct.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "SUSPENDED",
    )!,
  },
  {
    name: "Fee Default",
    code: "SUSP_FEE",
    color: "#c2410c",
    bgColor: "#ffedd5",
    description:
      "User has been suspended due to non-payment or default on institutional fees.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "SUSPENDED",
    )!,
  },
  {
    name: "Attendance Shortage",
    code: "SUSP_ATT",
    color: "#ea580c",
    bgColor: "#fff7ed",
    description:
      "User has been suspended due to attendance falling below the required threshold.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "SUSPENDED",
    )!,
  },
  {
    name: "Examination Debarred",
    code: "SUSP_EXAM",
    color: "#991b1b",
    bgColor: "#fecaca",
    description:
      "User has been debarred from appearing in examinations due to eligibility criteria not being met.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "SUSPENDED",
    )!,
  },

  // ── APPLICANT ─────────────────────────────────────────────────────
  {
    name: "Applied",
    code: "APPL_APLD",
    color: "#0284c7",
    bgColor: "#e0f2fe",
    description:
      "Applicant has submitted an application and is awaiting review.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "APPLICANT",
    )!,
  },
  {
    name: "Provisionally Admitted",
    code: "APPL_PROV",
    color: "#b45309",
    bgColor: "#fef3c7",
    description:
      "Applicant has received a provisional admission offer pending document verification.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "APPLICANT",
    )!,
  },
  {
    name: "Admission Confirmed",
    code: "APPL_CONF",
    color: "#0f766e",
    bgColor: "#99f6e4",
    description:
      "Applicant's admission has been confirmed and enrollment is complete.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "APPLICANT",
    )!,
  },
  {
    name: "Admission Cancelled",
    code: "APPL_CANC",
    color: "#92400e",
    bgColor: "#fef3c7",
    description:
      "Applicant's admission has been cancelled either by the institution or the applicant.",
    parentUserStatusMaster: defaultPrimaryUserStatuses.find(
      (s) => s.code === "APPLICANT",
    )!,
  },
];

export const userStatusData = {
  defaultPrimaryUserStatuses,
  defaultSubUserStatuses,
};

// --------------------------------- App Module ---------------------------------
const PRIMARY_APP_MODULE = {
  Login: "Login",
  Dashboard: "Dashboard",
};

const defaultPrimaryAppModules: AppModuleDto[] = [
  {
    name: PRIMARY_APP_MODULE.Login,
    application: "MAIN_CONSOLE",
    description:
      "Secure entry point for authenticated access to the management console.",
    parentAppModule: null,
    iconType: "lucide",
    iconValue: "LogIn",
    image: "",
    componentKey: "LOGIN_PAGE",
    routePath: "/",
    isDynamic: false,
    isLayout: false,
    isProtected: false,
    moduleUrl: "/",
    isReadOnly: true,
    isMasterModule: false,
  },
  {
    name: PRIMARY_APP_MODULE.Dashboard,
    application: "MAIN_CONSOLE",
    description:
      "Central overview of institutional activity, metrics, and quick-access modules.",
    parentAppModule: null,
    iconType: "lucide",
    iconValue: "LayoutDashboard",
    image: "",
    componentKey: "DASHBOARD_HOME_PAGE",
    routePath: "/dashboard",
    moduleUrl: "/dashboard",
    isDynamic: false,
    isLayout: true,
    isProtected: true,
    isReadOnly: true,
    isMasterModule: false,
  },
];

export const appModuleData = { defaultPrimaryAppModules };
