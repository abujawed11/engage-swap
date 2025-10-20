import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Earn from "./pages/Earn";
import Gateway from "./pages/Gateway";
import Promote from "./pages/Promote";
import Market from "./pages/Market";
import Wallet from "./pages/Wallet";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Analytics from "./pages/Analytics";
import CampaignAnalyticsDetail from "./pages/CampaignAnalyticsDetail";
import AuthGate from "./components/AuthGate";
import { AppProvider } from "./lib/appState";

// Info & Legal pages
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import Disclaimer from "./pages/Disclaimer";
import FAQ from "./pages/FAQ";
import Support from "./pages/Support";
import Cookies from "./pages/Cookies";
import Guide from "./pages/Guide";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminLimits from "./pages/admin/AdminLimits";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminCoinPacks from "./pages/admin/AdminCoinPacks";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public routes
      { index: true, element: <Landing /> }, // Public landing page
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },

      // Info & Legal pages (Public)
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "privacy", element: <Privacy /> },
      { path: "terms", element: <Terms /> },
      { path: "refund", element: <Refund /> },
      { path: "disclaimer", element: <Disclaimer /> },
      { path: "faq", element: <FAQ /> },
      { path: "support", element: <Support /> },
      { path: "cookies", element: <Cookies /> },
      { path: "guide", element: <Guide /> },

      // Protected routes
      {
        path: "dashboard",
        element: <AuthGate><Dashboard /></AuthGate>
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
      {
        path: "analytics",
        element: <AuthGate><Analytics /></AuthGate>
      },
      {
        path: "analytics/campaign/:campaignId",
        element: <AuthGate><CampaignAnalyticsDetail /></AuthGate>
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
      {
        path: "admin/coin-packs",
        element: <AuthGate><AdminCoinPacks /></AuthGate>
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
