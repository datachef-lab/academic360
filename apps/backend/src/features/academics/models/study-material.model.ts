// import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

// import { studyMaterialAvailabilityTypeEnum, studyMaterialTypeEnum, studyMetaTypeEnum } from "@/features/user/models/helper.js";
// import { createInsertSchema } from "drizzle-zod";
// import { z } from "zod";
// import { sessionModel } from "./session.model.js";
// import { courseModel } from "../../course-design/models/course.model.js";
// import { batchModel } from "./batch.model.js";


// export const studyMaterialModel = pgTable("study_materials", {
//     id: serial().primaryKey(),
//     availability: studyMaterialAvailabilityTypeEnum().notNull(),
//     subjectMetadataId: integer("subject_metadata_id_fk")
//         .references(() => subjectMetadataModel.id)
//         .notNull(),
//     sessionId: integer("session_di_fk")
//         .references(() => sessionModel.id),
//     courseId: integer("course_id_fk")
//         .references(() => courseModel.id),
//     batchId: integer("batch_id_fk")
//         .references(() => batchModel.id),
//     type: studyMaterialTypeEnum().notNull(),
//     variant: studyMetaTypeEnum().notNull(),
//     name: varchar({ length: 700 }).notNull(),
//     url: varchar({ length: 2000 }).notNull(),
//     filePath: varchar({ length: 700 }),
//     dueDate: timestamp(),
//     createdAt: timestamp().notNull().defaultNow(),
//     updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
// });

// export const createStudyMaterialSchema = createInsertSchema(studyMaterialModel);

// export type studyMaterial = z.infer<typeof createStudyMaterialSchema>;