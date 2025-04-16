import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logo from '../Assets/WAVE__1_-removebg-preview.png';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <img src={logo} alt="Wave ASL Tutor Logo" className="landing-logo" />
        
        <p className="landing-slogan">
          Making sign language learning accessible to everyone through innovative technology and expert instruction.
        </p>
        <button className="get-started-button" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage; 