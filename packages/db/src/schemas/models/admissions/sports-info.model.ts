import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { sportsLevelType } from "@/schemas/enums";
import { admissionAdditionalInfoModel, sportsCategoryModel } from "@/schemas/models/admissions";

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
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createSportsInfoSchema = createInsertSchema(sportsInfoModel);

export type SportsInfo = z.infer<typeof createSportsInfoSchema>;