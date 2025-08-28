import { doublePrecision, boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "../user";
import { programCourseModel, specializationModel, streamModel } from "../course-design";
import { classModel, shiftModel } from "../academics";
import { eligibilityCriteriaModel } from "./eligibility-criteria.model";
import { studentCategoryModel } from "./adm-student-category.model";
import { bankBranchModel } from "../payments/bank-branch.model";
import { bankModel } from "../payments/bank.model";
import { meritListModel } from "./merit-list.model";
import { cancelSourceModel } from "./cancel-source.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";


export const admissionCourseDetailsModel = pgTable("admission_course_details", {
    id: serial().primaryKey(),
    legacyCourseDetailsId: integer("legacy_course_details_id"),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    streamId: integer("stream_id_fk")
        .references(() => streamModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    shiftId: integer("shift_id_fk")
        .references(() => shiftModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    eligibilityCriteriaId: integer("eligibility_criteria_id_fk")
        .references(() => eligibilityCriteriaModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
    studentCategoryId: integer("student_category_id_fk")
        .references(() => studentCategoryModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    rollNumber: varchar({ length: 50 }).notNull(),

    appNumber: varchar({ length: 50 }).notNull(),
    challanNumber: varchar({ length: 50 }).notNull(),
    amount: integer("amount").notNull().default(0),
    paymentTimestamp: timestamp("payment_timestamp"),
    receivedPayment: boolean().notNull().default(false),
    paymentType: varchar({ length: 500 }),
    applicationTimestamp: timestamp("application_timestamp").defaultNow().notNull(),
    isSmsSent: boolean().notNull().default(false),
    smsSentAt: timestamp("sms_sent_at"),

    isVerified: boolean().notNull().default(false),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: integer(),
    verifiedOn: timestamp("verified_on"),

    freeshipDate: timestamp("freeship_date"),
    freeshipApprovedBy: integer(),
    freeshipApprovedOn: timestamp("freeship_approved_on"),
    freeshipPercentage: integer("freeship_perc").notNull(),
    isFreeshipApplied: boolean().notNull().default(false),
    freeshipPercentageApplied: integer("freeship_perc_applied").notNull().default(0),
    isFreeshipApproved: boolean().notNull().default(false),
    freesshipAmountId: integer("freeship_amount_id"),
    isFeesChallanGenerated: boolean().notNull().default(false),
    feesChallanNumber: varchar({ length: 50 }),
    feesChallanDate: timestamp("fees_challan_generated_at"),
    isFeesPaid: boolean().notNull().default(false),
    feesPaidType: varchar({ length: 500 }),
    feesPaidAt: timestamp("fees_paid_at"),
    feesPaymentBankBranchId: integer("fees_payment_bank_branch_id_fk")
        .references(() => bankBranchModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
    isInstallmentApplied: boolean().notNull().default(false),
    installmentAppliedOn: timestamp("installment_applied_on"),
    feesChallanInstallmentAmount: integer("fees_challan_installment_amount"),
    feesPaymentEntryDate: timestamp("fees_payment_entry_date"),
    feesPaidReconciled: boolean().notNull().default(false),
    onlineRefNumber: varchar({ length: 200 }),
    paymentMessage: varchar({ length: 1000 }),

    chkAntiRagStudent: boolean().notNull().default(false),
    chkAntiRagParent: boolean().notNull().default(false),

    lastDateDocumentPending: timestamp("last_date_document_pending"),
    admFrmDwnld: varchar({ length: 5 }),
    admFrmDwnlIdEntryDate: varchar({ length: 5 }),
    feesPaymentBankId: integer("fees_payment_bank_id")
        .references(() => bankModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
    feesDraftNumber: varchar({ length: 50 }),
    feesDratdtDate: timestamp("fees_draft_date"),
    feesDraftDrawnOn: timestamp("fees_draft_drawn_on"),
    feesDraftAmount: integer("fees_draft_amount"),
    isBlocked: boolean().notNull().default(false),
    blockRemarks: varchar({ length: 1000 }),
    shiftChangeRemarks: varchar({ length: 1000 }),
    isTransferred: boolean().notNull().default(false),
    specialization: integer("specialization_id_fk")
        .references(() => specializationModel.id, { onDelete: "cascade", onUpdate: "cascade" }),

    isEdCutOffFailed: boolean().notNull().default(false),
    isMeritListed: boolean().notNull().default(false),
    bestOfFour: doublePrecision("best_of_four"),
    totalScore: doublePrecision("total_score"),
    meritListId: integer()
        .references(() => meritListModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
    meritListedOn: timestamp("merit_listed_on"),
    meritListCount: integer("merit_list_count"),
    meritListBy: integer("merit_list_by"),
    isAdmitCardSelected: boolean().notNull().default(false),
    admitCardSelectedOn: timestamp("admit_card_selected_on"),
    admissionTestSmsSentOn: timestamp("admission_test_sms_sent_on"),
    
    instltranId: integer("instltran_id"),
    documentVerificationCalledAt: timestamp("document_verification_called_at"),
    installmentRefNumber: varchar({ length: 100 }),
    
    verifymastersubid: integer("verifymastersubid"),
    verifyType: varchar({ length: 100 }),
    verifyRemarks: varchar({ length: 500 }),

    verify_master_sub_orig1_id: integer("verify_master_sub_orig1_id"),
    verify_master_sub_orig2_id: integer("verify_master_sub_orig2_id"),

    verify_type_orig1: varchar({ length: 100 }),
    verify_type_orig2: varchar({ length: 100 }),

    verify_remarks1: varchar({ length: 500 }),
    verify_remarks2: varchar({ length: 500 }),

    gujaratiPeriod: integer("gujarati_periods"),
    gujaratiAdmissionType: varchar({ length: 100 }),
    gujaratiAdmissionDate: timestamp("gujarati_admission_date"),

    sportQuotaAdmissionType: varchar({ length: 100 }),
    sportsQuotaAdmissionDate: timestamp("sports_quota_admission_date"),
    isSportsQuotaApplied: boolean().notNull().default(false),
    
    subjectSelection: integer("subject_selection"),

    documentStatus: varchar({ length: 1000 }),
    documentUploadDate: timestamp("document_upload_date"),
    isCancelled: boolean().notNull().default(false),
    cancelSourceId: integer("cancel_source_id")
        .references(() => cancelSourceModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
    cancelRemarks: varchar({ length: 1000 }),
    cancelDate: timestamp("cancel_date"),
    cancelUserId: integer("cancel_user_id"),
    cancelEntryDate: timestamp("cancel_entry_date"),


    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createAdmissionCourseDetails = createInsertSchema(admissionCourseDetailsModel);

export type AdmissionCourseDetails = z.infer<typeof createAdmissionCourseDetails>;