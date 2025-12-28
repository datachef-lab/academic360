import { Marksheet } from "@repo/db/schemas/models/academics";

import { Class } from "@repo/db/schemas/models/academics";
import { BatchDto } from "./batch.type.js";
import { MarksheetPaperMapping } from "@repo/db/schemas/models/academics";
import { MarksheetPaperComponentMapping } from "@repo/db/schemas/models/academics";
import { PaperComponentDto } from "../course-design/index.type.js";
import { Paper } from "@repo/db/schemas/models/course-design";

export interface MarksheetPaperComponentMappingDto extends Omit<
  MarksheetPaperComponentMapping,
  "paperComponentId"
> {
  paperComponent: PaperComponentDto;
}
export interface MarksheetPaperDto extends Omit<
  MarksheetPaperMapping,
  "batchStudentPaperId" | "yearOfAppearanceId" | "yearOfPassingId"
> {
  year1: string;
  year2: string | null;
  paper: Paper;
  components: MarksheetPaperComponentMappingDto[];
}

export interface MarksheetDto extends Omit<
  Marksheet,
  "batchStudentMappingId" | "classId"
> {
  name: string;
  class: Class;
  batch: BatchDto;
  // academicIdentifier: AcademicIdentifierType;
  papers: MarksheetPaperDto[];
}
