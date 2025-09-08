import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
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

import { sessionModel } from "@/schemas/models/academics";
import { admissionFormStatus } from "@/schemas/enums";

export const admissionModel = pgTable("admissions", {
  id: serial().primaryKey().notNull(),
  sessionId: integer("session_id_fk")
    .references(() => sessionModel.id)
    .notNull(),
  status: admissionFormStatus("status").notNull(),
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
export const createAdmissionSchema = createInsertSchema(admissionModel) as z.ZodTypeAny;

export type Admission = z.infer<typeof createAdmissionSchema>;

export type AdmissionT = typeof createAdmissionSchema._type;