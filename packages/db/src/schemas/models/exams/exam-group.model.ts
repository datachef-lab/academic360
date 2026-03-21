
import { date, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const examGroupModel = pgTable("exam_groups", {
    id: serial().primaryKey(),
    name: varchar({ length: 1000 }).notNull(),
    examCommencementDate: date().notNull().defaultNow(),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
return {
      uniqueNameDate: uniqueIndex("exam_groups_name_date_unique").on(
        table.name,
        table.examCommencementDate
      ),
    };
});

export const createExamGroupSchema = createInsertSchema(examGroupModel);

export type ExamGroup = z.infer<typeof createExamGroupSchema>;

export type ExamGroupT = typeof examGroupModel.$inferSelect;