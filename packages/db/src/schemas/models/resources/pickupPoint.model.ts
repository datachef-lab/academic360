import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const pickupPointModel = pgTable("pickup_point", {
    id: serial().primaryKey(),  
    legacyPickupPointId: integer(),
    name: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPickupPointSchema = createInsertSchema(pickupPointModel);

export type PickupPoint = z.infer<typeof createPickupPointSchema>;

export type PickupPointT = typeof createPickupPointSchema._type;