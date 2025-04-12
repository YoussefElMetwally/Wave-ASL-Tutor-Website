import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../LoginSignup/ThemeContext';
import './Course.css';

export const CourseDetails = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/courses/${courseSlug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch course details');
        }

        const data = await response.json();
        console.log('Fetched course data:', data);
        setCourse(data);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseSlug]);

  const startLesson = (lessonId) => {
    navigate(`/course/${courseSlug}/lesson/${lessonId}`);
  };

  if (loading) {
    return <div className="loading">Loading course details...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!course) {
    return <div className="error">Course not found</div>;
  }

  return (
    <div className="course-details-container">
      <div className="course-header">
        <div className="course-title-section">
          <h1>{course.title}</h1>
          <div className="course-progress">
            <div className="progress-bar">
              <div className="progress" style={{ width: `${course.progress || 0}%` }}></div>
            </div>
            <span>{course.progress || 0}% Complete</span>
          </div>
        </div>
      </div>

      <div className="lessons-container">
        {course.lessons && course.lessons.length > 0 ? (
          course.lessons.map((lesson, index) => (
            <div key={lesson.id} className="lesson-card" onClick={() => startLesson(lesson.id)}>
              <div className="lesson-icon">
                {lesson.icon || '📚'}
              </div>
              <div className="lesson-info">
                <h3>Lesson {index + 1}</h3>
                <p>{lesson.title}</p>
                {lesson.description && <p className="lesson-description">{lesson.description}</p>}
              </div>
              <div className="lesson-status">
                {lesson.completed ? (
                  <span className="status-complete">✓</span>
                ) : index === 0 ? (
                  <span className="status-current">▶</span>
                ) : (
                  <span className="status-locked">🔒</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-lessons">No lessons available for this course yet.</div>
        )}
      </div>
    </div>
  );
}; 