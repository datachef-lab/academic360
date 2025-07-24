import { Marksheet } from "@/features/academics/models/marksheet.model.js";
import { AcademicIdentifierType } from "../user/academic-identifier.js";
import { Class } from "@/features/academics/models/class.model.js";
import { BatchDto } from "./batch.type.js";
import { MarksheetPaperMapping } from "@/features/academics/models/marksheet-paper-mapping.model.js";
import { MarksheetPaperComponentMapping } from "@/features/academics/models/marksheet-paper-component-mapping.model.js";
import { PaperComponentDto } from "../course-design/index.type.js";
import { Paper } from "@/features/course-design/models/paper.model.js";

export interface MarksheetPaperComponentMappingDto extends Omit<MarksheetPaperComponentMapping, "paperComponentId"> {
    paperComponent: PaperComponentDto;
}
export interface MarksheetPaperDto extends Omit<MarksheetPaperMapping, "batchStudentPaperId" | "yearOfAppearanceId" | "yearOfPassingId"> {
    year1: string;
    year2: string | null;
    paper: Paper;
    components: MarksheetPaperComponentMappingDto[];
}

export interface MarksheetDto extends Omit<Marksheet, "batchStudentMappingId" | "classId"> {
    name: string;
    class: Class;
    batch: BatchDto;
    academicIdentifier: AcademicIdentifierType;
    papers: MarksheetPaperDto[];
}