import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../LoginSignup/ThemeContext";
import "./Course.css";
import "../LoginSignup/LoginSignup.css"; // Import shared styles
import closeIcon from '../Assets/close.png'; // Import the close icon

export const CourseDetails = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);
  const [enrollment, setEnrollment] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("error");

  // Function to handle back button click
  const handleBackClick = () => {
    // Navigate to the home page
    navigate('/home');
  };

  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    // Prevent duplicate fetches in development mode (React StrictMode)
    if (fetchedRef.current) return;

    const fetchCourseDetails = async () => {
      try {
        fetchedRef.current = true;
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8000/api/courses/${courseSlug}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.status === 403) {
          // User is not enrolled in this course
          console.error("Access denied: Not enrolled in this course");
          navigate("/home", {
            state: {
              notificationMessage:
                "You need to enroll in this course before accessing it",
              notificationType: "error",
            },
          });
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch course details");
        }

        const data = await response.json();
        setCourse(data);

        // After getting course data, fetch enrollment data to get progress
        await fetchEnrollmentData(data.course_id);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseSlug, navigate]);

  // Function to fetch enrollment data for this course
  const fetchEnrollmentData = async (courseId) => {
    try {
      const token = localStorage.getItem("token");

      // Fetch all enrollments
      const response = await fetch(
        "http://localhost:8000/api/enrollment/getEnrollments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch enrollment data");
      }

      const enrollments = await response.json();

      // Find enrollment for the current course
      const currentEnrollment = enrollments.find(
        (e) => e.course_id === courseId
      );

      if (currentEnrollment) {
        setEnrollment(currentEnrollment);
        setProgressPercentage(currentEnrollment.progress_percentage || 0);
        setCompletedLessons(currentEnrollment.completed_lessons_id || []);
      }
    } catch (err) {
      console.error("Error fetching enrollment data:", err);
    }
  };

  const startLesson = (lessonId, index) => {
    // Check if user can access this lesson
    if (index === 0 || isLessonCompleted(course.lessons[index - 1].id)) {
      navigate(`/course/${courseSlug}/lesson/${lessonId}`);
    } else {
      // Show notification that the previous lesson needs to be completed
      setNotificationMessage("You need to complete the previous lesson first");
      setNotificationType("error");
      setShowNotification(true);
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  // Function to check if a lesson is accessible
  const isLessonAccessible = (index) => {
    return (
      index === 0 ||
      (index > 0 && isLessonCompleted(course.lessons[index - 1].id))
    );
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading course details...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!course) {
    return <div className="error">Course not found</div>;
  }

  return (
    <div className="course-details-container">
      {/* Back button */}
      <div className="back-button" onClick={handleBackClick}>
        <img src={closeIcon} alt="Back to home" title="Back to home" />
      </div>
      
      <div className="course-header">
        <div className="course-title-section">
          <h1>{course.title}</h1>
          <div className="course-progress">
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
        </div>
      </div>

      <div className="lessons-container">
        {course.lessons && course.lessons.length > 0 ? (
          course.lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`lesson-card ${
                !isLessonAccessible(index) ? "locked" : ""
              } ${isLessonCompleted(lesson.id) ? "completed" : ""}`}
              onClick={() => startLesson(lesson.id, index)}
            >
              <div className="lesson-icon">{lesson.icon || "📚"}</div>
              <div className="lesson-info">
                <h3>Lesson {index + 1}</h3>
                <p>{lesson.title}</p>
                {lesson.description && (
                  <p className="lesson-description">{lesson.description}</p>
                )}
              </div>
              <div className="lesson-status">
                {isLessonCompleted(lesson.id) ? (
                  <span className="status-complete">✓</span>
                ) : isLessonAccessible(index) ? (
                  <span className="status-current">▶</span>
                ) : (
                  <span className="status-locked">🔒</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-lessons">
            No lessons available for this course yet.
          </div>
        )}
      </div>

      {enrollment && enrollment.status === "Completed" && (
        <div className="course-completion-badge">
          <div className="completion-icon">🏆</div>
          <div className="completion-text">
            <h3>Course Completed!</h3>
            <p>Congratulations on completing this course.</p>
          </div>
        </div>
      )}

      {/* Notification popup - updated to match home screen style */}
      {showNotification && (
        <div className="notification-popup">
          <div className={`notification-content ${notificationType}`}>
            <p>{notificationMessage}</p>
            <button onClick={closeNotification} className="close-btn">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
