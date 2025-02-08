import { Stream } from "@/features/academics/models/stream.model";
import { AcademicIdentifier } from "@/features/user/models/academicIdentifier.model.js";

export interface AcademicIdentifierType extends Omit<AcademicIdentifier, "streamId"> {
    stream?: Stream | null;
}
