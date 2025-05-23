import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StreakPopup.css';

export const StreakPopup = ({ 
    isOpen, 
    onClose, 
    streak, 
    timeUntilReset,
    onContinueLearning 
}) => {
    const navigate = useNavigate();

    // Format time until reset in a readable format
    const formatTimeUntilReset = () => {
        if (!timeUntilReset) return "";
        
        const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    };

    // Helper to get streak status message
    const getStreakStatusMessage = () => {
        if (streak.status === "at_risk") {
            return `Your streak is at risk! Complete a lesson in the next ${formatTimeUntilReset()} to maintain it.`;
        } else if (streak.status === "active") {
            // More encouraging messages for active streaks
            if (streak.current === 1) {
                return "Great job on starting your streak today! Come back tomorrow to keep it going!";
            } else if (streak.current < 3) {
                return "You're on your way! Keep practicing daily to build your streak.";
            } else if (streak.current < 7) {
                return "Fantastic work maintaining your streak! You're building a solid habit.";
            } else if (streak.current < 14) {
                return "Amazing dedication! You've maintained your streak for over a week!";
            } else if (streak.current < 30) {
                return "Incredible commitment! Your consistency is truly impressive.";
            } else {
                return `Extraordinary achievement! ${streak.current} days of dedication shows your amazing commitment to learning.`;
            }
        } else if (streak.current > 0 && streak.status !== "active") {
            // For users who have a streak but haven't practiced today
            return "You're on a streak! Complete a lesson today to keep it going.";
        } else if (streak.max > 0 && streak.current === 0) {
            // For users who had a streak before but lost it
            return `You previously had a ${streak.max}-day streak. Start a new one today!`;
        } else {
            // For new users
            return "Complete a lesson today to start your learning streak!";
        }
    };

    if (!isOpen) return null;

    return (
        <div className="streak-popup-overlay" onClick={onClose}>
            <div className="streak-popup" onClick={(e) => e.stopPropagation()}>
                <div className="streak-popup-header">
                    <h3>Your Streak</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="streak-popup-content">
                    <div className="streak-popup-info" data-streak={streak.current}>
                        <div className="big-flame">🔥</div>
                        <div className="streak-popup-details">
                            <div className="current-streak">{streak.current}</div>
                            <div className="streak-label">day streak</div>
                        </div>
                    </div>
                    
                    {streak.max > streak.current && (
                        <div className="streak-record">
                            <span className="record-label">Your best</span>
                            <span className="record-value">{streak.max} days</span>
                        </div>
                    )}
                    
                    <div className="streak-status">
                        <div className="status-message">{getStreakStatusMessage()}</div>
                    </div>
                    
                    <div className="streak-days-preview">
                        {/* Generate the 7 day tracker */}
                        {Array.from({ length: 7 }).map((_, index) => {
                            // Calculate if this day is part of the current streak
                            const dayOffset = index - 6; // -6 to 0, with 0 being today
                            const isToday = dayOffset === 0;
                            const isPast = dayOffset < 0;
                            
                            // Determine the day's status
                            let dayStatus = 'empty';
                            if (isPast && Math.abs(dayOffset) < streak.current) {
                                dayStatus = 'completed';
                            } else if (isToday && streak.status === 'active') {
                                dayStatus = 'completed';
                            } else if (isToday) {
                                dayStatus = 'current';
                            }
                            
                            // Get day of week name
                            const date = new Date();
                            date.setDate(date.getDate() + dayOffset);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`streak-day ${dayStatus} ${isToday ? 'today' : ''}`}
                                >
                                    <div className="day-circle">
                                        <span className="flame-icon">🔥</span>
                                    </div>
                                    <span className="day-name">{dayName}</span>
                                </div>
                            );
                        })}
                    </div>
                    
                    <button 
                        className="streak-continue-button" 
                        onClick={() => {
                            onClose();
                            if (onContinueLearning) {
                                onContinueLearning();
                            } else {
                                navigate('/home');
                            }
                        }}
                    >
                        Continue Learning
                    </button>
                </div>
            </div>
        </div>
    );
}; 