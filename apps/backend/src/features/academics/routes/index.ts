import documentRouter from "@/features/academics/routes/document.route.js";
import marksheetRouter from "@/features/academics/routes/marksheet.route.js";
import batchRouter from "@/features/academics/routes/batch.route.js";
import batchStudentMappingRouter from "@/features/academics/routes/batch-student-mapping.route.js";
import marksheetPaperMappingRouter from "@/features/academics/routes/marksheet-paper-mapping.route.js";
import marksheetPaperComponentMappingRouter from "@/features/academics/routes/marksheet-paper-component-mapping.route.js";

import academicYearRouter from "@/features/academics/routes/academic-year.route.js";
import shiftRouter from "@/features/academics/routes/shift.route.js";
import classRouter from "@/features/academics/routes/class.route.js";
import sectionRoutes from "@/features/academics/routes/section.route.js";
import sessionRouter from "@/features/academics/routes/session.route.js";

export {
  classRouter,
  documentRouter,
  sessionRouter,
  marksheetRouter,
  academicYearRouter,
  batchRouter,
  batchStudentMappingRouter,
  marksheetPaperMappingRouter,
  marksheetPaperComponentMappingRouter,
  shiftRouter,
  sectionRoutes,
};
