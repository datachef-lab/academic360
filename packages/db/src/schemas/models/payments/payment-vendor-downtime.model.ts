import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const paymentVendorDowntimeModel = pgTable("payment_vendor_downtime", {
    id: serial().primaryKey(),
    vendor: varchar({ length: 255 }),
    type: varchar(),
    currentDowntimeStates: varchar(),
    payMethod: varchar(),
    severity: varchar(),
    vendorDowntimeId: varchar(),
    downtimeStartTime: varchar(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createPaymentVendorDowntimeSchema = createInsertSchema(paymentVendorDowntimeModel);

export type PaymentVendorDowntime = z.infer<typeof createPaymentVendorDowntimeSchema>;

export type PaymentVendorDowntimeT = typeof paymentVendorDowntimeModel.type;