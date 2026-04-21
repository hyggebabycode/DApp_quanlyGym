import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import GymWebsite from "./components/Hello";
import Pricing from "./components/Pricing";
import Trainers from "./components/Trainers";
import Contact from "./components/Contact";
import AdminDashboard from "./Admin";
import Login from "./Admin/Login";
import Register from "./Admin/Register";
import MemberDashboard from "./components/Member";
import { session } from "./api";

function RequireAuth({ children, role = "" }) {
  const user = session.user;

  if (!user || !session.token) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin-portal" : "/member-portal"} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GymWebsite />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/member-portal"
          element={
            <RequireAuth role="member">
              <MemberDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/me"
          element={
            <RequireAuth role="member">
              <MemberDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin-portal"
          element={
            <RequireAuth role="admin">
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
