import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { bookModel } from "./book.model";
import { statusModel } from "./status.model";
import { entryModeModel } from "./entry-mode.model";
import { rackModel } from "./rack.model";
import { shelfModel } from "./shelf.model";
import { enclosureModel } from "./enclosure.model";
import { bindingModel } from "./binding.model";
import { personModel, userModel } from "../user";

export const copyDetailsModel = pgTable("copy_details", {
    id: serial().primaryKey(),
    legacyCopyDetailsId: integer(),
    bookId: integer("book_id_fk")
        .references(() => bookModel.id)
        .notNull(),
    publishedYear: varchar({ length: 255 }),
    accessNumber: varchar({ length: 255 }),
    oldAccessNumber: varchar({ length: 255 }),
    type: varchar({ length: 255 }),
    issueType: varchar({ length: 255 }),
    statusId: integer("status_id_fk")
        .references(() => statusModel.id),
    enntryModeId: integer("entry_mode_id_fk")
        .references(() => entryModeModel.id),
    rackId: integer("rack_id_fk")
        .references(() => rackModel.id),
    shelfId: integer("shelf_id_fk")
        .references(() => shelfModel.id),
    voucherNumber: varchar({ length: 255 }),
    enclosureId: integer("enclosure_id_fk")
        .references(() => enclosureModel.id),
    numberOfEnclosures: integer().default(0),
    numberOfPages: integer().default(0),
    priceInINR: varchar({ length: 255 }),
    priceForeignCurrency: varchar({ length: 255 }),
    purchasePrice: varchar({ length: 255 }),
    setPrice: varchar({ length: 255 }), 
    bindingTypeId: integer("binding_type_id_fk")
        .references(() => bindingModel.id),
    isbn: varchar({ length: 255 }),
    bookVolume: varchar({ length: 255 }),
    bookPart: varchar({ length: 255 }),
    bookPartInfo: varchar({ length: 255 }),
    volumeInfo: varchar({ length: 255 }),
    remarks: varchar({ length: 1000 }),
    legacyVendorId: integer(),
    donorPersonId: integer("donor_person_id_fk")
        .references(() => personModel.id),
    prefix: varchar({ length: 255 }),
    suffix: varchar({ length: 255 }),
    pdfPath: varchar(),
    bookSize: varchar({ length: 255 }),
    billDate: timestamp({withTimezone: true}),
    discount: varchar({ length: 255 }),
    shippingCharges: varchar({ length: 255 }),
    createdById: integer("created_by_user_id_fk")
        .references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedById: integer("updated_by_user_id_fk")
        .references(() => userModel.id),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCopyDetailsSchema = createInsertSchema(copyDetailsModel);

export type CopyDetails = z.infer<typeof createCopyDetailsSchema>;

export type CopyDetailsT = typeof createCopyDetailsSchema._type;