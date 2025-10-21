
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

export interface NotificationDto {
    userId: number;
    variant: "EMAIL" | "WHATSAPP" | "SMS" | "WEB" | "OTHER";
    type: "UPLOAD" | "EDIT" | "UPDATE" | "INFO" | "FEE" | "EVENT" | "OTHER" | "ADMISSION" | "EXAM" | "MINOR_PAPER_SELECTION" | "SEMESTER_WISE_SUBJECT_SELECTION" | "ALERT" | "OTP";
    message: string;
    notificationMasterId: number;
    applicationFormId?: number;
    notificationEvent?: NotificationEventDto;
    content?: NotificationContentT[];
    otherUsersEmails?: string[];
    otherUsersWhatsAppNumbers?: string[];
    emailAttachments?: Array<{
        pdfS3Url: string;
    }>;
}

export type TemplateScalar = string | number | boolean | null | undefined;
export type TemplateData = { [key: string]: TemplateScalar | TemplateData | Array<TemplateScalar | TemplateData> };