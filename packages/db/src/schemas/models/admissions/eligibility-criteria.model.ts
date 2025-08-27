import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { courseModel } from "../course-design";
import { classModel } from "../academics";
import { categoryModel } from "../resources";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const eligibilityCriteriaModel = pgTable("eligibility_criteria", {
    id: serial().primaryKey(),
    legacyEligibilityCriteriaId: integer("legacy_eligibility_criteria_id").notNull(),
    courseId: integer("course_id_fk")
        .references(() => courseModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    categoryId: integer("category_id_fk")
        .references(() => categoryModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    description: varchar({ length: 1000 }),
    generalInstruction: varchar({ length: 1000 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const eligibilityCriteriaSchema = createInsertSchema(eligibilityCriteriaModel);

export type EligibilityCriteria = z.infer<typeof eligibilityCriteriaSchema>;