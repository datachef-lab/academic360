import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { studentModel, userModel } from "@/schemas/models/user";
import { feeConcessionSlabModel, feeStructureInstallmentModel, feeStructureModel } from "@/schemas/models/fees";
import { paymentModeEnum, paymentStatusEnum, studentFeesMappingEnum } from "@/schemas/enums";
import { feeCategoryPromotionMappingModel } from "./fee-category-promotion-mapping.model";

export const feeStudentMappingModel = pgTable("fee_student_mappings", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    feeStructureId: integer("fee_structure_id_fk")
        .references(() => feeStructureModel.id)
        .notNull(),
    feeCategoryPromotionMappingId: integer("fee_category_promotion_mapping_id_fk")
        .references(() => feeCategoryPromotionMappingModel.id)
        .notNull(),
    type: studentFeesMappingEnum().notNull().default("FULL"),
    feeStructureInstallmentId: integer("fee_structure_installment_id_fk")
        .references(() => feeStructureInstallmentModel.id),
    feeConcessionSlabId: integer("fee_concession_slab_id_fk")
        .references(() => feeConcessionSlabModel.id),
    isWaivedOff: boolean().notNull().default(false),
    waivedOffAmount: integer().notNull().default(0),
    waivedOffReason: varchar({ length: 500 }),
    waivedOffDate: timestamp({withTimezone: true}),
    waivedOffByUserId: integer("waived_off_by_user_id_fk")
        .references(() => userModel.id),
    lateFee: integer().notNull().default(0),
    totalPayable: integer().notNull().default(0),
    amountPaid: integer().notNull().default(0),
    paymentStatus: paymentStatusEnum().notNull().default("PENDING").notNull(),
    paymentMode: paymentModeEnum(),
    transactionRef: text(),
    transactionDate: timestamp({withTimezone: true}),
    receiptNumber: varchar({ length: 2555 }),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeStudentMappingSchema = createInsertSchema(feeStudentMappingModel);

export type FeeStudentMapping = z.infer<typeof createFeeStudentMappingSchema>;

export type FeeStudentMappingT = typeof createFeeStudentMappingSchema._type;