import { db } from "@/db";
import { ilike } from "drizzle-orm";
import { createLogger } from "@/config/logger.js";
import { academicActivityMasterModel } from "@repo/db/schemas/models/academics/academic-activity-master.model";

const log = createLogger("default-academic-activity");

export async function initializeAcademicActivities() {
  try {
    const [existingActivity] = await db
      .select()
      .from(academicActivityMasterModel)
      .where(ilike(academicActivityMasterModel.name, "Semester Fee Payment"));

    if (existingActivity) return;

    await db.insert(academicActivityMasterModel).values({
      name: "Semester Fee Payment",
      description: "Online & cash payment gateway for semester fees",
      type: "FINANCE",
      isActive: true,
    });

    log.info("Default academic activity 'Semester Fee Payment' created");
  } catch (e) {
    log.warn("Failed to initialize academic activities", { error: e });
  }
}
