import { z } from "zod";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
    bigint,
    date,
    index,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

import { idCardIssueStatusEnum } from "@/schemas/enums";
import { studentModel } from "@/schemas/models/user/student.model";
import { userModel } from "@/schemas/models/user/user.model";
import { idCardTemplateModel } from "./id-card-template.model";

export const idCardIssueModel = pgTable(
    "id_card_issues",
    {
        id: serial().primaryKey(),
        // Old HRCLSMS.id_card_issues.id — set by the one-time legacy sync to keep it idempotent.
        legacyIssueId: bigint("legacy_issue_id", { mode: "number" }).unique(),
        studentId: integer("student_id_fk")
            .notNull()
            .references(() => studentModel.id),
        templateId: integer("template_id_fk").references(() => idCardTemplateModel.id),
        issueStatus: idCardIssueStatusEnum().notNull().default("ISSUED"),
        renewedFromIssueId: integer("renewed_from_issue_id_fk").references(
            (): AnyPgColumn => idCardIssueModel.id,
        ),
        issueDate: timestamp().notNull().defaultNow(),
        validFrom: date(),
        validTill: date(),
        rfidNumber: varchar({ length: 255 }),
        frontImageKey: varchar({ length: 1000 }),
        frontImageUrl: varchar({ length: 2000 }),
        photoImageKey: varchar({ length: 1000 }),
        photoImageUrl: varchar({ length: 2000 }),
        nameSnapshot: varchar({ length: 500 }),
        courseSnapshot: varchar({ length: 500 }),
        bloodGroupSnapshot: varchar({ length: 50 }),
        mobileSnapshot: varchar({ length: 50 }),
        sportsQuotaSnapshot: varchar({ length: 100 }),
        quotaTypeSnapshot: varchar({ length: 100 }),
        sectionSnapshot: varchar({ length: 100 }),
        classRollNumberSnapshot: varchar({ length: 100 }),
        uidSnapshot: varchar({ length: 255 }),
        remarks: text(),
        issuedByUserId: integer("issued_by_user_id_fk").references(() => userModel.id),
        createdAt: timestamp().notNull().defaultNow(),
        updatedAt: timestamp()
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (t) => ({
        idxStudentIssueDate: index("idx_id_card_issues_student_date").on(
            t.studentId,
            t.issueDate,
        ),
    }),
);

export const idCardIssueRelations = relations(idCardIssueModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [idCardIssueModel.studentId],
        references: [studentModel.id],
    }),
    template: one(idCardTemplateModel, {
        fields: [idCardIssueModel.templateId],
        references: [idCardTemplateModel.id],
    }),
    renewedFrom: one(idCardIssueModel, {
        fields: [idCardIssueModel.renewedFromIssueId],
        references: [idCardIssueModel.id],
        relationName: "id_card_issue_renewed_from",
    }),
    issuedBy: one(userModel, {
        fields: [idCardIssueModel.issuedByUserId],
        references: [userModel.id],
    }),
}));

export const createIdCardIssueSchema = createInsertSchema(idCardIssueModel);
export type IdCardIssue = z.infer<typeof createIdCardIssueSchema>;
export type IdCardIssueT = typeof createIdCardIssueSchema._type;
