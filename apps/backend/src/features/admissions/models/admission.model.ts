import { academicYearModel } from "@/features/academics/models/academic-year.model.js";
import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admissionModel = pgTable("admissions", {
  id: serial().primaryKey().notNull(),
  academicYearId: integer("academic_year_id_fk")
    .references(() => academicYearModel.id)
    .notNull(),
  admissionCode: varchar({ length: 255 }),
  isClosed: boolean("is_closed").default(false).notNull(),
  startDate: date("start_date"),
  lastDate: date("last_date"),
  isArchived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  remarks: text("remarks"),
});
export const createAdmissionSchema = createInsertSchema(admissionModel);

export type Admission = z.infer<typeof createAdmissionSchema>;
