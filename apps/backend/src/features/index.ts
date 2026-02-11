import {
  batchRouter,
  documentRouter,
  marksheetRouter,
} from "./academics/routes/index.js";
import authRouter from "@/features/auth/routes/auth.route.js";
import {
  bloodGroupRouter,
  boardUniversityRouter,
  categoryRouter,
  cityRouter,
  countryRouter,
  degreeRouter,
  institutionRouter,
  languageMediumRouter,
  nationalityRouter,
  occupationRouter,
  pickupPointRouter,
  qualificationRouter,
  religionRouter,
  stateRouter,
  transportRouter,
} from "./resources/routes/index.js";
import {
  reportRouter,
  accommodationRouter,
  addressRouter,
  admissionRouter,
  emergencyContactRouter,
  specializationRouter,
  healthRouter,
  familyRouter,
  personalDetailsRouter,
  personRouter,
  studentRouter,
  studentApaarUpdateRouter,
  transportDetailsRouter,
  userStatusMasterRouter,
  userStatusMasterLevelRouter,
  userRouter,
} from "./user/routes/index.js";
// import feesComponentRouter from "./fees/routes/feesComponent.route.js";
import addonRouter from "./fees/routes/addon.route.js";
import feeSlabRouter from "./fees/routes/fee-slab.route.js";
import feeHeadRouter from "./fees/routes/fee-head.route.js";
import feeStructureComponentRouter from "./fees/routes/fee-structure-component.routes.js";
import feeCategoryRouter from "./fees/routes/fee-category.route.js";
import feeGroupPromotionMappingRouter from "./fees/routes/fee-group-promotion-mapping.route.js";
// import feesReceiptTypeRouter from "./fees/routes/fees-receipt-type.route.js";
// import feesSlabRouter from "./fees/routes/fees-slab.route.js";
// import feesStructureRouter from "./fees/routes/fees-structure.route.js";
// import studentFeesMappingRouter from "./fees/routes/student-fees-mapping.route.js";
// import feesSlabYearMappingRouter from "./fees/routes/fees-slab-mapping.route.js";
import {
  courseRouter,
  paperRouter,
  subjectRouter,
  topicRouter,
  cascadingDropdownsRouter,
} from "./course-design/routes/index.js";
import {
  relatedSubjectMainRoutes,
  relatedSubjectSubRoutes,
  restrictedGroupingMainRoutes,
  restrictedGroupingClassRoutes,
  restrictedGroupingSubjectRoutes,
  restrictedGroupingProgramCourseRoutes,
  subjectSpecificPassingRoutes,
} from "./subject-selection/routes/index.js";
import {
  boardRouter,
  boardSubjectNameRouter,
  boardSubjectRouter,
  cuRegistrationCorrectionRequestRouter,
  cuRegistrationDocumentUploadRouter,
} from "./admissions/index.js";
import {
  floorRouter,
  roomRouter,
  examTypeRouter,
  examScheduleRouter,
} from "./exams/routes/index.js";
import {
  departmentRouter,
  designationRouter,
  subDepartmentRouter,
} from "./administration/routes/index.js";

export {
  documentRouter,
  marksheetRouter,
  authRouter,
  reportRouter,
  specializationRouter,
  bloodGroupRouter,
  boardUniversityRouter,
  categoryRouter,
  cityRouter,
  countryRouter,
  degreeRouter,
  institutionRouter,
  languageMediumRouter,
  nationalityRouter,
  occupationRouter,
  pickupPointRouter,
  qualificationRouter,
  religionRouter,
  stateRouter,
  transportRouter,
  accommodationRouter,
  addressRouter,
  admissionRouter,
  emergencyContactRouter,
  healthRouter,
  familyRouter,
  personRouter,
  personalDetailsRouter,
  transportDetailsRouter,
  userStatusMasterRouter,
  userStatusMasterLevelRouter,
  studentRouter,
  studentApaarUpdateRouter,
  userRouter,
  batchRouter,
  //   feesComponentRouter,
  addonRouter,
  feeSlabRouter,
  feeHeadRouter,
  feeStructureComponentRouter,
  feeCategoryRouter,
  feeGroupPromotionMappingRouter,
  //   feesReceiptTypeRouter,
  //   feesSlabRouter,
  //   feesStructureRouter,
  //   studentFeesMappingRouter,
  //   feesSlabYearMappingRouter,
  courseRouter,
  paperRouter,
  subjectRouter,
  topicRouter,
  cascadingDropdownsRouter,
  relatedSubjectMainRoutes,
  relatedSubjectSubRoutes,
  restrictedGroupingMainRoutes,
  restrictedGroupingClassRoutes,
  restrictedGroupingSubjectRoutes,
  restrictedGroupingProgramCourseRoutes,
  subjectSpecificPassingRoutes,
  boardRouter,
  boardSubjectNameRouter,
  boardSubjectRouter,
  cuRegistrationCorrectionRequestRouter,
  cuRegistrationDocumentUploadRouter,
  floorRouter,
  roomRouter,
  examTypeRouter,
  examScheduleRouter,
  departmentRouter,
  designationRouter,
  subDepartmentRouter,
};
