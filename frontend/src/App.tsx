import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AppShell } from './components/layout/AppShell';
import ProjectDashboard from './pages/ProjectDashboard';
import Editor from './pages/Editor';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { TopLoadingBar } from './components/ui/TopLoadingBar';

export default function App() {
  return (
    <>
      <TopLoadingBar />
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
    </>
  );
}
