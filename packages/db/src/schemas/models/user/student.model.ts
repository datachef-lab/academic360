import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { userModel } from "@/schemas/models/user";
import { communityTypeEnum } from "@/schemas/enums";
import { specializationModel } from "@/schemas/models/course-design";
import { applicationFormModel } from "@/schemas/models/admissions";

export const studentModel = pgTable("students", {
    id: serial().primaryKey(),
    legacyStudentId: integer(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    applicationId: integer("application_id_fk")
        .references(() => applicationFormModel.id),
    community: communityTypeEnum(),
    handicapped: boolean().default(false),
    specializationId: integer("specialization_id_fk").references(() => specializationModel.id),
    lastPassedYear: integer(),
    notes: text(),
    active: boolean(),
    alumni: boolean(),
    isSuspended: boolean().default(false),
    leavingDate: timestamp(),
    leavingReason: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const studentRelations = relations(studentModel, ({ one }) => ({
    user: one(userModel, {
        fields: [studentModel.userId],
        references: [userModel.id],
    }),
    specialization: one(specializationModel, {
        fields: [studentModel.specializationId],
        references: [specializationModel.id],
    }),
}))

export const createStudentSchema = createInsertSchema(studentModel);

export type StudentT = typeof createStudentSchema._type;
// z.infer<typeof createStudentSchema>;


