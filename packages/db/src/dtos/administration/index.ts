import { AppModuleT, DepartmentT, UserStatusMasterT } from "@/schemas";

export interface DepartmentDto extends Omit<DepartmentT, "parentDepartmentId"> {
   parentDepartment: DepartmentDto | null;
}

export interface AppModuleDto extends Omit<AppModuleT, "parentAppModuleId"> {
   parentAppModule: AppModuleDto | null;
}

export interface UserStatusMasterDto extends Omit<UserStatusMasterT, "parentUserStatusMasterId"> {
   parentUserStatusMasterId: UserStatusMasterDto | null;
}