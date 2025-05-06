export interface Subject {
  id: number;
  name: string;
  irpCode: string;
  marksheetCode: string;
  subjectType?: {
    id: number;
    marksheetName: string;
  };
  credit: number;
  fullMarks: number;
  semester: number;
  stream?: {
    id: number;
    degreeProgramme: string;
    degree?: {
      id: number;
      name: string;
    };
  };
  isOptional: boolean;
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface ApiResponse {
  httpStatusCode: number;
  payload: Subject[];
  httpStatus: string;
  message: string;
}

export interface NewSubject {
  name: string;
  irpCode: string;
  marksheetCode: string;
  subjectTypeId: number;
  credit: number;
  fullMarks: number;
  semester: number;
  streamId: number;
  isOptional: boolean;
}

export interface SubjectTypeOption {
  id: number;
  marksheetName: string;
}

export interface DegreeOption {
  id: number;
  name: string;
}

export interface ProgrammeOption {
  id: number;
  degreeProgramme: string;
  degreeId: number;
} 