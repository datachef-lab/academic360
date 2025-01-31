import { boolean, date, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "@/features/user/models/user.model.ts";
import { streamLevelEnum, streamModel } from "@/features/academics/models/stream.model.ts";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { specializationModel } from "./specialization.model.ts";

export const frameworkTypeEnum = pgEnum('framework_type', ["CBCS", "CCF"]);

export const communityTypeEnum = pgEnum("community_type", ["GUJARATI", "NON-GUJARATI"]);

export const shiftTypeEnum = pgEnum("shift_type", ["MORNING", "AFTERNOON", "EVENING"]);

export const studentModel = pgTable("students", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    community: communityTypeEnum(),
    handicapped: boolean().default(false),
    level: streamLevelEnum().notNull().default("UNDER_GRADUATE"),
    framework: frameworkTypeEnum(),
    specializationId: integer("specialization_id_fk").references(() => specializationModel.id),
    shift: shiftTypeEnum(),
    lastPassedYear: integer(),
    notes: text(),
    active: boolean(),
    alumni: boolean(),
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

export type Student = z.infer<typeof createStudentSchema>;