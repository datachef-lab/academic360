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
  SearchStudentPage,
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
import StudentSubjectsPage from "./pages/StudentSubjectsPage";
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
      { path: "", element: <MyWorkspacePage /> },
      { path: "academics", element: <HomePage /> },
      { path: "student-View", element: <StudentViewPage /> },
      { path: "academics-add", element: <AddStudentPage /> },
      {
        path: "manage-marksheet",
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
      { path: "subjects", element: <StudentSubjectsPage /> },
      { path: "lib", element: <Dashboard /> },

      { path: "catalog", element: <BookCatalog /> },
      { path: "issued-book", element: <IssueRetun /> },
      { path: "fine-management", element: <LibFineManagement /> },
      { path: "lib-report", element: <LibReport /> },
      {
        path: "academics-search",
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
