import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { stateModel } from "../resources";
import z from "zod";

export const policeStationModel = pgTable("police_station", {
    id: serial().primaryKey(),
    legacyPoliceStationId: integer().notNull(),
    name: varchar({ length: 255 }).notNull(),
    stateId: integer("state_id_fk")
        .references(() => stateModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createPoliceStationSchema = createInsertSchema(policeStationModel);

export type PoliceStation = typeof createPoliceStationSchema._type;

export type PoliceStationT = z.infer<typeof createPoliceStationSchema>;