import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar, index } from "drizzle-orm/pg-core";

export const degreeModel = pgTable("degree", {
    id: serial().primaryKey(),
    legacyDegreeId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    // Search indexes
    nameIdx: index("idx_degree_name").on(table.name),
    isActiveIdx: index("idx_degree_active").on(table.isActive),
    legacyDegreeIdIdx: index("idx_degree_legacy_id").on(table.legacyDegreeId),

    // Ordering indexes
    sequenceIdx: index("idx_degree_sequence").on(table.sequence),
    createdAtIdx: index("idx_degree_created_at").on(table.createdAt),
}));

export const createDegreeSchema = createInsertSchema(degreeModel);

export type Degree = z.infer<typeof createDegreeSchema>;

export type DegreeT = typeof createDegreeSchema._type;