// import axios from 'axios';
import axiosInstance from '@/utils/api';
import {
    Paper,
        // PaperWithDetails,
    PaperComponent,
    Subject,
    Course,
    SubjectType,
    Affiliation,
    RegulationType,
    CourseType,
    AffiliationType,
    ProgramCourse,
    CourseLevel,
    ExamComponent,
} from '@/types/course-design';
import { ApiResonse } from '@/types/api-response';
import { Stream } from '@/pages/courses-subjects-design/streams/columns';
import { AcademicYear } from '@/types/academics/academic-year';

// Define proper types for bulk upload data
export interface BulkUploadRow {
    [key: string]: string | number | boolean;
}

export interface BulkUploadError {
    row: number;
    data: BulkUploadRow;
    error: string;
}

export interface BulkUploadResult {
    success: BulkUploadRow[];
    errors: BulkUploadError[];
    unprocessedData: BulkUploadRow[];
    summary: {
        total: number;
        successful: number;
        failed: number;
        unprocessed: number;
    };
}

const BASE = '/api/course-design';

// Papers
export const getPapers = async () => {
    const res = await axiosInstance.get<ApiResonse<Paper[]>>(`${BASE}/papers`);
    return res.data.payload;
};
export const getPaper = (id: number) => axiosInstance.get<Paper>(`${BASE}/papers/${id}`);
export const getPaperById = (id: number) => axiosInstance.get<ApiResonse<Paper | null>>(`${BASE}/papers/query?id=${id}`);
export const createPaper = (data: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>[]) => axiosInstance.post<ApiResonse<Paper[] | null>>(`${BASE}/papers`, { arr: data });
export const updatePaper = (id: number, data: Partial<Paper>) => axiosInstance.put<Paper>(`${BASE}/papers/${id}`, data);
export const deletePaper = (id: number) => axiosInstance.delete<Paper>(`${BASE}/papers/${id}`);

// Paper Components
export const getPaperComponents = () => axiosInstance.get<PaperComponent[]>(`${BASE}/paper-components`);
export const getPaperComponent = (id: number) => axiosInstance.get<PaperComponent>(`${BASE}/paper-components/${id}`);
export const createPaperComponent = (data: Omit<PaperComponent, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<PaperComponent>(`${BASE}/paper-components`, data);
export const updatePaperComponent = (id: number, data: Partial<PaperComponent>) => axiosInstance.put<PaperComponent>(`${BASE}/paper-components/${id}`, data);
export const deletePaperComponent = (id: number) => axiosInstance.delete<PaperComponent>(`${BASE}/paper-components/${id}`);

// Subjects
export const getSubjects = async () => {
    const res = await axiosInstance.get<ApiResonse<Subject[]>>(`${BASE}/subjects`);
    return res.data.payload;
};
export const getSubject = (id: number) => axiosInstance.get<Subject>(`${BASE}/subjects/${id}`);
export const createSubject = (data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<Subject>(`${BASE}/subjects`, data);
export const updateSubject = (id: number, data: Partial<Subject>) => axiosInstance.put<Subject>(`${BASE}/subjects/${id}`, data);
export const deleteSubject = (id: number) => axiosInstance.delete<Subject>(`${BASE}/subjects/${id}`);

// Courses
export const getCourses = async () => {
    const res = await axiosInstance.get<ApiResonse<Course[]>>(`${BASE}/courses`);
    console.log("in get courses in api, res:", res);
    return res.data.payload;
};
export const getCourse = (id: number) => axiosInstance.get<Course>(`${BASE}/courses/${id}`);
export const createCourse = (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<Course>(`${BASE}/courses`, data);
export const updateCourse = (id: number, data: Partial<Course>) => axiosInstance.put<Course>(`${BASE}/courses/${id}`, data);
export const deleteCourse = (id: number) => axiosInstance.delete<Course>(`${BASE}/courses/${id}`);

// Course Types
export const getCourseTypes = async () => {
    const res = await axiosInstance.get<ApiResonse<CourseType[]>>(`${BASE}/course-types`);
    return res.data.payload;
};
export const getCourseType = (id: number) => axiosInstance.get<CourseType>(`${BASE}/course-types/${id}`);
export const createCourseType = (data: Omit<CourseType, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<CourseType>(`${BASE}/course-types`, data);
export const updateCourseType = (id: number, data: Partial<Omit<CourseType, 'id' | 'createdAt' | 'updatedAt'>>) => axiosInstance.put<CourseType>(`${BASE}/course-types/${id}`, data);
export const deleteCourseType = (id: number) => axiosInstance.delete<CourseType>(`${BASE}/course-types/${id}`);

// Bulk upload course types
export const bulkUploadCourseTypes = async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/course-types/bulk-upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.payload;
};

// Subject Types
export const getSubjectTypes = async () => {
    const res = await axiosInstance.get<ApiResonse<SubjectType[]>>(`${BASE}/subject-types`);
    return res.data.payload;
};
export const getSubjectType = (id: number) => axiosInstance.get<SubjectType>(`${BASE}/subject-types/${id}`);
export const createSubjectType = (data: Omit<SubjectType, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<SubjectType>(`${BASE}/subject-types`, data);
export const updateSubjectType = (id: number, data: Partial<SubjectType>) => axiosInstance.put<SubjectType>(`${BASE}/subject-types/${id}`, data);
export const deleteSubjectType = (id: number) => axiosInstance.delete<SubjectType>(`${BASE}/subject-types/${id}`);

// Bulk upload subject types
export const bulkUploadSubjectTypes = async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/subject-types/bulk-upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.payload;
};

// Affiliations
export const getAffiliations = async () => {
    const res = await axiosInstance.get<ApiResonse<Affiliation[]>>(`${BASE}/affiliations`);
    return res.data.payload;
};
export const getAffiliation = (id: number) => axiosInstance.get<Affiliation>(`${BASE}/affiliations/${id}`);
export const createAffiliation = (data: Omit<Affiliation, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<Affiliation>(`${BASE}/affiliations`, data);
export const updateAffiliation = (id: number, data: Partial<Affiliation>) => axiosInstance.put<Affiliation>(`${BASE}/affiliations/${id}`, data);
export const deleteAffiliation = (id: number) => axiosInstance.delete<Affiliation>(`${BASE}/affiliations/${id}`);

// Bulk upload affiliations
export const bulkUploadAffiliations = async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/affiliations/bulk-upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.payload;
};

// Affiliation Types
export const getAffiliationTypes = async () => {
    const res = await axiosInstance.get<ApiResonse<AffiliationType[]>>(`${BASE}/affiliation-types`);
    return res.data.payload;
};
export const getAffiliationType = (id: number) => axiosInstance.get<AffiliationType>(`${BASE}/affiliation-types/${id}`);
export const createAffiliationType = (data: Omit<AffiliationType, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<AffiliationType>(`${BASE}/affiliation-types`, data);
export const updateAffiliationType = (id: number, data: Partial<AffiliationType>) => axiosInstance.put<AffiliationType>(`${BASE}/affiliation-types/${id}`, data);
export const deleteAffiliationType = (id: number) => axiosInstance.delete<AffiliationType>(`${BASE}/affiliation-types/${id}`);

// Bulk upload affiliation types
export const bulkUploadAffiliationTypes = async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/affiliation-types/bulk-upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.payload;
};

// Regulation Types
export const getRegulationTypes = async () => {
    const res = await axiosInstance.get<ApiResonse<RegulationType[]>>(`${BASE}/regulation-types`);
    return res.data.payload;
};
export const getRegulationType = (id: number) => axiosInstance.get<RegulationType>(`${BASE}/regulation-types/${id}`);
export const createRegulationType = (data: Omit<RegulationType, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<RegulationType>(`${BASE}/regulation-types`, data);
export const updateRegulationType = (id: number, data: Partial<RegulationType>) => axiosInstance.put<RegulationType>(`${BASE}/regulation-types/${id}`, data);
export const deleteRegulationType = (id: number) => axiosInstance.delete<RegulationType>(`${BASE}/regulation-types/${id}`);

// Bulk upload regulation types
export const bulkUploadRegulationTypes = async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/regulation-types/bulk-upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.payload;
};

// Program Courses
export const getProgramCourses = async () => {
    const res = await axiosInstance.get<ApiResonse<ProgramCourse[]>>(`${BASE}/program-courses`);
    return res.data.payload;
};
export const getProgramCourse = (id: number) => axiosInstance.get<ProgramCourse>(`${BASE}/program-courses/${id}`);
export const createProgramCourse = (data: Omit<ProgramCourse, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<ProgramCourse>(`${BASE}/program-courses`, data);
export const updateProgramCourse = (id: number, data: Partial<ProgramCourse>) => axiosInstance.put<ProgramCourse>(`${BASE}/program-courses/${id}`, data);
export const deleteProgramCourse = (id: number) => axiosInstance.delete<ProgramCourse>(`${BASE}/program-courses/${id}`);

// Bulk upload program courses
export const bulkUploadProgramCourses = async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/program-courses/bulk-upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.payload;
};

// Streams
export const getStreams = async () => {
    const res = await axiosInstance.get<ApiResonse<Stream[]>>(`${BASE}/streams`);
    return res.data.payload;
};
export const getStream = (id: number) => axiosInstance.get<Stream>(`${BASE}/streams/${id}`);
export const createStream = (data: Omit<Stream, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<Stream>(`${BASE}/streams`, data);
export const updateStream = (id: number, data: Partial<Stream>) => axiosInstance.put<Stream>(`${BASE}/streams/${id}`, data);
export const deleteStream = (id: number) => axiosInstance.delete<Stream>(`${BASE}/streams/${id}`);

// Course Levels
export const getCourseLevels = async () => {
    const res = await axiosInstance.get<ApiResonse<CourseLevel[]>>(`${BASE}/course-levels`);
    return res.data.payload;
};
export const getCourseLevel = (id: number) => axiosInstance.get<CourseLevel>(`${BASE}/course-levels/${id}`);
export const createCourseLevel = (data: Omit<CourseLevel, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<CourseLevel>(`${BASE}/course-levels`, data);
export const updateCourseLevel = (id: number, data: Partial<CourseLevel>) => axiosInstance.put<CourseLevel>(`${BASE}/course-levels/${id}`, data);
export const deleteCourseLevel = (id: number) => axiosInstance.delete<CourseLevel>(`${BASE}/course-levels/${id}`);

// Update a paper with components
export const updatePaperWithComponents = (paperId: number, data: {
    name: string;
    subjectId: number;
    affiliationId: number;
    regulationTypeId: number;
    academicYearId: number;
    courseId: number;
    subjectTypeId: number;
    classId: number;
    code: string;
    isOptional: boolean;
    disabled: boolean;
    components: Array<{
        examComponent: {
            id: number;
        };
        fullMarks: number;
        credit: number;
    }>;
}) => axiosInstance.put(`${BASE}/papers/${paperId}/with-components`, data);

// Bulk upload subject papers
export const bulkUploadSubjectPapers = async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/subject-papers/bulk-upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.payload;
};

// Exam Components
export const getExamComponents = async () => {
    const res = await axiosInstance.get<ApiResonse<ExamComponent[]>>(`${BASE}/exam-components`);
    return res.data.payload;
};
export const getExamComponent = (id: number) => axiosInstance.get<ExamComponent>(`${BASE}/exam-components/${id}`);
export const createExamComponent = (data: Omit<ExamComponent, 'id' | 'createdAt' | 'updatedAt'>) => axiosInstance.post<ExamComponent>(`${BASE}/exam-components`, data);
export const updateExamComponent = (id: number, data: Partial<ExamComponent>) => axiosInstance.put<ExamComponent>(`${BASE}/exam-components/${id}`, data);
export const deleteExamComponent = (id: number) => axiosInstance.delete<ExamComponent>(`${BASE}/exam-components/${id}`);

// Academic Years
export const getAcademicYears = async () => {
    const res = await axiosInstance.get<ApiResonse<AcademicYear[]>>('/api/v1/academics/all');
    return res.data.payload;
};

// Classes

// Get filtered and paginated subject papers
export const getFilteredSubjectPapersWithPagination = (filters: {
    subjectId?: number;
    affiliationId?: number;
    regulationTypeId?: number;
    academicYearId?: number;
    searchText?: string;
    page?: number;
    limit?: number;
}) => {
    const params = new URLSearchParams();

    if (filters.subjectId) params.append('subjectId', filters.subjectId.toString());
    if (filters.affiliationId) params.append('affiliationId', filters.affiliationId.toString());
    if (filters.regulationTypeId) params.append('regulationTypeId', filters.regulationTypeId.toString());
    if (filters.academicYearId) params.append('academicYearId', filters.academicYearId.toString());
    if (filters.searchText) params.append('searchText', filters.searchText);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return axiosInstance.get(`${BASE}/subject-papers/filtered?${params.toString()}`);
};
