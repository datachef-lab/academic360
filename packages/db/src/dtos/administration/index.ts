import { 
    AppModuleT, 
    DepartmentT, 
    DesignationT, 
    UserGroupDomainT, 
    UserGroupMemberT, 
    UserGroupT, 
    UserPrivilegeSubProgramCourseT, 
    UserPrivilegeSubScopeT, 
    UserPrivilegeSubT, 
    UserPrivilegeT, 
    UserStatusReasonT, 
    UserStatusSessionMappingT, 
    UserStatusT,
} from "@/schemas";
import { ProgramCourseDto } from "../course-design";
import { SessionDto } from "../academics";

export interface DepartmentDto extends Omit<DepartmentT, "parentDepartmentId"> {
    parentDepartment: DepartmentDto | null;
}

export interface AppModuleDto extends Omit<AppModuleT, "parentAppModuleId"> {
    parentAppModule: AppModuleDto | null;
}

export interface UserGroupDto extends UserGroupT {
    domains: UserGroupDomainT[];
    members: UserGroupMemberT[];
}

export interface UserPrivilegeSubProgramCourseDto extends Omit<UserPrivilegeSubProgramCourseT, "programCourseId"> {
    programCourse: ProgramCourseDto;
}

export interface UserPrivilegeSubScopeDto extends Omit<UserPrivilegeSubScopeT, "departmentId" | "designationId"> {
    department?: DepartmentDto;
    designation?: DesignationT;
}

export interface UserPrivilegeSubDto extends Omit<UserPrivilegeSubT, "appModuleId"> {
    appModule: AppModuleDto;
    programCourses?: UserPrivilegeSubProgramCourseDto[];
    scopes?: UserPrivilegeSubScopeDto[];
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