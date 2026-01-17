import { ExamCandidate, ExamProgramCourseT, ExamShift, ExamSubjectT, ExamSubjectType, ExamTypeT, FloorT, RoomT } from "@/schemas/models/exams";
import { ExamRoomT } from "@/schemas/models/exams/exam-room.model";
import { ExamT } from "@/schemas/models/exams/exam.model";
import { PaperDto, ProgramCourseDto } from "../course-design";
import { AcademicYearT, ClassT, PaperT, ShiftT,  SubjectT, SubjectTypeT } from "@/schemas";

export interface ExamAuditUserInfo {
    id: number;
    name: string;
    email: string;
    image?: string | null;
    phone?: string | null;
}

export interface RoomDto extends Omit<RoomT, "floorId"> {
    floor: FloorT;
}

export interface ExamRoomDto extends Omit<ExamRoomT, "roomId"> {
    room: RoomDto;
}

export interface ExamCandidateDto extends Omit<ExamCandidate, "paperId"> {
    paper: PaperT;
}

export interface ExamProgramCourseDto extends Omit<ExamProgramCourseT, "programCourseId"> {
    programCourse: ProgramCourseDto;   
}

export interface ExamShiftDto extends Omit<ExamShift, "shiftId"> {
    shift: ShiftT;
}

export interface ExamSubjectTypeDto extends Omit<ExamSubjectType, "subjectTypeId"> {
    subjectType: SubjectTypeT;
}

export interface ExamSubjectDto extends Omit<ExamSubjectT, "subjectId"> {
    subject: SubjectT;
}

export interface ExamDto extends Omit<ExamT, "academicYearId" | "examTypeId" | "classId"> {
    academicYear: AcademicYearT;
    examType: ExamTypeT;
    class: ClassT;
    locations: ExamRoomDto[];
    examProgramCourses: ExamProgramCourseDto[];
    examShifts: ExamShiftDto[];
    examSubjectTypes: ExamSubjectTypeDto[];
    examSubjects: ExamSubjectDto[];
    scheduledByUser?: ExamAuditUserInfo | null;
    lastUpdatedByUser?: ExamAuditUserInfo | null;
}

export interface ExamPapersWithStats {
    paper: PaperDto;
    studentCount: number;
    examSubjectId: number;
}