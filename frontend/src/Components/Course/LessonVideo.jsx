import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../LoginSignup/ThemeContext';
import ThemeToggle from '../LoginSignup/ThemeToggle';
import './Course.css';

export const LessonVideo = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isVideoComplete, setIsVideoComplete] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const startPractice = () => {
    navigate(`/course/${courseId}/practice`);
  };

  return (
    <div className="lesson-container">
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>

      <div className="lesson-header">
        <h2>Basic Greetings</h2>
        <div className="lesson-progress">
          <span>Lesson 1/4</span>
          <div className="progress-dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>

      <div className="content-container">
        <div className="video-section">
          <div className="video-player">
            <video
              onEnded={() => setIsVideoComplete(true)}
              controls
              src="your-video-url.mp4"
              className="main-video"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="lesson-actions">
            <button onClick={startPractice} className="practice-button">
              <span className="practice-icon">🎯</span>
              Practice Now
            </button>
            {isVideoComplete && (
              <button onClick={startPractice} className="continue-button">
                Continue
              </button>
            )}
          </div>
        </div>

        <div className="lesson-sidebar">
          <div className="lesson-tips">
            <h3>Tips</h3>
            <ul>
              <li>Watch the hand movements carefully</li>
              <li>Practice in front of a mirror</li>
              <li>Focus on finger positioning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 