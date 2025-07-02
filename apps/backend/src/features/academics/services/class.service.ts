import { db } from "@/db/index";
import { classModel } from "../models/class.model";
import { and, eq } from "drizzle-orm";
// import { classTypeEnum } from "@/features/user/models/helper";

export async function processClassBySemesterNumber(semester: number) {
  let className: string | undefined;
  switch (semester) {
    case 1:
      className = "SEMESTER I";
      break;
    case 2:
      className = "SEMESTER II";
      break;
    case 3:
      className = "SEMESTER III";
      break;
    case 4:
      className = "SEMESTER IV";
      break;
    case 5:
      className = "SEMESTER V";
      break;
    case 6:
      className = "SEMESTER VI";
      break;

    case 7:
      className = "SEMESTER VII";
      break;
    case 8:
      className = "SEMESTER VIII";
      break;
    default:
      className = undefined;
  }

  if (!className) throw Error("No Class found");

  const [existingClass] = await db
    .select()
    .from(classModel)
    .where(
      and(eq(classModel.name, className), eq(classModel.type, "SEMESTER")),
    );

  if (existingClass) return existingClass;

  return (
    await db
      .insert(classModel)
      .values({ name: className, type: "SEMESTER" })
      .returning()
  )[0];
}

export async function findClassById(id: number) {
  return (await db.select().from(classModel).where(eq(classModel.id, id)))[0];
}
