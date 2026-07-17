import React from 'react';
import { Navigate } from 'react-router-dom';
import { AUTH_TOKEN_KEY } from '../../config';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
