import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { admissionCourseModel, applicationFormModel, eligibilityCriteriaModel, meritListModel } from "@/schemas/models/admissions";
import { shiftModel } from "../academics";
import { paymentModeEnum } from "@/schemas/enums";
import { bankBranchModel } from "../payments";
import { specializationModel } from "../course-design";
import { staffModel } from "../user/staff.model";

export const admissionCourseApplication = pgTable("admission_course_applications", {
    id: serial("id").primaryKey(),
    isTransferred: boolean().notNull().default(false),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id)
        .notNull(),
    admissionCourseId: integer("admission_course_id_fk")
        .references(() => admissionCourseModel.id)
        .notNull(),
    shiftId: integer("shift_id_fk")
        .references(() => shiftModel.id)
        .notNull(),
    classRollNumber: varchar({ length: 255 }),
    rfidNumber: varchar({ length: 50 }),
    appNumber: varchar({ length: 255 }),
    challanNumber: varchar({ length: 255 }),
    amount: integer("amount").notNull().default(0),
    paymentTimestamp: timestamp("payment_timestamp"),
    receivedPayment: boolean().notNull().default(false),
    paymentType: paymentModeEnum(),
    applicationTimestamp: timestamp("application_timestamp"),
    isSmsSent: boolean().notNull().default(false),
    smsSentAt: timestamp("sms_sent_at"),
    isVerified: boolean().notNull().default(false),
    verifiedAt: timestamp("verified_at"),

    verifiedBy: integer("verified_by_staff_id_fk").references(() => staffModel.id),

    verifiedOn: timestamp("verified_on"),

    isBlocked: boolean().notNull().default(false),
    blockRemarks: varchar({ length: 1000 }),
    shiftChangeRemarks: varchar({ length: 1000 }),


    freeshipAmountId: integer("freeship_amount_id"), // TODO: Add freeship amount model
        // .references(() => freeshipAmountModel.id),


    isFreeshipApplied: boolean().notNull().default(false),
    freeshipDate: timestamp("freeship_date"),
    freeshipApprovedBy: integer("freeship_approved_by"),
    freeshipPercentage: doublePrecision("freeship_percentage"),
    freeshipApprovedOn: timestamp("freeship_approved_on"),

    isFeesChallanGenerated: boolean().notNull().default(false),
    feesChallanNumber: varchar({ length: 50 }),
    feesChallanDate: timestamp("fees_challan_date"),
    isFeesPaid: boolean().notNull().default(false),
    feesDraftNumber: varchar({ length: 50 }),
    feesDraftDrawnOn: timestamp("fees_draft_drawn_on"),
    feesDraftAmount: integer("fees_draft_amount"),

    specializationId: integer("specialization_id_fk")
        .references(() => specializationModel.id),
    isEdCutOffFailed: boolean().notNull().default(false),
    feesPaidType: paymentModeEnum(),
    feesPaymentDate: timestamp("fees_payment_date"),
    feesPaymentBankBranchId: integer("fees_payment_bank_branch_id_fk")
        .references(() => bankBranchModel.id),
    feesPaymentBranchOther: varchar({ length: 500 }),
    feesChallanInstallmentAmount: doublePrecision("fees_challan_installment_amount"),
    feesPaymentEntryDate: timestamp("fees_payment_entry_date"),
    feesPaidReconciled: boolean().notNull().default(false),
    isDocPending: boolean().notNull().default(false),
    docPendingDateLts: timestamp("doc_pending_date_lts"),

    lstedt: timestamp("lstedt").defaultNow().notNull(),
    bestOfFour: doublePrecision("best_of_four"),
    totalScore: doublePrecision("total_score"),
    
    isMeritListed: boolean().notNull().default(false),
    meritListId: integer("merit_list_id")
        .references(() => meritListModel.id),
    meritListedOn: timestamp("merit_listed_on"),
    isAdmitCardSelected: boolean().notNull().default(false),
    admitCardSelectedOn: timestamp("admit_card_selected_on"),
    admTestSmsSentOn: timestamp("adm_test_sms_sent_on"),
    meritListCount: integer("merit_list_count"),
    meritListBy: integer("merit_list_by_staff_id_fk").references(() => staffModel.id),


    isInstallmentApplied: boolean().notNull().default(false),
    installmentAppliedOn: timestamp("installment_applied_on"),

    

    onlineRefNumber: varchar({ length: 2000 }),
    paymentMessage: varchar({ length: 2000 }),

    docVerificationCalledDate: timestamp("doc_verification_called_date"),

    installmentRefNumber: varchar({ length: 100 }),

    verifyMasterSubId: integer("verifymastersubid"), // TODO: Add verify master sub model
    verifyType: varchar({ length: 100 }),
    verifyRemarks: varchar({ length: 500 }),
    verifyMasterSubOrig1Id: integer("verify_master_sub_orig1_id"),
    verifyMasterSubOrig2Id: integer("verify_master_sub_orig2_id"),
    verifyTypeOrig1: varchar({ length: 100 }),
    verifyTypeOrig2: varchar({ length: 100 }),
    verifyRemarksOrig1: varchar({ length: 500 }),
    verifyRemarksOrig2: varchar({ length: 500 }),
    
    gujaratiPeriods: integer("gujarati_periods"),
    gujaratiAdmissionType: varchar({ length: 100 }),
    gujaratiAdmissionDate: timestamp("gujarati_admission_date"),



    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createAdmissionCourseApplicationSchema = createInsertSchema(admissionCourseApplication);

export type AdmissionCourseApplication = z.infer<typeof createAdmissionCourseApplicationSchema>;

export type AdmissionCourseApplicationT = typeof createAdmissionCourseApplicationSchema._type;