import { ExamSubject, ExamTypeT, FloorT, RoomT } from "@/schemas/models/exams";
import { ExamRoomT } from "@/schemas/models/exams/exam-room.model";
import { ExamT } from "@/schemas/models/exams/exam.model";
import { ProgramCourseDto } from "../course-design";
import { AcademicYearT, ClassT, ShiftT, Subject, SubjectTypeT } from "@/schemas";

export interface RoomDto extends Omit<RoomT, "floorId"> {
    floor: FloorT;
}

export interface ExamRoomDto extends Omit<ExamRoomT, "roomId"> {
    room: RoomDto;
}

export interface ExamDto extends Omit<ExamT, "academicYearId" | "examTypeId" | "classId"> {
    academicYear: AcademicYearT;
    examType: ExamTypeT;
    classId: ClassT;
    locations: ExamRoomDto[];
    programCourses: ProgramCourseDto[];
    shifts: ShiftT[];
    subjectTypes: SubjectTypeT[];
    subjects: ExamSubject[];
}