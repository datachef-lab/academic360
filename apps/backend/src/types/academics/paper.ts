import { Paper } from "@/features/academics/models/paper.model.js";
import { OfferedSubjectType } from "./offered-subject.js";

export interface PaperType extends Omit<Paper, "offeredSubjectId"> {
    offeredSubject: OfferedSubjectType;
}