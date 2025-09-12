import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { attachmentTypeEnum } from "@/schemas/enums";
import { noticeModel } from "@/schemas/models/academics";

export const noticeAttachmentModel = pgTable("notice_attachments", {
    id: serial().primaryKey(),
    noticeId: integer('notice_id_fk')
        .references(() => noticeModel.id)
        .notNull(),
    type: attachmentTypeEnum().notNull(),
    url: varchar({ length: 2000 }),
    filePath: varchar({ length: 700 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createNoticeAttachmentSchema = createInsertSchema(noticeAttachmentModel);

export type NoticeAttachment = z.infer<typeof createNoticeAttachmentSchema>;

export type NoticeAttachmentT = typeof createNoticeAttachmentSchema._type;