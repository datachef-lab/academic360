import { db } from "@/db";
import { AcademicActivityDto } from "@repo/db/dtos";
import { academicActivityModel } from "@repo/db/schemas/models/academics/academic-activity.model";
import { ilike } from "drizzle-orm";

export const defaultAcademicActivities: AcademicActivityDto[] = [
  {
    name: "Semester Fee Payment",
    description: "Online & cash payment gateway for semester fees",
    audience: "STUDENT",
    startDate: new Date(),
    isEnabled: true,
    classes: [],
    programCourses: [],
  },
];

export async function initializeAcademicActivities() {
  for (const activity of defaultAcademicActivities) {
    const [existingActivity] = await db
      .select()
      .from(academicActivityModel)
      .where(ilike(academicActivityModel.name, activity.name));
    if (existingActivity) {
      continue;
    }
    await db.insert(academicActivityModel).values(activity);
  }
}
