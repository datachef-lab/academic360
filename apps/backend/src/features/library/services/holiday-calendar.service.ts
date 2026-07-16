import { db } from "@/db/index.js";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { holidayModel } from "@repo/db/schemas/models/library/holiday.model.js";
import { classHolidayModel } from "@repo/db/schemas/models/library/class-holiday.model.js";

const startOfUtcDay = (d: Date) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

const dayDiff = (a: Date, b: Date) => {
  const ms = startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
};

export async function listHolidayDatesInRange(start: Date, end: Date) {
  const rows = await db
    .select({ from: holidayModel.from, to: holidayModel.to })
    .from(holidayModel)
    .where(
      or(
        and(
          gte(holidayModel.from, start.toISOString().slice(0, 10)),
          lte(holidayModel.from, end.toISOString().slice(0, 10)),
        ),
        and(
          gte(holidayModel.to, start.toISOString().slice(0, 10)),
          lte(holidayModel.to, end.toISOString().slice(0, 10)),
        ),
        and(
          lte(holidayModel.from, start.toISOString().slice(0, 10)),
          gte(holidayModel.to, end.toISOString().slice(0, 10)),
        ),
      ),
    );

  const set = new Set<string>();
  for (const r of rows) {
    if (!r.from || !r.to) continue;
    const from = startOfUtcDay(new Date(r.from));
    const to = startOfUtcDay(new Date(r.to));
    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      set.add(d.toISOString().slice(0, 10));
    }
  }
  return set;
}

export async function listClassHolidayDatesForClass(
  classId: number,
  start: Date,
  end: Date,
) {
  const rows = await db
    .select({
      from: holidayModel.from,
      to: holidayModel.to,
      isHoliday: classHolidayModel.isHoliday,
    })
    .from(classHolidayModel)
    .innerJoin(holidayModel, eq(holidayModel.id, classHolidayModel.holidayId))
    .where(eq(classHolidayModel.classId, classId));

  const set = new Set<string>();
  for (const r of rows) {
    if (!r.isHoliday || !r.from || !r.to) continue;
    const from = startOfUtcDay(new Date(r.from));
    const to = startOfUtcDay(new Date(r.to));
    const rangeStart = from > start ? from : startOfUtcDay(start);
    const rangeEnd = to < end ? to : startOfUtcDay(end);
    for (
      let d = new Date(rangeStart);
      d <= rangeEnd;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      set.add(d.toISOString().slice(0, 10));
    }
  }
  return set;
}

export async function countWorkingDaysBetween(
  start: Date,
  end: Date,
  classId?: number | null,
): Promise<number> {
  const total = dayDiff(start, end);
  if (total <= 0) return 0;
  const holidaySet = await listHolidayDatesInRange(start, end);
  const classSet =
    classId != null
      ? await listClassHolidayDatesForClass(classId, start, end)
      : new Set<string>();
  let lateDays = 0;
  const cursor = startOfUtcDay(start);
  for (let i = 0; i < total; i++) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const key = cursor.toISOString().slice(0, 10);
    if (holidaySet.has(key) || classSet.has(key)) continue;
    lateDays++;
  }
  return lateDays;
}
