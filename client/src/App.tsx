import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardLandingPage } from './pages/DashboardLandingPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Public Experience Pages
import { HomePage } from './pages/public/HomePage';
import { BlogPage } from './pages/public/BlogPage';
import { BlogArticlePage } from './pages/public/BlogArticlePage';
import { AboutPage } from './pages/public/AboutPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Student Module Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentAcademicPage } from './pages/student/StudentAcademicPage';
import { StudentSkillsPage } from './pages/student/StudentSkillsPage';
import { StudentCertificationsPage } from './pages/student/StudentCertificationsPage';
import { StudentCareerPage } from './pages/student/StudentCareerPage';
import { StudentDocumentsPage } from './pages/student/StudentDocumentsPage';
import { OpportunitiesDiscoveryPage } from './pages/student/OpportunitiesDiscoveryPage';
import { OpportunityDetailPage } from './pages/student/OpportunityDetailPage';

// Company & Recruiter Module Pages
import { RecruiterDashboardPage } from './pages/recruiter/RecruiterDashboardPage';
import { CompanyProfilePage } from './pages/recruiter/CompanyProfilePage';
import { RecruiterManagementPage } from './pages/recruiter/RecruiterManagementPage';
import { RecruiterJobsPage } from './pages/recruiter/RecruiterJobsPage';
import { RecruiterInternshipsPage } from './pages/recruiter/RecruiterInternshipsPage';
import { CompanyManagementPage } from './pages/admin/CompanyManagementPage';
import { OpportunityManagementPage } from './pages/admin/OpportunityManagementPage';

// Step 7: Application Management Pages
import { StudentApplicationsPage } from './pages/student/StudentApplicationsPage';
import { StudentApplicationDetailPage } from './pages/student/StudentApplicationDetailPage';
import { RecruiterApplicationsPage } from './pages/recruiter/RecruiterApplicationsPage';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';

// Step 8: Recruitment Module Pages (Interviews & Offers)
import { StudentInterviewsPage } from './pages/student/StudentInterviewsPage';
import { StudentOffersPage } from './pages/student/StudentOffersPage';
import { RecruiterInterviewsPage } from './pages/recruiter/RecruiterInterviewsPage';
import { RecruiterOffersPage } from './pages/recruiter/RecruiterOffersPage';
import { AdminInterviewsPage } from './pages/admin/AdminInterviewsPage';
import { AdminOffersPage } from './pages/admin/AdminOffersPage';

// Step 9: Placement Management Pages
import { StudentPlacementPage } from './pages/student/StudentPlacementPage';
import { RecruiterPlacementsPage } from './pages/recruiter/RecruiterPlacementsPage';
import { AdminPlacementsPage } from './pages/admin/AdminPlacementsPage';

// Step 10: Administration, Notifications, Reports & Analytics Pages
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

// Smart Root Redirector: Sends students to their dedicated Student Module, recruiters to their portal, and admins to admin dashboard
function RootLandingRedirect() {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }
  if (user?.role === 'RECRUITER') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }
  if (user?.role === 'PLACEMENT_ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <DashboardLandingPage />;
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Unauthorized Access Fallback */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Public Platform Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authenticated Root Landing & Dashboard Redirector */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RootLandingRedirect />
              </ProtectedRoute>
            }
          />

          {/* ========================================== */}
          {/* STUDENT MODULE ROUTES                      */}
          {/* ========================================== */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Navigate to="/student/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/academic"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentAcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/skills"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentSkillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certifications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentCertificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/career"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentCareerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/documents"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/opportunities"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <OpportunitiesDiscoveryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/opportunities/job/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <OpportunityDetailPage type="JOB" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/opportunities/internship/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <OpportunityDetailPage type="INTERNSHIP" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentApplicationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/interviews"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentInterviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/offers"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentOffersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/placement"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentPlacementPage />
              </ProtectedRoute>
            }
          />

          {/* ========================================== */}
          {/* COMPANY & RECRUITER MODULE ROUTES          */}
          {/* ========================================== */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <Navigate to="/recruiter/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/applications"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/interviews"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterInterviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/offers"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterOffersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/placements"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterPlacementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/internships"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterInternshipsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/profile"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CompanyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/team"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterManagementPage />
              </ProtectedRoute>
            }
          />

          {/* ========================================== */}
          {/* PLACEMENT ADMIN & SUPER ADMIN ROUTES       */}
          {/* ========================================== */}
          <Route
            path="/placement/opportunities"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <OpportunityManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/opportunities"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <OpportunityManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/applications"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/interviews"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminInterviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/interviews"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminInterviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/offers"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminOffersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/offers"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminOffersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/placements"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminPlacementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/placements"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminPlacementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/companies"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <CompanyManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <CompanyManagementPage />
              </ProtectedRoute>
            }
          />

          {/* ========================================== */}
          {/* STEP 10: NOTIFICATIONS & ADMINISTRATION    */}
          {/* ========================================== */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'RECRUITER', 'PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* User Management */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/users"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          {/* Department Management */}
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminDepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/departments"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminDepartmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Reports & Analytics */}
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/reports"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs */}
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* System Settings */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/settings"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />


          {/* Admin and Placement Root Redirections */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/placement/*"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT_ADMIN', 'SUPER_ADMIN']}>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />

          {/* Custom 404 Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
