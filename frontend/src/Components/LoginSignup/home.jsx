import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeContext";
import "./home.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Footer } from "./Footer";

// Popup notification component
const Popup = ({ message, type, onClose }) => {
  const isSuccess = type === "success";
  
  return (
    <div className="popup-overlay">
      <div className={`popup-content ${isSuccess ? 'success' : 'error'}`}>
        <h3>{isSuccess ? "Success" : "Error"}</h3>
        <p>{message}</p>
        <button onClick={onClose} className={isSuccess ? "success-btn" : "error-btn"}>
          Close
        </button>
      </div>
    </div>
  );
};

export const Home = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("User");
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  // Add state for popup notifications
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("error"); // "error" or "success"


  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    // Check if we have a notification message from navigation state
    if (location.state?.notificationMessage) {
      showNotification(
        location.state.notificationMessage, 
        location.state.notificationType || 'error'
      );
      
      // Clear the state to prevent showing the notification again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSignOut = async () => {
    try {
      // Call the logout endpoint to clear the cookie
      await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        credentials: "include", // Important for cookie handling
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      // Clear the token from localStorage
      localStorage.removeItem("token");

      // Navigate to login page
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Still remove token and redirect even if the request fails
      localStorage.removeItem("token");
      navigate("/", { replace: true });
    }
  };

  // Helper function to show notifications
  const showNotification = (message, type = "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const handleEnroll = async (courseId) => {
    try {
      // Set enrolling state for this specific course
      setEnrollingCourseId(courseId);
      
      const token = localStorage.getItem("token");
      console.log("Enrolling in course:", courseId);
      
      const response = await fetch("http://localhost:8000/api/user/enroll", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Match exactly what the backend expects
        body: JSON.stringify({ 
          course_id: courseId 
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          if (data.message === "Course Pre-Requisite Incomplete") {
            showNotification(`You need to complete "${data.prereqCourse}" first`);
          } else {
            showNotification("Course or user not found");
          }
        } else if (response.status === 400) {
          showNotification("You are already enrolled in this course");
          // Navigate to the course anyway if already enrolled
          navigate(`/course/${courses.find(c => c.course_id === courseId).title.toLowerCase().replace(/\s+/g, '-')}`);
        } else {
          showNotification("Failed to enroll in course");
        }
        return;
      }

      // Successful enrollment
      showNotification("Successfully enrolled in course!", "success");
      // Refresh the courses list and enrollments
      fetchEnrollments();
      fetchCourses();
    } catch (error) {
      console.error("Enrollment error:", error);
      showNotification("Failed to enroll in course");
    } finally {
      // Clear enrolling state
      setEnrollingCourseId(null);
    }
  };

  // Function to fetch user enrollments
  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/enrollment/getEnrollments", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEnrollments(data);
      return data;
    } catch (err) {
      console.error("Error fetching enrollments:", err);
      return [];
    }
  };

  // Function to determine course status based on enrollments
  const getCourseStatus = (courseId) => {
    if (!enrollments || enrollments.length === 0) {
      return "enroll";
    }
    
    // Find enrollment by matching course_id field
    const enrollment = enrollments.find(e => e.course_id === courseId);
    
    if (!enrollment) {
      return "enroll";
    }
    
    if (enrollment.status === "Completed") {
      return "completed";
    }
    
    // If enrolled but not completed
    if (enrollment.progress_percentage >= 0) {
      return "continue";
    }
    
    return "start"; // Enrolled but not started
  };

  // Function to get course progress from enrollments
  const getCourseProgress = (courseId) => {
    if (!enrollments || enrollments.length === 0) return 0;
    
    // Find enrollment by matching course_id field
    const enrollment = enrollments.find(e => e.course_id === courseId);
    return enrollment ? enrollment.progress_percentage || 0 : 0;
  };

  // Function to get button text based on course status
  const getButtonText = (status, isEnrolling) => {
    if (isEnrolling) return "Enrolling...";
    
    switch(status) {
      case "completed":
        return "Review";
      case "continue":
        return "Continue";
      case "start":
        return "Start";
      case "enroll":
      default:
        return "Enroll";
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
        try {
            // Check if we have a token
            const token = localStorage.getItem("token");
            if (!token) return;
            
            // Get user data from API call
            const response = await fetch("http://localhost:8000/api/user/profile", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                credentials: "include"
            });
            
            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }
            
            const userData = await response.json();
            
            // Check if userData has direct first_name property or nested in a user object
            if (userData && userData.first_name) {
                setFirstName(userData.first_name);
            } else if (userData && userData.user && userData.user.first_name) {
                setFirstName(userData.user.first_name);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };
    
    fetchUserData();
}, []);

const user = {
  name: firstName,
}

  // Function to fetch courses
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/courses", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourses(data);
      return data;
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      return [];
    }
  };

  // Combined function to load both courses and enrollments
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // First fetch enrollments
        const userEnrollments = await fetchEnrollments();
        
        // Then fetch courses
        const coursesData = await fetchCourses();
        
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your courses...</div>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  // Get courses that are in progress or enrolled but not completed
  const getEnrolledCourses = () => {
    if (!courses || courses.length === 0) return [];
    
    // Get all courses that are enrolled (continue or start status)
    return courses.filter(course => {
      const status = getCourseStatus(course.course_id);
      return status === "continue" || status === "start";
    }).sort((a, b) => {
      // Sort by progress (highest first)
      const progressA = getCourseProgress(a.course_id);
      const progressB = getCourseProgress(b.course_id);
      return progressB - progressA;
    });
  };

  // Get the highlighted course (for backward compatibility)
  const getHighlightedCourse = () => {
    if (!courses || courses.length === 0) return null;
    
    // First try to find a course in progress
    const inProgressCourse = courses.find(course => {
      const status = getCourseStatus(course.course_id);
      return status === "continue";
    });
    
    if (inProgressCourse) return inProgressCourse;
    
    // If no in-progress course, return the first non-completed course
    const nextCourse = courses.find(course => {
      const status = getCourseStatus(course.course_id);
      return status !== "completed";
    });
    
    return nextCourse || courses[0];
  };

  const enrolledCourses = getEnrolledCourses();
  const highlightedCourse = getHighlightedCourse();

  return (
    <div>
      <nav className="nav-bar">
        <div className="logo">Wave!</div>
        <div className="user-profile">
          <span className="xp">🌟 850 XP</span>
          <div className="streak">🔥 7-day streak</div>
        </div>
        <div className="nav-right">
          <Link to="/profile" className="profile-link">
            <div className="profile-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
          </Link>
          <button onClick={handleSignOut} className="sign-out-button">
            Sign out
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="header-section">
          <h1>Welcome back, {firstName}!</h1>
          <div className="daily-goal">
            <div className="progress-circle">
              <span>75%</span>
            </div>
            <p>Daily Goal Progress</p>
          </div>
        </div>

        <section className="current-course">
          <h2>Continue Learning</h2>
          {enrolledCourses.length > 0 ? (
            <div className="enrolled-courses">
              {enrolledCourses.map(course => {
                const status = getCourseStatus(course.course_id);
                const progress = getCourseProgress(course.course_id);
                
                return (
                  <div key={course.course_id} className="course-card highlighted">
                    <div
                      className="course-image"
                      style={{ backgroundColor: 'var(--course-image-bg)' }}
                    >
                      <span className="hand-emoji">👋</span>
                    </div>
                    <div className="course-details">
                      <h3>{course.title}</h3>
                      <div className="progress-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <div className="course-progress-info">
                        <p>
                          {status === "continue" 
                            ? `${Math.round(progress)}% complete` 
                            : "Ready to start"}
                        </p>
                        <button 
                          className="continue-button"
                          onClick={() => {
                            navigate(`/course/${course.title.toLowerCase().replace(/\s+/g, '-')}`);
                          }}
                          disabled={enrollingCourseId !== null}
                        >
                          {status === "continue" ? "Continue" : "Start"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-enrolled-courses">
              <p>You haven't enrolled in any courses yet. Browse the courses below to get started!</p>
            </div>
          )}
        </section>

        <section className="all-courses">
          <h2>All Courses</h2>
          <div className="course-grid">
            {courses.map((course) => {
              const status = getCourseStatus(course.course_id);
              const progress = getCourseProgress(course.course_id);
              
              return (
                <div key={course.course_id} className={`course-card ${status === "completed" ? "completed" : ""}`}>
                  <div className="course-header">
                    <span className="level-badge"></span>
                    {status === "completed" && <span className="completed-badge">Completed</span>}
                  </div>
                  <div
                    className="course-image"
                    style={{ backgroundColor: 'var(--course-image-bg)' }}
                  >
                    <span className="hand-emoji">✋</span>
                  </div>
                  <div className="course-content">
                    <h3>{course.title}</h3>
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="course-footer">
                      <span>{course.lessons?.length || 0} lessons</span>
                      <button
                        onClick={() => {
                          if (status === "enroll") {
                            handleEnroll(course.course_id);
                          } else {
                            navigate(`/course/${course.title.toLowerCase().replace(/\s+/g, '-')}`);
                          }
                        }}
                        className={`start-button ${status}`}
                        disabled={enrollingCourseId !== null}
                      >
                        {getButtonText(status, enrollingCourseId === course.course_id)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />

      {showPopup && (
        <Popup
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};
