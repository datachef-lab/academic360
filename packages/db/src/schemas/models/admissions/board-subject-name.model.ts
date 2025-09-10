import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const boardSubjectNameModel = pgTable("board_subject_names", {
    id: serial().primaryKey(),
    legacyBoardSubjectNameId: integer("legacy_board_subject_name_id"),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 500 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createBoardSubjectName = createInsertSchema(boardSubjectNameModel);

export type BoardSubjectName = z.infer<typeof createBoardSubjectName>;

export type BoardSubjectNameT = typeof createBoardSubjectName._type;