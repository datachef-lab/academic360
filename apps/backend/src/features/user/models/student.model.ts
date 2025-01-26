import { boolean, date, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "@/features/user/models/user.model.ts";
import { streamModel } from "@/features/academics/models/stream.model.ts";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const courseTypeEnum = pgEnum("course_type", ["HONOURS", "GENERAL"]);

export const frameworkTypeEnum = pgEnum('framework_type', ["CBCS", "CCF"]);

export const communityTypeEnum = pgEnum("community_type", ["GUJARATI", "NON-GUJARATI"]);

export const studentModel = pgTable("students", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    community: communityTypeEnum().default("GUJARATI"),
    lastPassedYear: integer(),
    notes: text(),
    active: boolean().notNull().default(true),
    alumni: boolean().notNull().default(false),
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
}))

export const createStudentSchema = createInsertSchema(studentModel);

export type Student = z.infer<typeof createStudentSchema>;