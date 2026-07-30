import { documentCategoryEnum, documentDomainEnum, documentEligibilityRuleEnum, issuingAuthorityEnum } from "@/schemas/enums";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documentTypeModel = pgTable("document_types", {
    id: serial().primaryKey(),
    domain: documentDomainEnum().default("OTHER").notNull(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 255 }),
    issuingAuthority:  issuingAuthorityEnum(),
    category: documentCategoryEnum().default("ADMINISTRATIVE").notNull(),
    eligibilityRule: documentEligibilityRuleEnum(), // Should only be set if the category is of type "EXAM_LINKED"
    requiresFeeClearance: boolean().notNull().default(false),
    requiresLibraryClearance: boolean().notNull().default(false),
    isRecurring: boolean().notNull().default(false),
    isAvailableForServiceRequest: boolean().notNull().default(false),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDocumentTypeModel = createInsertSchema(documentTypeModel);

export type DocumentType = z.infer<typeof createDocumentTypeModel>;

export type DocumentTypeT = typeof createDocumentTypeModel._type;