
import { NotificationMasterMeta, NotificationMasterMetaT } from "@/schemas/models/notifications/notification-master-meta.model";
import { NotificationEventT, NotificationT, NotificationMasterT, NotificationMasterFieldT, NotificationContentT, NotificationMasterField } from "../../schemas/models/notifications";

export interface NotificationMasterDto extends NotificationMasterT {
    fields: NotificationMasterField[];
    meta: NotificationMasterMeta[];
}

export interface NotificationEventDto extends NotificationEventT {
        notificationMaster: NotificationMasterDto;
    // Optional transport and templating fields for email/whatsapp rendering
    subject?: string;
    subjectTemplate?: string; // EJS string for subject
    html?: string;
    templateData?: TemplateData;
    emailFromName?: string; // Sender display name for email
    emailAttachments?: Array<{
        filename: string;
        contentBase64: string; // base64 content
        mimeType: string;
    }>;
    // WhatsApp
    bodyValues?: string[]; // override values if needed
    whatsappHeaderMediaUrl?: string; // media header URL for Interakt templates
    // Flags
    meta?: { devOnly?: boolean };
}

export interface NotificationDto extends NotificationT {
    notificationEvent: NotificationEventDto;
    content: NotificationContentT[];
}

export type TemplateScalar = string | number | boolean | null | undefined;
export type TemplateData = { [key: string]: TemplateScalar | TemplateData | Array<TemplateScalar | TemplateData> };