import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { lazy } from 'react';

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard").then(m => ({ default: m.Dashboard })));
const CustomerOrders = lazy(() => import("../pages/CustomerOrders/CustomerOrders").then(m => ({ default: m.CustomerOrders })));
const OrderHistory = lazy(() => import("../pages/OrderHistory/OrderHistory").then(m => ({ default: m.OrderHistory })));
const BulkUpload = lazy(() => import("../pages/BulkUpload/BulkUpload").then(m => ({ default: m.BulkUpload })));
const Backorders = lazy(() => import("../pages/Backorders/Backorders").then(m => ({ default: m.Backorders })));
const Admin = lazy(() => import("../pages/Admin/Admin").then(m => ({ default: m.Admin })));
const ApprovalDashboard = lazy(() => import("../pages/Admin/ApprovalDashboard").then(m => ({ default: m.ApprovalDashboard })));
const AuthLayout = lazy(() => import("../pages/Auth/AuthLayout").then(m => ({ default: m.AuthLayout })));
const Login = lazy(() => import("../pages/Auth/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("../pages/Auth/Register").then(m => ({ default: m.Register })));
const Inventory = lazy(() => import("../pages/Inventory/Inventory").then(m => ({ default: m.Inventory })));
const Reports = lazy(() => import("../pages/Reports/Reports").then(m => ({ default: m.Reports })));
const Settings = lazy(() => import("../pages/Settings/Settings").then(m => ({ default: m.Settings })));

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ]
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            path: "",
            element: <Dashboard />,
          },
          {
            path: "orders/new",
            element: <CustomerOrders />,
          },
          {
            path: "orders/history",
            element: <OrderHistory />,
          },
          {
            path: "orders/bulk-upload",
            element: <BulkUpload />,
          },
          {
            path: "orders/backorders",
            element: <Backorders />,
          },
          {
            path: "admin",
            element: <Admin />,
          },
          {
            path: "admin/approvals",
            element: <ApprovalDashboard />,
          },
          {
            path: "inventory",
            element: <Inventory />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
          {
            path: "settings",
            element: <Settings />,
          }
        ],
      }
    ]
  },
]);
export default router;
