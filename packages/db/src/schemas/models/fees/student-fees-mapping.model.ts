import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { studentModel } from "@/schemas/models/user";
import { instalmentModel, feesStructureModel } from "@/schemas/models/fees";
import { paymentModeEnum, paymentStatusEnum, studentFeesMappingEnum } from "@/schemas/enums";

export const studentFeesMappingModel = pgTable("student_fees_mappings", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    feesStructureId: integer("fees_structure_id_fk")
        .references(() => feesStructureModel.id)
        .notNull(),
    type: studentFeesMappingEnum().notNull().default("FULL"),
    instalmentId: integer("instalment_id_fk")
        .references(() => instalmentModel.id),
    baseAmount: integer().notNull().default(0),
    lateFee: integer().notNull().default(0),
    totalPayable: integer().notNull().default(0),
    amountPaid: integer(),
    paymentStatus: paymentStatusEnum().notNull().default("PENDING").notNull(),
    paymentMode: paymentModeEnum(),
    transactionRef: varchar({ length: 255 }),
    transactionDate: timestamp(),
    receiptNumber: varchar({ length: 2555 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStudentFeesMappingSchema = createInsertSchema(studentFeesMappingModel);

export type StudentFeesMapping = z.infer<typeof createStudentFeesMappingSchema>;

export type StudentFeesMappingT = typeof createStudentFeesMappingSchema._type;