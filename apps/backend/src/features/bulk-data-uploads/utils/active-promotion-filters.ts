import { isNull, sql } from "drizzle-orm";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";

/** Open promotion row (excludes shift-change closed / deprecated rows). */
export const activePromotionRowConditions = [
  isNull(promotionModel.endDate),
  sql`COALESCE(${promotionModel.isDeprecated}, false) = false`,
];
