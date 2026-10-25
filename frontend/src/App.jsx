import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ApplicationsPage = lazy(() => import("./pages/ApplicationsPage"));
const ApplicationDetailPage = lazy(() => import("./pages/ApplicationDetailPage"));
const EditApplicationPage = lazy(() => import("./pages/EditApplicationPage"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const InterviewsPage = lazy(() => import("./pages/InterviewsPage"));
const RemindersPage = lazy(() => import("./pages/RemindersPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function GuestLanding() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><span className="loading-mark" /><p>Loading CareerFlow</p></div>;
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function Workspace() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

function PageLoading() {
  return <div className="app-loading"><span className="loading-mark" /><p>Loading your workspace</p></div>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<GuestLanding />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<Workspace />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/applications/:id/edit" element={<EditApplicationPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
