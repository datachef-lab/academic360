import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { index, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { declartionMasterModel } from "./declaration-master.model";
import { promotionModel } from "../batches";

export const declartionModel = pgTable('declarations', {
    id: serial().primaryKey(),
    declarationMasterId: integer("declaration_master_id_fk")
        .references(() => declartionMasterModel.id, { onDelete: "cascade" })
        .notNull(),
    promotionId: integer("promotion_id_fk")
        .references(() => promotionModel.id, { onDelete: "cascade" })
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    // A student declares a given master once per promotion (exam cycle). This is
    // the server-side guard behind "don't show the dialog again" and makes the
    // submit endpoint safely idempotent.
    uqDeclarationPerPromotion: unique("uq_declaration_master_promotion").on(
        t.declarationMasterId,
        t.promotionId,
    ),
    promotionIdx: index("declarations_promotion_id_idx").on(t.promotionId),
}));

export const createDeclartionModel = createInsertSchema(declartionModel);

export type Declartion = z.infer<typeof createDeclartionModel>;

export type DeclartionT = typeof createDeclartionModel._type;