import { z } from "zod";

// SubjectType Schema
export const SubjectTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Topic Schema
export const TopicSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// PaperComponent Schema
export const PaperComponentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  maxMarks: z.number(),
  passingMarks: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Paper Schema
export const PaperSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  subjectId: z.string(),
  components: z.array(PaperComponentSchema),
  topics: z.array(TopicSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ExamComponent Schema
export const ExamComponentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  maxMarks: z.number(),
  passingMarks: z.number(),
  weight: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Specialization Schema
export const SpecializationSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  courseId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Subject Schema
export const SubjectSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  code: z.string(),
  description: z.string(),
  credits: z.number(),
  subjectTypeId: z.string(),
  specializationId: z.string().optional(),
  papers: z.array(PaperSchema).optional(),
  examComponents: z.array(ExamComponentSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Course Schema
export const CourseSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  code: z.string(),
  description: z.string(),
  duration: z.number(),
  totalCredits: z.number(),
  specializations: z.array(SpecializationSchema).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Export types
export type SubjectType = z.infer<typeof SubjectTypeSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type PaperComponent = z.infer<typeof PaperComponentSchema>;
export type Paper = z.infer<typeof PaperSchema>;
export type ExamComponent = z.infer<typeof ExamComponentSchema>;
export type Specialization = z.infer<typeof SpecializationSchema>;
export type Subject = z.infer<typeof SubjectSchema>;
export type Course = z.infer<typeof CourseSchema>;
