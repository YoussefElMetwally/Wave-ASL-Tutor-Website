import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import { useTheme } from './ThemeContext';
import user_icon from '../Assets/user (1).png';
import email_icon from '../Assets/email.png';
import password_icon from '../Assets/locked-computer.png';

const Popup = ({ message, onClose, type = "error" }) => {
  // Add popup-active class to body when component mounts
  React.useEffect(() => {
    document.body.classList.add('popup-active');
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('popup-active');
    };
  }, []);

  const isSuccess = type === "success";

  return (
    <div className="popup-overlay">
      <div className={`popup-content ${isSuccess ? 'success' : 'error'}`}>
        <h3>{isSuccess ? "Success" : "Error"}</h3>
        <p>{message}</p>
        <button onClick={onClose} className={isSuccess ? "success-btn" : "error-btn"}>Close</button>
      </div>
    </div>
  );
};

export const LoginSignup = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [action, setAction] = useState("Login");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestReset = async () => {
    if (!formData.email) {
      setPopupMessage("Please enter your email address");
      setShowPopup(true);
      setPopupType("error");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage("Password reset instructions have been sent to your email");
        setTimeout(() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setIsRequestingReset(false);
            setIsTransitioning(false);
          }, 300);
        }, 2000);
      } else {
        setPopupMessage(data.message || "Failed to request password reset");
        setShowPopup(true);
        setPopupType("error");
      }
    } catch (error) {
      console.error("Password reset request failed:", error);
      setPopupMessage("An error occurred. Please try again.");
      setShowPopup(true);
      setPopupType("error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = action === "Login" 
      ? "http://localhost:8000/api/login" 
      : "http://localhost:8000/api/register";
    
    const payload = action === "Login" 
      ? { email: formData.email, password: formData.password }
      : formData;
  
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
  
      const data = await response.json();
      console.log("API Response:", data);
  
      if (data.status === 400) {
        setPopupMessage(data.message);
        setShowPopup(true);
        setPopupType("error");
        return;
      }
  
      if (data.token) {
        console.log("Token found:", data.token);
        localStorage.setItem("token", data.token);
        setMessage("Login successful!");
        navigate("/home", { replace: true });
      } else {
        console.log("No token received from API.");
      }
    } catch (error) {
      console.error("API request failed:", error);
      setPopupMessage("An error occurred. Please try again.");
      setShowPopup(true);
      setPopupType("error");
    }
  };

  const handleResetClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsRequestingReset(true);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBackToLogin = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsRequestingReset(false);
      setIsTransitioning(false);
    }, 300);
  };

  // Password visibility toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isRequestingReset) {
    return (
      <>
        {showPopup && (
          <Popup 
            message={popupMessage} 
            onClose={() => setShowPopup(false)}
            type={popupType || "error"} 
          />
        )}
        <div className={`container ${isTransitioning ? 'slide-out' : 'slide-in'}`}>
          <div className='header'>
            <div className='text'>Reset Password</div>
            <div className='underline'></div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleRequestReset(); }} className="inputs">
            <div className="input">
              <img src={email_icon} alt="" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            {message && <div className="message">{message}</div>}
            <div className="submit-container">
              <button type="submit" className="submit" style={{width: 200}}>
                Reset Password
              </button>
            </div>
            <div className="forgot-password" style={{ textAlign: 'center', marginTop: '20px' }}>
              <span onClick={handleBackToLogin} style={{ cursor: 'pointer' }}>
                Back to Login
              </span>
            </div>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      {showPopup && (
        <Popup 
          message={popupMessage} 
          onClose={() => setShowPopup(false)}
          type={popupType || "error"} 
        />
      )}
      <div className={`container ${isTransitioning ? 'slide-out' : 'slide-in'}`}>
        <div className='header'>
          <div className='text'>{action}</div>
          <div className='underline'></div>
        </div>
        <div className="option-container">
          <div className={action === "Login" ? "submit gray" : "submit"} 
                onClick={() => setAction("Sign Up")}>
            Sign Up
          </div>
          <div className={action === "Sign Up" ? "submit gray" : "submit"} 
                onClick={() => setAction("Login")}>
            Login
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="inputs">
          {action === "Login" ? null : (
            <>
              <div className="input">
                <img src={user_icon} alt="" />
                <input type="text" 
                        name="firstName" 
                        placeholder='First Name' 
                        value={formData.firstName} 
                        onChange={handleChange} />
              </div>
              <div className="input">
                <img src={user_icon} alt="" />
                <input type="text" 
                        name="lastName" 
                        placeholder='Last Name' 
                        value={formData.lastName} 
                        onChange={handleChange} />
              </div>
            </>
          )}
          <div className="input">
            <img src={email_icon} alt="" />
            <input type="email" 
                    name="email" 
                    placeholder='Email' 
                    value={formData.email} 
                    onChange={handleChange} />
          </div>
          <div className="input">
            <img src={password_icon} alt="" />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder='Password' 
              value={formData.password} 
              onChange={handleChange} 
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
          {action === "Login" && (
            <div className="forgot-password">
              Lost Password? <span onClick={handleResetClick}>Click Here!</span>
            </div>
          )}
          {message && <div className="message">{message}</div>}
          <div className="submit-container">
            <button type="submit" className="submit">
              {action}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};