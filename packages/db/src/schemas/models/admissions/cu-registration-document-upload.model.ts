import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { cuRegistrationCorrectionRequestModel } from "./cu-registration-correction-request.model";

import z from "zod";
import { createInsertSchema } from "drizzle-zod";
import { documentTypeModel } from "../documents";
import { documentLedgerModel } from "../documents/document-ledger.model";


export const cuRegistrationDocumentUploadModel = pgTable("cu_registration_document_uploads", {
    id: serial().primaryKey(),
    cuRegistrationCorrectionRequestId: integer("cu_registration_correction_request_id_fk")
        .references(() => cuRegistrationCorrectionRequestModel.id)
        .notNull(),
    documentId: integer("document_id_fk").references(() => documentTypeModel.id).notNull(),
    documentUrl: varchar("document_url", { length: 255 }),
    path: varchar("path", { length: 255 }),
    fileName: varchar("file_name", { length: 255 }),
    fileType: varchar("file_type", { length: 255 }),
    fileSize: integer("file_size"),
    remarks: text("remarks"),
    // The upload's entry in the student's document passbook. Mirrors the pattern
    // used by id_card_issues: the source row is the system of record and the
    // ledger row is its projection, so the link lives here and document_ledger
    // stays generic across flows.
    documentLedgerId: integer("document_ledger_id_fk")
        .references(() => documentLedgerModel.id)
        .unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const cuRegistrationDocumentUploadInsertSchema = createInsertSchema(cuRegistrationDocumentUploadModel);

export type cuRegistrationDocumentUploadInsertTypeT = typeof cuRegistrationDocumentUploadInsertSchema._type;

export type CuRegistrationDocumentUpload = z.infer<typeof cuRegistrationDocumentUploadInsertSchema>;