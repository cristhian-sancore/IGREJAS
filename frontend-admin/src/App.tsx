import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Finance from './pages/Finance';
import Events from './pages/Events';
import Cells from './pages/Cells';
import Configuration from './pages/Configuration';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="finance" element={<Finance />} />
          <Route path="events" element={<Events />} />
          <Route path="cells" element={<Cells />} />
          <Route path="config" element={<Configuration />} />
          <Route path="*" element={<Navigate to="dashboard" />} />
        </Route>

        <Route path="/" element={<Navigate to="/admin/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
