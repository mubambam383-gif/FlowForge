import React, { ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './hooks/useAuth';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ApiTesting = lazy(() => import('./pages/ApiTesting'));
const WebhookLab = lazy(() => import('./pages/WebhookLab'));
const MockServers = lazy(() => import('./pages/MockServers'));
const Contracts = lazy(() => import('./pages/Contracts'));
const Logs = lazy(() => import('./pages/Logs'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-dark-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
    </div>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/api-testing" element={<PrivateRoute><ApiTesting /></PrivateRoute>} />
            <Route path="/webhooks" element={<PrivateRoute><WebhookLab /></PrivateRoute>} />
            <Route path="/mock-servers" element={<PrivateRoute><MockServers /></PrivateRoute>} />
            <Route path="/contracts" element={<PrivateRoute><Contracts /></PrivateRoute>} />
            <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}
