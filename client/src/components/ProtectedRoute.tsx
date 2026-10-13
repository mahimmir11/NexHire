import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth.types';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EAF6F0] flex flex-col items-center justify-center p-4">
        <div className="h-12 w-12 rounded-2xl bg-[#2E9D74] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#2E9D74]/30 animate-bounce">
          N
        </div>
        <p className="mt-4 text-xs font-bold text-[#2E9D74] tracking-wider uppercase animate-pulse">
          Verifying NexHire Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
