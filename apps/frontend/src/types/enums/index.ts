export type Community = "GUJARATI" | "NON-GUJARATI";

export type Level = "UNDER_GRADUATE" | "POST_GRADUATE";

export type Framework = "CCF" | "CBCS" | null;

export type Shift = "MORNING" | "AFTERNOON" | "EVENING";


export type Gender = "MALE" | "FEMALE" | "TRANSGENDER";

export type Disability = "VISUAL" | "HEARING_IMPAIRMENT" | "VISUAL_IMPAIRMENT" | "ORTHOPEDIC" | "OTHER"

export type StudentStatus = "DROPPED_OUT" | "GRADUATED" | "ACTIVE" | "PENDING_CLEARANCE"

export type SubjectCategory = "SPECIAL" | "COMMON" | "HONOURS" | "GENERAL" | "ELECTIVE";

export type ParentType = "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY";

export type ResultStatus = "FAIL" | "PASS";

export type PlaceOfStay = "OWN" |
    "HOSTEL" |
    "FAMILY_FRIENDS" |
    "PAYING_GUEST" |
    "RELATIVES";

export type ProgrammeType =  "HONOURS" | "GENERAL" | null;

export type PlaceOfStayType = "OWN" | "HOSTEL" | "FAMILY_FRIENDS" |"PAYING_GUEST" |"RELATIVES";






export type LocalityType = "RURAL" | "URBAN";

export type UserType = "ADMIN" | "STUDENT" | "TEACHER";

export type MarksheetSource = "FILE_UPLOAD" | "ADDED";

export type ClassType = "YEAR" | "SEMESTER";

export type PaperModeType =
  | "THEORETICAL"
  | "PRACTICAL"
  | "VIVA"
  | "ASSIGNMENT"
  | "PROJECT"
  | "MCQ";

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED"
  | "SUCCESS";

export type PaymentMode =
  | "CASH"
  | "CHEQUE"
  | "ONLINE"
  | "UPI"
  | "WALLET"
  | "NET_BANKING"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "PAYTM_BALANCE";

export type StudentFeesMappingType = "FULL" | "INSTALMENT";

export type AdmissionFormStatus =
  | "DRAFT"
  | "PAYMENT_DUE"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "WAITING_FOR_APPROVAL"
  | "WAITING_FOR_PAYMENT"
  | "WAITING_FOR_DOCUMENTS"
  | "DOCUMENTS_VERIFIED"
  | "DOCUMENTS_PENDING"
  | "DOCUMENTS_REJECTED";

export type AdmissionStep =
  | "GENERAL_INFORMATION"
  | "ACADEMIC_INFORMATION"
  | "COURSE_APPLICATION"
  | "ADDITIONAL_INFORMATION"
  | "DOCUMENTS"
  | "PAYMENT"
  | "REVIEW"
  | "SUBMITTED";

export type PersonTitleType =
  | "MR"
  | "MRS"
  | "MS"
  | "DR"
  | "PROF"
  | "REV"
  | "OTHER";

export type BoardResultStatusType =
  | "PASS"
  | "FAIL"
  | "COMPARTMENTAL";

export type SubjectResultStatusType =
  | "PASS"
  | "FAIL IN THEORY"
  | "FAIL IN PRACTICAL"
  | "FAIL";

export type SportsLevel = "NATIONAL" | "STATE" | "DISTRICT" | "OTHERS";

export type StreamType = "SCIENCE" | "COMMERCE" | "HUMANITIES" | "ARTS";

export type OtpType = "FOR_PHONE" | "FOR_EMAIL";

export type StudyMaterialType = "FILE" | "LINK";

export type StudyMetaType = "RESOURCE" | "WORKSHEET" | "ASSIGNMENT" | "PROJECT";
