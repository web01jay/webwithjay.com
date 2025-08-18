import { lazy } from "react";
import { createBrowserRouter } from 'react-router-dom';

import App from '../App';

const LoginPage = lazy(() => import('../pages/Login.jsx')); // Lazy load Login component
const SignupPage = lazy(() => import('../pages/Signup.jsx')); // Lazy load Signup component
const HomePage = lazy(() => import('../pages/Home.jsx')); // Lazy load Home component
// const BlogPage = lazy(() => import('../pages/Blog')); // Lazy load Blog component
// const TicTacToePage = lazy(() => import('../pages/Tasks/TicTacToe')); // Lazy load TicTacToe component
const ErrorBoundaryPage = lazy(() => import('../pages/ErrorBoundary.jsx')); // Lazy load ErrorBoundary component
const NotFoundPage = lazy(() => import('../pages/NotFound.jsx')); // Lazy load NotFound component

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: 'login', element: <LoginPage /> },
  { path: 'signup', element: <SignupPage /> },
  { path: '*', element: <NotFoundPage /> }, // 404 route
]);

// errorElement: <ErrorBoundaryPage />,

export default router;
