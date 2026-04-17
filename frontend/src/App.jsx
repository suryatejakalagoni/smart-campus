// React import not needed with the new JSX transform (React 17+)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './layouts/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentLeaves from './pages/Leaves/StudentLeaves';
import AdminLeaves from './pages/Leaves/AdminLeaves';
import StudentQueue from './pages/Queue/StudentQueue';
import AdminQueue from './pages/Queue/AdminQueue';
import TimetableView from './pages/Schedule/TimetableView';
import AdminSchedule from './pages/Schedule/AdminSchedule';
import FacultyReschedule from './pages/Schedule/FacultyReschedule';
import LostFoundPage from './pages/LostFound/LostFoundPage';
import ProfilePage from './pages/Profile/ProfilePage';
import UserManagementPage from './pages/Users/UserManagementPage';
import StudentDashboard from './pages/Dashboards/StudentDashboard';
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import FacultyDashboard from './pages/Dashboards/FacultyDashboard';
import FacultyAttendance from './pages/Attendance/FacultyAttendance';
import AcademicCalendar from './pages/AcademicCalendar';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                fontSize: 13,
                fontFamily: '"Inter", sans-serif',
                padding: '12px 16px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: 'var(--bg-secondary)' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: 'var(--bg-secondary)' } },
            }}
          />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Authenticated Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Common / Redirect Home */}
              <Route path="/" element={<StudentDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/lost-found" element={<LostFoundPage />} />
              <Route path="/schedule" element={<TimetableView />} />
              <Route path="/academic-calendar" element={<AcademicCalendar />} />

              {/* Student Role */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/leaves" element={<StudentLeaves />} />
                <Route path="/queue" element={<StudentQueue />} />
              </Route>

              {/* Faculty Role */}
              <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/reschedule" element={<FacultyReschedule />} />
                <Route path="/faculty/attendance" element={<FacultyAttendance />} />
              </Route>

              {/* Admin Role */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/leaves" element={<AdminLeaves />} />
                <Route path="/admin/queue" element={<AdminQueue />} />
                <Route path="/admin/schedule" element={<AdminSchedule />} />
                <Route path="/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
