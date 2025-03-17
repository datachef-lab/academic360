import { userModel } from "@/features/user/models/user.model.js";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const threadModel = pgTable("threads", {
    id: serial().primaryKey(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const threadRelations = relations(threadModel, ({ one }) => ({
    user: one(userModel, {
        fields: [threadModel.userId],
        references: [userModel.id],
    }),
}));

export const createThreadSchema = createInsertSchema(threadModel);

export type Thread = z.infer<typeof createThreadSchema>;