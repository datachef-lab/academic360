import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { idProofTypeEnum } from "@/schemas/enums";

export const serviceAlumniIntakeModel = pgTable("service_alumni_intake", {
    id: serial().primaryKey(),
    fullName: varchar({ length: 255 }).notNull(),
    yearOfPassing: varchar({ length: 10 }).notNull(),
    courseStream: varchar({ length: 255 }).notNull(),
    universityRegNo: varchar({ length: 255 }),
    collegeRollNo: varchar({ length: 255 }),
    mobileWhatsapp: varchar({ length: 20 }).notNull(),
    email: varchar({ length: 500 }).notNull(),
    idProofType: idProofTypeEnum().notNull(),
    idProofS3Key: varchar({ length: 1000 }),
    idProofVerified: boolean().notNull().default(false),
    contactVerified: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createServiceAlumniIntakeSchema = createInsertSchema(serviceAlumniIntakeModel);

export type ServiceAlumniIntake = z.infer<typeof createServiceAlumniIntakeSchema>;

export type ServiceAlumniIntakeT = typeof serviceAlumniIntakeModel.$inferSelect;
