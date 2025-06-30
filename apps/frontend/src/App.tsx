import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomeLayout from "@/components/layouts/HomeLayout";
import {
  AddStudentPage,
  GetReportsPage,
  HomePage,
  LoginPage,
  MyWorkspacePage,
  NotFoundPage,
  SettingsPage,
  UserProfilePage,
} from "@/pages";
// import StudentViewPage from "./pages/StudentViewPage";
import { AuthProvider } from "./providers/AuthProvider";
import { NotificationProvider } from "./providers/NotificationProvider";
import StudentPage from "./pages/students/StudentPage";
import BookCatalog from "./components/LibManagement/BookCatalog";
import IssueRetun from "./components/LibManagement/IssueRetun";
import LibFineManagement from "./components/LibManagement/LibFines";
import LibReport from "./components/LibManagement/LibReport";

import ManageMarksheetPage from "./pages/students/ManageMarksheetPage";
import StudentMarksheetsPage from "./pages/students/StudentMarksheetsPage";
import FrameworkActivitiesTab from "./components/manage-marksheet/FrameworkActivitiesTab";
import MarksheetPage from "./pages/students/MarksheetPage";
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
      { path: "", element: <div>Dashboard Home (College Dashboard)</div> },
      { path: "resources", element: <SettingsPage /> },
      {
        path: "courses-subjects",
        element: <courseSubjectModule.CoursesSubjectsMaster />,
        children: [
          { path: "", element: <courseSubjectModule.HomePage /> },
          { path: "courses", element: <courseSubjectModule.CoursesAndSubjectPage /> },
          { path: "materials", element: <courseSubjectModule.CourseMaterialPage /> },
        ],
      },
      {
        path: "admissions-fees",
        element: <admissionFeesModule.AdmissionsFeesMaster />,
        children: [
          { path: "", element: <div>Admissions & Fees Home (Default) </div> },
          {
            path: "admissions",
            element: <Outlet />,
            children: [
              { path: "", element: <div>Admissions</div> },
              { path: "admissionId", element: <div>Admission Details</div> },
            ],
          },
          {
            path: "fees",
            element: <Outlet />,
            children: [
              { path: "", element: <admissionFeesModule.feesModule.FeesStructurePage /> },
              { path: "academic-year", element: <admissionFeesModule.feesModule.AcademicYearPage /> },
              { path: "fees-slab", element: <admissionFeesModule.feesModule.FeesSlabPage /> },
              { path: "fees-receipttype", element: <admissionFeesModule.feesModule.FeesReceiptTypePage /> },
              { path: "addon", element: <admissionFeesModule.feesModule.AddonPage /> },
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
          { path: ":batchId", element: <batchModule.BatchDetailsPage /> },
          { path: "create", element: <batchModule.CreateBatchPage /> },
          { path: "reports", element: <batchModule.ReportsPage /> },
        ],
      },

      {
        path: "exam-management",
        element: <Outlet />,
        children: [
          { path: "", element: <MyWorkspacePage /> },
          { path: ":examId", element: <div>Exam Id</div> },
          { path: "create", element: <div>Create Exams</div> },
          { path: "reports", element: <div>Exam Reports</div> },
        ],
      },

      {
        path: "students",
        element: <Outlet />,
        children: [
          { path: "", element: <HomePage /> },
          {
            path: "search",
            element: <Outlet />,
            children: [
              { path: ":studentId", element: <StudentPage /> },
              {
                path: ":studentId",
                element: <Outlet />,
                children: [{ path: ":marksheetId", element: <GradeCard /> }],
              },
            ],
          },
          { path: "create", element: <AddStudentPage /> },
          { path: "downloads", element: <Downloads /> },
          { path: "reports", element: <GetReportsPage /> },
          {
            path: "add-marksheet",
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
                      { path: "", element: <StudentMarksheetsPage /> },
                      { path: ":marksheetId", element: <MarksheetPage /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      //   { path: "student-View", element: <StudentViewPage /> },
      //   { path: "add-student", element: <AddStudentPage /> },
      { path: "event", element: <Event /> },

      //   { path: "academics-reports", element: <GetReportsPage /> },
      //   { path: "student-reports", element: <GetReportsPage /> },
      { path: "lib", element: <LibraryDashboard /> },

      { path: "catalog", element: <BookCatalog /> },
      { path: "issued-book", element: <IssueRetun /> },
      { path: "fine-management", element: <LibFineManagement /> },
      { path: "lib-report", element: <LibReport /> },
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
