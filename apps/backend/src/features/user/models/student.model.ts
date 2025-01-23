import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "@/features/user/models/user.model.ts";
import { streamModel } from "@/features/academics/models/stream.model.ts";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const courseTypeEnum = pgEnum("course_type", ["HONOURS", "GENERAL"]);

export const frameworkTypeEnum = pgEnum('framework_type', ["CBCS", "CCF"]);

export const studentModel = pgTable("students", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    applicationNumber: varchar({ length: 255 }),
    applicantSignature: varchar({ length: 255 }),
    yearOfAdmission: integer(),
    admissionCode: varchar({ length: 255 }),
    admissionDate: timestamp(),
    frameworkType: frameworkTypeEnum().notNull().default("CBCS"),
    rfid: varchar({ length: 255 }),
    apaarId: varchar({ length: 255 }),
    uid: varchar({ length: 255 }),
    oldUid: varchar({ length: 255 }),
    streamId: integer("stream_id_fk").notNull().references(() => streamModel.id),
    course: courseTypeEnum().notNull().default("HONOURS"),
    cuFormNumber: varchar({ length: 255 }),
    checkRepeat: boolean(),
    notes: text(),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
    section: varchar({ length: 255 }),
    classRollNumber: integer(),
    abcId: varchar({ length: 255 }),
    apprid: varchar({ length: 255 }),
    lastPassedYear: integer(),
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
    stream: one(streamModel, {
        fields: [studentModel.streamId],
        references: [streamModel.id],
    })
}))

export const createStudentSchema = createInsertSchema(studentModel);

export type Student = z.infer<typeof createStudentSchema>;