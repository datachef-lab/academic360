import { createBrowserRouter, RouterProvider } from "react-router-dom";

import HomeLayout from "@/components/layouts/HomeLayout";
import {
  AddStudentPage,
  GetReportsPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  RootPage,
  SettingsPage,
  UserProfilePage,
} from "@/pages";

const router = createBrowserRouter([
  { path: "/", element: <RootPage /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/home",
    element: <HomeLayout />,
    children: [
      { path: "", element: <HomePage /> },
      { path: "add", element: <AddStudentPage /> },
      { path: "reports", element: <GetReportsPage /> },
      { path: "search", element: <GetReportsPage /> },
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
