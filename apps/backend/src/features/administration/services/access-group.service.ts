import { db } from "@/db/index.js";
import { asc, eq } from "drizzle-orm";
import {
  accessGroupModel,
  accessGroupApplicationModel,
  accessGroupDesignationModel,
  accessGroupUserTypeModel,
  accessGroupModuleModel,
  accessGroupModulePermissionModel,
  accessGroupModuleProgramCourseModel,
  accessGroupModuleProgramCourseClassModel,
  designationModel,
  userTypeModel,
  appModuleModel,
} from "@repo/db/schemas/models/administration";
import { classModel } from "@repo/db/schemas/models/academics";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";
import type {
  AccessGroupDto,
  AccessGroupCreateInput,
  AccessGroupUpdateInput,
} from "@repo/db/dtos/administration";
import type {
  AccessGroupApplicationT,
  AccessGroupDesignationT,
  AccessGroupUserTypeT,
  AccessGroupModulePermissionT,
} from "@repo/db/schemas/models/administration";
import type {
  DesignationT,
  UserTypeT,
} from "@repo/db/schemas/models/administration";

async function modelToDto(
  model: typeof accessGroupModel.$inferSelect | null,
): Promise<AccessGroupDto | null> {
  if (!model) return null;

  const applications = await db
    .select()
    .from(accessGroupApplicationModel)
    .where(eq(accessGroupApplicationModel.accessGroupId, model.id));

  const designationRows = await db
    .select()
    .from(accessGroupDesignationModel)
    .where(eq(accessGroupDesignationModel.accessGroupId, model.id));

  const designations = [];
  for (const row of designationRows) {
    const [des] = await db
      .select()
      .from(designationModel)
      .where(eq(designationModel.id, row.designationId));
    if (des) {
      const { designationId: _d, ...rest } = row;
      designations.push({ ...rest, designation: des as DesignationT });
    }
  }

  const userTypeRows = await db
    .select()
    .from(accessGroupUserTypeModel)
    .where(eq(accessGroupUserTypeModel.accessGroupId, model.id));

  const userTypes = [];
  for (const row of userTypeRows) {
    const [ut] = await db
      .select()
      .from(userTypeModel)
      .where(eq(userTypeModel.id, row.userTypeId));
    if (ut) {
      const { userTypeId: _u, ...rest } = row;
      userTypes.push({ ...rest, userType: ut as UserTypeT });
    }
  }

  const moduleRows = await db
    .select()
    .from(accessGroupModuleModel)
    .where(eq(accessGroupModuleModel.accessGroupId, model.id));

  const features = [];
  const allPermissions: AccessGroupModulePermissionT[] = [];

  for (const mod of moduleRows) {
    const [appMod] = await db
      .select()
      .from(appModuleModel)
      .where(eq(appModuleModel.id, mod.appModuleId));
    if (!appMod) continue;

    const permRows = await db
      .select()
      .from(accessGroupModulePermissionModel)
      .where(eq(accessGroupModulePermissionModel.accessGroupModuleId, mod.id));
    allPermissions.push(...(permRows as AccessGroupModulePermissionT[]));

    const pcRows = await db
      .select()
      .from(accessGroupModuleProgramCourseModel)
      .where(
        eq(accessGroupModuleProgramCourseModel.accessGroupModuleId, mod.id),
      );

    const programCourseAndClasses = [];
    for (const pc of pcRows) {
      const pcDto = await programCourseService.findById(pc.programCourseId);
      if (pcDto) {
        const pcClassRows = await db
          .select()
          .from(accessGroupModuleProgramCourseClassModel)
          .where(
            eq(
              accessGroupModuleProgramCourseClassModel.accessGroupModuleProgramCourseId,
              pc.id,
            ),
          );
        const pcClasses = [];
        for (const pcc of pcClassRows) {
          const [c] = await db
            .select()
            .from(classModel)
            .where(eq(classModel.id, pcc.classId));
          if (c) {
            const { classId: _c, ...rest } = pcc;
            pcClasses.push({ ...rest, class: c });
          }
        }
        const { programCourseId: _p, ...rest } = pc;
        programCourseAndClasses.push({
          ...rest,
          programCourse: pcDto,
          classes: pcClasses,
        });
      }
    }

    const { appModuleId: _a, ...modRest } = mod;
    features.push({
      ...modRest,
      appModule: appMod,
      programCourseAndClasses,
    });
  }

  return {
    ...model,
    applications: applications as AccessGroupApplicationT[],
    designations,
    userTypes,
    features,
    permissions: allPermissions,
  };
}

export async function createAccessGroup(
  data: AccessGroupCreateInput,
): Promise<AccessGroupDto> {
  const {
    applications = [],
    designations = [],
    userTypes = [],
    features = [],
    ...rest
  } = data;

  if (!rest.name?.trim()) {
    throw new Error("Access group name is required.");
  }
  if (rest.userStatusId == null) {
    throw new Error("User status is required.");
  }

  const [created] = await db
    .insert(accessGroupModel)
    .values({
      name: rest.name.trim(),
      type: rest.type ?? "BASIC",
      userStatusId: rest.userStatusId,
      code: rest.code ?? null,
      description: rest.description ?? null,
      remarks: rest.remarks ?? null,
      isActive: rest.isActive ?? true,
    })
    .returning();

  if (!created) throw new Error("Failed to create access group.");

  const accessGroupId = created.id;

  for (const app of applications) {
    await db.insert(accessGroupApplicationModel).values({
      accessGroupId,
      type: app.type,
    });
  }

  for (const des of designations) {
    await db.insert(accessGroupDesignationModel).values({
      accessGroupId,
      designationId: des.designationId,
    });
  }

  for (const ut of userTypes) {
    await db.insert(accessGroupUserTypeModel).values({
      accessGroupId,
      userTypeId: ut.userTypeId,
    });
  }

  for (const feat of features) {
    const [mod] = await db
      .insert(accessGroupModuleModel)
      .values({
        accessGroupId,
        appModuleId: feat.appModuleId,
        type: feat.type ?? "STATIC",
        isAllowed: feat.isAllowed ?? true,
      })
      .returning();

    if (mod) {
      const modId = mod.id;
      for (const p of feat.permissions ?? []) {
        await db.insert(accessGroupModulePermissionModel).values({
          accessGroupModuleId: modId,
          type: p.type,
        });
      }
      for (const pc of feat.programCourses ?? []) {
        const [pcRow] = await db
          .insert(accessGroupModuleProgramCourseModel)
          .values({
            accessGroupModuleId: modId,
            programCourseId: pc.programCourseId,
            isAllowed: pc.isAllowed ?? true,
          })
          .returning();
        if (pcRow && pc.classes?.length) {
          for (const c of pc.classes) {
            await db.insert(accessGroupModuleProgramCourseClassModel).values({
              accessGroupModuleProgramCourseId: pcRow.id,
              classId: c.classId,
              isAllowed: c.isAllowed ?? true,
            });
          }
        }
      }
    }
  }

  const dto = await modelToDto(created);
  if (!dto) throw new Error("Failed to map created access group.");
  return dto;
}

export async function getAllAccessGroups(): Promise<AccessGroupDto[]> {
  const rows = await db
    .select()
    .from(accessGroupModel)
    .orderBy(asc(accessGroupModel.id));
  const dtos = await Promise.all(rows.map((r) => modelToDto(r)));
  return dtos.filter((d): d is AccessGroupDto => d != null);
}

export async function findAccessGroupById(
  id: number,
): Promise<AccessGroupDto | null> {
  const [row] = await db
    .select()
    .from(accessGroupModel)
    .where(eq(accessGroupModel.id, id));
  return modelToDto(row ?? null);
}

async function upsertNestedForUpdate(
  accessGroupId: number,
  data: AccessGroupUpdateInput,
  existing: typeof accessGroupModel.$inferSelect,
): Promise<void> {
  // Applications: replace (delete not in payload, upsert each in payload)
  if (data.applications !== undefined) {
    const existingApps = await db
      .select()
      .from(accessGroupApplicationModel)
      .where(eq(accessGroupApplicationModel.accessGroupId, accessGroupId));

    const payloadTypes = new Set(data.applications.map((a) => a.type));
    const toDelete = existingApps.filter((e) => !payloadTypes.has(e.type));
    for (const d of toDelete) {
      await db
        .delete(accessGroupApplicationModel)
        .where(eq(accessGroupApplicationModel.id, d.id));
    }
    for (const app of data.applications) {
      const found = existingApps.find((e) => e.type === app.type);
      if (found) {
        await db
          .update(accessGroupApplicationModel)
          .set({ type: app.type })
          .where(eq(accessGroupApplicationModel.id, found.id));
      } else {
        await db.insert(accessGroupApplicationModel).values({
          accessGroupId,
          type: app.type,
        });
      }
    }
  }

  // Designations
  if (data.designations !== undefined) {
    const existingDes = await db
      .select()
      .from(accessGroupDesignationModel)
      .where(eq(accessGroupDesignationModel.accessGroupId, accessGroupId));
    const payloadIds = new Set(data.designations.map((d) => d.designationId));
    const toDeleteDes = existingDes.filter(
      (e) => !payloadIds.has(e.designationId),
    );
    for (const d of toDeleteDes) {
      await db
        .delete(accessGroupDesignationModel)
        .where(eq(accessGroupDesignationModel.id, d.id));
    }
    for (const des of data.designations) {
      const found = existingDes.find(
        (e) => e.designationId === des.designationId,
      );
      if (!found) {
        await db.insert(accessGroupDesignationModel).values({
          accessGroupId,
          designationId: des.designationId,
        });
      }
    }
  }

  // User types
  if (data.userTypes !== undefined) {
    const existingUt = await db
      .select()
      .from(accessGroupUserTypeModel)
      .where(eq(accessGroupUserTypeModel.accessGroupId, accessGroupId));
    const payloadUtIds = new Set(data.userTypes.map((u) => u.userTypeId));
    const toDeleteUt = existingUt.filter(
      (e) => !payloadUtIds.has(e.userTypeId),
    );
    for (const d of toDeleteUt) {
      await db
        .delete(accessGroupUserTypeModel)
        .where(eq(accessGroupUserTypeModel.id, d.id));
    }
    for (const ut of data.userTypes) {
      const found = existingUt.find((e) => e.userTypeId === ut.userTypeId);
      if (!found) {
        await db.insert(accessGroupUserTypeModel).values({
          accessGroupId,
          userTypeId: ut.userTypeId,
        });
      }
    }
  }

  // Features (modules) with permissions, classes, programCourses
  if (data.features !== undefined) {
    const existingMods = await db
      .select()
      .from(accessGroupModuleModel)
      .where(eq(accessGroupModuleModel.accessGroupId, accessGroupId));

    const payloadAppModIds = new Set(data.features.map((f) => f.appModuleId));
    const toDeleteMods = existingMods.filter(
      (e) => !payloadAppModIds.has(e.appModuleId),
    );

    for (const dm of toDeleteMods) {
      await db
        .delete(accessGroupModulePermissionModel)
        .where(eq(accessGroupModulePermissionModel.accessGroupModuleId, dm.id));
      await db
        .delete(accessGroupModuleProgramCourseModel)
        .where(
          eq(accessGroupModuleProgramCourseModel.accessGroupModuleId, dm.id),
        );
      await db
        .delete(accessGroupModuleModel)
        .where(eq(accessGroupModuleModel.id, dm.id));
    }

    const deletedModIds = new Set(toDeleteMods.map((m) => m.id));
    const availableMods = existingMods.filter((m) => !deletedModIds.has(m.id));

    for (const feat of data.features) {
      let mod = availableMods.find((e) => e.appModuleId === feat.appModuleId);

      if (mod) {
        await db
          .update(accessGroupModuleModel)
          .set({
            type: feat.type ?? mod.type,
            isAllowed: feat.isAllowed ?? mod.isAllowed,
          })
          .where(eq(accessGroupModuleModel.id, mod.id));
      } else {
        const [inserted] = await db
          .insert(accessGroupModuleModel)
          .values({
            accessGroupId,
            appModuleId: feat.appModuleId,
            type: feat.type ?? "STATIC",
            isAllowed: feat.isAllowed ?? true,
          })
          .returning();
        mod = inserted ?? null;
      }

      if (!mod) continue;
      const modId = mod.id;

      // Permissions
      if (feat.permissions !== undefined) {
        const existingPerms = await db
          .select()
          .from(accessGroupModulePermissionModel)
          .where(
            eq(accessGroupModulePermissionModel.accessGroupModuleId, modId),
          );
        const payloadPermTypes = new Set(feat.permissions.map((p) => p.type));
        const toDelPerms = existingPerms.filter(
          (e) => !payloadPermTypes.has(e.type),
        );
        for (const p of toDelPerms) {
          await db
            .delete(accessGroupModulePermissionModel)
            .where(eq(accessGroupModulePermissionModel.id, p.id));
        }
        for (const p of feat.permissions) {
          const found = existingPerms.find((e) => e.type === p.type);
          if (!found) {
            await db.insert(accessGroupModulePermissionModel).values({
              accessGroupModuleId: modId,
              type: p.type,
            });
          }
        }
      }

      // Program courses (with per-PC classes)
      if (feat.programCourses !== undefined) {
        const existingPcs = await db
          .select()
          .from(accessGroupModuleProgramCourseModel)
          .where(
            eq(accessGroupModuleProgramCourseModel.accessGroupModuleId, modId),
          );
        const payloadPcIds = new Set(
          feat.programCourses.map((pc) => pc.programCourseId),
        );
        const toDelPcs = existingPcs.filter(
          (e) => !payloadPcIds.has(e.programCourseId),
        );
        for (const pc of toDelPcs) {
          await db
            .delete(accessGroupModuleProgramCourseModel)
            .where(eq(accessGroupModuleProgramCourseModel.id, pc.id));
        }
        for (const pc of feat.programCourses) {
          const found = existingPcs.find(
            (e) => e.programCourseId === pc.programCourseId,
          );
          if (!found) {
            const [pcRow] = await db
              .insert(accessGroupModuleProgramCourseModel)
              .values({
                accessGroupModuleId: modId,
                programCourseId: pc.programCourseId,
                isAllowed: pc.isAllowed ?? true,
              })
              .returning();
            if (pcRow && pc.classes?.length) {
              for (const c of pc.classes) {
                await db
                  .insert(accessGroupModuleProgramCourseClassModel)
                  .values({
                    accessGroupModuleProgramCourseId: pcRow.id,
                    classId: c.classId,
                    isAllowed: c.isAllowed ?? true,
                  });
              }
            }
          } else {
            await db
              .update(accessGroupModuleProgramCourseModel)
              .set({ isAllowed: pc.isAllowed ?? found.isAllowed })
              .where(eq(accessGroupModuleProgramCourseModel.id, found.id));
            const payloadClassIds = new Set(
              (pc.classes ?? []).map((c) => c.classId),
            );
            const existingPcClasses = await db
              .select()
              .from(accessGroupModuleProgramCourseClassModel)
              .where(
                eq(
                  accessGroupModuleProgramCourseClassModel.accessGroupModuleProgramCourseId,
                  found.id,
                ),
              );
            const toDelPcClasses = existingPcClasses.filter(
              (e) => !payloadClassIds.has(e.classId),
            );
            for (const c of toDelPcClasses) {
              await db
                .delete(accessGroupModuleProgramCourseClassModel)
                .where(eq(accessGroupModuleProgramCourseClassModel.id, c.id));
            }
            for (const c of pc.classes ?? []) {
              const cFound = existingPcClasses.find(
                (e) => e.classId === c.classId,
              );
              if (!cFound) {
                await db
                  .insert(accessGroupModuleProgramCourseClassModel)
                  .values({
                    accessGroupModuleProgramCourseId: found.id,
                    classId: c.classId,
                    isAllowed: c.isAllowed ?? true,
                  });
              } else {
                await db
                  .update(accessGroupModuleProgramCourseClassModel)
                  .set({ isAllowed: c.isAllowed ?? cFound.isAllowed })
                  .where(
                    eq(accessGroupModuleProgramCourseClassModel.id, cFound.id),
                  );
              }
            }
          }
        }
      }
    }
  }
}

export async function updateAccessGroup(
  id: number,
  data: AccessGroupUpdateInput,
): Promise<AccessGroupDto | null> {
  const [existing] = await db
    .select()
    .from(accessGroupModel)
    .where(eq(accessGroupModel.id, id));

  if (!existing) return null;

  const updatePayload: Partial<typeof accessGroupModel.$inferInsert> = {};
  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.type !== undefined) updatePayload.type = data.type;
  if (data.userStatusId !== undefined)
    updatePayload.userStatusId = data.userStatusId;
  if (data.code !== undefined) updatePayload.code = data.code;
  if (data.description !== undefined)
    updatePayload.description = data.description;
  if (data.remarks !== undefined) updatePayload.remarks = data.remarks;
  if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

  if (Object.keys(updatePayload).length > 0) {
    await db
      .update(accessGroupModel)
      .set(updatePayload)
      .where(eq(accessGroupModel.id, id));
  }

  await upsertNestedForUpdate(id, data, existing);

  const [updated] = await db
    .select()
    .from(accessGroupModel)
    .where(eq(accessGroupModel.id, id));

  return modelToDto(updated ?? null);
}

export async function deleteAccessGroupSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(accessGroupModel)
    .where(eq(accessGroupModel.id, id));

  if (!found) return null;

  const modules = await db
    .select()
    .from(accessGroupModuleModel)
    .where(eq(accessGroupModuleModel.accessGroupId, id));

  for (const mod of modules) {
    await db
      .delete(accessGroupModulePermissionModel)
      .where(eq(accessGroupModulePermissionModel.accessGroupModuleId, mod.id));
    await db
      .delete(accessGroupModuleProgramCourseModel)
      .where(
        eq(accessGroupModuleProgramCourseModel.accessGroupModuleId, mod.id),
      );
  }

  await db
    .delete(accessGroupModuleModel)
    .where(eq(accessGroupModuleModel.accessGroupId, id));
  await db
    .delete(accessGroupApplicationModel)
    .where(eq(accessGroupApplicationModel.accessGroupId, id));
  await db
    .delete(accessGroupDesignationModel)
    .where(eq(accessGroupDesignationModel.accessGroupId, id));
  await db
    .delete(accessGroupUserTypeModel)
    .where(eq(accessGroupUserTypeModel.accessGroupId, id));

  const [deleted] = await db
    .delete(accessGroupModel)
    .where(eq(accessGroupModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Access group deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete access group.",
    records: [],
  };
}
