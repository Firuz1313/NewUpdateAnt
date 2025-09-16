import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";

// Main pages
import DeviceSelection from "@/pages/DeviceSelection";
import ProblemsPage from "@/pages/ProblemsPage";
import DiagnosticPage from "@/pages/DiagnosticPage";
import SuccessPage from "@/pages/SuccessPage";
import Index from "@/pages/Index";
import ApiTest from "@/pages/ApiTest";
import TVInterfaceDemo from "@/pages/TVInterfaceDemo";
import RemotesApiTest from "@/pages/RemotesApiTest";
import NotFound from "@/pages/NotFound";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import DeviceManager from "@/pages/admin/DeviceManager";
import ProblemsManager from "@/pages/admin/ProblemsManager";
import StepsManager from "@/pages/admin/StepsManager";
import StepsManagerFixed from "@/pages/admin/StepsManagerFixed";
import StepsManagerAccess from "@/pages/admin/StepsManagerAccess";
import RemoteBuilder from "@/pages/admin/RemoteBuilder";
import TVInterfaceBuilder from "@/pages/admin/TVInterfaceBuilder";
import UsersManager from "@/pages/admin/UsersManager";
import SystemSettings from "@/pages/admin/SystemSettings";
import { AuthProvider } from "@/hooks/useAuth";
import RequireAdmin from "@/components/RequireAdmin";
import AdminLogin from "@/pages/admin/Login";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <Layout>
                <Index />
              </Layout>
            }
          />
          <Route
            path="/devices"
            element={
              <Layout>
                <DeviceSelection />
              </Layout>
            }
          />
          <Route path="/device" element={<Navigate to="/devices" replace />} />
          <Route
            path="/problems/:deviceId"
            element={
              <Layout>
                <ProblemsPage />
              </Layout>
            }
          />
          <Route
            path="/diagnostic/:deviceId/:problemId"
            element={
              <Layout>
                <DiagnosticPage />
              </Layout>
            }
          />
          <Route
            path="/success/:deviceId/:sessionId"
            element={
              <Layout>
                <SuccessPage />
              </Layout>
            }
          />

          {/* API Test page */}
          <Route
            path="/api-test"
            element={
              <Layout>
                <ApiTest />
              </Layout>
            }
          />

          {/* TV Interface Demo page */}
          <Route
            path="/tv-interface-demo"
            element={
              <Layout>
                <TVInterfaceDemo />
              </Layout>
            }
          />

          {/* Remotes API Test page */}
          <Route
            path="/remotes-api-test"
            element={
              <Layout>
                <RemotesApiTest />
              </Layout>
            }
          />

          {/* Legacy redirect - old problems page */}
          <Route
            path="/problems"
            element={<Navigate to="/devices" replace />}
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <DeviceManager />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/problems"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <ProblemsManager />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/steps"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <StepsManagerAccess />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/steps-old"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <StepsManager />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/steps-fixed"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <StepsManagerFixed />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/remotes"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <RemoteBuilder />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/tv-interfaces"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <TVInterfaceBuilder />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <UsersManager />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <SystemSettings />
                </AdminLayout>
              </RequireAdmin>
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <Layout>
                <NotFound />
              </Layout>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
