import { integer, pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { userModel } from "@/features/user/models/user.model.ts";
import { streamModel } from "@/features/academics/models/stream.model.ts";
import { relations } from "drizzle-orm";

export const courseTypeEnum = pgEnum("course_type", [
    "HONOURS",
    "GENERAL",
]);

export const studentModel = pgTable("students", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    yearOfAdmission: integer(),
    applicationNumber: varchar({ length: 255 }),
    apaarId: varchar({ length: 255 }),
    nationality: varchar({ length: 255 }),
    aadhaarNumber: varchar({ length: 255 }),
    uid: varchar({ length: 16 }),
    streamId: integer("stream_id_fk").notNull().references(() => streamModel.id),
    course: courseTypeEnum().notNull().default("HONOURS"),
    section: varchar({ length: 255 }),
    classRollNumber: integer(),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
});

// export const studentRelations = relations(studentModel, ({ one }) => ({
//     user: one(userModel, {
//         fields: [studentModel.userId],
//         references: [userModel.id],
//     }),
//     stream: one(streamModel, {
//         fields: [studentModel.streamId],
//         references: [streamModel.id],
//     })
// }))