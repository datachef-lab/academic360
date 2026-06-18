import {
    AcademicYearT,
    IdCardIssueT,
    IdCardTemplateFieldT,
    IdCardTemplateT,
} from "@/schemas";

export interface IdCardTemplateFieldDto extends IdCardTemplateFieldT {}

export interface IdCardTemplateDto extends Omit<IdCardTemplateT, "academicYearId"> {
    academicYear: AcademicYearT;
    fields: IdCardTemplateFieldDto[];
}

export interface IdCardTemplateListItemDto extends IdCardTemplateT {
    fieldCount: number;
    issueCount: number;
}

export interface IdCardIssueStudentSummary {
    id: number;
    uid: string;
    name: string;
    course: string | null;
    section: string | null;
    shift: string | null;
    bloodGroup: string | null;
    phone: string | null;
    sportsQuota: string | null;
    rfidNumber: string | null;
    profileImageUrl: string | null;
}

export interface IdCardIssueDto extends Omit<IdCardIssueT, "studentId" | "templateId"> {
    student: IdCardIssueStudentSummary;
    template: IdCardTemplateT | null;
}

export interface CreateIdCardTemplatePayload {
    academicYearId: number;
    name: string;
    description?: string | null;
    canvasWidthPx?: number;
    canvasHeightPx?: number;
    qrcodeSize?: number;
    validFrom?: string | null;
    validTill?: string | null;
    isDefault?: boolean;
}

export interface UpsertIdCardTemplateFieldPayload {
    fieldKey: IdCardTemplateFieldT["fieldKey"];
    x: number;
    y: number;
    width?: number | null;
    height?: number | null;
    isVisible?: boolean;
}

export interface CreateIdCardIssuePayload {
    studentId: number;
    templateId: number;
    rfidNumber?: string | null;
    issueStatus?: IdCardIssueT["issueStatus"];
    renewedFromIssueId?: number | null;
    validFrom?: string | null;
    validTill?: string | null;
    nameSnapshot?: string | null;
    courseSnapshot?: string | null;
    bloodGroupSnapshot?: string | null;
    mobileSnapshot?: string | null;
    sportsQuotaSnapshot?: string | null;
    uidSnapshot?: string | null;
    remarks?: string | null;
}
