import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Add transition class to body when route changes
    document.body.classList.add('page-transition');
    
    // Remove the class after animation completes
    const timer = setTimeout(() => {
      document.body.classList.remove('page-transition');
    }, 300); // Match this with the CSS transition duration

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className="page-transition-container">
      {children}
    </div>
  );
};

export default PageTransition; 