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
import promotionRouter from "@/features/academics/routes/promotion.route";
import careerProgressionFormFieldRouter from "@/features/academics/routes/career-progression-form-field.route.js";
import careerProgressionFormRouter from "@/features/academics/routes/career-progression-form.route.js";
import certificateFieldMasterRouter from "@/features/academics/routes/certificate-field-master.route.js";
import certificateFieldOptionMasterRouter from "@/features/academics/routes/certificate-field-option-master.route.js";
import certificateMasterRouter from "@/features/academics/routes/certificate-master.route.js";
import academicActivityRouter from "@/features/academics/routes/academic-activity.route.js";
import academicActivityMasterRouter from "@/features/academics/routes/academic-activity-master.route.js";

export {
  careerProgressionFormFieldRouter,
  careerProgressionFormRouter,
  certificateFieldMasterRouter,
  certificateFieldOptionMasterRouter,
  certificateMasterRouter,
  academicActivityRouter,
  academicActivityMasterRouter,
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
  promotionRouter,
};
