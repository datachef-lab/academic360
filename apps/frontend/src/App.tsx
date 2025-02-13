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
import BookCatalog from "./pages/BookCatalog";
import IssueReturnPage from "./pages/IssueRetun";

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
      { path: "lib", element: <BookCatalog/> },
      { path: "issue", element: <IssueReturnPage/> },
      { path: "academics-reports", element: <GetReportsPage /> },

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
  return <RouterProvider router={router} />;
};

export default App;
