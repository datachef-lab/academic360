import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home, Login, Root } from "@/pages";

const router = createBrowserRouter([
  { path: "/", element: <Root /> },
  { path: "/login", element: <Login /> },
  { path: "/home", element: <Home /> },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
