import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { paperModel } from "./paper.model";
import { academicYearModel } from "../academics";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const paperOverrideYearModel = pgTable("paper_override_years", {
    id: serial().primaryKey(),
    paperId: integer("paper_id_fk")
        .references(() => paperModel.id)
        .notNull(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createPaperOverrideYearSchema = createInsertSchema(paperOverrideYearModel);

export type PaperOverrideYear = z.infer<typeof createPaperOverrideYearSchema>;

export type PaperOverrideYearT = typeof createPaperOverrideYearSchema._type;