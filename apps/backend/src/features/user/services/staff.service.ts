import { db, mysqlConnection } from "@/db";
import { StaffDto } from "@repo/db/dtos";
import { Staff, staffModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

import * as shiftService from "@/features/academics/services/shift.service";
import { OldStaff } from "@repo/db/legacy-system-types/users";
import { upsertUser } from "./refactor-old-migration.service";

const BATCH_SIZE = 500;

export async function loadAllStaff() {
  console.log("Loading all staff...");
  const [[{ total }]] = (await mysqlConnection.query(`
        SELECT COUNT(*) as total
        FROM staffpersonaldetails
    `)) as [{ total: number }[], any];

  const totalBatches = Math.ceil(total / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const offset = i * BATCH_SIZE;
    const limit = BATCH_SIZE;

    const [oldStaffs] = (await mysqlConnection.query(`
            SELECT *
            FROM staffpersonaldetails
            LIMIT ${limit}
            OFFSET ${offset};
        `)) as [OldStaff[], any];

    for (let j = 0; j < oldStaffs.length; j++) {
      await upsertUser(oldStaffs[j], "STAFF");
      console.log(`Processed staff ${oldStaffs[j].id}`);
    }
  }
}

export async function findById(id: number) {
  const [foundStaff] = await db
    .select()
    .from(staffModel)
    .where(eq(staffModel.id, id));
  return await modelToDto(foundStaff);
}

export async function findByUserId(userId: number) {
  const [foundStaff] = await db
    .select()
    .from(staffModel)
    .where(eq(staffModel.userId, userId));
  return await modelToDto(foundStaff);
}

export async function modelToDto(
  staff: Staff | null,
): Promise<StaffDto | null> {
  if (!staff) return null;

  const { shiftId, ...props } = staff;

  return {
    ...props,
    shift: await shiftService.findById(shiftId!),
    userId: staff.userId,
  };
}
