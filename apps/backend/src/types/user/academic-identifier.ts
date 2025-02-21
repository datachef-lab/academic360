import { Section } from "@/features/academics/models/section.model.js";
import { Shift } from "@/features/academics/models/shift.model.js";
import { Stream } from "@/features/academics/models/stream.model.js";
import { AcademicIdentifier } from "@/features/user/models/academicIdentifier.model.js";
import { StreamType } from "../academics/stream.js";

export interface AcademicIdentifierType extends Omit<AcademicIdentifier, "streamId" | "shiftId" | "sectionId"> {
    stream?: StreamType | null;
    shift: Shift | null;
    section: Section | null; 
}
