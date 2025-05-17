import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logo from '../Assets/imageedit_7_3337107561.png';
import { useTheme } from '../LoginSignup/ThemeContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply theme only to the landing page container, not the entire body
  useEffect(() => {
    // No body attribute changes to avoid affecting other pages
    // We'll use the class on landing-page-container instead
  }, [isDarkMode]);

  // Handle scroll event for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false); // Close mobile menu after navigation
    }
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={`landing-page-container ${isDarkMode ? 'dark' : ''}`}>
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-logo">
          <img src={logo} alt="Wave ASL Tutor" />
          <span>Wave!</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-links desktop-nav">
          <a href="#" onClick={() => scrollToSection('hero')}>Home</a>
          <a href="#" onClick={() => scrollToSection('about')}>About</a>
          <a href="#" onClick={() => scrollToSection('features')}>Features</a>
          <a href="#" onClick={() => scrollToSection('demo')}>Demo</a>
          <a href="#" onClick={() => scrollToSection('contact')}>Contact</a>
        </div>
        
        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button className="login-button" onClick={() => navigate('/login')}>Login</button>
          
          {/* Mobile Menu Toggle Button */}
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </nav>
      
      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#" onClick={() => scrollToSection('hero')}>Home</a>
        <a href="#" onClick={() => scrollToSection('about')}>About</a>
        <a href="#" onClick={() => scrollToSection('features')}>Features</a>
        <a href="#" onClick={() => scrollToSection('demo')}>Demo</a>
        <a href="#" onClick={() => scrollToSection('contact')}>Contact</a>
      </div>

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Learn American Sign Language with AI</h1>
          <p className="hero-subtitle">
            Wave makes learning ASL fun, interactive, and accurate. Get real-time feedback powered by AI.
          </p>
          <div className="cta-buttons">
            <button className="primary-button" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="animation-container">
            {/* Hand sign animation */}
            <div className="animation-circle"></div>
            <div className="hand-animation">👋</div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-header">
          <h2>About Wave!</h2>
          <div className="underline"></div>
        </div>
        <p className="about-text">
          Wave! is revolutionizing how people learn American Sign Language through 
          cutting-edge AI technology. Our platform provides an immersive learning experience 
          with real-time feedback and personalized guidance to help you master ASL efficiently.
        </p>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-works-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <div className="underline"></div>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-icon">
              <span className="material-icons">👆</span>
            </div>
            <h3>Choose a Sign</h3>
            <p>Select from our comprehensive library of ASL signs and lessons.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">
              <span className="material-icons">📹</span>
            </div>
            <h3>Practice with Webcam</h3>
            <p>Use your webcam to practice signs and get instant visual guidance.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">
              <span className="material-icons">✅</span>
            </div>
            <h3>Get Instant Feedback</h3>
            <p>Our AI analyzes your signs and provides real-time accuracy feedback.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Features</h2>
          <div className="underline"></div>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Real-time Sign Accuracy</h3>
            <p>Get immediate feedback on your signing technique with precision metrics.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Webcam-Based Detection</h3>
            <p>Advanced computer vision analyzes your signing in real-time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>Track your learning journey with detailed statistics and achievements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👩‍🏫</div>
            <h3>Real Human Demonstrations</h3>
            <p>Learn from high-quality videos of real people performing authentic ASL signs.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍👩‍👧‍👦</div>
            <h3>Built for All Ages</h3>
            <p>Suitable for learners of all ages with adaptive difficulty levels.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Access Anywhere</h3>
            <p>Practice on any device with a camera, anytime and anywhere.</p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="demo-section">
        <div className="section-header">
          <h2>See Wave! in Action</h2>
          <div className="underline"></div>
        </div>
        <div className="demo-container">
          <div className="video-placeholder">
            <div className="play-button">▶</div>
          </div>
          <p className="demo-caption">See how easy it is to get started with Wave!</p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>What Our Users Say</h2>
          <div className="underline"></div>
        </div>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <div className="avatar-circle">JD</div>
            </div>
            <p className="testimonial-text">"Wave has transformed how I learn ASL. The real-time feedback is incredibly helpful!"</p>
            <p className="testimonial-author">- Jane Doe, Student</p>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <div className="avatar-circle">JS</div>
            </div>
            <p className="testimonial-text">"As an educator, I'm impressed with the accuracy and engagement this platform offers."</p>
            <p className="testimonial-author">- John Smith, ASL Teacher</p>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <div className="avatar-circle">AM</div>
            </div>
            <p className="testimonial-text">"The streak feature keeps me motivated to practice every day. Great learning tool!"</p>
            <p className="testimonial-author">- Alex Morgan, Professional</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-header">
          <h2>Get in Touch</h2>
          <div className="underline"></div>
        </div>
        <div className="contact-container">
          <p className="contact-text">Have questions or feedback about Wave!? We'd love to hear from you!</p>
          <a href="mailto:contact@waveasl.com" className="contact-email">contact@waveasl.com</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">
          <img src={logo} alt="Wave ASL Tutor" />
          <span>Wave!</span>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Navigation</h4>
            <a href="#" onClick={() => scrollToSection('hero')}>Home</a>
            <a href="#" onClick={() => scrollToSection('about')}>About</a>
            <a href="#" onClick={() => scrollToSection('features')}>Features</a>
            <a href="#" onClick={() => scrollToSection('demo')}>Demo</a>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <a href="mailto:contact@waveasl.com">Email Us</a>
            <a href="#">Support</a>
            <a href="#">FAQ</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Wave! All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 