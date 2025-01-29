import { documentRouter, marksheetRouter, streamRouter, subjectMetadataRouter, subjectRouter } from "./academics/routes/index.ts";
import authRouter from "@/features/auth/routes/auth.route.ts";
import { bloodGroupRouter, boardUniversityRouter, categoryRouter, cityRouter, countryRouter, degreeRouter, institutionRouter, languageMediumRouter, nationalityRouter, occupationRouter, pickupPointRouter, qualificationRouter, religionRouter, stateRouter, transportRouter } from "./resources/routes/index.ts";
import { academicHistoryRouter, academicIdentifierRouter, accommodationRouter, addressRouter, admissionRouter, emergencyContactRouter, guardianRouter, healthRouter, parentRouter, personalDetailsRouter, personRouter, studentRouter, transportDetailsRouter, userRouter } from "./user/routes/index.ts";

export {
    documentRouter,
    marksheetRouter,
    streamRouter,
    subjectRouter,
    subjectMetadataRouter,
    authRouter,
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
    guardianRouter,
    healthRouter,
    parentRouter,
    personRouter,
    personalDetailsRouter,
    transportDetailsRouter,
    studentRouter,
    userRouter,

}