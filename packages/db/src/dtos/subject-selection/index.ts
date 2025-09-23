import { RelatedSubjectMainT } from "@/schemas/models/subject-selection/related-subject-main.model";
import { ProgramCourseDto } from "../course-design";
import {
    BoardSubjectNameT,
    //  BoardSubjectUnivSubjectMappingT, 
    ClassT, ProgramCourseT, SubjectT, SubjectTypeT } from "@/schemas";
import { RelatedSubjectSubT } from "@/schemas/models/subject-selection/related-subject-sub.model";
import { RestrictedGroupingMainT } from "@/schemas/models/subject-selection/restricted-grouping-main.model";
import { RestrictedGroupingClassT } from "@/schemas/models/subject-selection/restricted-grouping-class.model";
import { RestrictedGroupingSubjectT } from "@/schemas/models/subject-selection/restricted-grouping-subject.model";
import { RestrictedGroupingProgramCourseT } from "@/schemas/models/subject-selection/restricted-grouping-program-course.model";

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