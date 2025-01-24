import { pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transportTypeEnum = pgEnum("transport_type", ["BUS", "TRAIN", "METRO", "AUTO", "TAXI", "CYCLE", "WALKING", "OTHER"]);

export const transportModel = pgTable("transport", {
    id: serial().primaryKey(),
    routeName: varchar({ length: 255 }),
    mode: transportTypeEnum().notNull().default("OTHER"),
    vehicleNumber: varchar({ length: 255 }),
    driverName: varchar({ length: 255 }),
    providerDetails: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createTransportSchema = createInsertSchema(transportModel);

export type Transport = z.infer<typeof createTransportSchema>;