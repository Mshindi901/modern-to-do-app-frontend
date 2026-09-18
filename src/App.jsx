import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Dashboard from './pages/client/Dashboard.jsx';
import Projects from './pages/client/Projects.jsx';
import ProjectDetails from './pages/client/ProjectDetails.jsx';
import Tags from './pages/client/Tags.jsx';
import Profile from './pages/client/Profile.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import LoadingSpinner from './components/ui/Loading.jsx';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === 'admin' ? '/admin' : '/app'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/tasks" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/today" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/upcoming" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/completed" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/starred" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/app/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="/app/tags" element={<ProtectedRoute><Tags /></ProtectedRoute>} />
        <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><div className="p-8 text-center text-slate-600">Admin dashboard coming soon</div></AdminRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
