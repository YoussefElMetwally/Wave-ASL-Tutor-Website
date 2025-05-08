import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { useSound } from './SoundContext';
import { Link, useNavigate } from 'react-router-dom';
import './profile.css';
import { Footer } from './Footer';

export const ProfilePage = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { isSoundEnabled, toggleSound } = useSound();
    const [firstName, setFirstName] = useState("User");
    const navigate = useNavigate();

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
        document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);
    
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

    // Sample user data
    const user = {
        name: firstName,
        xp: 850,
        streak: 7,
        level: "B1",
        avatar: firstName.charAt(0).toUpperCase(),
        completedLessons: 58,
        achievements: [
            { id: 1, title: "First Steps", icon: "👣", description: "Complete 5 lessons" },
            { id: 2, title: "Daily Learner", icon: "📚", description: "7-day streak" },
            { id: 3, title: "Conversation Starter", icon: "💬", description: "Complete dialogue module" },
        ]
    };

    return (
        <div className="profile-container">
            <nav className="nav-bar">
            <Link to="/home" className="logo">Wave!</Link>
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

            <main className="profile-content">
                <section className="profile-header">
                    <div className="avatar-container">
                        <div className="avatar">{user.avatar}</div>
                        <h1>{user.name}</h1>
                        <p className="level">Level {user.level}</p>
                    </div>
                    
                    <div className="stats-container">
                        <div className="stat-card">
                            <h3>Daily Progress</h3>
                            <div className="progress-container">
                                <div className="progress-bar" style={{ width: '65%' }}></div>
                            </div>
                            <p>65% of daily goal</p>
                        </div>
                        
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">{user.xp}</span>
                                <span className="stat-label">Total XP</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{user.streak}</span>
                                <span className="stat-label">Day Streak</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{user.completedLessons}</span>
                                <span className="stat-label">Lessons</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="achievements-section">
                    <h2>Achievements</h2>
                    <div className="achievements-grid">
                        {user.achievements.map(achievement => (
                            <div key={achievement.id} className="achievement-card">
                                <div className="achievement-icon">{achievement.icon}</div>
                                <h4>{achievement.title}</h4>
                                <p>{achievement.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="settings-section">
                    <h2>Settings</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <span>Dark Mode</span>
                            <button 
                                className={`toggle-switch ${isDarkMode ? 'active' : ''}`}
                                onClick={toggleTheme}
                            >
                                <div className="toggle-knob"></div>
                            </button>
                        </div>
                        <div className="setting-item">
                            <span>Notifications</span>
                            <button className="toggle-switch">
                                <div className="toggle-knob"></div>
                            </button>
                        </div>
                        <div className="setting-item">
                            <span>Sound effects</span>
                            <button 
                                className={`toggle-switch ${isSoundEnabled ? 'active' : ''}`}
                                onClick={toggleSound}
                            >
                                <div className="toggle-knob"></div>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

