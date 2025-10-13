// MIS Table data types matching the backend API
export interface MisTableRow {
  programCourseName: string;
  admitted: number;
  subjectSelectionDone: number;
  onlineRegDone: number;
  physicalRegDone: number;
  sortOrder: number;
}

export interface MisTableData {
  updatedAt: string;
  sessionId?: number;
  classId?: number;
  data: MisTableRow[];
}

export interface MisTableUpdate {
  id: string;
  type: "mis_table_update";
  sessionId?: number;
  classId?: number;
  data: MisTableRow[];
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface MisFilters {
  sessionId?: number;
  classId?: number;
}

export interface MisStats {
  totalAdmitted: number;
  totalSubjectSelectionDone: number;
  completionPercentage: number;
  lastUpdated: string;
}
