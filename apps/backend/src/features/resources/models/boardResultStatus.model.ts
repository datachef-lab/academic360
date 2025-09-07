import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const boardResultTypeEnum = pgEnum("board_result_type", [
  "FAIL",
  "PASS",
]);

export const boardResultStatusModel = pgTable("board_result_status", {
  id: serial().primaryKey(),
  legacyBoardResultStatusId: integer(),
  name: varchar({ length: 255 }).notNull(),
  spclType: varchar({ length: 255 }).notNull(),
  result: boardResultTypeEnum(),
  sequence: integer().unique(),
  disabled: boolean().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createBoardResultStatusSchema = createInsertSchema(
  boardResultStatusModel,
);

export type BoardResultStatus = z.infer<typeof createBoardResultStatusSchema>;
