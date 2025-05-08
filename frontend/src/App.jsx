import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginSignup } from './Components/LoginSignup/LoginSignup';
import { Home } from './Components/LoginSignup/home';
import { ThemeProvider } from './Components/LoginSignup/ThemeContext';
import { SoundProvider } from './Components/LoginSignup/SoundContext';
import { CourseDetails } from './Components/Course/CourseDetails';
import { LessonVideo } from './Components/Course/LessonVideo';
import { Practice } from './Components/Course/Practice';
import { ProfilePage } from './Components/LoginSignup/profile';
import PageTransition from './Components/LoginSignup/PageTransition';
import LandingPage from './Components/Landing/LandingPage';

// Simpler ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <BrowserRouter>
          <PageTransition>
            <Routes>
              <Route path="/" element={<LandingPage />} />
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
                path="/course/:courseSlug" 
                element={
                  <ProtectedRoute>
                    <CourseDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/course/:courseSlug/lesson/:lessonId" 
                element={
                  <ProtectedRoute>
                    <LessonVideo />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/course/:courseSlug/practice" 
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
          </PageTransition>
        </BrowserRouter>
      </SoundProvider>
    </ThemeProvider>
  );
}

export default App;
