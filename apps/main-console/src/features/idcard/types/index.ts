export type IdCardFieldKey =
  | "NAME"
  | "COURSE"
  | "UID"
  | "MOBILE"
  | "BLOOD_GROUP"
  | "SPORTS_QUOTA"
  | "QRCODE"
  | "VALID_TILL_DATE"
  | "PHOTO";

export type IdCardIssueStatus = "ISSUED" | "RENEWED" | "REISSUED";

export interface IdCardTemplateField {
  id: number;
  templateId: number;
  fieldKey: IdCardFieldKey;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  fontSize: number | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IdCardTemplate {
  id: number;
  academicYearId: number;
  name: string;
  description: string | null;
  templateImageKey: string;
  templateImageUrl: string | null;
  backsideImageKey?: string | null;
  backsideImageUrl?: string | null;
  canvasWidthPx: number;
  canvasHeightPx: number;
  qrcodeSize: number;
  isDefault: boolean;
  disabled: boolean;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  academicYear?: { id: number; year: string } | null;
  fields?: IdCardTemplateField[];
}

export interface IdCardIssue {
  id: number;
  studentId: number;
  templateId: number | null;
  issueStatus: IdCardIssueStatus;
  renewedFromIssueId: number | null;
  issueDate: string;
  validFrom: string | null;
  validTill: string | null;
  rfidNumber: string | null;
  frontImageKey: string | null;
  frontImageUrl: string | null;
  photoImageKey: string | null;
  photoImageUrl: string | null;
  nameSnapshot: string | null;
  courseSnapshot: string | null;
  bloodGroupSnapshot: string | null;
  mobileSnapshot: string | null;
  sportsQuotaSnapshot: string | null;
  uidSnapshot: string | null;
  remarks: string | null;
  issuedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  template?: IdCardTemplate | null;
  student?: {
    id: number;
    uid: string;
    name: string | null;
    rfidNumber: string | null;
  } | null;
}

export interface IdCardTemplateUpsertPayload {
  academicYearId: number;
  name: string;
  description?: string | null;
  canvasWidthPx?: number;
  canvasHeightPx?: number;
  qrcodeSize?: number;
  isDefault?: boolean;
  disabled?: boolean;
}

export interface IdCardTemplateFieldUpsertPayload {
  fieldKey: IdCardFieldKey;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  fontSize?: number | null;
  isVisible?: boolean;
}

export interface IdCardIssueCreatePayload {
  studentId: number;
  templateId: number;
  issueStatus?: IdCardIssueStatus;
  renewedFromIssueId?: number | null;
  rfidNumber?: string | null;
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

export const ID_CARD_FIELD_LABELS: Record<IdCardFieldKey, string> = {
  NAME: "Name",
  COURSE: "Course",
  UID: "UID",
  MOBILE: "Mobile",
  BLOOD_GROUP: "Blood Group",
  SPORTS_QUOTA: "Sports Quota",
  QRCODE: "QR Code",
  VALID_TILL_DATE: "Valid Till Date",
  PHOTO: "Photo",
};

export const ID_CARD_FIELDS_WITH_DIMENSIONS: IdCardFieldKey[] = ["PHOTO"];
