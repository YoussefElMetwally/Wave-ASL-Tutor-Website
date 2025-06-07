import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import { useTheme } from './ThemeContext';
import user_icon from '../Assets/user (1).png';
import email_icon from '../Assets/email.png';
import password_icon from '../Assets/locked-computer.png';
import logo from '../Assets/imageedit_19_2995496302.png';

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
        <div className="split-screen">
          <div className="left-panel">
            <div className="brand-content">
              <img src={logo} alt="Wave ASL Tutor Logo" className="logo" />
              <p>Master American Sign Language with interactive lessons</p>
            </div>
          </div>
          <div className="right-panel">
            <div className={`auth-container ${isTransitioning ? 'slide-out' : 'slide-in'}`}>
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
                  <button type="submit" className="submit">
                    Reset Password
                  </button>
                </div>
                <div className="forgot-password">
                  <span onClick={handleBackToLogin}>
                    Back to Login
                  </span>
                </div>
              </form>
            </div>
          </div>
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
      <div className="split-screen">
        <div className="left-panel">
          <div className="brand-content">
            <img src={logo} alt="Wave ASL Tutor Logo" className="logo" />
            <p>Master American Sign Language with interactive lessons</p>
          </div>
        </div>
        <div className="right-panel">
          <div className={`auth-container ${isTransitioning ? 'slide-out' : 'slide-in'}`}>
            <div className='header'>
              <div className='text'>{action}</div>
              <div className='underline'></div>
            </div>
            <div className="option-container">
              <div 
                className={action === "Login" ? "submit gray" : "submit"} 
                onClick={() => setAction("Sign Up")}
              >
                Sign Up
              </div>
              <div 
                className={action === "Sign Up" ? "submit gray" : "submit"} 
                onClick={() => setAction("Login")}
              >
                Login
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="inputs">
              {action === "Login" ? null : (
                <>
                  <div className="input">
                    <img src={user_icon} alt="" />
                    <input 
                      type="text" 
                      name="firstName" 
                      placeholder='First Name' 
                      value={formData.firstName} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="input">
                    <img src={user_icon} alt="" />
                    <input 
                      type="text" 
                      name="lastName" 
                      placeholder='Last Name' 
                      value={formData.lastName} 
                      onChange={handleChange} 
                    />
                  </div>
                </>
              )}
              <div className="input">
                <img src={email_icon} alt="" />
                <input 
                  type="email" 
                  name="email" 
                  placeholder='Email' 
                  value={formData.email} 
                  onChange={handleChange} 
                />
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
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </button>
              </div>
              {action === "Login" && (
                <div className="forgot-password">
                  <span onClick={handleResetClick}>Forgot Password?</span>
                </div>
              )}
              <div className="submit-container">
                <button type="submit" className="submit">
                  {action === "Login" ? "Login" : "Sign Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};