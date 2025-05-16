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
import StudentViewPage from "./pages/StudentViewPage";
import { AuthProvider } from "./providers/AuthProvider";
import { NotificationProvider } from "./providers/NotificationProvider";
import StudentPage from "./pages/StudentPage";
import BookCatalog from "./components/LibManagement/BookCatalog";
import IssueRetun from "./components/LibManagement/IssueRetun";
import LibFineManagement from "./components/LibManagement/LibFines";
import LibReport from "./components/LibManagement/LibReport";


import ManageMarksheetPage from "./pages/ManageMarksheetPage";
import StudentMarksheetsPage from "./pages/StudentMarksheetsPage";
import FrameworkActivitiesTab from "./components/manage-marksheet/FrameworkActivitiesTab";
import MarksheetPage from "./pages/MarksheetPage";
// import Downloads from "./pages/Downloads";
import Event from "./pages/Event";
import LibraryDashboard from "./pages/LibraryDashboard";

import CoursesAndSubject from "./pages/CoursesAndSubject";

import Downloads from "./pages/Downloads";
import AdmissionAndFees from "./pages/AdmissionAndFess";



const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  {
    path: "/home",
    element: (
      <AuthProvider>
        <NotificationProvider>
          <HomeLayout />
        </NotificationProvider>
      </AuthProvider>
    ),
    children: [
      { path: "exam-management", element: <MyWorkspacePage /> },
      { path: "", element: <HomePage /> },
      { path: "student-View", element: <StudentViewPage /> },
      { path: "add-student", element: <AddStudentPage /> },
      { path: "downloads", element: < Downloads/> },
      { path: "event", element: <Event /> },
      { path: "admission-fees", element: <AdmissionAndFees /> },
      { path: "courses-subjects", element: <CoursesAndSubject /> },
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
      { path: "academics-reports", element: <GetReportsPage /> },
      { path: "student-reports", element: <GetReportsPage /> },
      { path: "lib", element: <LibraryDashboard /> },

      { path: "catalog", element: <BookCatalog /> },
      { path: "issued-book", element: <IssueRetun /> },
      { path: "fine-management", element: <LibFineManagement /> },
      { path: "lib-report", element: <LibReport /> },
      { path: "search-students/:studentId", element: <StudentPage /> },
      // {
      //   path: "search-students",
      //   element: <Outlet />,
      //   children: [
         
      //     { path: ":studentId", element: <StudentPage /> },
      //   ],
      // },
      { path: "profile", element: <UserProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
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
