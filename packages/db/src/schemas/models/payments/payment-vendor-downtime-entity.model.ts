import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { paymentVendorDowntimeModel } from "./payment-vendor-downtime.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const paymentVendorDowntimeEntityModel = pgTable("payment_vendor_downtime_entity", {
    id: serial().primaryKey(),
    paymentVendorDowntimeId: integer("payment_vendor_downtime_id_fk")
        .references(() => paymentVendorDowntimeModel.id)
        .notNull(),
    name: varchar().notNull(),
    type: varchar().notNull(),
    code: varchar().notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createPaymentVendorDowntimeEntitySchema = createInsertSchema(paymentVendorDowntimeEntityModel);

export type PaymentVendorDowntimeEntity = z.infer<typeof createPaymentVendorDowntimeEntitySchema>;

export type PaymentVendorDowntimeEntityT = typeof paymentVendorDowntimeEntityModel.type;