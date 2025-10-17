import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import Earn from "./pages/Earn";
import Gateway from "./pages/Gateway";
import Promote from "./pages/Promote";
import Market from "./pages/Market";
import Wallet from "./pages/Wallet";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import AuthGate from "./components/AuthGate";
import { AppProvider } from "./lib/appState";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminLimits from "./pages/admin/AdminLimits";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminCampaigns from "./pages/admin/AdminCampaigns";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public routes
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "verify-email", element: <VerifyEmail /> },

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
        path: "gateway",
        element: <AuthGate><Gateway /></AuthGate>
      },
      {
        path: "promote",
        element: <AuthGate><Promote /></AuthGate>
      },
      {
        path: "market",
        element: <Market />
      },
      {
        path: "wallet",
        element: <AuthGate><Wallet /></AuthGate>
      },

      // Admin routes
      {
        path: "admin",
        element: <AuthGate><AdminDashboard /></AuthGate>
      },
      {
        path: "admin/users",
        element: <AuthGate><AdminUsers /></AuthGate>
      },
      {
        path: "admin/users/:id",
        element: <AuthGate><AdminUserDetails /></AuthGate>
      },
      {
        path: "admin/limits",
        element: <AuthGate><AdminLimits /></AuthGate>
      },
      {
        path: "admin/logs",
        element: <AuthGate><AdminLogs /></AuthGate>
      },
      {
        path: "admin/campaigns",
        element: <AuthGate><AdminCampaigns /></AuthGate>
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
