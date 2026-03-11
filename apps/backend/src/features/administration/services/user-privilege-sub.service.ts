// import { db } from "@/db/index.js";
// import { eq } from "drizzle-orm";
// import {
//   userPrivilegeSubModel,
//   type UserPrivilegeSubT,
// } from "@repo/db/schemas/models/administration/user-privilege-sub.model.js";
// import type { UserPrivilegeSubDto } from "@repo/db/dtos/administration/index.js";

// type CreateUserPrivilegeSubInput = Omit<
//   UserPrivilegeSubT,
//   "id" | "createdAt" | "updatedAt"
// >;
// type UpdateUserPrivilegeSubInput = Partial<
//   Pick<UserPrivilegeSubT, "programCourseId" | "departmentId" | "isAccessible">
// >;

// function toUserPrivilegeSubDto(model: UserPrivilegeSubT): UserPrivilegeSubDto {
//   const { appModuleId, programCourseId, departmentId, ...rest } = model;
//   return {
//     ...rest,
//     appModule: {
//       id: 0,
//       name: "",
//       description: "",
//       moduleUrl: "",
//       parentAppModule: [],
//     } as UserPrivilegeSubDto["appModule"],
//     programCourse: undefined,
//     department: undefined,
//   };
// }

// export async function getAllUserPrivilegeSubs(): Promise<
//   UserPrivilegeSubDto[]
// > {
//   const rows = await db.select().from(userPrivilegeSubModel);
//   return rows.map(toUserPrivilegeSubDto);
// }

// export async function getUserPrivilegeSubsByPrivilegeId(
//   userPrivilegeId: number,
// ): Promise<UserPrivilegeSubDto[]> {
//   const rows = await db
//     .select()
//     .from(userPrivilegeSubModel)
//     .where(eq(userPrivilegeSubModel.userPrivilegeId, userPrivilegeId));
//   return rows.map(toUserPrivilegeSubDto);
// }

// export async function getUserPrivilegeSubById(
//   id: number,
// ): Promise<UserPrivilegeSubDto | null> {
//   const [row] = await db
//     .select()
//     .from(userPrivilegeSubModel)
//     .where(eq(userPrivilegeSubModel.id, id));
//   return row ? toUserPrivilegeSubDto(row) : null;
// }

// export async function createUserPrivilegeSub(
//   data: CreateUserPrivilegeSubInput,
// ): Promise<UserPrivilegeSubDto> {
//   const [created] = await db
//     .insert(userPrivilegeSubModel)
//     .values(data)
//     .returning();
//   return toUserPrivilegeSubDto(created);
// }

// export async function updateUserPrivilegeSub(
//   id: number,
//   data: UpdateUserPrivilegeSubInput,
// ): Promise<UserPrivilegeSubDto | null> {
//   const [updated] = await db
//     .update(userPrivilegeSubModel)
//     .set(data)
//     .where(eq(userPrivilegeSubModel.id, id))
//     .returning();
//   return updated ? toUserPrivilegeSubDto(updated) : null;
// }

// export async function deleteUserPrivilegeSub(
//   id: number,
// ): Promise<UserPrivilegeSubDto | null> {
//   const [deleted] = await db
//     .delete(userPrivilegeSubModel)
//     .where(eq(userPrivilegeSubModel.id, id))
//     .returning();
//   return deleted ? toUserPrivilegeSubDto(deleted) : null;
// }
