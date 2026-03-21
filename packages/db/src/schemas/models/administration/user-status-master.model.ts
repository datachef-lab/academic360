import { AnyPgColumn, boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";


export const userStatusMasterModel = pgTable("user_statuses_master", {
   id: serial().primaryKey(),
   
   parentUserStatusMasterId: integer("parent_user_status_master_id_fk")
       .references((): AnyPgColumn => userStatusMasterModel.id),
   name: varchar({ length: 255 })
       .notNull()
       .unique(),
   color: varchar({ length: 255 }),
   bgColor: varchar({ length: 255 }),
   description: varchar({ length: 500 }),
   code: varchar({ length: 255 }),
   isActive: boolean().notNull().default(true),
    
   createdAt: timestamp({ withTimezone: true })
       .notNull()
       .defaultNow(),
   updatedAt: timestamp({ withTimezone: true })
       .notNull()
       .defaultNow()
       .$onUpdate(() => new Date()),
});

export const createUserStatusMasterSchema = createInsertSchema(userStatusMasterModel);

export type UserStatusMaster = z.infer<typeof createUserStatusMasterSchema>;

export type UserStatusMasterT = typeof createUserStatusMasterSchema._type;