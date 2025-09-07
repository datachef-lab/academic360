import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { admissionAdditionalInfoModel } from "@repo/db/schemas/models/admissions";
import { sportsCategoryModel } from "@repo/db/schemas/models/admissions";
import { sportsLevelType } from "@repo/db/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sportsInfoModel = pgTable("sports_info", {
  id: serial().primaryKey(),
  additionalInfoId: integer("additional_info_id_fk")
    .references(() => admissionAdditionalInfoModel.id)
    .notNull(),
  sportsCategoryId: integer("sports_category_id_fk")
    .references(() => sportsCategoryModel.id)
    .notNull(),
  level: sportsLevelType().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createSportsInfoSchema = createInsertSchema(sportsInfoModel);

export type SportsInfo = z.infer<typeof createSportsInfoSchema>;
