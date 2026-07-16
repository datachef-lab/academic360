import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
    boolean,
    integer,
    pgTable,
    serial,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core";

import { idCardFieldKeyEnum } from "@/schemas/enums";
import { idCardTemplateModel } from "./id-card-template.model";

export const idCardTemplateFieldModel = pgTable(
    "id_card_template_fields",
    {
        id: serial().primaryKey(),
        templateId: integer("template_id_fk")
            .notNull()
            .references(() => idCardTemplateModel.id, { onDelete: "cascade" }),
        fieldKey: idCardFieldKeyEnum().notNull(),
        x: integer().notNull().default(0),
        y: integer().notNull().default(0),
        width: integer(),
        height: integer(),
        fontSize: integer(),
        align: varchar({ length: 10 }).notNull().default("LEFT"),
        isVisible: boolean().notNull().default(true),
        createdAt: timestamp().notNull().defaultNow(),
        updatedAt: timestamp()
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (t) => ({
        uniqTemplateField: uniqueIndex("uniq_template_field").on(t.templateId, t.fieldKey),
    }),
);

export const idCardTemplateFieldRelations = relations(idCardTemplateFieldModel, ({ one }) => ({
    template: one(idCardTemplateModel, {
        fields: [idCardTemplateFieldModel.templateId],
        references: [idCardTemplateModel.id],
    }),
}));

export const createIdCardTemplateFieldSchema = createInsertSchema(idCardTemplateFieldModel);
export type IdCardTemplateField = z.infer<typeof createIdCardTemplateFieldSchema>;
export type IdCardTemplateFieldT = typeof createIdCardTemplateFieldSchema._type;
