import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const boardResultTypeEnum = pgEnum("board_result_type", ["FAIL", "PASS"]);

export const boardResultStatusModel = pgTable("board_result_status", {
    id: serial().primaryKey(),
    legacyBoardResultStatusId: integer(),
    name: varchar({ length: 255 }).notNull(),
    spclType: varchar({ length: 255 }).notNull(),
    result: boardResultTypeEnum(),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBoardResultStatusSchema = createInsertSchema(boardResultStatusModel);

export type BoardResultStatus = z.infer<typeof createBoardResultStatusSchema>;

export type BoardResultStatusT = typeof createBoardResultStatusSchema._type;