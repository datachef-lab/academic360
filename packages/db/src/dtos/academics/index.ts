import { AcademicActivityMasterT, AcademicActivityScopeT, AcademicYearT, DeclartionMasterT, DeclartionT, AffiliationT, CareerProgressionFormCertificateT, CareerProgressionFormFieldT, CareerProgressionFormT, CertificateFieldMasterT, CertificateFieldOptionMasterT, CertificateMasterT, ClassT, PromotionStatusT, RegulationTypeT, SessionT, StreamT, DeclartionMasterStatementT, DeclartionMasterStatementFieldT, DeclartionMasterStatementFieldOptionT, DeclartionStatementT, DeclartionStatementFieldT } from "@/schemas";
import { AcademicActivityT } from "@/schemas/models/academics/academic-activity.model";

export interface SessionDto extends Omit<SessionT, "academicYearId"> {
    academicYear: AcademicYearT;
}

export interface CertificateFieldMasterDto extends CertificateFieldMasterT {
    options: CertificateFieldOptionMasterT[];
}

export interface CertificateMasterDto extends CertificateMasterT {
    fields: CertificateFieldMasterDto[]
}

export interface CareerProgressionFormFieldDto extends Omit<CareerProgressionFormFieldT, "certificateFieldMasterId" | "certificateFieldOptionMasterId"> {
    certificateFieldMaster: CertificateFieldMasterT;
    certificateFieldOptionMaster: CertificateFieldOptionMasterT | null;
}

export interface CareerProgressionFormCertificateDto extends Omit<CareerProgressionFormCertificateT, "certificateMasterId"> {
    certificateMaster: CertificateMasterT;
    fields: CareerProgressionFormFieldDto[];
}

/** Enriched student row for admin export (career progression list / Excel). */
export interface CareerProgressionFormStudentExport {
    uid: string;
    name: string;
    registrationNumber: string | null;
    rollNumber: string | null;
    programCourse: string;
    semester: string;
    shift: string;
    section: string;
    studentStatus: string;
}

export interface CareerProgressionFormDto extends Omit<CareerProgressionFormT, "academicYearId"> {
    academicYear: AcademicYearT;
    certificates: CareerProgressionFormCertificateDto[];
    /** Present when the form is loaded via list/export APIs that join student + user. */
    student?: CareerProgressionFormStudentExport;
}

export interface AcademicActivityScopeDto extends Omit<AcademicActivityScopeT, "streamId" | "classId" | "academicActivityId"> {
    stream: StreamT;
    class: ClassT;
}


export interface AcademicActivityDto extends Omit<AcademicActivityT,
    "academicYearId"
    | "academicActivityMasterId"
    | "affiliationId"
    | "regulationTypeId"
    | "appearTypeId"
    | "lastUpdatedBy"
> {
    master: AcademicActivityMasterT;
    academicYear: AcademicYearT;
    affiliation: AffiliationT;
    regulationType: RegulationTypeT;
    appearType: PromotionStatusT;
    scopes: AcademicActivityScopeDto[];
}

export interface DeclarationMasterStatementFieldDto extends DeclartionMasterStatementFieldT {
    options?: DeclartionMasterStatementFieldOptionT[];
}

export interface DeclarationMasterStatementDto extends DeclartionMasterStatementT {
    fields: DeclarationMasterStatementFieldDto[];
}

export interface DeclarationMasterDto extends DeclartionMasterT {
    statements: DeclarationMasterStatementDto[];
}

export interface DeclarationStatementFieldDto extends Omit<DeclartionStatementFieldT, "declarationMasterStatementFieldId" | "declarationMasterStatementFieldOptionId"> {
    masterField: DeclartionMasterStatementFieldT;
    masterFieldOption?: DeclartionMasterStatementFieldOptionT;
}

export interface DeclarationStatementDto extends DeclartionStatementT {
    statementMaster: DeclarationMasterDto;
    fields: DeclarationStatementFieldDto[];
}

export interface DeclarationDto extends Omit<DeclartionT, "declarationMasterId"> {
    master: DeclartionMasterT;
    statements: DeclarationStatementDto[];
}