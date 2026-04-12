import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { promotionModel } from "../batches";
import { userModel } from "../user";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const examFormFillupModel = pgTable("exam_form_fillup", {
    id: serial().primaryKey(),
    promotionId: integer("promotion_id_fk")
        .references(() => promotionModel.id)
        .notNull(),
    formFilledByUserId: integer("form_filled_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createExamFormFillupSchema = createInsertSchema(examFormFillupModel);

export type ExamFormFillup = z.infer<typeof createExamFormFillupSchema>;

export type ExamFormFillupT = typeof examFormFillupModel.$inferSelect;
