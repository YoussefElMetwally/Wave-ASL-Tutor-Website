import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import { useTheme } from './ThemeContext';
import user_icon from '../Assets/user (1).png';
import email_icon from '../Assets/email.png';
import password_icon from '../Assets/locked-computer.png';

const Popup = ({ message, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>Error</h3>
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
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
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      }
    } catch (error) {
      console.error("Password reset request failed:", error);
      setPopupMessage("An error occurred. Please try again.");
      setShowPopup(true);
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

  if (isRequestingReset) {
    return (
      <div className={`container ${isTransitioning ? 'slide-out' : 'slide-in'}`}>
        {showPopup && (
          <Popup 
            message={popupMessage} 
            onClose={() => setShowPopup(false)} 
          />
        )}
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
    );
  }

  return (
    <div className={`container ${isTransitioning ? 'slide-out' : 'slide-in'}`}>
      {showPopup && (
        <Popup 
          message={popupMessage} 
          onClose={() => setShowPopup(false)} 
        />
      )}
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
          <input type="password" 
                 name="password" 
                 placeholder='Password' 
                 value={formData.password} 
                 onChange={handleChange} />
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
  );
};