import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomeLayout from "@/components/layouts/HomeLayout";
import {
  LoginPage,
  NotFoundPage,
  SettingsPage,
  // SettingsPage,
  UserProfilePage,
} from "@/pages";
// import StudentViewPage from "./pages/StudentViewPage";
import { AuthProvider } from "./providers/AuthProvider";
import { NotificationProvider } from "./providers/NotificationProvider";
// import StudentPage from "./pages/students/StudentPage";
import BookCatalog from "./components/LibManagement/BookCatalog";
import IssueRetun from "./components/LibManagement/IssueRetun";
// import LibFineManagement from "./components/LibManagement/LibFines";
// import LibReport from "./components/LibManagement/LibReport";

import ManageMarksheetPage from "./pages/students/ManageMarksheetPage";
// import StudentMarksheetsPage from "./pages/students/StudentMarksheetsPage";
import FrameworkActivitiesTab from "./components/manage-marksheet/FrameworkActivitiesTab";
// import MarksheetPage from "./pages/students/MarksheetPage";
// import Downloads from "./pages/Downloads";
import Event from "./pages/events/EventPage";
import LibraryDashboard from "./pages/library/LibraryDashboard";

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
import * as batchModule from "@/pages/batches";
import * as studentModule from "@/pages/students";
import * as examModule from "@/pages/exam-management";
import * as attendanceModule from "@/pages/attendance-timetable";
import * as libraryModule from "@/pages/library";
import * as appModule from "./pages/apps";
import * as facultiesStaffsModule from "./pages/faculties-staffs";
import * as marksheetModule from "@/pages/marksheets";
import * as settingsModule from "./pages/settings";
import { NoticeMaster } from "./pages/notices";
import { AcademicYearPage } from "./pages/admissions-fees/fees";
import Dashboard from "./pages/dashboard/Dashboard";
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
// import * as resourceModule from "@/pages/resources";

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
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

      {
        path: "courses-subjects-design",
        element: <courseSubjectModule.CoursesSubjectsMaster />,
        children: [
          { path: "subject-paper-mapping", element: <courseSubjectModule.SubjectPaperMappingPage /> },
          { path: "", element: <courseSubjectModule.ProgramCoursesPage /> },
          { path: "streams", element: <courseSubjectModule.StreamsPage /> },
          { path: "courses", element: <courseSubjectModule.CoursesPage /> },
          { path: "course-types", element: <courseSubjectModule.CourseTypesPage /> },
          { path: "course-levels", element: <courseSubjectModule.CourseLevelsPage /> },
          { path: "affiliations", element: <courseSubjectModule.AffiliationsPage /> },
          { path: "regulation-types", element: <courseSubjectModule.RegulationTypesPage /> },
          { path: "subjects", element: <courseSubjectModule.SubjectsPage /> },
          { path: "subject-categories", element: <courseSubjectModule.SubjectCategoriesPage /> },
          { path: "subject-paper-mapping", element: <courseSubjectModule.SubjectPaperMappingPage /> },
          { path: "classes", element: <courseSubjectModule.ClassesPage /> },
          { path: "paper-components", element: <courseSubjectModule.ExamComponentesPage /> },
          { path: "academic-years", element: <AcademicYearPage /> },
        ],
      },
      {
        path: "admissions-fees/admissions/:year",
        element: <Outlet />,
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
              { path: "academic-year", element: <admissionFeesModule.feesModule.AcademicYearPage /> },
              { path: "slabs", element: <admissionFeesModule.feesModule.FeesSlabPage /> },
              { path: "heads", element: <admissionFeesModule.feesModule.FeeHeadsPage /> },
              { path: "receipt-types", element: <admissionFeesModule.feesModule.FeesReceiptTypePage /> },
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
      {
        path: "exam-management",
        element: <examModule.ExamMaster />,
        children: [
          { path: "", element: <examModule.MyWorkspacePage /> },
          { path: ":examId", element: <examModule.ExamPage /> },
          { path: "create", element: <examModule.CreateExamPage /> },
          { path: "reports", element: <examModule.ReportsPage /> },
        ],
      },

      {
        path: "attendance-timetable",
        element: <attendanceModule.AttendanceTimeTableMaster />,
        children: [
          { path: "", element: <div>TODO: Attendance & Time-Tabel Home</div> },
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
          { path: "", element: <LibraryDashboard /> },
          { path: "archived", element: <div>TODO: Archived Books</div> },
          { path: "catalog", element: <BookCatalog /> },
          { path: "issued", element: <IssueRetun /> },
          //   { path: "fine-management", element: <LibFineManagement /> },
          //   { path: "lib-report", element: <LibReport /> },
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
      {
        path: "faculty-staff",
        element: <facultiesStaffsModule.FacultyStaffMaster />,
        children: [
          { path: "", element: <div>TODO: Faculty/Staff Home</div> },
          { path: "faculties", element: <div>TODO: Faculty List</div> },
          { path: "create", element: <div>TODO: Create Page</div> },
          { path: "departments", element: <div>TODO: Departments Page</div> },
          { path: "roles", element: <div>TODO: Roles & Permission Page</div> },
          { path: "reports", element: <div>TODO: Roles & Reports Page</div> },
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
          { path: "departments", element: <settingsModule.DepartmentsPage /> },
        ],
      },

      { path: "profile", element: <UserProfilePage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

const App = () => {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;
