import { studentModel } from "@/features/user/models/student.model";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { feesStructureModel } from "./fees-structure.model";
import { paymentModeEnum, paymentStatusEnum, studentFeesMappingEnum } from "@/features/user/models/helper";

export const studentFeesMappingModel = pgTable("student_fees_mappings", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    feesStructureId: integer("fees_structure_id_fk")
        .references(() => feesStructureModel.id)
        .notNull(),
    type: studentFeesMappingEnum().notNull().default("FULL"),
    instalmentNumber: integer(),
    baseAmount: integer().notNull(),
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