import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminPage from './AdminPage';
import authService from '../services/authService';

const AdminWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check authentication status whenever the location changes
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, [location]); // Re-check when location changes

  const handleLogout = () => {
    authService.signOut();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Admin login route */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <AdminLogin />
        } 
      />
      
      {/* Protected admin dashboard route */}
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? 
            <AdminPage onLogout={handleLogout} /> :
            <Navigate to="/admin" replace />
        } 
      />
    </Routes>
  );
};

export default AdminWrapper;