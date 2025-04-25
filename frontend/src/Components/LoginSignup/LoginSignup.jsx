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

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
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

  return (
    <div className='container'>
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
        <div className="forgot-password">
          Lost Password? <span>Click Here!</span>
        </div>
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