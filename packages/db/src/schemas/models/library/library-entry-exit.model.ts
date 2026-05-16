import { integer, pgTable, serial, timestamp,  } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";
import { libraryEntryExitStatusEnum } from "@/schemas/enums";

export const libraryEntryExitModel = pgTable("library_entry_exit", {
    id: serial().primaryKey(),
    legacyLibraryEntryExitId: integer(),
    userId: integer("user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    currentStatus: libraryEntryExitStatusEnum().notNull(),
    entryTimestamp: timestamp({ withTimezone: true }).notNull().defaultNow(),
    exitTimestamp: timestamp({ withTimezone: true }),
});

export const createLibraryEntryExitSchema = createInsertSchema(libraryEntryExitModel);

export type LibraryEntryExit = z.infer<typeof createLibraryEntryExitSchema>;

export type LibraryEntryExitT = typeof createLibraryEntryExitSchema._type;