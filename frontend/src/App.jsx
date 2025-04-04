import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginSignup } from './Components/LoginSignup/LoginSignup';
import { Home } from './Components/LoginSignup/home';
import { ThemeProvider } from './Components/LoginSignup/ThemeContext';
import { CourseDetails } from './Components/Course/CourseDetails';
import { LessonVideo } from './Components/Course/LessonVideo';
import { Practice } from './Components/Course/Practice';
import { ProfilePage } from './Components/LoginSignup/profile';
// Simpler ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginSignup />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course/:courseId" 
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course/:courseId/lesson" 
            element={
              <ProtectedRoute>
                <LessonVideo />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course/:courseId/practice" 
            element={
              <ProtectedRoute>
                <Practice />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
