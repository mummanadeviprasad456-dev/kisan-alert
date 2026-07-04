import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/common/Navbar';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check for demo mode
  const demoRole = (location.state as any)?.demoRole;
  if (demoRole) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Dashboard Router Layout
const DashboardRouter: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="pt-20 lg:pl-64 px-4 pb-6 lg:px-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

// Dashboard Content Selector
const DashboardContent: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  
  // Save demoRole in session storage if present in state
  const stateRole = (location.state as any)?.demoRole;
  if (stateRole) {
    sessionStorage.setItem('demoRole', stateRole);
  }
  
  const demoRole = stateRole || sessionStorage.getItem('demoRole') || profile?.role || 'farmer';

  switch (demoRole) {
    case 'expert':
      return <ExpertDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <FarmerDashboard />;
  }
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(17, 24, 39, 0.9)',
                color: '#d1d5db',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            >
              {/* Define all child routes that map to the same DashboardContent */}
              <Route index element={<DashboardContent />} />
              <Route path="weather" element={<DashboardContent />} />
              <Route path="crop" element={<DashboardContent />} />
              <Route path="disease" element={<DashboardContent />} />
              <Route path="irrigation" element={<DashboardContent />} />
              <Route path="advisory" element={<DashboardContent />} />
              <Route path="alerts" element={<DashboardContent />} />
              <Route path="users" element={<DashboardContent />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;

