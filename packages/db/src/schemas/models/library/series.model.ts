import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const seriesModel = pgTable("series", {
    id: serial().primaryKey(),
    legacySeriesId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSeriesSchema = createInsertSchema(seriesModel);

export type Series = z.infer<typeof createSeriesSchema>;

export type SeriesT = typeof createSeriesSchema._type;