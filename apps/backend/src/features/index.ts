import { batchPaperRouter, batchRouter, documentRouter, marksheetRouter,  studentPaperRouter, subjectMetadataRouter, subjectRouter } from "./academics/routes/index.js";
import authRouter from "@/features/auth/routes/auth.route.js";
import { bloodGroupRouter, boardUniversityRouter, categoryRouter, cityRouter, countryRouter, degreeRouter, institutionRouter, languageMediumRouter, nationalityRouter, occupationRouter, pickupPointRouter, qualificationRouter, religionRouter, stateRouter, transportRouter } from "./resources/routes/index.js";
import { academicHistoryRouter, academicIdentifierRouter,reportRouter, accommodationRouter, addressRouter, admissionRouter, emergencyContactRouter,specializationRouter, healthRouter, familyRouter, personalDetailsRouter, personRouter, studentRouter, transportDetailsRouter, userRouter } from "./user/routes/index.js";
import feesComponentRouter from "./fees/routes/feesComponent.route.js";
import addonRouter from "./fees/routes/addon.route.js";
import feesHeadRouter from "./fees/routes/fees-head.route.js";
import feesReceiptTypeRouter from "./fees/routes/fees-receipt-type.route.js";
import feesSlabRouter from "./fees/routes/fees-slab.route.js";
import feesStructureRouter from "./fees/routes/fees-structure.route.js";
import studentFeesMappingRouter from "./fees/routes/student-fees-mapping.route.js";
import feesSlabYearMappingRouter from "./fees/routes/fees-slab-mapping.route.js";
import courseRouter from "./course-design/routes/course.routes.js";
import examComponentRouter from "./course-design/routes/exam-component.routes.js";
import paperComponentRouter from "./course-design/routes/paper-component.routes.js";
import paperRouter from "./course-design/routes/paper.routes.js";
import specializationCourseRouter from "./course-design/routes/specialization.routes.js";
import subjectTypeRouter from "./course-design/routes/subject-type.routes.js";
import subjectCourseRouter from "./course-design/routes/subject.routes.js";
import topicRouter from "./course-design/routes/topic.routes.js";

export {
    documentRouter,
    marksheetRouter,
    subjectRouter,
    subjectMetadataRouter,
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
    academicHistoryRouter,
    academicIdentifierRouter,
    accommodationRouter,
    addressRouter,
    admissionRouter,
    emergencyContactRouter,
    healthRouter,
    familyRouter,
    personRouter,
    personalDetailsRouter,
    transportDetailsRouter,
    studentRouter,
    userRouter,
    batchRouter,
    batchPaperRouter,
    studentPaperRouter,
    feesComponentRouter,
    addonRouter,
    feesHeadRouter,
    feesReceiptTypeRouter,
    feesSlabRouter,
    feesStructureRouter,
    studentFeesMappingRouter,
    feesSlabYearMappingRouter,
    courseRouter,
    examComponentRouter,
    paperComponentRouter,
    paperRouter,
    specializationCourseRouter,
    subjectTypeRouter,
    subjectCourseRouter,
    topicRouter,
}