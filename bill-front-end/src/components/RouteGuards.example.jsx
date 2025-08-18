/**
 * Example usage of RouteGuards components
 * 
 * This file demonstrates how to use PublicRoute and PrivateRoute
 * components in a React Router setup with authentication.
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicRoute, PrivateRoute } from './RouteGuards';

// Example page components
const HomePage = () => <div>Welcome to our app!</div>;
const LoginPage = () => <div>Please log in</div>;
const SignupPage = () => <div>Create an account</div>;
const DashboardPage = () => <div>Dashboard - Protected Content</div>;
const ClientsPage = () => <div>Clients - Protected Content</div>;
const InvoicesPage = () => <div>Invoices - Protected Content</div>;
const ProductsPage = () => <div>Products - Protected Content</div>;
const NotFoundPage = () => <div>404 - Page Not Found</div>;

/**
 * Example App routing structure with authentication
 */
function ExampleAppRoutes() {
  return (
    <Routes>
      {/* Public Routes - Accessible without authentication */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        } 
      />
      
      {/* Auth Routes - Redirect authenticated users away */}
      <Route 
        path="/login" 
        element={
          <PublicRoute redirectIfAuthenticated={true}>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/signup" 
        element={
          <PublicRoute redirectIfAuthenticated={true}>
            <SignupPage />
          </PublicRoute>
        } 
      />
      
      {/* Private Routes - Require authentication */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/clients" 
        element={
          <PrivateRoute>
            <ClientsPage />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/invoices" 
        element={
          <PrivateRoute>
            <InvoicesPage />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/products" 
        element={
          <PrivateRoute>
            <ProductsPage />
          </PrivateRoute>
        } 
      />
      
      {/* Catch-all route for 404 */}
      <Route 
        path="*" 
        element={
          <PublicRoute>
            <NotFoundPage />
          </PublicRoute>
        } 
      />
    </Routes>
  );
}

/**
 * Example with custom redirect paths and loading states
 */
function ExampleWithCustomOptions() {
  return (
    <Routes>
      {/* Custom redirect destination for authenticated users */}
      <Route 
        path="/login" 
        element={
          <PublicRoute 
            redirectIfAuthenticated={true}
            redirectTo="/admin-dashboard"
          >
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Custom login redirect and loading fallback */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute 
            redirectTo="/admin-login"
            fallback={<div>Checking admin permissions...</div>}
          >
            <div>Admin Panel</div>
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export { ExampleAppRoutes, ExampleWithCustomOptions };