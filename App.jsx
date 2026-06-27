import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Ventas from "./pages/Ventas";
import Caja from "./pages/Caja";
import Reportes from "./pages/Reportes";

// Ruta que requiere estar autenticado
function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Inter, sans-serif", color: "#8A7A5C" }}>Cargando...</div>;
  return session ? children : <Navigate to="/login" replace />;
}

// Ruta exclusiva para admin (Rosa)
function AdminRoute({ children }) {
  const { esAdmin, loading } = useAuth();
  if (loading) return null;
  return esAdmin ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/inventario" element={<PrivateRoute><Inventario /></PrivateRoute>} />
      <Route path="/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />

      {/* Solo Rosa puede ver Caja y Reportes */}
      <Route path="/caja" element={<PrivateRoute><AdminRoute><Caja /></AdminRoute></PrivateRoute>} />
      <Route path="/reportes" element={<PrivateRoute><AdminRoute><Reportes /></AdminRoute></PrivateRoute>} />

      {/* Cualquier ruta desconocida va al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
