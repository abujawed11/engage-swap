import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import Earn from "./pages/Earn";
import Promote from "./pages/Promote";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthGate from "./components/AuthGate";
import { AppProvider } from "./lib/appState";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public routes
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },

      // Protected routes
      {
        index: true,
        element: <AuthGate><Home /></AuthGate>
      },
      {
        path: "earn",
        element: <AuthGate><Earn /></AuthGate>
      },
      {
        path: "promote",
        element: <AuthGate><Promote /></AuthGate>
      },

      { path: "*", element: <div className="text-slate-600">404 • Not found</div> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </React.StrictMode>
);
