import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const pickupPointModel = pgTable("pickup_point", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPickupPointSchema = createInsertSchema(pickupPointModel);

export type PickupPoint = z.infer<typeof createPickupPointSchema>;