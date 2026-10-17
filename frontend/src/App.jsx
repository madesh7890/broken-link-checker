import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LinkChecker from './pages/LinkChecker';
import SuspiciousScanner from './pages/SuspiciousScanner';
import ApkScanner from './pages/ApkScanner';
import ApkEmbeddedUrls from './pages/ApkEmbeddedUrls';
import ScanHistory from './pages/ScanHistory';
import ScanDetails from './pages/ScanDetails';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import AccessDenied from './pages/AccessDenied';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="403" element={<AccessDenied />} />

            {/* Protected security routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="link-checker" element={
              <ProtectedRoute>
                <LinkChecker />
              </ProtectedRoute>
            } />
            <Route path="suspicious-checker" element={
              <ProtectedRoute>
                <SuspiciousScanner />
              </ProtectedRoute>
            } />
            <Route path="apk-scanner" element={
              <ProtectedRoute>
                <ApkScanner />
              </ProtectedRoute>
            } />
            <Route path="apk-urls" element={
              <ProtectedRoute>
                <ApkEmbeddedUrls />
              </ProtectedRoute>
            } />
            <Route path="apk-embedded-urls/:id" element={
              <ProtectedRoute>
                <ApkEmbeddedUrls />
              </ProtectedRoute>
            } />
            <Route path="history" element={
              <ProtectedRoute>
                <ScanHistory />
              </ProtectedRoute>
            } />
            <Route path="reports/:type/:id" element={
              <ProtectedRoute>
                <ScanDetails />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
