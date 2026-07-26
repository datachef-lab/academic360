import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { studentModel } from "@/schemas/models/user/student.model";
import { userModel } from "@/schemas/models/user";
import { promotionModel } from "@/schemas/models/batches/promotions.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const tempAdmitCardDistributionsModel = pgTable(
    "temp_admit_card_distributions",
    {
        id: serial().primaryKey(),
        studentId: integer("student_id_fk")
            .notNull()
            .references(() => studentModel.id),
        distributedByUserId: integer("distributed_by_user_id_fk")
            .notNull()
            .references(() => userModel.id),
        /**
         * Which promotion (= exam cycle) the admit card was distributed for.
         * NULL on legacy rows from the Semester I cycle (the table predates the
         * column) — those rows are history and must not mark a student as
         * "already distributed" in later cycles.
         */
        promotionId: integer("promotion_id_fk")
            .references(() => promotionModel.id),
        createdAt: timestamp({ withTimezone: true }).defaultNow(),
        updatedAt: timestamp({ withTimezone: true }).defaultNow(),
    },
);

export const createTempAdmitCardDistributionSchema = createInsertSchema(
    tempAdmitCardDistributionsModel,
);

export type TempAdmitCardDistribution = z.infer<
    typeof createTempAdmitCardDistributionSchema
>;

export type TempAdmitCardDistributionT =
    typeof tempAdmitCardDistributionsModel.$inferSelect;
