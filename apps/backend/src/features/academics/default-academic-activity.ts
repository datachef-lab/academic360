import { db } from "@/db";
import { ilike } from "drizzle-orm";
import { createLogger } from "@/config/logger.js";
import { academicActivityMasterModel } from "@repo/db/schemas/models/academics/academic-activity-master.model";

const log = createLogger("default-academic-activity");

const DEFAULT_ACTIVITIES = [
  {
    name: "Semester Fee Payment",
    description: "Online & cash payment gateway for semester fees",
    type: "FINANCE" as const,
  },
  {
    name: "CU Registration",
    description: "CU affiliation registration process for enrolled students",
    type: "ADMISSION" as const,
  },
  {
    name: "Subject Selection",
    description: "Subject selection window for the upcoming semester",
    type: "ACADEMIC" as const,
  },
];

export async function initializeAcademicActivities() {
  for (const activity of DEFAULT_ACTIVITIES) {
    try {
      const [existing] = await db
        .select()
        .from(academicActivityMasterModel)
        .where(ilike(academicActivityMasterModel.name, activity.name));

      if (existing) continue;

      await db.insert(academicActivityMasterModel).values({
        name: activity.name,
        description: activity.description,
        type: activity.type,
        isActive: true,
      });

      log.info(`Default academic activity '${activity.name}' created`);
    } catch (e) {
      log.warn(`Failed to initialize academic activity '${activity.name}'`, {
        error: e,
      });
    }
  }
}
