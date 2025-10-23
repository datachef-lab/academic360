import { calculateBestOfFour, calculateBestOfFourWithFullMarks } from "../bestOfFourUtils";
import { StudentAcademicSubjectsDto } from "@repo/db/dtos/admissions";

describe("Best of Four Utils", () => {
  describe("calculateBestOfFour", () => {
    it("should return null for empty subjects", () => {
      const result = calculateBestOfFour([]);
      expect(result).toBeNull();
    });

    it("should return null for subjects with no valid marks", () => {
      const subjects = [
        { totalMarks: 0, resultStatus: "FAIL" },
        { totalMarks: 0, resultStatus: "FAIL" },
      ] as StudentAcademicSubjectsDto[];

      const result = calculateBestOfFour(subjects);
      expect(result).toBeNull();
    });

    it("should calculate Best of Four for valid subjects", () => {
      const subjects = [
        { totalMarks: 80, resultStatus: "PASS" },
        { totalMarks: 75, resultStatus: "PASS" },
        { totalMarks: 90, resultStatus: "PASS" },
        { totalMarks: 85, resultStatus: "PASS" },
        { totalMarks: 70, resultStatus: "PASS" },
      ] as StudentAcademicSubjectsDto[];

      const result = calculateBestOfFour(subjects);
      // Best 4: 90, 85, 80, 75 = 330/400 = 82.5%
      expect(result).toBe(82.5);
    });

    it("should handle subjects with FAIL status", () => {
      const subjects = [
        { totalMarks: 80, resultStatus: "PASS" },
        { totalMarks: 75, resultStatus: "FAIL" },
        { totalMarks: 90, resultStatus: "PASS" },
        { totalMarks: 85, resultStatus: "PASS" },
      ] as StudentAcademicSubjectsDto[];

      const result = calculateBestOfFour(subjects);
      // Best 3: 90, 85, 80 = 255/300 = 85%
      expect(result).toBe(85);
    });
  });

  describe("calculateBestOfFourWithFullMarks", () => {
    const boardSubjects = [
      {
        id: 1,
        name: "Math",
        fullMarksTheory: 80,
        fullMarksPractical: 20,
        passingMarksTheory: 24,
        passingMarksPractical: 6,
      },
      {
        id: 2,
        name: "Physics",
        fullMarksTheory: 70,
        fullMarksPractical: 30,
        passingMarksTheory: 21,
        passingMarksPractical: 9,
      },
      {
        id: 3,
        name: "Chemistry",
        fullMarksTheory: 70,
        fullMarksPractical: 30,
        passingMarksTheory: 21,
        passingMarksPractical: 9,
      },
      {
        id: 4,
        name: "English",
        fullMarksTheory: 100,
        fullMarksPractical: 0,
        passingMarksTheory: 30,
        passingMarksPractical: 0,
      },
    ];

    it("should return null for empty subjects", () => {
      const result = calculateBestOfFourWithFullMarks([], boardSubjects);
      expect(result).toBeNull();
    });

    it("should calculate Best of Four with custom full marks", () => {
      const subjects = [
        {
          totalMarks: 85,
          resultStatus: "PASS",
          boardSubjectId: 1, // Math: 85/100 = 85%
        },
        {
          totalMarks: 80,
          resultStatus: "PASS",
          boardSubjectId: 2, // Physics: 80/100 = 80%
        },
        {
          totalMarks: 90,
          resultStatus: "PASS",
          boardSubjectId: 3, // Chemistry: 90/100 = 90%
        },
        {
          totalMarks: 75,
          resultStatus: "PASS",
          boardSubjectId: 4, // English: 75/100 = 75%
        },
      ] as StudentAcademicSubjectsDto[];

      const result = calculateBestOfFourWithFullMarks(subjects, boardSubjects);
      // All 4 subjects: (85+80+90+75)/400 = 330/400 = 82.5%
      expect(result).toBe(82.5);
    });

    it("should select best 4 subjects by percentage", () => {
      const subjects = [
        {
          totalMarks: 60,
          resultStatus: "PASS",
          boardSubjectId: 1, // Math: 60/100 = 60%
        },
        {
          totalMarks: 80,
          resultStatus: "PASS",
          boardSubjectId: 2, // Physics: 80/100 = 80%
        },
        {
          totalMarks: 90,
          resultStatus: "PASS",
          boardSubjectId: 3, // Chemistry: 90/100 = 90%
        },
        {
          totalMarks: 75,
          resultStatus: "PASS",
          boardSubjectId: 4, // English: 75/100 = 75%
        },
        {
          totalMarks: 95,
          resultStatus: "PASS",
          boardSubjectId: 1, // Another Math: 95/100 = 95%
        },
      ] as StudentAcademicSubjectsDto[];

      const result = calculateBestOfFourWithFullMarks(subjects, boardSubjects);
      // Best 4: 95%, 90%, 80%, 75% = (95+90+80+75)/400 = 85%
      expect(result).toBe(85);
    });
  });
});
