import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createPaper,
  getPaperById,
  getAllPapers,
  updatePaper,
  deletePaperSafe,
  updatePaperWithComponents,
  createPapers,
  getPapersFilteredPaginated,
  //   bulkUploadPapers,
} from "@/features/course-design/services/paper.service.js";
import { PaperDto } from "@/types/course-design/index.type.js";
import { socketService } from "@/services/socketService";
import { bulkUploadCourses } from "../services/course.service";
import XLSX from "xlsx";

export const createPaperHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body.arr);
    const created = await createPapers(req.body.arr as PaperDto[]);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Paper created successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPaperByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.query.id || req.params.id);
    const paper = await getPaperById(id);
    if (!paper) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Paper with ID ${id} not found`,
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", paper, "Paper fetched successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllPapersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page =
      Number((req.query.page as string) || 0) ||
      Number((req.query.pageNumber as string) || 0);
    const pageSize = Number(
      (req.query.pageSize as string) || (req.query.limit as string) || 0,
    );

    if (page > 0 && pageSize > 0) {
      const { getPapersPaginated, getPapersFilteredPaginated } =
        await import("@/features/course-design/services/paper.service.js");

      const filters = {
        subjectId: req.query.subjectId
          ? Number(req.query.subjectId)
          : undefined,
        affiliationId: req.query.affiliationId
          ? Number(req.query.affiliationId)
          : undefined,
        regulationTypeId: req.query.regulationTypeId
          ? Number(req.query.regulationTypeId)
          : undefined,
        academicYearId: req.query.academicYearId
          ? Number(req.query.academicYearId)
          : undefined,
        subjectTypeId: req.query.subjectTypeId
          ? Number(req.query.subjectTypeId)
          : undefined,
        programCourseId: req.query.programCourseId
          ? Number(req.query.programCourseId)
          : undefined,
        classId: req.query.classId ? Number(req.query.classId) : undefined,
        isOptional:
          req.query.isOptional !== undefined
            ? req.query.isOptional === "true"
            : undefined,
        searchText: req.query.searchText as string | undefined,
      };

      const hasFilters = Object.values(filters).some(Boolean);
      const payload = hasFilters
        ? await getPapersFilteredPaginated(filters, page, pageSize)
        : await getPapersPaginated(page, pageSize);

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            payload,
            "Papers fetched (paginated)",
          ),
        );
      return;
    }

    const papers = await getAllPapers();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", papers, "All papers fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePaperHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.query.id || req.params.id);
    const updated = await updatePaper(id, req.body);
    if (!updated) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Paper not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "UPDATED", updated, "Paper updated successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePaperHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.query.id || req.params.id);
    const result = await deletePaperSafe(id);
    if (!result) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Paper not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          result as any,
          (result as any).message ?? "",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePaperWithComponentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id);
    const result = await updatePaperWithComponents(id, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, "Paper updated successfully", result));
    return;
  } catch (error) {
    handleError(error, res, next);
    return;
  }
};

export const downloadPapersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("Download request received with query:", req.query);

    const filters = {
      subjectId: req.query.subjectId ? Number(req.query.subjectId) : undefined,
      affiliationId: req.query.affiliationId
        ? Number(req.query.affiliationId)
        : undefined,
      regulationTypeId: req.query.regulationTypeId
        ? Number(req.query.regulationTypeId)
        : undefined,
      academicYearId: req.query.academicYearId
        ? Number(req.query.academicYearId)
        : undefined,
      subjectTypeId: req.query.subjectTypeId
        ? Number(req.query.subjectTypeId)
        : undefined,
      programCourseId: req.query.programCourseId
        ? Number(req.query.programCourseId)
        : undefined,
      classId: req.query.classId ? Number(req.query.classId) : undefined,
      isOptional:
        req.query.isOptional !== undefined
          ? req.query.isOptional === "true"
          : undefined,
      searchText: req.query.searchText as string | undefined,
    };

    console.log("Filters applied:", filters);

    // Get all data that matches the filters (no pagination for download)
    let { content: papers } = await getPapersFilteredPaginated(
      filters,
      1,
      10000,
    );

    console.log("Papers fetched:", papers.length);

    // Fallback: if no papers found, try to get some basic data
    if (!papers || papers.length === 0) {
      console.log("No papers found with filters, trying to get all papers...");
      const { getAllPapers } =
        await import("@/features/course-design/services/paper.service.js");
      const allPapers = await getAllPapers();
      console.log("All papers fetched:", allPapers.length);
      papers = allPapers.slice(0, 100); // Limit to 100 for download
    }

    // Import required services to get related data
    const { getAllSubjects } =
      await import("@/features/course-design/services/subject.service.js");
    const { getAllAffiliations } =
      await import("@/features/course-design/services/affiliation.service.js");
    const { getAllRegulationTypes } =
      await import("@/features/course-design/services/regulation-type.service.js");
    const { findAllAcademicYears } =
      await import("@/features/academics/services/academic-year.service.js");
    const { getAllSubjectTypes } =
      await import("@/features/course-design/services/subject-type.service.js");
    const { getAllProgramCourses } =
      await import("@/features/course-design/services/program-course.service.js");
    const { getAllClasses } =
      await import("@/features/academics/services/class.service.js");

    const [
      subjects,
      affiliations,
      regulationTypes,
      academicYears,
      subjectTypes,
      programCourses,
      classes,
    ] = await Promise.all([
      getAllSubjects(),
      getAllAffiliations(),
      getAllRegulationTypes(),
      findAllAcademicYears(),
      getAllSubjectTypes(),
      getAllProgramCourses(),
      getAllClasses(),
    ]);

    // Prepare data for Excel
    console.log("Preparing Excel data...");
    const excelData = papers.map((paper, index) => {
      const subject = subjects.find((s) => s.id === paper.subjectId);
      const affiliation = affiliations.find(
        (a) => a.id === paper.affiliationId,
      );
      const regulationType = regulationTypes.find(
        (rt) => rt.id === paper.regulationTypeId,
      );
      const academicYear = academicYears.find(
        (ay) => ay.id === paper.academicYearId,
      );
      const subjectType = subjectTypes.find(
        (st) => st.id === paper.subjectTypeId,
      );
      const programCourse = programCourses.find(
        (pc) => pc.id === paper.programCourseId,
      );
      const classInfo = classes.find((c) => c.id === paper.classId);

      return {
        "Sr. No.": index + 1,
        "Program Course": programCourse?.name || "-",
        "Subject & Paper": paper.name || "-",
        "Subject Name": subject?.name || "-",
        "Paper Code": paper.code || "-",
        "Subject Category": subjectType?.code || "-",
        "Subject Category Name": subjectType?.name || "-",
        Semester: classInfo?.name?.split(" ")[1] || "-",
        "Is Optional": paper.isOptional ? "No" : "Yes",
        Affiliation: affiliation?.name || "-",
        "Regulation Type": regulationType?.name || "-",
        "Academic Year": academicYear?.year || "-",
        "Exam Components":
          paper.components
            ?.map((comp) => comp.examComponent?.name)
            .join(", ") || "No components",
      };
    });

    console.log("Excel data prepared:", excelData.length, "rows");

    // Create workbook
    console.log("Creating Excel workbook...");
    const wb = XLSX.utils.book_new();

    // Set column widths
    const colWidths = [
      { wch: 8 }, // Sr. No.
      { wch: 30 }, // Program Course
      { wch: 25 }, // Subject & Paper
      { wch: 25 }, // Subject Name
      { wch: 15 }, // Paper Code
      { wch: 15 }, // Subject Category
      { wch: 20 }, // Subject Category Name
      { wch: 10 }, // Semester
      { wch: 12 }, // Is Optional
      { wch: 20 }, // Affiliation
      { wch: 15 }, // Regulation Type
      { wch: 15 }, // Academic Year
      { wch: 30 }, // Exam Components
    ];

    // Check if excelData is valid and create worksheet
    if (!excelData || excelData.length === 0) {
      console.log("No data to export, creating empty sheet");
      const emptyData = [
        {
          "Sr. No.": 1,
          "Program Course": "No data available",
          "Subject & Paper": "-",
          "Subject Name": "-",
          "Paper Code": "-",
          "Subject Category": "-",
          "Subject Category Name": "-",
          Semester: "-",
          "Is Optional": "-",
          Affiliation: "-",
          "Regulation Type": "-",
          "Academic Year": "-",
          "Exam Components": "-",
        },
      ];
      const ws = XLSX.utils.json_to_sheet(emptyData);
      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, "Subject Paper Mapping");
    } else {
      const ws = XLSX.utils.json_to_sheet(excelData);
      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, "Subject Paper Mapping");
    }

    // Generate buffer
    console.log("Generating Excel buffer...");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    console.log("Buffer generated, size:", buffer.length);

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=subject-paper-mapping.xlsx",
    );
    res.setHeader("Content-Length", buffer.length);

    console.log("Sending response...");
    res.send(buffer);
  } catch (error) {
    console.error("Download error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    handleError(error, res, next);
  }
};

// export const bulkUploadPapersHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     if (!req.file) {
//       res
//         .status(400)
//         .json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
//       return;
//     }

//     const uploadSessionId =
//       req.body.uploadSessionId || req.query.uploadSessionId;
//     const io = socketService.getIO();

//     // const result = await bulkUploadPapers(req.file.path, io, uploadSessionId);

//     const response = {
//       success: result.success,
//       errors: result.errors,
//       summary: {
//         total: result.summary.total,
//         successful: result.summary.successful,
//         failed: result.summary.failed,
//       },
//     };

//     res
//       .status(200)
//       .json(new ApiResponse(200, "SUCCESS", response, "Bulk upload completed"));
//   } catch (error) {
//     handleError(error, res, next);
//   }
// };
