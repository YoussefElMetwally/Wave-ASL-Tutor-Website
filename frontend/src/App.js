import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginSignup } from './Components/LoginSignup/LoginSignup';
import { Home } from './Components/LoginSignup/home';
import { ThemeProvider } from './Components/LoginSignup/ThemeContext';

function App() {
  return (
    <ThemeProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;
