import { boolean, date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admissionModel = pgTable("admissions", {
    id: serial().primaryKey().notNull(),
    year: integer("year").notNull(),
    isClosed: boolean("is_closed").default(false).notNull(),
    startDate: date("start_date"),
    lastDate: date("last_date"),
    isArchived: boolean("archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
});
export const createAdmissionSchema = createInsertSchema(admissionModel);

export type Admission = z.infer<typeof createAdmissionSchema>;