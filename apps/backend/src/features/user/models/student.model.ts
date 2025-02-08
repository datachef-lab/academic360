import { boolean, date, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "@/features/user/models/user.model.js";
import { streamLevelEnum, streamModel } from "@/features/academics/models/stream.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
<<<<<<< HEAD
import { specializationModel } from "./specialization.model.ts";
import { frameworkTypeEnum } from "@/features/academics/models/subjectMetadata.model.ts";
=======
import { specializationModel } from "./specialization.model.js";
import { frameworkTypeEnum } from "@/features/academics/models/subjectMetadata.model.js";
>>>>>>> 90004db6fb605e03f0ecb8df3be32b6658a1417b

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