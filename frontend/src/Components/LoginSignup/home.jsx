import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeContext";
import "./home.css";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "./Footer";

export const Home = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("User");


  useEffect(() => {
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

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
            console.log("User data:", userData);
            
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

  useEffect(() => {
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
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

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
          {courses.length > 0 && (
            <div className="course-card highlighted">
              <div
                className="course-image"
                style={{ background: isDarkMode ? "#2a3a4d" : "#e0f4ff" }}
              >
                <span className="hand-emoji">👋</span>
              </div>
              <div className="course-details">
                <h3>{courses[0].title}</h3>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: "75%" }} />
                </div>
                <p>Start your learning journey</p>
                <button className="continue-button">Continue</button>
              </div>
            </div>
          )}
        </section>

        <section className="all-courses">
          <h2>Your Courses</h2>
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course.course_id} className="course-card">
                <div className="course-header">
                  <span className="level-badge"></span>
                </div>
                <div
                  className="course-image"
                  style={{ background: isDarkMode ? "#2a3a4d" : "#e0f4ff" }}
                >
                  <span className="hand-emoji">✋</span>
                </div>
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                  <div className="course-footer">
                    <span>{course.lessons?.length || 0} lessons</span>
                    <button
                      onClick={() => navigate(`/course/${course.title.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="start-button"
                    >
                      {(course.progress || 0) > 0 ? "Continue" : "Start"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
