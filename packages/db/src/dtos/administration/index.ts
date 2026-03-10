import { AppModuleT, DepartmentT, UserGroupDomainT, UserGroupMemberT, UserGroupT, UserPrivilegeSubT, UserPrivilegeT, UserStatusReasonT, UserStatusSessionMappingT, UserStatusT } from "@/schemas";
import { ProgramCourseDto } from "../course-design";
import { SessionDto } from "../academics";

export interface DepartmentDto extends Omit<DepartmentT, "parentDepartmentId"> {
    parentDepartment: DepartmentDto[];
}

export interface AppModuleDto extends Omit<AppModuleT, "parentAppModuleId"> {
    parentAppModule: AppModuleDto[];
}

export interface UserGroupDto extends UserGroupT {
    domains: UserGroupDomainT[];
    members: UserGroupMemberT[];
}

export interface UserPrivilegeSubDto extends Omit<UserPrivilegeSubT, "appModuleId" | "programCourseId" | "departmentId"> {
    appModule: AppModuleDto
    programCourse?: ProgramCourseDto;
    department?: DepartmentDto;
}

export interface UserPrivilegeDto extends Omit<UserPrivilegeT, "userGroupId" | "userStatusId"> {
    group: UserGroupDto;
    status: UserStatusT;
    resources: UserPrivilegeSubDto[];
}

export interface UserStatusReasonDto extends Omit<UserStatusReasonT, "userStatusId"> {
    status: UserStatusT;
}

export interface UserStatusSessionMappingDto extends Omit<UserStatusSessionMappingT, "sessionId" | "userStatusReasonId"> {
    session: SessionDto;
    reason: UserStatusReasonDto;
}