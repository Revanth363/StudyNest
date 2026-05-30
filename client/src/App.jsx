import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RoomsProvider } from "./context/RoomsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import RoomPage from "./pages/RoomPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import { useAuth } from "./context/AuthContext";
import "./index.css";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoomsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={<RootRouteComponent />}
          />
          <Route
            path="/myrooms"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/yourrooms"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <RoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:username"
            element={<ProfilePage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </RoomsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

function RootRouteComponent() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to="/yourrooms" replace />;
  }
  return <HomePage />;
}