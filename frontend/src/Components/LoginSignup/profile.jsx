import React, { useEffect } from 'react';
import { useTheme } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import './profile.css';

export const ProfilePage = () => {
    const { isDarkMode } = useTheme();
    useEffect(() => {
        document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
      }, [isDarkMode]);
    
  

  // Sample user data
  const user = {
    name: "Sign Language Learner",
    xp: 2450,
    streak: 14,
    level: "B1",
    avatar: "👤",
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
        <div className="logo">Wave!</div>
        <div className="user-profile">
          <span className="xp">🌟 {user.xp} XP</span>
          <div className="streak">🔥 {user.streak}-day streak</div>
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
              <span>Notifications</span>
              <button className="toggle-switch">
                <div className="toggle-knob"></div>
              </button>
            </div>
            <div className="setting-item">
              <span>Sound effects</span>
              <button className="toggle-switch active">
                <div className="toggle-knob"></div>
              </button>
            </div>
          </div>
        </section>
      </main>
      <div className="switch"><ThemeToggle /></div>
    </div>
  );
};

