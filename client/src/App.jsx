import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorList from './pages/patient/DoctorList';
import LiveQueueTracker from './pages/LiveQueueTracker';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import BookToken from './pages/patient/BookToken';
import AppointmentHistory from './pages/patient/AppointmentHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import QueueManagement from './pages/admin/QueueManagement';
import OfflineBooking from './pages/admin/OfflineBooking';
import DoctorManagement from './pages/admin/DoctorManagement';
import PatientList from './pages/admin/PatientList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/doctors" element={<DoctorList />} />
              <Route path="/queue-tracker" element={<LiveQueueTracker />} />

              {/* Patient Protected Routes */}
              <Route
                path="/patient"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/book"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <BookToken />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/history"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <AppointmentHistory />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/queue"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <QueueManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/offline-booking"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <OfflineBooking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DoctorManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/patients"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PatientList />
                  </ProtectedRoute>
                }
              />

              {/* Catch all / 404 redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
