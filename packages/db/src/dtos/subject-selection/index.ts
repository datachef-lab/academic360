import { RelatedSubjectMainT } from "@/schemas/models/subject-selection/related-subject-main.model";
import { ProgramCourseDto } from "../course-design";
import {
    BoardSubjectNameT,
    //  BoardSubjectUnivSubjectMappingT, 
    ClassT, ProgramCourseT, SessionT, StreamT, SubjectT, SubjectTypeT, AcademicYearT
} from "@/schemas";
import { RelatedSubjectSubT } from "@/schemas/models/subject-selection/related-subject-sub.model";
import { RestrictedGroupingMainT } from "@/schemas/models/subject-selection/restricted-grouping-main.model";
import { RestrictedGroupingClassT } from "@/schemas/models/subject-selection/restricted-grouping-class.model";
import { RestrictedGroupingSubjectT } from "@/schemas/models/subject-selection/restricted-grouping-subject.model";
import { RestrictedGroupingProgramCourseT } from "@/schemas/models/subject-selection/restricted-grouping-program-course.model";
import { SubjectSelectionMetaT } from "@/schemas/models/subject-selection/subject-selection-meta.model";
import { SubjectSelectionMetaClassT } from "@/schemas/models/subject-selection/subject-selection-meta-class.model";
import { StudentSubjectSelectionT } from "@/schemas/models/subject-selection/student-subject-selection.model";
import { SubjectSelectionMetaStreamT } from "@/schemas/models/subject-selection/subject-selection-meta-stream.model";
import { SubjectSelectionMetaSourceT } from "@/schemas/models/subject-selection/subject-selection-meta-source.model";

export interface RelatedSubjectSubDto extends Omit<RelatedSubjectSubT, "boardSubjectNameId"> {
    boardSubjectName: BoardSubjectNameT;
}

export interface RelatedSubjectMainDto extends Omit<RelatedSubjectMainT, "programCourseId" | "boardSubjectUnivSubjectMappingId" | "subjectTypeId"> {
    programCourse: ProgramCourseDto;
    subjectType: SubjectTypeT;
    boardSubjectName: BoardSubjectNameT;
    relatedSubjectSubs: RelatedSubjectSubDto[];
}

export interface RestrictedGroupingClassDto extends Omit<RestrictedGroupingClassT, "classId"> {
    class: ClassT;
}

export interface RestrictedGroupingSubjectDto extends Omit<RestrictedGroupingSubjectT, "cannotCombineWithSubjectId"> {
    cannotCombineWithSubject: SubjectT;
}

export interface RestrictedGroupingProgramCourseDto extends Omit<RestrictedGroupingProgramCourseT, "programCourseId"> {
    programCourse: ProgramCourseT;
}

export interface RestrictedGroupingMainDto extends Omit<RestrictedGroupingMainT, "subjectTypeId" | "subjectId"> {
    subjectType: SubjectTypeT;
    subject: SubjectT;
    forClasses: RestrictedGroupingClassDto[];
    cannotCombineWithSubjects: RestrictedGroupingSubjectDto[];
    applicableProgramCourses: RestrictedGroupingProgramCourseDto[];
}


export interface SubjectSelectionMetaClassDto extends Omit<SubjectSelectionMetaClassT, "classId"> {
    class: ClassT;
}

export interface SubjectSelectionMetaStreamDto extends Omit<SubjectSelectionMetaStreamT, "subjectSelectionMetaId" | "streamId"> {
    stream: StreamT;
}

/**
 * Lightweight reference to another meta. Used by `sources` so a meta can point
 * at the metas it draws options from without recursively expanding them.
 */
export interface SubjectSelectionMetaRefDto {
    id: number;
    label: string;
    sequence: number | null;
    subjectType: SubjectTypeT;
}

export interface SubjectSelectionMetaSourceDto
    extends Omit<SubjectSelectionMetaSourceT, "subjectSelectionMetaId" | "sourceSubjectSelectionMetaId"> {
    /** The meta whose prior student selections feed this meta's options. */
    sourceMeta: SubjectSelectionMetaRefDto;
}

export interface SubjectSelectionMetaDto extends Omit<SubjectSelectionMetaT, "subjectTypeId" | "academicYearId"> {
    streams: SubjectSelectionMetaStreamDto[];
    subjectType: SubjectTypeT;
    academicYear: AcademicYearT;
    forClasses: SubjectSelectionMetaClassDto[];
    /**
     * Only meaningful when `optionSource` is PRIOR_SELECTION — the metas this
     * one takes its student options from. Empty for ELECTIVE_SUBJECTS metas.
     * (`optionSource` itself rides along from SubjectSelectionMetaT.)
     */
    sources: SubjectSelectionMetaSourceDto[];
}

export interface StudentSubjectSelectionDto extends Omit<StudentSubjectSelectionT, "sessionId" | "subjectSelectionMetaId" | "subjectId"> {
    session: SessionT;
    subjectSelectionMeta: SubjectSelectionMetaDto;
    subject: SubjectT;
}