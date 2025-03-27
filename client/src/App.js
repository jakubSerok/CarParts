import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ContextProvider from "./context/ContextProvider";
import ProtectedRoute from "./context/ProtectedRoute";
import UserPanel from "./pages/UserPanel";
import AdminPanel from "./pages/AdminPanel";
import Login from './pages/Login';

function AppContent() {
  return (
  <ContextProvider>
    <Routes>        
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
          path="/user-panel"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserPanel />
            </ProtectedRoute>
          }
        />
      <Route
          path="/admin-panel"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        /> 
    </Routes>
  </ContextProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
export default App;
