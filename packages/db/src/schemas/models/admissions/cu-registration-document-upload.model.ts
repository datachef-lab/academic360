import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { cuRegistrationCorrectionRequestModel } from "./cu-registration-correction-request.model";
import { documentModel } from "../academics";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const cuRegistrationDocumentUploadModel = pgTable("cu_registration_document_uploads", {
    id: serial().primaryKey(),
    cuRegistrationCorrectionRequestId: integer("cu_registration_correction_request_id_fk")
        .references(() => cuRegistrationCorrectionRequestModel.id)
        .notNull(),
    documentId: integer("document_id_fk").references(() => documentModel.id).notNull(),
    documentUrl: varchar("document_url", { length: 255 }),
    path: varchar("path", { length: 255 }),
    fileName: varchar("file_name", { length: 255 }),
    fileType: varchar("file_type", { length: 255 }),
    fileSize: integer("file_size"),
    remarks: text("remarks"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const cuRegistrationDocumentUploadInsertSchema = createInsertSchema(cuRegistrationDocumentUploadModel);

export type cuRegistrationDocumentUploadInsertTypeT = typeof cuRegistrationDocumentUploadInsertSchema._type;

export type CuRegistrationDocumentUpload = z.infer<typeof cuRegistrationDocumentUploadInsertSchema>;