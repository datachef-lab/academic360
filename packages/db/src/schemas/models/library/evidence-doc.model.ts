import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";

export const evidenceDocModel = pgTable("library_evidence_docs", {
    id: serial().primaryKey(),
    criterionCode: varchar({ length: 100 }).notNull(),
    title: varchar({ length: 500 }).notNull(),
    description: varchar({ length: 2000 }),
    fileKey: varchar({ length: 1000 }).notNull(),
    mimeType: varchar({ length: 255 }),
    fileSizeBytes: integer(),
    tags: varchar({ length: 1000 }),
    academicYear: varchar({ length: 50 }),
    uploadedByUserId: integer("uploaded_by_user_id_fk")
        .references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createEvidenceDocSchema = createInsertSchema(evidenceDocModel);

export type EvidenceDoc = z.infer<typeof createEvidenceDocSchema>;

export type EvidenceDocT = typeof createEvidenceDocSchema._type;
