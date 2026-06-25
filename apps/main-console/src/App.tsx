import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import HomeLayout from "@/features/dashboard/layouts/home-layout";

// import StudentViewPage from "./pages/StudentViewPage";
import { AuthProvider } from "./features/auth/providers/auth-provider";
import { NotificationProvider } from "./providers/NotificationProvider";
// import StudentPage from "./pages/students/StudentPage";
// import LibFineManagement from "./components/LibManagement/LibFines";
// import LibReport from "./components/LibManagement/LibReport";

import ManageMarksheetPage from "./pages/students/ManageMarksheetPage";
// import StudentMarksheetsPage from "./pages/students/StudentMarksheetsPage";
import FrameworkActivitiesTab from "./components/manage-marksheet/FrameworkActivitiesTab";
// import MarksheetPage from "./pages/students/MarksheetPage";
// import Downloads from "./pages/Downloads";
import Event from "./pages/events/EventPage";

import Downloads from "./pages/Downloads";

import GradeCard from "./components/GradeMarks/GradeCard";

// import FeesStructure from "./pages/fees-module/FeesStructure";
// import AcademicYear from "./pages/fees-module/AcademicYear";
// import FeesSlab from "./pages/fees-module/FeesSlab";
// import FeesReceiptType from "./pages/fees-module/FeesReceiptType";
// import Addon from "./pages/fees-module/Addon";
// import StudentFees from "./pages/fees-module/StudentFees";
// import CoursesSubjectsMaster from "@/pages/courses-subjects-master/CoursesSubjectsMaster";
// import CourseSubjectMasterHomePage from "@/pages/courses-subjects-master/HomePage";

import * as courseSubjectModule from "@/pages/courses-subjects-design";
import * as admissionFeesModule from "@/pages/admissions-fees";
import * as documentIssuanceModule from "@/features/document-issuance";
import * as careerProgressionModule from "@/features/career-progression";
import * as batchModule from "@/pages/batches";
import * as studentModule from "@/pages/students";
import * as attendanceModule from "@/pages/attendance-timetable";
import * as libraryModule from "@/pages/library";
import * as appModule from "./pages/apps";
// import * as facultiesStaffsModule from "./pages/faculties-staffs";
import * as marksheetModule from "@/pages/marksheets";
import * as settingsModule from "./features/settings";
import { NoticeMaster } from "./pages/notices";
import { AcademicYearPage } from "./pages/admissions-fees/fees";
// import Dashboard from "./features/dashboard/pages/dashboard";
import PreAdmissionQueriesPage from "./pages/admissions-fees/admissions/[year]/workflows/PreAdmissionQueriesPage";
import ApplicationsPage from "./pages/admissions-fees/admissions/[year]/workflows/ApplicationsPage";
// import GenerateMeritPage from "./pages/admissions-fees/admissions/[year]/workflows/GenerateMeritPage";
import FeePaymentReviewPage from "./pages/admissions-fees/admissions/[year]/workflows/FeePaymentReviewPage";
import DocumentVerificationPage from "./pages/admissions-fees/admissions/[year]/workflows/DocumentVerificationPage";
import IdCardGeneratorPage from "./pages/admissions-fees/admissions/[year]/workflows/IdCardGeneratorPage";
import FinalAdmissionPushPage from "./pages/admissions-fees/admissions/[year]/workflows/FinalAdmissionPushPage";
import GenerateMeritListPage from "./pages/admissions-fees/admissions/[year]/workflows/GenerateMeritListPage";
import StaffAssignmentPage from "./pages/admissions-fees/admissions/[year]/workflows/StaffAssignmentPage";
import EligibilityPage from "./pages/admissions-fees/admissions/[year]/workflows/EligibilityPage";
import MeritCriteriaPage from "./pages/admissions-fees/admissions/[year]/workflows/MeritCriteriaPage";
import FeesSlabMappingPage from "./pages/admissions-fees/admissions/[year]/workflows/FeesSlabMappingPage";
import { BulkDataUploadPage } from "@/features/bulk-upload";
import Dashboard from "./features/dashboard/pages/dashboard";
import LoginPage from "./features/auth/pages/login-page";
import ResetPasswordPage from "./features/auth/pages/reset-password-page";
import { NotFoundPage, SettingsPage, UserProfilePage } from "./pages";
import AdmitCardDistributions from "./pages/AdmitCardDistributions";

// import NewAcademicSetupPage from "./features/academic-year-setup/pages/NewAcademicSetupPage";
import AcademicYearSetupPage from "./features/academic-year-setup/pages/academic-year-setup-page";
import AdmissionsPage from "./features/academic-year-setup/pages/admissions-page";
import AdmissionProgramCoursePage from "./features/academic-year-setup/pages/admission-program-course-page";
import AdmissionsYearRedirect from "./features/academic-year-setup/pages/admissions-year-redirect";
import ShiftSectionConfigPage from "./features/academic-year-setup/pages/shift-section-config-page";
import AdmissionMasterHomePage from "./features/academic-year-setup/pages/admission-master-home-page";
import GeneralMaster from "./features/academic-year-setup/layouts/general-master";
import ResourceMasterPage from "./features/academic-year-setup/general/ResourceMasterPage";
import { RESOURCE_CONFIGS } from "./features/academic-year-setup/general/resource-configs";
import { ADMISSION_MASTER_CONFIGS } from "./features/academic-year-setup/general/admission-master-configs";
import ToolsPage from "./features/tools/pages/tools-page";
import ShiftChangePage from "./features/tools/pages/shift-change-page";
import SubjectConfigurationMaster from "./features/academic-year-setup/layouts/subject-configuration-master";
// import MandatorySubjectsPage from "./features/academic-year-setup/pages/mandatory-subjects-page";

import WhitelistedCategoriesPage from "./features/academic-year-setup/pages/whitelisted-categories-page";
import AlternativeSubjectsPage from "./features/academic-year-setup/pages/related-subjects-page";
// import RestrictedGroupingsPage from "./features/academic-year-setup/pages/restricted-grouping-page";
import SubjectSelectionMetaPage from "./features/academic-year-setup/pages/subject-selection-meta-page";
import RestrictedGroupingPage from "./features/academic-year-setup/pages/restricted-grouping-page";
import UnderConstructionPage from "./pages/under-construction-page";
import AdmissionBoardMaster from "./features/academic-year-setup/layouts/admission-board-master";
import BoardPage from "./features/academic-year-setup/pages/board-page";
import BoardSubjectNamePage from "./features/academic-year-setup/pages/board-subject-name-page";
import BoardSubjectPage from "./features/academic-year-setup/pages/board-subject-page";
import ProtectedRouteWrapper from "./components/globals/ProtectedRouteWrapper";
import CuRegStudentPage from "./features/cu-registration/pages/CuRegStudentPage";
import BoardSubjectUnivSubjectMappingPaper from "./features/academic-year-setup/pages/board-subject-univ-subject-mapping-paper";
import StudentPromotionLogicMaster from "./features/academic-year-setup/layouts/student-promotion-logic-master";
import PromotionBuilderPage from "./features/academic-year-setup/pages/promotion-builder-page";
import PromotionClausesPage from "./features/academic-year-setup/pages/promotion-clauses-page";
import AppearTypePage from "./features/academic-year-setup/pages/appear-type-page";
import * as examManagementModule from "@/features/exam-management";
import RealTimeTrackerPage from "./features/realtime-tracker/pages";
import ReportsPage from "./features/reports/page";
import PromoteStudentsPage from "./pages/PromoteStudentsPage";
import AcademicActivityPage from "./features/administration/pages/academic-activity.page";
import PhysicalCURegMarkingPage from "./features/cu-registration/pages/PhysicalCURegMarkingPage";
import * as administrationModule from "./features/administration";
import * as idCardModule from "@/features/idcard";
// import * as resourceModule from "@/pages/resources";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      ),
    },
    {
      path: "/reset-password",
      element: <ResetPasswordPage />,
    },
    {
      path: "/dashboard",
      element: (
        <AuthProvider>
          <NotificationProvider>
            <HomeLayout />
          </NotificationProvider>
        </AuthProvider>
      ),
      children: [
        { path: "", element: <Dashboard /> },
        { path: "promote-students", element: <PromoteStudentsPage /> },
        { path: "academic-activity", element: <AcademicActivityPage /> },
        {
          path: "academic-setup",
          element: <Outlet />,
          children: [
            { path: "", element: <AcademicYearSetupPage /> },
            {
              path: "admissions",
              element: <Outlet />,
              children: [
                { path: "", element: <AdmissionsYearRedirect /> },
                {
                  path: ":year",
                  element: <Outlet />,
                  children: [
                    { path: "", element: <AdmissionsPage /> },
                    {
                      path: "master",
                      element: <AdmissionBoardMaster />,
                      children: [
                        { path: "", element: <AdmissionMasterHomePage /> },
                        { path: "program-courses", element: <AdmissionProgramCoursePage /> },
                        {
                          path: "quota-type",
                          element: (
                            <ResourceMasterPage
                              config={ADMISSION_MASTER_CONFIGS["admission-quota-types"]!}
                            />
                          ),
                        },
                        { path: "shift-section-config", element: <ShiftSectionConfigPage /> },
                        {
                          path: "cancel-sources",
                          element: (
                            <ResourceMasterPage
                              config={ADMISSION_MASTER_CONFIGS["cancel-sources"]!}
                            />
                          ),
                        },
                        {
                          path: "grades",
                          element: (
                            <ResourceMasterPage config={ADMISSION_MASTER_CONFIGS["grades"]!} />
                          ),
                        },
                        {
                          path: "sports-categories",
                          element: (
                            <ResourceMasterPage
                              config={ADMISSION_MASTER_CONFIGS["sports-categories"]!}
                            />
                          ),
                        },
                        {
                          path: "sections",
                          element: (
                            <ResourceMasterPage config={ADMISSION_MASTER_CONFIGS["sections"]!} />
                          ),
                        },
                        { path: "board-subject-mapping", element: <BoardSubjectPage /> },
                        { path: "boards", element: <BoardPage /> },
                        { path: "subjects", element: <BoardSubjectNamePage /> },
                        {
                          path: "mapping-subjects",
                          element: <BoardSubjectUnivSubjectMappingPaper />,
                        },
                      ],
                    },
                    { path: "home", element: <UnderConstructionPage /> },
                    { path: "start", element: <UnderConstructionPage /> },
                    { path: "counselling", element: <UnderConstructionPage /> },
                    { path: "staff-management", element: <UnderConstructionPage /> },
                    { path: "help-desk", element: <UnderConstructionPage /> },
                    { path: "application-forms", element: <UnderConstructionPage /> },
                    { path: "merit-listing", element: <UnderConstructionPage /> },
                    { path: "merit-listing-rules", element: <UnderConstructionPage /> },
                    { path: "verification", element: <UnderConstructionPage /> },
                    { path: "admit-students", element: <UnderConstructionPage /> },
                    { path: "notifications", element: <UnderConstructionPage /> },
                  ],
                },
              ],
            },
            // Back-compat: old board-subjects path now lives under the Admission master
            {
              path: "board-subjects/*",
              element: <Navigate to="/dashboard/academic-setup/admissions/master" replace />,
            },
            {
              path: "general",
              element: <GeneralMaster />,
              children: [
                { path: "", element: <ResourceMasterPage config={RESOURCE_CONFIGS[0]!} /> },
                ...RESOURCE_CONFIGS.map((c) => ({
                  path: c.key,
                  element: <ResourceMasterPage config={c} />,
                })),
              ],
            },
            {
              path: "course-design",
              element: <courseSubjectModule.CoursesSubjectsMaster />,
              children: [
                {
                  path: "subject-paper-mapping",
                  element: <courseSubjectModule.SubjectPaperMappingPage />,
                },
                { path: "", element: <courseSubjectModule.ProgramCoursesPage /> },
                { path: "streams", element: <courseSubjectModule.StreamsPage /> },
                { path: "courses", element: <courseSubjectModule.CoursesPage /> },
                { path: "course-types", element: <courseSubjectModule.CourseTypesPage /> },
                { path: "course-levels", element: <courseSubjectModule.CourseLevelsPage /> },
                { path: "affiliations", element: <courseSubjectModule.AffiliationsPage /> },
                { path: "regulation-types", element: <courseSubjectModule.RegulationTypesPage /> },
                { path: "subjects", element: <courseSubjectModule.SubjectsPage /> },
                {
                  path: "subject-categories",
                  element: <courseSubjectModule.SubjectCategoriesPage />,
                },
                {
                  path: "subject-paper-mapping",
                  element: <courseSubjectModule.SubjectPaperMappingPage />,
                },
                { path: "classes", element: <courseSubjectModule.ClassesPage /> },
                { path: "paper-components", element: <courseSubjectModule.ExamComponentesPage /> },
                { path: "academic-years", element: <AcademicYearPage /> },
                {
                  path: "subject-groupings",
                  element: <courseSubjectModule.SubjectGroupingsPage />,
                },
              ],
            },
            {
              path: "subject-configurations",
              element: (
                <ProtectedRouteWrapper>
                  <SubjectConfigurationMaster />
                </ProtectedRouteWrapper>
              ),
              children: [
                // { path: "program-course-relations", element: <RestrictedGroupingPage /> },
                { path: "", element: <AlternativeSubjectsPage /> },
                { path: "restricted-groupings", element: <RestrictedGroupingPage /> },
                { path: "whitelisted-categories", element: <WhitelistedCategoriesPage /> },
                { path: "subject-selection-meta", element: <SubjectSelectionMetaPage /> },
              ],
            },
            {
              path: "student-promotion-logic",
              element: <StudentPromotionLogicMaster />,
              children: [
                { path: "", element: <PromotionBuilderPage /> },
                { path: "classes", element: <courseSubjectModule.ClassesPage /> },
                { path: "promotion-clauses", element: <PromotionClausesPage /> },
                { path: "appear-types", element: <AppearTypePage /> },
              ],
            },
          ],
        },
        // Back-compat redirect: old "academic-year-setup" base path -> "academic-setup"
        {
          path: "academic-year-setup/*",
          element: <Navigate to="/dashboard/academic-setup" replace />,
        },
        {
          path: "tools",
          element: <Outlet />,
          children: [
            { path: "", element: <ToolsPage /> },
            {
              path: "id-cards",
              element: <idCardModule.ClassesMaster />,
              children: [
                { path: "", element: <idCardModule.IdCardIssuePage /> },
                { path: "reports", element: <idCardModule.IdCardReportsPage /> },
                { path: "templates", element: <idCardModule.IdCardTemplatesPage /> },
                {
                  path: "templates/:templateId/editor",
                  element: <idCardModule.IdCardTemplateEditorPage />,
                },
                { path: "shifts", element: <idCardModule.ShiftsMasterPage /> },
                { path: "sections", element: <idCardModule.SectionsMasterPage /> },
              ],
            },
            {
              path: "simulation",
              element: <appModule.StudentConsoleSimulation />,
            },
            {
              path: "shift-change",
              element: <ShiftChangePage />,
            },
          ],
        },
        {
          path: "exam-management",
          element: <examManagementModule.ExamManagementMasterLayout />,
          children: [
            { path: "", element: <examManagementModule.HomePage /> },
            { path: "schedule", element: <examManagementModule.ScheduleExamPage /> },
            { path: "allot", element: <examManagementModule.AllotExamPage /> },
            { path: "exams", element: <examManagementModule.ExamsPage /> },

            // { path: "components", element: <examManagementModule.ExamComponentsPage /> },
            { path: "floors", element: <examManagementModule.ExamFloorsPage /> },
            { path: "rooms", element: <examManagementModule.ExamRoomsPage /> },
            { path: "test-types", element: <examManagementModule.TestTypePage /> },
            // { path: "evaluation-types", element: <examManagementModule.EvaluationTypePage /> },
          ],
        },

        {
          path: "exam-management/exams/:examGroupId",
          element: <examManagementModule.ExamLayoutMaster />,
          children: [
            { path: "", element: <examManagementModule.ExamPage /> },
            {
              path: "floors",
              element: <Outlet />,
              children: [
                { path: "", element: <examManagementModule.FloorsPage /> },
                {
                  path: ":floorNumber",
                  element: <Outlet />,
                  children: [
                    { path: "", element: <examManagementModule.RoomsPage /> },
                    { path: ":roomNumber", element: <examManagementModule.RoomPage /> },
                  ],
                },
              ],
            },
            { path: "invigilators", element: <examManagementModule.InvigilatorsPage /> },
            { path: "support-staff", element: <examManagementModule.SupportStaffPage /> },
            { path: "examiners", element: <examManagementModule.ExaminersPage /> },

            { path: "collect", element: <examManagementModule.CollectAnswerscriptsPage /> },
          ],
        },
        {
          path: "admit-card-distributions",
          element: <AdmitCardDistributions />,
        },
        {
          path: "cu-registration",
          element: <CuRegStudentPage />,
        },
        {
          path: "cu-reg/physical-marking",
          element: <PhysicalCURegMarkingPage />,
        },
        {
          path: "reports",
          element: <ReportsPage />,
        },
        { path: "resources", element: <SettingsPage /> },
        // {
        //   path: "resources",
        //   element: <resourceModule.ResourcesMaster />,
        //   children: [
        //   //   { path: "", element: <resourceModule.BoardUniversitiesPage /> },
        //     { path: "", element: <resourceModule.InstitutionsPage /> },
        //     { path: "categories", element: <resourceModule.CategoriesPage /> },
        //     { path: "religion", element: <resourceModule.ReligionPage /> },
        //     { path: "degree", element: <resourceModule.DegreePage /> },
        //     { path: "language-medium", element: <resourceModule.LanguageMediumPage /> },
        //     { path: "documents", element: <resourceModule.DocumentPage /> },
        //     { path: "blood-group", element: <resourceModule.BloodGroupPage /> },
        //     { path: "occupations", element: <resourceModule.OccupationsPage /> },
        //     { path: "qualifications", element: <resourceModule.QualificationsPage /> },
        //     { path: "nationalities", element: <resourceModule.NationalitiesPage /> },
        //     { path: "annual-income", element: <resourceModule.AnnualIncomePage /> },
        //   ],
        // },

        // {
        //   path: "courses-subjects-design",
        //   element: <courseSubjectModule.CoursesSubjectsMaster />,
        //   children: [
        //     { path: "subject-paper-mapping", element: <courseSubjectModule.SubjectPaperMappingPage /> },
        //     { path: "", element: <courseSubjectModule.ProgramCoursesPage /> },
        //     { path: "streams", element: <courseSubjectModule.StreamsPage /> },
        //     { path: "courses", element: <courseSubjectModule.CoursesPage /> },
        //     { path: "course-types", element: <courseSubjectModule.CourseTypesPage /> },
        //     { path: "course-levels", element: <courseSubjectModule.CourseLevelsPage /> },
        //     { path: "affiliations", element: <courseSubjectModule.AffiliationsPage /> },
        //     { path: "regulation-types", element: <courseSubjectModule.RegulationTypesPage /> },
        //     { path: "subjects", element: <courseSubjectModule.SubjectsPage /> },
        //     { path: "subject-categories", element: <courseSubjectModule.SubjectCategoriesPage /> },
        //     { path: "subject-paper-mapping", element: <courseSubjectModule.SubjectPaperMappingPage /> },
        //     { path: "classes", element: <courseSubjectModule.ClassesPage /> },
        //     { path: "paper-components", element: <courseSubjectModule.ExamComponentesPage /> },
        //     { path: "academic-years", element: <AcademicYearPage /> },
        //   ],
        // },
        {
          path: "admissions-fees/admissions/:year",
          element: (
            <ProtectedRouteWrapper>
              <Outlet />
            </ProtectedRouteWrapper>
          ),
          children: [
            { path: "", element: <admissionFeesModule.AdmissionDetailsPage /> },
            { path: "pre-admission-queries", element: <PreAdmissionQueriesPage /> },
            { path: "applications", element: <ApplicationsPage /> },
            { path: "generate-merit", element: <GenerateMeritListPage /> },
            { path: "fee-payment-review", element: <FeePaymentReviewPage /> },
            { path: "document-verification", element: <DocumentVerificationPage /> },
            { path: "id-card-generator", element: <IdCardGeneratorPage /> },
            { path: "final-admission-push", element: <FinalAdmissionPushPage /> },
            { path: "staff-assignment", element: <StaffAssignmentPage /> },
            { path: "eligibility-rules", element: <EligibilityPage /> },
            { path: "merit-criteria", element: <MeritCriteriaPage /> },
            { path: "fee-slab-mapping", element: <FeesSlabMappingPage /> },
          ],
        },
        {
          path: "realtime-tracker",
          element: <RealTimeTrackerPage />,
        },
        {
          path: "fees",
          element: <admissionFeesModule.feesModule.FeesMasterLayout />,
          children: [
            { path: "", element: <admissionFeesModule.feesModule.FeesHomePage /> },
            { path: "reports", element: <admissionFeesModule.feesModule.FeesReportsPage /> },
            { path: "structure", element: <admissionFeesModule.feesModule.FeesStructurePage /> },
            { path: "student-fees", element: <admissionFeesModule.feesModule.StudentFees /> },
            { path: "marking", element: <admissionFeesModule.feesModule.FeePaymentMarkingPage /> },
            {
              path: "fee-group-promotion-mapping",
              element: <admissionFeesModule.feesModule.FeeGroupPromotionMappingPage />,
            },
            { path: "slabs", element: <admissionFeesModule.feesModule.FeesSlabPage /> },
            { path: "heads", element: <admissionFeesModule.feesModule.FeeHeadsPage /> },
            {
              path: "fee-slabs",
              element: <admissionFeesModule.feesModule.FeeConcessionSlabPage />,
            },
            { path: "fee-category", element: <admissionFeesModule.feesModule.FeeCategoryPage /> },
            { path: "fee-groups", element: <admissionFeesModule.feesModule.FeeGroupsPage /> },
            {
              path: "receipt-types",
              element: <admissionFeesModule.feesModule.FeesReceiptTypePage />,
            },
            { path: "addon", element: <admissionFeesModule.feesModule.AddonPage /> },
          ],
        },
        {
          path: "document-issuance",
          element: <documentIssuanceModule.DocumentIssuanceMasterLayout />,
          children: [
            { path: "", element: <documentIssuanceModule.DocumentIssuanceHomePage /> },
            {
              path: "student/:id",
              element: <documentIssuanceModule.DocumentIssuanceStudentPage />,
            },
            { path: "reports", element: <documentIssuanceModule.DocumentIssuanceReportsPage /> },
            { path: "types", element: <documentIssuanceModule.DocumentTypesPage /> },
            { path: "templates", element: <documentIssuanceModule.DocumentTemplatesPage /> },
            { path: "logs", element: <documentIssuanceModule.DocumentIssuanceLogsPage /> },
          ],
        },
        {
          path: "career-progression",
          element: <careerProgressionModule.CareerProgressionMasterLayout />,
          children: [
            { path: "", element: <careerProgressionModule.CareerProgressionHomePage /> },
            {
              path: "certificate-master",
              element: <careerProgressionModule.CertificateMasterPage />,
            },
            {
              path: "certificate-fields",
              element: <careerProgressionModule.CertificateFieldsPage />,
            },
          ],
        },
        {
          path: "admissions-fees",
          element: <admissionFeesModule.AdmissionsFeesMaster />,
          children: [
            { path: "", element: <admissionFeesModule.HomePage /> },
            {
              path: "admissions",
              element: <Outlet />,
              children: [{ path: "", element: <admissionFeesModule.AdmissionsPage /> }],
            },
            {
              path: "fees",
              element: <Outlet />,
              children: [
                { path: "", element: <admissionFeesModule.feesModule.FeesStructurePage /> },
                {
                  path: "academic-year",
                  element: <admissionFeesModule.feesModule.AcademicYearPage />,
                },
                { path: "slabs", element: <admissionFeesModule.feesModule.FeesSlabPage /> },
                { path: "heads", element: <admissionFeesModule.feesModule.FeeHeadsPage /> },
                {
                  path: "receipt-types",
                  element: <admissionFeesModule.feesModule.FeesReceiptTypePage />,
                },
                { path: "addons", element: <admissionFeesModule.feesModule.AddonPage /> },
                { path: "student-fees", element: <admissionFeesModule.feesModule.StudentFees /> },
              ],
            },
          ],
        },
        {
          path: "batches",
          element: <batchModule.BatchMaster />,
          children: [
            { path: "", element: <batchModule.HomePage /> },

            { path: "create", element: <batchModule.CreateBatchPage /> },
            { path: "reports", element: <batchModule.ReportsPage /> },
          ],
        },
        { path: "batches/:batchId", element: <batchModule.BatchDetailsPage /> },
        // Legacy exam-management routes removed to avoid conflict with new feature module

        {
          path: "attendance-timetable",
          element: <attendanceModule.AttendanceTimeTableMaster />,
          children: [
            { path: "", element: <div>TODO: Attendan ce & Time-Tabel Home</div> },
            { path: "timetable", element: <div>TODO: Time-table</div> },
          ],
        },

        {
          path: "students",
          element: <studentModule.StudentMaster />,
          children: [
            { path: "", element: <studentModule.DashboardStats /> },

            //   {
            //     path: "search",
            //     element: <studentModule.SearchStudent />,
            //     children: [
            //       { path: ":studentId", element: <studentModule.StudentPage /> },
            //       {
            //         path: ":studentId",
            //         element: <Outlet />,
            //         children: [{ path: ":marksheetId", element: <GradeCard /> }],
            //       },
            //     ],
            //   },
            { path: "create", element: <studentModule.AddStudentPage /> },
            { path: "downloads", element: <Downloads /> },
          ],
        },

        {
          path: "students/:studentId",
          element: <Outlet />,
          children: [
            { path: "", element: <studentModule.StudentPage /> },
            { path: ":marksheetId", element: <GradeCard /> },
          ],
        },

        //   { path: "student-View", element: <StudentViewPage /> },
        //   { path: "add-student", element: <AddStudentPage /> },
        { path: "events", element: <Event /> },

        //   { path: "academics-reports", element: <GetReportsPage /> },
        //   { path: "student-reports", element: <GetReportsPage /> },
        {
          path: "library",
          element: <libraryModule.LibraryMaster />,
          children: [
            { path: "", element: <libraryModule.LibraryHomePage /> },
            { path: "entry-exit", element: <libraryModule.EntryExitPage /> },
            { path: "book-circulation", element: <libraryModule.BookCirculationPage /> },
            {
              path: "article-entry",
              children: [
                { index: true, element: <libraryModule.ArticleEntryPage /> },
                { path: "books", element: <libraryModule.BooksPage /> },
                { path: "journal", element: <libraryModule.JournalPage /> },
              ],
            },
            { path: "series", element: <libraryModule.SeriesPage /> },
            { path: "publications", element: <libraryModule.PublicationsPage /> },
            { path: "enclosures", element: <libraryModule.EnclosuresPage /> },
            { path: "entry-modes", element: <libraryModule.EntryModesPage /> },
            { path: "journal-types", element: <libraryModule.JournalTypesPage /> },
            { path: "statuses", element: <libraryModule.StatusesPage /> },
            { path: "racks", element: <libraryModule.RacksPage /> },
            { path: "shelves", element: <libraryModule.ShelvesPage /> },
            { path: "binding-types", element: <libraryModule.BindingTypesPage /> },
            { path: "periods", element: <libraryModule.PeriodsPage /> },
            { path: "articles", element: <libraryModule.ArticlesPage /> },
            { path: "library-documents", element: <libraryModule.LibraryDocumentsPage /> },
            { path: "borrowing-types", element: <libraryModule.BorrowingTypesPage /> },
            { path: "author-types", element: <libraryModule.AuthorTypesPage /> },
            { path: "authors", element: <libraryModule.AuthorsPage /> },
            { path: "vendors", element: <libraryModule.VendorsPage /> },
            { path: "holidays", element: <libraryModule.HolidaysPage /> },
            { path: "class-holidays", element: <libraryModule.ClassHolidaysPage /> },
            { path: "branches", element: <libraryModule.BranchesPage /> },
            { path: "patron-categories", element: <libraryModule.PatronCategoriesPage /> },
            { path: "item-categories", element: <libraryModule.ItemCategoriesPage /> },
            { path: "circulation-policies", element: <libraryModule.CirculationPoliciesPage /> },
            { path: "zones", element: <libraryModule.LibraryZonesMasterPage /> },
            { path: "search", element: <libraryModule.LibrarySearchPage /> },
            { path: "reading-lists", element: <libraryModule.ReadingListsPage /> },
            { path: "academic-archives", element: <libraryModule.AcademicArchivePage /> },
            { path: "evidence-locker", element: <libraryModule.EvidenceLockerPage /> },
            { path: "journal-subscriptions", element: <libraryModule.JournalSubscriptionsPage /> },
            { path: "reports", element: <libraryModule.LibraryReportsPage /> },
            { path: "student-analytics", element: <libraryModule.StudentAnalyticsPage /> },
            { path: "cdl/:bookId", element: <libraryModule.CdlReaderPage /> },
            { path: "digital-twin", element: <libraryModule.DigitalTwinPage /> },
          ],
        },

        //   {
        //     path: "search-students",
        //     element: <Outlet />,
        //     children: [
        //       { path: ":studentId", element: <StudentPage /> },
        //       {
        //         path: ":studentId",
        //         element: <Outlet />,
        //         children: [{ path: ":marksheetId", element: <GradeCard /> }],
        //       },
        //     ],
        //   },
        {
          path: "marksheets",
          element: <marksheetModule.MarksheetMaster />,
          children: [
            { path: "", element: <marksheetModule.HomePage /> },
            { path: "reports", element: <studentModule.GetReportsPage /> },
            {
              path: "add",
              element: <Outlet />,
              children: [
                { path: "", element: <ManageMarksheetPage /> },
                {
                  path: ":framework",
                  element: <Outlet />,
                  children: [
                    { path: "", element: <FrameworkActivitiesTab /> },
                    {
                      path: ":rollNumber",
                      element: <Outlet />,
                      children: [
                        { path: "", element: <studentModule.StudentMarksheetsPage /> },
                        { path: ":marksheetId", element: <studentModule.MarksheetPage /> },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          path: "apps",
          element: <Outlet />,
          children: [
            { path: "", element: <appModule.AppMaster /> },
            { path: "student-console", element: <appModule.BescStudentConsoleSettings /> },
            { path: "event-gatekeeper", element: <appModule.EventGatekeeperPage /> },
            { path: "ems-app", element: <appModule.EmsAppPage /> },
            { path: "event-management", element: <appModule.EventGatekeeperPage /> },
            { path: "admission-comm-module", element: <appModule.AdmissionCommModulePage /> },
          ],
        },
        // Legacy alias for the old direct route — kept so deep links keep working.
        {
          path: "apps/student-console/simulation",
          element: <appModule.StudentConsoleSimulation />,
        },
        {
          path: "user-groups-accesses",
          element: <administrationModule.UserGroupsAccessLayout />,
          children: [
            { path: "", element: <administrationModule.UserGroupsAccessHomePage /> },
            { path: "app-modules", element: <administrationModule.AppModulePage /> },
            { path: "user-groups", element: <div>TODO: User Groups Master</div> },
            { path: "faculties", element: <div>TODO: User Directory</div> },
            { path: "create", element: <div>TODO: Create User Group</div> },
            { path: "departments", element: <administrationModule.DepartmentPage /> },
            { path: "designations", element: <administrationModule.DesignationPage /> },
            { path: "access-groups", element: <administrationModule.AccessGroupPage /> },
            { path: "user-types", element: <administrationModule.UserTypePage /> },
            { path: "roles", element: <div>TODO: Roles & Permissions Page</div> },
            { path: "user-statuses", element: <administrationModule.UserStatusPage /> },
            { path: "reports", element: <div>TODO: User Access Reports Page</div> },
          ],
        },
        { path: "notices", element: <NoticeMaster /> },
        {
          path: "settings",
          element: <settingsModule.SettingsMasterLayoutPage />,
          children: [
            { path: "", element: <settingsModule.GeneralSettingsPage /> },
            { path: "users", element: <settingsModule.UsersPage /> },
            { path: "api-config", element: <settingsModule.ApiConfigurationPage /> },
          ],
        },

        { path: "profile", element: <UserProfilePage /> },
        { path: "bulk-upload", element: <BulkDataUploadPage /> },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ],
  { basename: import.meta.env.VITE_APP_PREFIX || "" },
);

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;
