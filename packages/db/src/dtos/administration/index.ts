import { AccessGroupApplicationT, AccessGroupDesignationT, AccessGroupModuleClassT, AccessGroupModulePermissionT, AccessGroupModuleProgramCourseT, AccessGroupModuleT, AccessGroupT, AccessGroupUserTypeT, AppModuleT, ClassT, DepartmentT, DesignationT, UserStatusMasterT, UserTypeT } from "@/schemas";
import { ProgramCourseDto } from "../course-design";

export interface DepartmentDto extends Omit<DepartmentT, "parentDepartmentId"> {
   parentDepartment: DepartmentDto | null;
}

export interface AppModuleDto extends Omit<AppModuleT, "parentAppModuleId"> {
   parentAppModule: AppModuleDto | null;
}

export interface UserStatusMasterDto extends Omit<UserStatusMasterT, "parentUserStatusMasterId"> {
   parentUserStatusMasterId: UserStatusMasterDto | null;
}

export interface AccessGroupDesignationDto extends Omit<AccessGroupDesignationT, "designationId"> {
   designation: DesignationT;
}

export interface AccessGroupUserTypeDto extends Omit<AccessGroupUserTypeT, "userTypeId"> {
   userType: UserTypeT;
}

export interface AccessGroupModuleProgramCourseDto extends Omit<AccessGroupModuleProgramCourseT, "programCourseId"> {
   programCourse: ProgramCourseDto;
}

export interface AccessGroupModuleClassDto extends Omit<AccessGroupModuleClassT, "classId"> {
   class: ClassT;
}

export interface AccessGroupModuleDto extends Omit<AccessGroupModuleT, "appModuleId"> {
   appModule: AppModuleT;
   programCourses: AccessGroupModuleProgramCourseDto[];
   classes: AccessGroupModuleClassDto[];
}

export interface AccessGroupDto extends AccessGroupT {
   applications: AccessGroupApplicationT[];
   designations: AccessGroupDesignationDto[];
   userTypes: AccessGroupUserTypeDto[];
   features: AccessGroupModuleDto[];
   permissions: AccessGroupModulePermissionT[];
}