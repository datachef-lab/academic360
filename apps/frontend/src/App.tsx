import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomeLayout from "@/components/layouts/HomeLayout";
import { HomePage, LoginPage, NotFoundPage, SettingsPage, UserProfilePage } from "@/pages";
// import StudentViewPage from "./pages/StudentViewPage";
import { AuthProvider } from "./providers/AuthProvider";
import { NotificationProvider } from "./providers/NotificationProvider";
// import StudentPage from "./pages/students/StudentPage";
import BookCatalog from "./components/LibManagement/BookCatalog";
import IssueRetun from "./components/LibManagement/IssueRetun";
import LibFineManagement from "./components/LibManagement/LibFines";
import LibReport from "./components/LibManagement/LibReport";

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

import * as courseSubjectModule from "@/pages/courses-subjects-master";
import * as admissionFeesModule from "@/pages/admissions-fees";
import * as batchModule from "@/pages/batches";
import * as studentModule from "@/pages/students";
import * as examModule from "@/pages/exam-management";
import * as attendanceModule from "@/pages/attendance-timetable";
import * as libraryModule from "@/pages/library";
import * as appModule from "./pages/apps";
import * as facultiesStaffsModule from "./pages/faculties-staffs";
import * as marksheetModule from "@/pages/marksheets";
import SettingsMasterPage from "./pages/settings/SettingsMasterPage";
import { NoticeMaster } from "./pages/notices";
import { AcademicYearPage } from "./pages/admissions-fees/fees";
import Dashboard from "./pages/dashboard/Dashboard";

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
      {
        path: "courses-subjects",
        element: <courseSubjectModule.CoursesSubjectsMaster />,
        children: [
          // { path: "", element: <courseSubjectModule.HomePage /> },
          { path: "", element: <courseSubjectModule.CoursesAndSubjectPage /> },
          { path: ":courseId", element: <courseSubjectModule.CoursePage /> },
          { path: "materials", element: <courseSubjectModule.CourseMaterialPage /> },
        ],
      },
      {
        path: "admissions-fees",
        element: <admissionFeesModule.AdmissionsFeesMaster />,
        children: [
          { path: "", element: <admissionFeesModule.HomePage /> },
          { path: "academic-years", element: <AcademicYearPage /> },
          {
            path: "admissions",
            element: <Outlet />,
            children: [
              { path: "", element: <admissionFeesModule.AdmissionsPage /> },
              { path: ":year", element: <admissionFeesModule.AdmissionDetailsPage /> },
            ],
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
          { path: "", element: <HomePage /> },

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
          { path: "fine-management", element: <LibFineManagement /> },
          { path: "lib-report", element: <LibReport /> },
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
      { path: "marksheets", element: <marksheetModule.MarksheetMaster />, children: [
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
      ] },
      { path: "apps", element: <appModule.AppMaster /> },
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
      { path: "settings", element: <SettingsMasterPage /> },

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
