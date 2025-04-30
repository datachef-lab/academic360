import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomeLayout from "@/components/layouts/HomeLayout";
import {
  AddStudentPage,
  GetReportsPage,
  HomePage,
  LoginPage,
  MyWorkspacePage,
  NotFoundPage,
  RootPage,

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
import Dashboard from "./components/LibManagement/Dashboard";

import ManageMarksheetPage from "./pages/ManageMarksheetPage";
import StudentMarksheetsPage from "./pages/StudentMarksheetsPage";
import FrameworkActivitiesTab from "./components/manage-marksheet/FrameworkActivitiesTab";
import MarksheetPage from "./pages/MarksheetPage";
import Downloads from "./pages/Downloads";
import Event from "./pages/Event";
import CoursesAndSubject from "./pages/Courses&Subject";
import AdmissionAndFess from "./pages/AdmissionAndFess";
import SearchStudentPage from "./pages/SearchStudentPage";
const router = createBrowserRouter([
  { path: "/", element: <RootPage /> },
  { path: "/login", element: <LoginPage /> },
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
      { path: "downloads", element: <Downloads /> },
      { path: "event", element: <Event /> },
      { path: "admission-fees", element: <AdmissionAndFess /> },
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
      { path: "student-reports", element: <GetReportsPage /> },
      { path: "lib", element: <Dashboard /> },

      { path: "catalog", element: <BookCatalog /> },
      { path: "issued-book", element: <IssueRetun /> },
      { path: "fine-management", element: <LibFineManagement /> },
      { path: "lib-report", element: <LibReport /> },
      {
        path: "search-students",
        element: <Outlet />,
        children: [
          { path: "", element: <SearchStudentPage /> },
          { path: ":studentId", element: <StudentPage /> },
        ],
      },
      { path: "profile", element: <UserProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

const App = () => {
  return (
    <>
      <RouterProvider router={router} />;
    </>
  );
};

export default App;
