import axiosInstance from "@/utils/api";
import type { Subject } from "@/types/course-design";
import type { BoardSubjectDto } from "./board-subject.service";

export interface BoardSubjectUnivSubjectMappingDto {
  id: number;
  subject: Subject;
  boardSubjects: BoardSubjectDto[];
}

const API_BASE_URL = "/api/admissions/board-subject-univ-subject-mappings";

export const boardSubjectUnivSubjectMappingService = {
  async list(): Promise<BoardSubjectUnivSubjectMappingDto[]> {
    const res = await axiosInstance.get(API_BASE_URL);
    return res.data.payload ?? [];
  },

  async get(id: number): Promise<BoardSubjectUnivSubjectMappingDto | null> {
    const res = await axiosInstance.get(`${API_BASE_URL}/${id}`);
    return res.data.payload ?? null;
  },

  async create(data: BoardSubjectUnivSubjectMappingDto): Promise<BoardSubjectUnivSubjectMappingDto> {
    const res = await axiosInstance.post(API_BASE_URL, data);
    return res.data.payload as BoardSubjectUnivSubjectMappingDto;
  },

  async update(id: number, data: BoardSubjectUnivSubjectMappingDto): Promise<BoardSubjectUnivSubjectMappingDto> {
    const res = await axiosInstance.put(`${API_BASE_URL}/${id}`, data);
    return res.data.payload as BoardSubjectUnivSubjectMappingDto;
  },

  async remove(id: number): Promise<void> {
    await axiosInstance.delete(`${API_BASE_URL}/${id}`);
  },
};
