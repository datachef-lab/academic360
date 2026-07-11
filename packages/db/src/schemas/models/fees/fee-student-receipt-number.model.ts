import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgTable,
    serial,
    timestamp,
    unique,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core";

import { studentModel } from "@/schemas/models/user";
import { feeStudentMappingModel } from "./fees-student-mapping.model";

/**
 * Receipt / challan numbers, decoupled from `fee_student_mappings`.
 *
 * The receipt string format is unchanged (`{uid}/{NN}[-{code}]`), but the number
 * now lives here so we can keep a continuous per-student sequence and full
 * history across a shift change: `uid` is frozen at issuance (so a receipt PDF
 * always prints the uid the student had when it was issued), and `isDeprecated`
 * lets a shift change retire the old-uid receipt while a fresh active one is
 * issued under the new uid. At most one active (is_deprecated=false) receipt
 * exists per fee_student_mapping.
 */
export const feeStudentReceiptNumberModel = pgTable(
    "fee_student_receipt_numbers",
    {
        id: serial().primaryKey(),
        studentId: integer("student_id_fk")
            .references(() => studentModel.id)
            .notNull(),
        // Nullable + ON DELETE SET NULL: the receipt row (and the per-student
        // sequence it holds) must survive if the mapping is later deleted by an
        // unrelated flow.
        feeStudentMappingId: integer("fee_student_mapping_id_fk").references(
            () => feeStudentMappingModel.id,
            { onDelete: "set null" },
        ),
        // The uid frozen at issuance (drives the receipt PDF uid).
        uid: varchar({ length: 255 }).notNull(),
        // Per-student allocation counter: the next receipt number is
        // MAX(sequence)+1 for the student. Padding + the `-{code}` suffix live
        // only in `receiptNumber`. NOTE: not unique per student — legacy data
        // has same-NN pairs (a bare `uid/NN` plus a coded `uid/NN-CODE`), so the
        // real collision guard is `unique(receiptNumber)` (+ the advisory lock
        // and 23505 retry in the allocator).
        sequence: integer().notNull(),
        receiptNumber: varchar({ length: 2555 }).notNull(),
        challanGeneratedAt: timestamp({ withTimezone: true }),
        isDeprecated: boolean().notNull().default(false),
        createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp({ withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => ({
        // Global collision guard (preserves the old fee_student_mappings.receipt_number semantics).
        uniqueReceiptNumber: unique().on(table.receiptNumber),
        // At most one ACTIVE receipt per mapping (null mapping ids are exempt).
        oneActivePerMapping: uniqueIndex("fee_student_receipt_active_mapping_idx")
            .on(table.feeStudentMappingId)
            .where(sql`is_deprecated = false`),
        studentIdx: index("fee_student_receipt_student_idx").on(table.studentId),
        mappingIdx: index("fee_student_receipt_mapping_idx").on(
            table.feeStudentMappingId,
        ),
    }),
);

export const createFeeStudentReceiptNumberSchema = createInsertSchema(
    feeStudentReceiptNumberModel,
);

export type FeeStudentReceiptNumber = z.infer<
    typeof createFeeStudentReceiptNumberSchema
>;

export type FeeStudentReceiptNumberT =
    typeof createFeeStudentReceiptNumberSchema._type;
