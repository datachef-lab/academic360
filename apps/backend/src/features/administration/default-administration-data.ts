import { UserGroupDto, UserPrivilegeDto } from "@repo/db/dtos";

const userGroupsData: UserGroupDto[] = [
  {
    name: "Students",
    description:
      "Group containing all student users who can access the student console for academic activities such as viewing results, course materials, exams, and personal academic information.",
    domains: [{ userGroupId: 0, domain: "STUDENT_CONSOLE" }],
    members: [{ userGroupId: 0, member: "STUDENT" }],
    sequence: 1,
  },
  {
    name: "Academic Operations",
    description:
      "Group for staff members responsible for configuring and managing academic structures such as courses, departments, programs, semesters, and other academic master data within the main console.",
    domains: [{ userGroupId: 0, domain: "MAIN_CONSOLE" }],
    members: [{ userGroupId: 0, member: "STAFF" }],
  },
];

const userPrivilegesData: UserPrivilegeDto[] = [];
