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
import StudentPage from "./pages/StudentPage";
// import Dashboard from "./pages/Dashboard";
import BookCatalog from "./components/LibManagement/BookCatalog";
import IssueRetun from "./components/LibManagement/IssueRetun";
import LibFineManagement from "./components/LibManagement/LibFines";
import LibReport from "./components/LibManagement/LibReport";
import GradeCard from "./pages/GradeCard";
import Dashboard from "./components/LibManagement/Dashboard";

const router = createBrowserRouter([
  { path: "/", element: <RootPage /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/home",
    element: (
      <AuthProvider>
        <HomeLayout />
      </AuthProvider>
    ),
    children: [
      { path: "", element: <MyWorkspacePage /> },
      { path: "academics", element: <HomePage /> },
      { path: "student-View", element: <StudentViewPage /> },
      { path: "academics-add", element: <AddStudentPage /> },
    
      { path: "academics-reports", element: <GetReportsPage /> },
      { path: "lib", element: <Dashboard/> },
    
      { path: "catalog", element: <BookCatalog/> },
      { path: "issued-book", element: <IssueRetun/> },
      { path: "fine-management", element: <LibFineManagement/> },
      { path: "lib-report", element: <LibReport/> },
      {
        path: "academics-search",
        element: <Outlet />,
        children: [
          { path: "", element: <SearchStudentPage /> },
          { path: ":studentId", element: <StudentPage /> },
        ],
      },
      {
        path: "student-Marksheet",
        element: <Outlet />,
        children: [
          { path: "", element: <GradeCard /> },
         
        ],
      },
      { path: "profile", element: <UserProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
