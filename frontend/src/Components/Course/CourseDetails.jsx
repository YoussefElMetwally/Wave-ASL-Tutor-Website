import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../LoginSignup/ThemeContext';
import './Course.css';

export const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const startLesson = () => {
    navigate(`/course/${courseId}/lesson`);
  };

  return (
    <div className="course-details-container">
      <div className="course-header">
        <div className="course-title-section">
          <h1>Basic Sign Language</h1>
          <div className="course-progress">
            <div className="progress-bar">
              <div className="progress" style={{ width: '25%' }}></div>
            </div>
            <span>25% Complete</span>
          </div>
        </div>
      </div>

      <div className="lessons-container">
        <div className="unit">
          <h2>Unit 1: Getting Started</h2>
          <div className="lesson-grid">
            {[1, 2, 3, 4].map((lesson) => (
              <div key={lesson} className="lesson-card" onClick={startLesson}>
                <div className="lesson-icon">
                  👋
                </div>
                <div className="lesson-info">
                  <h3>Lesson {lesson}</h3>
                  <p>Basic Greetings</p>
                </div>
                <div className="lesson-status">
                  {lesson === 1 ? (
                    <span className="status-complete">✓</span>
                  ) : lesson === 2 ? (
                    <span className="status-current">▶</span>
                  ) : (
                    <span className="status-locked">🔒</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 