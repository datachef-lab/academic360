import { AcademicYearT, CareerProgressionFormCertificateT, CareerProgressionFormFieldT, CareerProgressionFormT, CertificateFieldMasterT, CertificateFieldOptionMasterT, CertificateMasterT, SessionT } from "@/schemas";

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

export interface CareerProgressionFormDto extends Omit<CareerProgressionFormT, "academicYearId"> {
    academicYear: AcademicYearT;
    certificates: CareerProgressionFormCertificateDto[];
}

