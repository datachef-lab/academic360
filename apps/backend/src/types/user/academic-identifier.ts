import { AcademicIdentifier } from "@/features/user/models/academicIdentifier.model.ts";

export interface AcademicIdentifierType extends Omit<AcademicIdentifier, "streamId"> {
    stream: string | null;
}
