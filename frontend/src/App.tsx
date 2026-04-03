import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { TopLoadingBar } from './components/ui/TopLoadingBar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load heavy components
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AppShell = lazy(() => import('./components/layout/AppShell').then(module => ({ default: module.AppShell })));
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'));
const Editor = lazy(() => import('./pages/Editor'));

export default function App() {
  return (
    <>
      <TopLoadingBar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ProjectDashboard />} />
          </Route>
          <Route
            path="/editor/:projectId"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}
