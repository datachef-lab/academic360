import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { studentModel } from "@/schemas/models/user";
import { feeConcessionSlabModel, feeStructureInstallmentModel, feeStructureModel } from "@/schemas/models/fees";
import { paymentModeEnum, paymentStatusEnum, studentFeesMappingEnum } from "@/schemas/enums";

export const studentFeeModel = pgTable("student_fees", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    feeStructureId: integer("fee_structure_id_fk")
        .references(() => feeStructureModel.id)
        .notNull(),
    type: studentFeesMappingEnum().notNull().default("FULL"),
    feeStructureInstallmentId: integer("fee_structure_installment_id_fk")
        .references(() => feeStructureInstallmentModel.id),
    feeConcessionSlabId: integer("fee_concession_slab_id_fk")
        .references(() => feeConcessionSlabModel.id),

    lateFee: integer().notNull().default(0),
    totalPayable: integer().notNull(),
    amountPaid: integer().notNull(),
    paymentStatus: paymentStatusEnum().notNull().default("PENDING").notNull(),
    paymentMode: paymentModeEnum(),
    transactionRef: varchar({ length: 255 }),
    transactionDate: timestamp(),
    receiptNumber: varchar({ length: 2555 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createStudentFeeSchema = createInsertSchema(studentFeeModel);

export type StudentFee = z.infer<typeof createStudentFeeSchema>;

export type StudentFeeT = typeof createStudentFeeSchema._type;