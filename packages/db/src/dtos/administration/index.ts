import { AccessGroupApplicationT, AccessGroupDesignationT, AccessGroupModulePermissionT, AccessGroupModuleProgramCourseClass, AccessGroupModuleProgramCourseT, AccessGroupModuleT, AccessGroupT, AccessGroupUserTypeT, AppModuleT, ClassT, DepartmentT, DesignationT, UserStatusMasterT, UserTypeT } from "@/schemas";
import { ProgramCourseDto } from "../course-design";

export interface UserTypeDto extends Omit<UserTypeT, "parentUserTypeId"> {
   parentUserType: UserTypeT | null;
}

export interface DepartmentDto extends Omit<DepartmentT, "parentDepartmentId"> {
   parentDepartment: DepartmentDto | null;
}

export interface AppModuleDto extends Omit<AppModuleT, "parentAppModuleId"> {
   parentAppModule: AppModuleDto | null;
}

export interface UserStatusMasterDto extends Omit<UserStatusMasterT, "parentUserStatusMasterId"> {
   parentUserStatusMaster: UserStatusMasterT | null;
}

export interface AccessGroupDesignationDto extends Omit<AccessGroupDesignationT, "designationId"> {
   designation: DesignationT;
}

export interface AccessGroupUserTypeDto extends Omit<AccessGroupUserTypeT, "userTypeId"> {
   userType: UserTypeT;
}

export interface AccessGroupModuleProgramCourseDto
  extends Omit<AccessGroupModuleProgramCourseT, "programCourseId"> {
  programCourse: ProgramCourseDto;
  classes: AccessGroupModuleProgramCourseClassDto[];
}

export interface AccessGroupModuleProgramCourseClassDto extends Omit<AccessGroupModuleProgramCourseClass, "classId"> {
   class: ClassT;
}

export interface AccessGroupModuleDto extends Omit<AccessGroupModuleT, "appModuleId"> {
   appModule: AppModuleT;
   programCourseAndClasses: AccessGroupModuleProgramCourseDto[];
}

export interface AccessGroupDto extends AccessGroupT {
   applications: AccessGroupApplicationT[];
   designations: AccessGroupDesignationDto[];
   userTypes: AccessGroupUserTypeDto[];
   features: AccessGroupModuleDto[];
   permissions: AccessGroupModulePermissionT[];
}

/** Nested input for access group create/update */
export interface AccessGroupApplicationInput {
   type: AccessGroupApplicationT["type"];
}

export interface AccessGroupDesignationInput {
   designationId: number;
}

export interface AccessGroupUserTypeInput {
   userTypeId: number;
}

export interface AccessGroupModulePermissionInput {
   type: AccessGroupModulePermissionT["type"];
}

export interface AccessGroupModuleClassInput {
   classId: number;
   isAllowed?: boolean;
}

export interface AccessGroupModuleProgramCourseInput {
  programCourseId: number;
  isAllowed?: boolean;
  classes?: AccessGroupModuleClassInput[];
}

export interface AccessGroupModuleInput {
   appModuleId: number;
   type?: AccessGroupModuleT["type"];
   isAllowed?: boolean;
   permissions?: AccessGroupModulePermissionInput[];
   classes?: AccessGroupModuleClassInput[];
   programCourses?: AccessGroupModuleProgramCourseInput[];
}

export interface AccessGroupCreateInput {
   name: string;
   type?: AccessGroupT["type"];
   userStatusId: number;
   code?: string | null;
   description?: string | null;
   remarks?: string | null;
   isActive?: boolean;
   applications?: AccessGroupApplicationInput[];
   designations?: AccessGroupDesignationInput[];
   userTypes?: AccessGroupUserTypeInput[];
   features?: AccessGroupModuleInput[];
}

export type AccessGroupUpdateInput = Partial<AccessGroupCreateInput>;