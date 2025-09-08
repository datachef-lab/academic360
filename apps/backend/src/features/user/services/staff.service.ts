import { db } from "@/db";
import { StaffDto } from "@repo/db/dtos";
import { Staff, staffModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

import * as shiftService from "@/features/academics/services/shift.service";

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
