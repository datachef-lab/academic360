import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { date, doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { feesStructureModel } from "@/schemas/models/fees";

export const instalmentModel = pgTable("instalments", {
    id: serial().primaryKey(),
    feesStructureId: integer("fees_structure_id_fk")
        .references(() => feesStructureModel.id)
        .notNull(),
    instalmentNumber: integer().notNull(),
    baseAmount: doublePrecision().default(0).notNull(),
    startDate: date(),
    endDate: date(),
    onlineStartDate: date(),
    onlineEndDate: date(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createInstalmentSchema = createInsertSchema(instalmentModel);

export type Instalment = z.infer<typeof createInstalmentSchema>; 