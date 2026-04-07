import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { classModel } from "../academics";
import { accessGroupModuleProgramCourseModel } from "./access-group-module-program-course.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

/** Classes that apply to a specific program course within an access group module */
export const accessGroupModuleProgramCourseClassModel = pgTable(
  "access_group_module__program_course__class",
  {
    id: serial().primaryKey(),
    accessGroupModuleProgramCourseId: integer(
      "access_group_module_program_course_id_fk",
    )
      .references(() => accessGroupModuleProgramCourseModel.id, { onDelete: "cascade" })
      .notNull(),
    classId: integer("class_id_fk")
      .references(() => classModel.id)
      .notNull(),
    isAllowed: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => ({
    uq: unique("uq_access_group_module_pc_class").on(
      table.accessGroupModuleProgramCourseId,
      table.classId,
    ),
  }),
);

export const createAccessGroupModuleProgramCourseClassSchema = createInsertSchema(
  accessGroupModuleProgramCourseClassModel,
);

export type AccessGroupModuleProgramCourseClass = z.infer<
  typeof createAccessGroupModuleProgramCourseClassSchema
>;
