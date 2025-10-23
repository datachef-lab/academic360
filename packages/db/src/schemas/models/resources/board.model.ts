import { z } from "zod";
// import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar, index } from "drizzle-orm/pg-core";

// import { addressModel } from "@/schemas/models/user";
import { degreeModel } from "@/schemas/models/resources";

export const boardModel = pgTable("boards", {
    id: serial().primaryKey(),
    legacyBoardId: integer(),
    name: varchar({ length: 700 }).notNull(),
    degreeId: integer().references(() => degreeModel.id),
    passingMarks: integer(),
    code: varchar({ length: 255 }),
    // addressId: integer().references(() => addressModel.id),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    // Foreign key indexes for fast joins
    degreeIdIdx: index("idx_boards_degree_id").on(table.degreeId),

    // Search indexes
    nameIdx: index("idx_boards_name").on(table.name),
    codeIdx: index("idx_boards_code").on(table.code),
    isActiveIdx: index("idx_boards_active").on(table.isActive),
    legacyBoardIdIdx: index("idx_boards_legacy_id").on(table.legacyBoardId),

    // Ordering indexes
    sequenceIdx: index("idx_boards_sequence").on(table.sequence),
    createdAtIdx: index("idx_boards_created_at").on(table.createdAt),

    // Composite indexes for common filter combinations
    searchIdx: index("idx_boards_search").on(table.name, table.code),
    filtersIdx: index("idx_boards_filters").on(table.degreeId, table.isActive),
}));

export const createBoardSchema = createInsertSchema(boardModel);

export type Board = z.infer<typeof createBoardSchema>;

export type BoardT = typeof createBoardSchema._type;