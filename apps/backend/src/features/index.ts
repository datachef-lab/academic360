import { batchPaperRouter, batchRouter, documentRouter, marksheetRouter, streamRouter, studentPaperRouter, subjectMetadataRouter, subjectRouter } from "./academics/routes/index.js";
import authRouter from "@/features/auth/routes/auth.route.js";
import { bloodGroupRouter, boardUniversityRouter, categoryRouter, cityRouter, countryRouter, degreeRouter, institutionRouter, languageMediumRouter, nationalityRouter, occupationRouter, pickupPointRouter, qualificationRouter, religionRouter, stateRouter, transportRouter } from "./resources/routes/index.js";
import { academicHistoryRouter, academicIdentifierRouter,reportRouter, accommodationRouter, addressRouter, admissionRouter, emergencyContactRouter,specializationRouter, healthRouter, familyRouter, personalDetailsRouter, personRouter, studentRouter, transportDetailsRouter, userRouter } from "./user/routes/index.js";


export {
    documentRouter,
    marksheetRouter,
    streamRouter,
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
}